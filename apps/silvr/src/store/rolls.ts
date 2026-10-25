import { getCamera } from '../cameras/models';
import { develop, promote, type DevelopOutput } from '../film/develop';
import type { DateFormat } from '../film/overlays';
import { developKey } from '../film/resolve';
import type { Aspect, DevelopSettings } from '../film/types';
import { atomic, get, getAll, getAllByIndex, rq, tx } from './db';

export type DevelopSpeed = 'instant' | '1h' | 'morning' | '3d';
export type RollStatus = 'loaded' | 'developing' | 'developed';
export type RollKind = 'camera' | 'import';

export const ROLL_SIZES = [12, 24, 36] as const;

export interface Roll {
  id: string;
  kind: RollKind;
  stockId: string;
  capacity: number;
  shots: number;
  aspect: Aspect;
  createdAt: number;
  status: RollStatus;
  finishedAt?: number;
  readyAt?: number;
  /** Set when the user first opens a developed roll (drives the "new" badge). */
  seenAt?: number;
  coverPhotoId?: string;
  /** Camera body the roll is loaded in (older rolls: none → Pro 35). */
  cameraId?: string;
  /** Finished negatives (≠ shots for half-frame, where two exposures share one). */
  negatives?: number;
  /** First half / first exposure waiting for its partner (half-frame, double exposure). */
  pending?: PendingExposure;
}

export interface PendingExposure {
  kind: 'half' | 'double';
  takenAt: number;
  width: number;
  height: number;
}

export interface Photo {
  id: string;
  rollId: string;
  frame: number;
  takenAt: number;
  width: number;
  height: number;
  develop: DevelopSettings;
  /** developKey() of the print currently stored, if any. */
  printKey?: string;
  printW?: number;
  printH?: number;
}

export const blobKey = {
  neg: (id: string) => `${id}:neg`,
  print: (id: string) => `${id}:print`,
  thumb: (id: string) => `${id}:thumb`,
};
const pendingKey = (rollId: string) => `pending:${rollId}`;

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------- pure domain logic ----------

const HOUR = 3600_000;

/** When a roll sent to the lab at `now` will be ready. */
export function readyAtFor(speed: DevelopSpeed, now: number): number {
  switch (speed) {
    case 'instant':
      return now;
    case '1h':
      return now + HOUR;
    case '3d':
      return now + 72 * HOUR;
    case 'morning': {
      const d = new Date(now);
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d.getTime();
    }
  }
}

export function effectiveStatus(roll: Roll, now: number): RollStatus {
  if (roll.status === 'developing' && roll.readyAt !== undefined && roll.readyAt <= now) return 'developed';
  return roll.status;
}

export function framesLeft(roll: Roll): number {
  return Math.max(0, roll.capacity - roll.shots);
}

/** Instant film and memory-card cameras show shots while the roll is still in the camera. */
export function inCamera(roll: Roll): boolean {
  return roll.status === 'loaded' && roll.kind === 'camera' && getCamera(roll.cameraId).instant;
}

/** Whether the roll's photos can be looked at (developed, or an instant camera). */
export function viewable(roll: Roll, now = Date.now()): boolean {
  return effectiveStatus(roll, now) === 'developed' || inCamera(roll);
}

export function isNew(roll: Roll, now: number): boolean {
  return effectiveStatus(roll, now) === 'developed' && !roll.seenAt;
}

// ---------- change notifications ----------

type Listener = () => void;
const listeners = new Set<Listener>();
// Other open tabs/windows of the app hear about changes too (e.g. a roll loaded elsewhere).
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('silvr-data') : null;
if (channel) channel.onmessage = () => listeners.forEach((fn) => fn());

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function notify(): void {
  listeners.forEach((fn) => fn());
  channel?.postMessage('changed');
}

// ---------- persistence ----------

