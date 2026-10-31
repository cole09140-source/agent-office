/**
 * Whole-library backup as a single .zip (manifest.json + original negatives).
 * Everything SILVR keeps lives only on this device, so this is the user's way
 * to move phones or survive a browser clearing its storage. Prints and thumbs
 * are left out: they re-develop from the negatives on demand.
 */
import { PALETTE_IDS, hasCamera } from '../cameras/models';
import { defaultDevelop } from '../film/resolve';
import { getStock } from '../film/stocks';
import type { Aspect, BorderStyle, DevelopSettings } from '../film/types';
import { atomic, get, getAll, rq, tx } from './db';
import { type LogFrame, type LogRoll } from './filmLog';
import { blobKey, notify, uid, type Photo, type Roll } from './rolls';
import { crc32, readZip, writeZip, type ZipInput } from './zip';

export const BACKUP_FORMAT = 'silvr-backup';
export const BACKUP_VERSION = 1;

interface BlobRef {
  key: string;
  file: string;
  type: string;
}

export interface BackupManifest {
  format: typeof BACKUP_FORMAT;
  version: number;
  createdAt: number;
  rolls: Roll[];
  photos: Photo[];
  logRolls: LogRoll[];
  logFrames: LogFrame[];
  blobs: BlobRef[];
}

export interface BackupSummary {
  rolls: number;
  photos: number;
  logRolls: number;
  /** Waiting first exposures (half frame / double exposure) carried in the backup. */
  pending?: number;
}

export interface RestoreResult extends BackupSummary {
  /** Items already on this device (same id), left untouched. */
  skipped: number;
  /** Entries whose data failed its checksum or was missing. */
  damaged: number;
}

export class BackupError extends Error {
  constructor(
    message: string,
    readonly code: 'invalid' | 'newer' | 'too-large' = 'invalid',
  ) {
    super(message);
  }
}

/** A library of ~200k photos fits easily; anything bigger is not ours. */
const MAX_MANIFEST_BYTES = 128 * 1024 * 1024;

/** Plain zip tops out at 4 GB; stop before reading gigabytes for nothing. */
const MAX_BACKUP_BYTES = 0xffffffff - 64 * 1024 * 1024;

