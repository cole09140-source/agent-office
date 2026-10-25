/**
 * Whole-library backup as a single .zip (manifest.json + original negatives).
 * Everything SILVR keeps lives only on this device, so this is the user's way
 * to move phones or survive a browser clearing its storage. Prints and thumbs
 * are left out: they re-develop from the negatives on demand.
 */
import { get, getAll, tx } from './db';
import { type LogFrame, type LogRoll } from './filmLog';
import { blobKey, notify, type Photo, type Roll } from './rolls';
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
}

export interface RestoreResult extends BackupSummary {
  /** Items already on this device (same id), left untouched. */
  skipped: number;
  /** Entries whose data failed its checksum or was missing. */
  damaged: number;
}

export class BackupError extends Error {}

const ext = (type: string) => (type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg');

export async function createBackup(now = Date.now(), onProgress?: (done: number, total: number) => void): Promise<{ blob: Blob; summary: BackupSummary }> {
  const [rolls, photos, logRolls, logFrames] = await Promise.all([getAll<Roll>('rolls'), getAll<Photo>('photos'), getAll<LogRoll>('logRolls'), getAll<LogFrame>('logFrames')]);
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
  for (const r of rolls) if (r.pending) await add(`pending:${r.id}`);
  const manifest: BackupManifest = { format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt: now, rolls, photos: kept, logRolls, logFrames, blobs };
  files.unshift({ name: 'manifest.json', data: new Blob([JSON.stringify(manifest)], { type: 'application/json' }) });
  const blob = await writeZip(files, new Date(now), onProgress);
  return { blob, summary: { rolls: rolls.length, photos: kept.length, logRolls: logRolls.length } };
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 200;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function validRoll(r: Roll): boolean {
  return !!r && isStr(r.id) && isStr(r.stockId) && isNum(r.capacity) && isNum(r.shots) && isNum(r.createdAt) && ['loaded', 'developing', 'developed'].includes(r.status) && ['camera', 'import'].includes(r.kind);
}

function validPhoto(p: Photo): boolean {
  return !!p && isStr(p.id) && isStr(p.rollId) && isNum(p.frame) && isNum(p.width) && isNum(p.height) && isNum(p.takenAt) && !!p.develop && isStr(p.develop.stockId);
}

/** Verifies an entry's checksum, then returns it as a lazy slice (a big roll is never held in memory at once). */
async function readEntry(data: Blob, crc: number, type: string): Promise<Blob | null> {
  if (crc32(new Uint8Array(await data.arrayBuffer())) !== crc) return null;
  return data.slice(0, data.size, type);
}

/**
 * Merges a backup into this device. Rolls, photos and log entries that already
 * exist (same id) are kept as they are; the rest are added roll by roll so a
 * failure part-way leaves whole rolls, never half of one.
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
    manifest = JSON.parse(await me.data.text()) as BackupManifest;
  } catch {
    throw new BackupError('manifest.json unreadable');
  }
  if (manifest?.format !== BACKUP_FORMAT || !Array.isArray(manifest.rolls) || !Array.isArray(manifest.photos)) throw new BackupError('Not a SILVR backup');
  if (manifest.version > BACKUP_VERSION) throw new BackupError('Backup made by a newer version');

  const blobRefs = new Map((manifest.blobs ?? []).map((b) => [b.key, b]));
  const loadBlob = async (key: string): Promise<Blob | null> => {
    const ref = blobRefs.get(key);
    const entry = ref && byName.get(ref.file);
    if (!ref || !entry) return null;
    return readEntry(entry.data, entry.crc, ref.type);
  };

  const [localRolls, localPhotos, localLogRolls, localLogFrames] = await Promise.all([getAll<Roll>('rolls'), getAll<Photo>('photos'), getAll<LogRoll>('logRolls'), getAll<LogFrame>('logFrames')]);
  const haveRoll = new Set(localRolls.map((r) => r.id));
  const havePhoto = new Set(localPhotos.map((p) => p.id));
  let cameraLoaded = localRolls.some((r) => r.kind === 'camera' && r.status === 'loaded');

  const result: RestoreResult = { rolls: 0, photos: 0, logRolls: 0, skipped: 0, damaged: 0 };
  const rolls = manifest.rolls.filter(validRoll);
  const photosByRoll = new Map<string, Photo[]>();
  for (const p of manifest.photos.filter(validPhoto)) photosByRoll.set(p.rollId, [...(photosByRoll.get(p.rollId) ?? []), p]);

  for (let i = 0; i < rolls.length; i++) {
    const src = rolls[i];
    onProgress?.(i, rolls.length);
    if (haveRoll.has(src.id)) {
      result.skipped++;
      continue;
    }
    let roll: Roll = { ...src };
    let pending: Blob | null = null;
    if (roll.kind === 'camera' && roll.status === 'loaded') {
      if (cameraLoaded) {
        // Only one roll can sit in the camera: the restored one comes out developed.
        const { pending: _p, ...rest } = roll;
        roll = { ...rest, status: 'developed', finishedAt: now, readyAt: now };
      } else {
        cameraLoaded = true;
        if (roll.pending) {
          pending = await loadBlob(`pending:${roll.id}`);
          if (!pending) {
            const { pending: _p, ...rest } = roll;
            roll = rest;
          }
        }
      }
    }
    const items: { photo: Photo; neg: Blob }[] = [];
    for (const p of photosByRoll.get(src.id) ?? []) {
      if (havePhoto.has(p.id)) {
        result.skipped++;
        continue;
      }
      const neg = await loadBlob(blobKey.neg(p.id));
      if (!neg) {
        result.damaged++;
        continue;
      }
      items.push({ photo: p, neg });
    }
    if (roll.coverPhotoId && !items.some((it) => it.photo.id === roll.coverPhotoId)) roll.coverPhotoId = items[0]?.photo.id;
    roll.negatives = items.length;
    await tx(['rolls', 'photos', 'blobs'], (t) => {
      t.objectStore('rolls').put(roll);
      for (const it of items) {
        t.objectStore('photos').put(it.photo);
        t.objectStore('blobs').put(it.neg, blobKey.neg(it.photo.id));
      }
      if (pending) t.objectStore('blobs').put(pending, `pending:${roll.id}`);
    });
    result.rolls++;
    result.photos += items.length;
  }

  const haveLogRoll = new Set(localLogRolls.map((r) => r.id));
  const haveLogFrame = new Set(localLogFrames.map((f) => f.id));
  const logRolls = (manifest.logRolls ?? []).filter((r) => r && isStr(r.id) && !haveLogRoll.has(r.id));
  const logIds = new Set([...haveLogRoll, ...logRolls.map((r) => r.id)]);
  const logFrames = (manifest.logFrames ?? []).filter((f) => f && isStr(f.id) && logIds.has(f.rollId) && !haveLogFrame.has(f.id));
  if (logRolls.length || logFrames.length) {
    await tx(['logRolls', 'logFrames'], (t) => {
      logRolls.forEach((r) => t.objectStore('logRolls').put(r));
      logFrames.forEach((f) => t.objectStore('logFrames').put(f));
    });
  }
  result.logRolls = logRolls.length;
  onProgress?.(rolls.length, rolls.length);
  notify();
  return result;
}