export async function listRolls(now = Date.now()): Promise<Roll[]> {
  // Promotion developing → developed is computed, not written back: a write here
  // could resurrect a roll another tab just deleted or undo its markSeen.
  const rolls = await getAll<Roll>('rolls');
  return rolls.map((r) => (r.status === 'developing' && effectiveStatus(r, now) === 'developed' ? { ...r, status: 'developed' as const } : r)).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getRoll(id: string): Promise<Roll | undefined> {
  return get<Roll>('rolls', id);
}

export async function getActiveRoll(): Promise<Roll | undefined> {
  const rolls = await getAll<Roll>('rolls');
  return rolls.find((r) => r.kind === 'camera' && r.status === 'loaded');
}

export async function loadRoll(stockId: string, capacity: number, aspect: Aspect, now = Date.now(), cameraId?: string): Promise<Roll> {
  const roll: Roll = { id: uid(), kind: 'camera', stockId, capacity, shots: 0, negatives: 0, aspect, createdAt: now, status: 'loaded', cameraId };
  await atomic(['rolls'], async (t) => {
    const all = (await rq(t.objectStore('rolls').getAll())) as Roll[];
    if (all.some((r) => r.kind === 'camera' && r.status === 'loaded')) throw new Error('A roll is already loaded');
    await rq(t.objectStore('rolls').put(roll));
  });
  notify();
  return roll;
}

const readRoll = async (t: IDBTransaction, id: string) => (await rq(t.objectStore('rolls').get(id))) as Roll | undefined;

export async function listPhotos(rollId: string): Promise<Photo[]> {
  const photos = await getAllByIndex<Photo>('photos', 'rollId', rollId);
  return photos.sort((a, b) => a.frame - b.frame);
}

export async function getPhoto(id: string): Promise<Photo | undefined> {
  return get<Photo>('photos', id);
}

export async function getBlob(key: string): Promise<Blob | undefined> {
  return get<Blob>('blobs', key);
}

export interface ShotResult {
  photo: Photo;
  roll: Roll;
  finished: boolean;
}

/**
 * Stores a negative on the loaded roll. `exposures` is how many counter steps
 * this negative consumes now (half-frame partners were counted when pending).
 * Clears any pending exposure. Throws if the roll is full or not loaded.
 */
export async function addShot(
  rollId: string,
  negative: Blob,
  dev: DevelopSettings,
  size: { width: number; height: number },
  takenAt = Date.now(),
  exposures = 1,
): Promise<ShotResult> {
  const result = await atomic(['rolls', 'photos', 'blobs'], async (t) => {
    const roll = await readRoll(t, rollId);
    if (!roll || roll.status !== 'loaded') throw new Error('Roll is not loaded');
    if (roll.shots + exposures > roll.capacity) throw new Error('Roll is full');
    roll.shots += exposures;
    roll.negatives = (roll.negatives ?? roll.shots - exposures) + 1;
    const hadPending = !!roll.pending;
    roll.pending = undefined;
    const photo: Photo = { id: uid(), rollId, frame: roll.negatives, takenAt, width: size.width, height: size.height, develop: dev };
    if (!roll.coverPhotoId) roll.coverPhotoId = photo.id;
    await rq(t.objectStore('rolls').put(roll));
    await rq(t.objectStore('photos').put(photo));
    await rq(t.objectStore('blobs').put(negative, blobKey.neg(photo.id)));
    if (hadPending) await rq(t.objectStore('blobs').delete(pendingKey(rollId)));
    return { photo, roll, finished: roll.shots >= roll.capacity };
  });
  notify();
  return result;
}

/**
 * Keeps the first half (half-frame) or first exposure (double exposure) until
 * its partner arrives. A half consumes one counter step right away.
 */
export async function savePending(rollId: string, blob: Blob, pending: PendingExposure): Promise<Roll> {
  const roll = await atomic(['rolls', 'blobs'], async (t) => {
    const r = await readRoll(t, rollId);
    if (!r || r.status !== 'loaded') throw new Error('Roll is not loaded');
    if (r.pending) throw new Error('An exposure is already pending');
    const cost = pending.kind === 'half' ? 1 : 0;
    if (r.shots + Math.max(cost, 1) > r.capacity) throw new Error('Roll is full');
    r.shots += cost;
    r.pending = pending;
    await rq(t.objectStore('rolls').put(r));
    await rq(t.objectStore('blobs').put(blob, pendingKey(rollId)));
    return r;
  });
  notify();
  return roll;
}

/** Forgets a pending exposure whose blob is gone (refunds a half-frame step). */
export async function dropPending(rollId: string): Promise<void> {
  await atomic(['rolls', 'blobs'], async (t) => {
    const r = await readRoll(t, rollId);
    if (!r?.pending) return;
    if (r.pending.kind === 'half') r.shots = Math.max(0, r.shots - 1);
    r.pending = undefined;
    await rq(t.objectStore('rolls').put(r));
    await rq(t.objectStore('blobs').delete(pendingKey(rollId)));
  });
  notify();
}

export async function getPending(rollId: string): Promise<Blob | undefined> {
  return getBlob(pendingKey(rollId));
}

/**
 * Rewinds the roll and sends it to the lab. Empty rolls are discarded. A
 * still-pending exposure is dropped (callers commit it first with addShot).
 */
export async function finishRoll(rollId: string, speed: DevelopSpeed, now = Date.now()): Promise<Roll | null> {
  const result = await atomic(['rolls', 'photos', 'blobs'], async (t) => {
    const roll = await readRoll(t, rollId);
    if (!roll) throw new Error('Roll not found');
    if (roll.status !== 'loaded') return roll;
    if (roll.pending) {
      if (roll.pending.kind === 'half') roll.shots = Math.max(0, roll.shots - 1);
      roll.pending = undefined;
      await rq(t.objectStore('blobs').delete(pendingKey(rollId)));
    }
    const photos = await rq(t.objectStore('photos').index('rollId').count(rollId));
    if (photos === 0) {
      await rq(t.objectStore('rolls').delete(rollId));
      return null;
    }
    roll.finishedAt = now;
    roll.readyAt = readyAtFor(speed, now);
    roll.status = speed === 'instant' ? 'developed' : 'developing';
    await rq(t.objectStore('rolls').put(roll));
    return roll;
  });
  notify();
  return result;
}

/** Skip the wait. (Future Pro perk — see entitlements.ts.) */
export async function rushRoll(rollId: string, now = Date.now()): Promise<void> {
  await atomic(['rolls'], async (t) => {
    const roll = await readRoll(t, rollId);
    if (!roll || roll.status !== 'developing') return;
    roll.readyAt = Math.min(roll.readyAt ?? now, now);
    roll.status = 'developed';
    await rq(t.objectStore('rolls').put(roll));
  });
  notify();
}

export async function markSeen(rollId: string, now = Date.now()): Promise<void> {
  let changed = false;
  await atomic(['rolls'], async (t) => {
    const roll = await readRoll(t, rollId);
    if (!roll || roll.seenAt) return;
    roll.seenAt = now;
    changed = true;
    await rq(t.objectStore('rolls').put(roll));
  });
  if (changed) notify();
}

export interface PrintOptions {
  dateFormat: DateFormat;
  /** The user is waiting on this print (viewer); jump the develop queue. */
  urgent?: boolean;
}

const inflight = new Map<string, Promise<DevelopOutput | null>>();

/**
 * Returns an up-to-date print for the photo, developing (and caching) it when
 * the stored print is missing or was made with an older recipe.
 */
export async function ensurePrint(photo: Photo, opts: PrintOptions): Promise<{ print: Blob; thumb: Blob } | null> {
  const key = `${developKey(photo.develop)}|${opts.dateFormat}`;
  if (photo.printKey === key) {
    const [print, thumb] = await Promise.all([getBlob(blobKey.print(photo.id)), getBlob(blobKey.thumb(photo.id))]);
    if (print && thumb) return { print, thumb };
  }
  const jobKey = `${photo.id}|${key}`;
  let job = inflight.get(jobKey);
  if (!job) {
    job = (async () => {
      const neg = await getBlob(blobKey.neg(photo.id));
      if (!neg) return null;
      const out = await develop(neg, photo.develop, { takenAt: photo.takenAt, frame: photo.frame, dateFormat: opts.dateFormat }, { urgent: opts.urgent, id: jobKey });
      const recipe = developKey(photo.develop);
      // Read-check-write in one transaction so a concurrent re-develop is never overwritten.
      let stored = false;
      await tx(['photos', 'blobs'], (t) => {
        const ps = t.objectStore('photos');
        const r = ps.get(photo.id);
        r.onsuccess = () => {
          const fresh = r.result as Photo | undefined;
          if (!fresh || developKey(fresh.develop) !== recipe) return; // deleted or recipe changed meanwhile
          ps.put({ ...fresh, printKey: key, printW: out.width, printH: out.height });
          t.objectStore('blobs').put(out.blob, blobKey.print(photo.id));
          t.objectStore('blobs').put(out.thumb, blobKey.thumb(photo.id));
          stored = true;
        };
      });
      if (!stored && !(await getPhoto(photo.id))) return null;
      if (stored) Object.assign(photo, { printKey: key, printW: out.width, printH: out.height });
      return out;
    })().finally(() => inflight.delete(jobKey));
    inflight.set(jobKey, job);
  } else if (opts.urgent) {
    promote(jobKey);
  }
  const out = await job;
  return out ? { print: out.blob, thumb: out.thumb } : null;
}

export async function updateDevelop(photoId: string, dev: DevelopSettings): Promise<Photo | undefined> {
  const [photo] = await updateDevelopMany([[photoId, dev]]);
  return photo;
}

/** Re-develops several frames atomically (darkroom "apply to roll"). Missing photos are skipped, never recreated. */
export async function updateDevelopMany(changes: [string, DevelopSettings][]): Promise<(Photo | undefined)[]> {
  const out = await atomic(['photos'], async (t) => {
    const res: (Photo | undefined)[] = [];
    for (const [id, dev] of changes) {
      const photo = (await rq(t.objectStore('photos').get(id))) as Photo | undefined;
      if (photo) {
        photo.develop = dev;
        await rq(t.objectStore('photos').put(photo));
      }
      res.push(photo);
    }
    return res;
  });
  notify();
  return out;
}

export async function deletePhoto(photoId: string): Promise<void> {
  await atomic(['photos', 'blobs', 'rolls'], async (t) => {
    const photo = (await rq(t.objectStore('photos').get(photoId))) as Photo | undefined;
    if (!photo) return;
    await rq(t.objectStore('photos').delete(photoId));
    for (const k of Object.values(blobKey)) await rq(t.objectStore('blobs').delete(k(photoId)));
    const roll = await readRoll(t, photo.rollId);
    if (!roll) return;
    const remaining = ((await rq(t.objectStore('photos').index('rollId').getAll(photo.rollId))) as Photo[]).sort((a, b) => a.frame - b.frame);
    if (remaining.length === 0 && roll.status !== 'loaded') {
      await rq(t.objectStore('rolls').delete(roll.id));
      return;
    }
    if (roll.coverPhotoId === photoId) roll.coverPhotoId = remaining[0]?.id;
    // Frames on a loaded roll stay consumed; finished rolls show what is left.
    if (roll.status !== 'loaded') roll.shots = roll.negatives = remaining.length;
    await rq(t.objectStore('rolls').put(roll));
  });
  notify();
}

export async function deleteRoll(rollId: string): Promise<void> {
  await atomic(['photos', 'blobs', 'rolls'], async (t) => {
    const photos = (await rq(t.objectStore('photos').index('rollId').getAll(rollId))) as Photo[];
    for (const p of photos) {
      await rq(t.objectStore('photos').delete(p.id));
      for (const k of Object.values(blobKey)) await rq(t.objectStore('blobs').delete(k(p.id)));
    }
    await rq(t.objectStore('rolls').delete(rollId));
    await rq(t.objectStore('blobs').delete(pendingKey(rollId)));
  });
  notify();
}

export interface ImportItem {
  negative: Blob;
  width: number;
  height: number;
  takenAt: number;
  develop: DevelopSettings;
}

/** Imported photos land on their own, already-developed roll. */
export async function importRoll(stockId: string, items: ImportItem[], now = Date.now()): Promise<Roll> {
  const roll: Roll = {
    id: uid(),
    kind: 'import',
    stockId,
    capacity: items.length,
    shots: items.length,
    aspect: '3:2',
    createdAt: now,
    status: 'developed',
    finishedAt: now,
    readyAt: now,
  };
  const photos: Photo[] = items.map((it, i) => ({
    id: uid(),
    rollId: roll.id,
    frame: i + 1,
    takenAt: it.takenAt,
    width: it.width,
    height: it.height,
    develop: it.develop,
  }));
  roll.coverPhotoId = photos[0]?.id;
  await tx(['rolls', 'photos', 'blobs'], (t) => {
    t.objectStore('rolls').put(roll);
    photos.forEach((p, i) => {
      t.objectStore('photos').put(p);
      t.objectStore('blobs').put(items[i].negative, blobKey.neg(p.id));
    });
  });
  notify();
  return roll;
}