const ext = (type: string) => (type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg');

export async function createBackup(now = Date.now(), onProgress?: (done: number, total: number) => void): Promise<{ blob: Blob; summary: BackupSummary }> {
  // One snapshot: separate reads could pair rolls and photos from different moments if another tab shoots meanwhile.
  const [rolls, photos, logRolls, logFrames] = await atomic(['rolls', 'photos', 'logRolls', 'logFrames'], async (t) =>
    Promise.all([
      rq(t.objectStore('rolls').getAll()) as Promise<Roll[]>,
      rq(t.objectStore('photos').getAll()) as Promise<Photo[]>,
      rq(t.objectStore('logRolls').getAll()) as Promise<LogRoll[]>,
      rq(t.objectStore('logFrames').getAll()) as Promise<LogFrame[]>,
    ]),
  );
  const files: ZipInput[] = [];
  const blobs: BlobRef[] = [];
  const add = async (key: string) => {
    const b = await get<Blob>('blobs', key);
    if (!b) return false;
    const type = b.type || 'image/jpeg';
    const file = `negatives/${blobs.length + 1}.${ext(type)}`;
    blobs.push({ key, file, type });
    files.push({ name: file, data: b });
    return true;
  };
  const kept: Photo[] = [];
  for (const p of photos) {
    // A photo without its negative can't be restored meaningfully.
    if (!(await add(blobKey.neg(p.id)))) continue;
    const { printKey: _k, printW: _w, printH: _h, ...rest } = p;
    kept.push(rest);
  }
  let pending = 0;
  for (const r of rolls) if (r.pending && (await add(`pending:${r.id}`))) pending++;
  if (files.reduce((n, f) => n + f.data.size, 0) > MAX_BACKUP_BYTES) throw new BackupError('Library larger than 4 GB', 'too-large');
  const manifest: BackupManifest = { format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt: now, rolls, photos: kept, logRolls, logFrames, blobs };
  files.unshift({ name: 'manifest.json', data: new Blob([JSON.stringify(manifest)], { type: 'application/json' }) });
  const blob = await writeZip(files, new Date(now), onProgress);
  return { blob, summary: { rolls: rolls.length, photos: kept.length, logRolls: logRolls.length, pending } };
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 200;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const clamp = (v: unknown, lo: number, hi: number, fallback: number) => (isNum(v) ? Math.min(hi, Math.max(lo, v)) : fallback);
/** A timestamp Date/Intl can format (a forged 1e20 would throw RangeError on every render). */
const isTime = (v: unknown): v is number => isNum(v) && v >= 0 && v <= 8.64e15;
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const ASPECTS: Aspect[] = ['3:2', '4:3', '1:1', '65:24', '2.39:1', '8:7'];
const BORDERS: BorderStyle[] = ['none', 'film35', 'instant', 'print'];

function validRoll(r: Roll): boolean {
  return (
    !!r &&
    isStr(r.id) &&
    isStr(r.stockId) &&
    isNum(r.capacity) &&
    isNum(r.shots) &&
    r.shots >= 0 &&
    r.capacity >= 1 &&
    r.capacity <= 1000 &&
    isTime(r.createdAt) &&
    ['loaded', 'developing', 'developed'].includes(r.status) &&
    ['camera', 'import'].includes(r.kind)
  );
}

function validPhoto(p: Photo): boolean {
  return !!p && isStr(p.id) && isStr(p.rollId) && isNum(p.frame) && p.width >= 1 && p.height >= 1 && isTime(p.takenAt) && !!p.develop && typeof p.develop === 'object';
}

/** Rebuilds develop settings from known fields only, so a damaged recipe can't break rendering. */
export function sanitizeDevelop(d: Partial<DevelopSettings>, fallbackStock: string): DevelopSettings {
  const stock = getStock(typeof d.stockId === 'string' ? d.stockId : fallbackStock);
  const base = defaultDevelop(stock, isNum(d.seed) ? d.seed : 1);
  const out: DevelopSettings = {
    ...base,
    push: clamp(d.push, -2, 2, 0),
    expired: clamp(d.expired, 0, 1, 0),
    grain: clamp(d.grain, 0, 2, 1),
    halation: clamp(d.halation, 0, 2, 1),
    leak: isNum(d.leak) ? d.leak : null,
    flash: typeof d.flash === 'boolean' ? d.flash : base.flash,
    dateStamp: typeof d.dateStamp === 'boolean' ? d.dateStamp : false,
    border: BORDERS.includes(d.border as BorderStyle) ? (d.border as BorderStyle) : base.border,
  };
  if (isNum(d.rotate)) out.rotate = ((Math.round(d.rotate) % 4) + 4) % 4;
  if (typeof d.cameraId === 'string' && hasCamera(d.cameraId)) out.cameraId = d.cameraId;
  if (isNum(d.ev)) out.ev = clamp(d.ev, -2, 2, 0);
  if (typeof d.palette === 'string' && PALETTE_IDS.includes(d.palette)) out.palette = d.palette;
  return out;
}

function sanitizeRoll(r: Roll): Roll {
  const roll: Roll = { ...r, aspect: ASPECTS.includes(r.aspect) ? r.aspect : '3:2', capacity: Math.round(r.capacity), shots: Math.min(Math.round(r.shots), Math.round(r.capacity)) };
  if (roll.cameraId !== undefined && !(typeof roll.cameraId === 'string' && hasCamera(roll.cameraId))) delete roll.cameraId;
  const pd = roll.pending;
  if (pd && !(['half', 'double'].includes(pd.kind) && isTime(pd.takenAt) && pd.width >= 1 && pd.height >= 1)) {
    if (pd.kind === 'half') roll.shots = Math.max(0, roll.shots - 1); // the waiting half had used a frame
    delete roll.pending;
  }
  for (const k of ['finishedAt', 'readyAt', 'seenAt'] as const) if (roll[k] !== undefined && !isTime(roll[k])) delete roll[k];
  // A roll in the lab needs a ready time, or the lab clock would poll it forever.
  if (roll.status === 'developing' && roll.readyAt === undefined) roll.readyAt = Date.now();
  return roll;
}

/** Shooting-log records rebuilt field by field: strings stay strings, numbers stay in range. */
function sanitizeLogRoll(r: LogRoll): LogRoll | null {
  if (!r || !isStr(r.id)) return null;
  return {
    id: r.id,
    camera: text(r.camera, 60),
    film: text(r.film, 60),
    iso: Math.round(clamp(r.iso, 1, 12800, 400)),
    exposures: Math.round(clamp(r.exposures, 1, 100, 36)),
    startedAt: isTime(r.startedAt) ? r.startedAt : Date.now(),
    note: text(r.note, 500),
  };
}

function sanitizeLogFrame(f: LogFrame): LogFrame | null {
  if (!f || !isStr(f.id) || !isStr(f.rollId)) return null;
  const frame: LogFrame = {
    id: f.id,
    rollId: f.rollId,
    frame: Math.round(clamp(f.frame, 1, 1000, 1)),
    aperture: text(f.aperture, 10),
    shutter: text(f.shutter, 20),
    lens: text(f.lens, 40),
    note: text(f.note, 140),
    takenAt: isTime(f.takenAt) ? f.takenAt : Date.now(),
  };
  if (isNum(f.lat) && isNum(f.lon) && Math.abs(f.lat) <= 90 && Math.abs(f.lon) <= 180) {
    frame.lat = f.lat;
    frame.lon = f.lon;
  }
  return frame;
}

/** Verifies an entry's checksum in 4 MB chunks (a huge or forged entry is never read into memory at once), then returns it as a lazy slice. */
async function readEntry(data: Blob, crc: number, type: string): Promise<Blob | null> {
  let c = 0;
  for (let at = 0; at < data.size; at += 4 * 1024 * 1024) c = crc32(new Uint8Array(await data.slice(at, at + 4 * 1024 * 1024).arrayBuffer()), c);
  if (c !== crc) return null;
  return data.slice(0, data.size, type);
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v.filter((x) => x && typeof x === 'object') as T[]) : []);

/**
 * Merges a backup into this device. Nothing already here is changed: rolls
 * and log entries with the same id are kept, but photos missing from an
 * existing (finished) roll — e.g. deleted by mistake — are put back. Each roll
 * is written in one transaction, so a failure part-way leaves whole rolls.
 */
export async function restoreBackup(file: Blob, now = Date.now(), onProgress?: (done: number, total: number) => void): Promise<RestoreResult> {
  let entries;
  try {
    entries = await readZip(file);
  } catch (err) {
    throw new BackupError((err as Error).message);
  }
  const byName = new Map(entries.map((e) => [e.name, e]));
  const me = byName.get('manifest.json');
  if (!me) throw new BackupError('manifest.json missing');
  let manifest: BackupManifest;
  try {
    if (me.size > MAX_MANIFEST_BYTES) throw new Error('manifest too large'); // JSON.parse of a forged giant would exhaust memory
    const raw = await readEntry(me.data, me.crc, 'application/json');
    if (!raw) throw new Error('checksum');
    manifest = JSON.parse(await raw.text()) as BackupManifest;
  } catch {
    throw new BackupError('manifest.json unreadable');
  }
  if (!manifest || manifest.format !== BACKUP_FORMAT || !Array.isArray(manifest.rolls) || !Array.isArray(manifest.photos)) throw new BackupError('Not a SILVR backup');
  if (!isNum(manifest.version) || manifest.version > BACKUP_VERSION) throw new BackupError('Backup made by a newer version', 'newer');

  const blobRefs = new Map(arr<BlobRef>(manifest.blobs).filter((b) => isStr(b.key) && isStr(b.file)).map((b) => [b.key, b]));
  const loadBlob = async (key: string): Promise<Blob | null> => {
    const ref = blobRefs.get(key);
    const entry = ref && byName.get(ref.file);
    if (!ref || !entry) return null;
    return readEntry(entry.data, entry.crc, typeof ref.type === 'string' ? ref.type : 'image/jpeg');
  };

  const result: RestoreResult = { rolls: 0, photos: 0, logRolls: 0, skipped: 0, damaged: 0 };
  const rolls = arr<Roll>(manifest.rolls).filter(validRoll).map(sanitizeRoll);
  const photosByRoll = new Map<string, Photo[]>();
  for (const p of arr<Photo>(manifest.photos).filter(validPhoto)) {
    const list = photosByRoll.get(p.rollId);
    if (list) list.push(p);
    else photosByRoll.set(p.rollId, [p]);
  }
  const logRolls = arr<LogRoll>(manifest.logRolls).map(sanitizeLogRoll).filter((r): r is LogRoll => !!r);
  const logFrames = arr<LogFrame>(manifest.logFrames).map(sanitizeLogFrame).filter((f): f is LogFrame => !!f);

  try {
    const localPhotoIds = new Set((await getAll<Photo>('photos')).map((p) => p.id));
    for (let i = 0; i < rolls.length; i++) {
      onProgress?.(i, rolls.length);
      const src = rolls[i];
      const items: { photo: Photo; neg: Blob }[] = [];
      for (const p of photosByRoll.get(src.id) ?? []) {
        if (localPhotoIds.has(p.id)) {
          result.skipped++;
          continue;
        }
        const neg = await loadBlob(blobKey.neg(p.id));
        if (!neg) {
          result.damaged++;
          continue;
        }
        const { printKey: _k, printW: _w, printH: _h, ...rest } = p;
        items.push({ photo: { ...rest, frame: Math.max(1, Math.round(p.frame)), develop: sanitizeDevelop(p.develop, src.stockId) }, neg });
      }
      const pending = src.pending ? await loadBlob(`pending:${src.id}`) : null;
      if (src.pending && !pending) result.damaged++;

      // Decide and write inside one transaction: another tab (or the user, while a
      // long restore runs) may load a roll or restore the same one meanwhile.
      const outcome = await atomic(['rolls', 'photos', 'blobs'], async (t) => {
        const rollStore = t.objectStore('rolls');
        const existing = (await rq(rollStore.get(src.id))) as Roll | undefined;
        const fresh: { photo: Photo; neg: Blob }[] = [];
        for (const it of items) if (!(await rq(t.objectStore('photos').get(it.photo.id)))) fresh.push(it);
        if (existing) {
          // Put back photos deleted from a finished roll; never touch a roll still in the camera.
          if (existing.status === 'loaded' || !fresh.length) return { kind: 'skip' as const, added: 0 };
          for (const it of fresh) {
            await rq(t.objectStore('photos').put(it.photo));
            await rq(t.objectStore('blobs').put(it.neg, blobKey.neg(it.photo.id)));
          }
          const count = (await rq(t.objectStore('photos').index('rollId').count(src.id))) as number;
          await rq(rollStore.put({ ...existing, negatives: count, coverPhotoId: existing.coverPhotoId ?? fresh[0].photo.id }));
          return { kind: 'merged' as const, added: fresh.length };
        }
        let roll: Roll = { ...src };
        let keepPending = !!(roll.pending && pending);
        if (roll.kind === 'camera' && roll.status === 'loaded') {
          const all = (await rq(rollStore.getAll())) as Roll[];
          if (all.some((r) => r.kind === 'camera' && r.status === 'loaded')) {
            // Only one roll fits in the camera: this one comes out finished. Its waiting
            // exposure becomes a frame of its own (as rewinding would), never lost.
            const { pending: pd, ...rest } = roll;
            roll = { ...rest, status: 'developed', finishedAt: now, readyAt: now, seenAt: now };
            if (pd && pending) {
              const maxFrame = fresh.reduce((m, it) => Math.max(m, it.photo.frame), 0);
              const cover = fresh[0]?.photo.develop ?? sanitizeDevelop({ stockId: roll.stockId, cameraId: roll.cameraId }, roll.stockId);
              const id = uid();
              fresh.push({ photo: { id, rollId: roll.id, frame: maxFrame + 1, takenAt: pd.takenAt, width: pd.width, height: pd.height, develop: { ...cover, seed: Math.floor(pd.takenAt % 1e9) } }, neg: pending });
            }
            keepPending = false;
          }
        } else if (roll.pending) {
          delete roll.pending;
          keepPending = false;
        }
        if (!keepPending && roll.pending) {
          // Its blob is missing or damaged: drop the waiting exposure the way dropPending does.
          if (roll.pending.kind === 'half') roll.shots = Math.max(0, roll.shots - 1);
          delete roll.pending;
        }
        // A finished roll with nothing left in it isn't kept (rewinding an empty roll deletes it too).
        if (roll.status !== 'loaded' && !fresh.length) return { kind: 'empty' as const, added: 0 };
        const maxFrame = fresh.reduce((m, it) => Math.max(m, it.photo.frame), 0);
        // In-camera rolls number the next shot from `negatives`: never reuse a restored frame number.
        roll.negatives = roll.status === 'loaded' ? Math.max(maxFrame, fresh.length) : fresh.length;
        if (!roll.coverPhotoId || !fresh.some((it) => it.photo.id === roll.coverPhotoId)) roll.coverPhotoId = fresh[0]?.photo.id;
        await rq(rollStore.put(roll));
        for (const it of fresh) {
          await rq(t.objectStore('photos').put(it.photo));
          await rq(t.objectStore('blobs').put(it.neg, blobKey.neg(it.photo.id)));
        }
        if (keepPending && pending) await rq(t.objectStore('blobs').put(pending, `pending:${roll.id}`));
        return { kind: 'added' as const, added: fresh.length };
      });
      if (outcome.kind === 'skip') result.skipped++;
      else if (outcome.kind === 'added') {
        result.rolls++;
        result.photos += outcome.added;
      } else if (outcome.kind === 'merged') result.photos += outcome.added;
    }

    const [localLogRolls, localLogFrames] = await Promise.all([getAll<LogRoll>('logRolls'), getAll<LogFrame>('logFrames')]);
    const haveLogRoll = new Set(localLogRolls.map((r) => r.id));
    const haveLogFrame = new Set(localLogFrames.map((f) => f.id));
    const newLogRolls = logRolls.filter((r) => !haveLogRoll.has(r.id));
    const logIds = new Set([...haveLogRoll, ...newLogRolls.map((r) => r.id)]);
    const newLogFrames = logFrames.filter((f) => logIds.has(f.rollId) && !haveLogFrame.has(f.id));
    if (newLogRolls.length || newLogFrames.length) {
      await tx(['logRolls', 'logFrames'], (t) => {
        newLogRolls.forEach((r) => t.objectStore('logRolls').put(r));
        newLogFrames.forEach((f) => t.objectStore('logFrames').put(f));
      });
    }
    result.logRolls = newLogRolls.length;
    onProgress?.(rolls.length, rolls.length);
  } catch (err) {
    // Rolls written before the failure stay; say how far it got.
    throw Object.assign(err instanceof Error ? err : new Error(String(err)), { partial: { ...result } });
  } finally {
    notify();
  }
  return result;
}
