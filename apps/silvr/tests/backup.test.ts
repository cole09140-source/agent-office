import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultDevelop } from '../src/film/resolve';
import { getStock } from '../src/film/stocks';
import { BackupError, createBackup, restoreBackup, sanitizeDevelop } from '../src/store/backup';
import { clearAll } from '../src/store/db';
import { listLogFrames, listLogRolls, saveLogFrame, saveLogRoll } from '../src/store/filmLog';
import { addShot, blobKey, deletePhoto, finishRoll, getActiveRoll, getBlob, getPending, listPhotos, listRolls, loadRoll, savePending } from '../src/store/rolls';
import { crc32, readZip, writeZip } from '../src/store/zip';

const bytes = (...b: number[]) => new Blob([new Uint8Array(b)], { type: 'image/jpeg' });
const dev = () => defaultDevelop(getStock('sunny200'), 1);

describe('zip container', () => {
  it('crc32 matches the reference value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
  it('round-trips entries including UTF-8 names and empty files', async () => {
    const zip = await writeZip([
      { name: 'a.txt', data: new Blob(['hello']) },
      { name: '필름/사진.jpg', data: bytes(1, 2, 3) },
      { name: 'empty', data: new Blob([]) },
    ]);
    const entries = await readZip(zip);
    expect(entries.map((e) => e.name)).toEqual(['a.txt', '필름/사진.jpg', 'empty']);
    expect(await entries[0].data.text()).toBe('hello');
    expect([...new Uint8Array(await entries[1].data.arrayBuffer())]).toEqual([1, 2, 3]);
    expect(entries[2].size).toBe(0);
  });
  it('rejects non-zip and truncated input', async () => {
    await expect(readZip(new Blob(['not a zip at all']))).rejects.toThrow();
    const zip = await writeZip([{ name: 'a', data: new Blob(['x'.repeat(100)]) }]);
    await expect(readZip(zip.slice(0, zip.size - 30))).rejects.toThrow();
  });
});

describe('backup / restore', () => {
  beforeEach(async () => {
    await clearAll();
  });

  async function library() {
    const r1 = await loadRoll('sunny200', 3, '3:2');
    await addShot(r1.id, bytes(1), dev(), { width: 3, height: 2 });
    await addShot(r1.id, bytes(2), dev(), { width: 3, height: 2 });
    await finishRoll(r1.id, 'instant');
    const r2 = await loadRoll('mono400', 24, '4:3', Date.now(), 'half72');
    await addShot(r2.id, bytes(3), dev(), { width: 4, height: 3 });
    await savePending(r2.id, bytes(9), { kind: 'half', takenAt: 5, width: 3, height: 4 });
    const lr = await saveLogRoll({ camera: 'FM2', film: 'HP5', iso: 400, exposures: 36, startedAt: 1, note: '' });
    await saveLogFrame({ rollId: lr.id, frame: 1, aperture: 'f/8', shutter: '1/125', lens: '50', note: '', takenAt: 2 });
    return { r1, r2 };
  }

  it('restores everything onto an empty device', async () => {
    const { r1, r2 } = await library();
    const { blob, summary } = await createBackup();
    expect(summary).toEqual({ rolls: 2, photos: 3, logRolls: 1 });
    await clearAll();
    const res = await restoreBackup(blob);
    expect(res).toMatchObject({ rolls: 2, photos: 3, logRolls: 1, skipped: 0, damaged: 0 });
    const rolls = await listRolls();
    expect(rolls.map((r) => r.id).sort()).toEqual([r1.id, r2.id].sort());
    const photos = await listPhotos(r1.id);
    expect(photos).toHaveLength(2);
    expect(photos[0].printKey).toBeUndefined();
    expect([...new Uint8Array(await (await getBlob(blobKey.neg(photos[1].id)))!.arrayBuffer())]).toEqual([2]);
    expect((await getActiveRoll())?.id).toBe(r2.id);
    expect(await getPending(r2.id)).toBeDefined();
    const logs = await listLogRolls();
    expect(logs).toHaveLength(1);
    expect(await listLogFrames(logs[0].id)).toHaveLength(1);
  });

  it('merges without duplicating and never puts two rolls in the camera', async () => {
    const { r2 } = await library();
    const { blob } = await createBackup();
    // Restoring onto the same device changes nothing.
    expect(await restoreBackup(blob)).toMatchObject({ rolls: 0, photos: 0, logRolls: 0, damaged: 0 });
    // A device with its own roll in the camera keeps it; the backup's loaded roll comes out developed.
    await clearAll();
    const mine = await loadRoll('sunny200', 12, '3:2');
    await restoreBackup(blob);
    expect((await getActiveRoll())?.id).toBe(mine.id);
    const restored = (await listRolls()).find((r) => r.id === r2.id)!;
    expect(restored.status).toBe('developed');
    expect(restored.pending).toBeUndefined();
    expect(await getPending(r2.id)).toBeUndefined();
    // …and its waiting half became a frame of its own instead of being dropped.
    const frames = await listPhotos(r2.id);
    expect(frames.map((p) => p.frame)).toEqual([1, 2]);
    expect(restored.negatives).toBe(2);
  });

  it('puts back photos deleted from a roll that still exists', async () => {
    const { r1 } = await library();
    const { blob } = await createBackup();
    const [first] = await listPhotos(r1.id);
    await deletePhoto(first.id);
    expect(await listPhotos(r1.id)).toHaveLength(1);
    const res = await restoreBackup(blob);
    expect(res.photos).toBe(1);
    expect(await listPhotos(r1.id)).toHaveLength(2);
    expect((await listRolls()).find((r) => r.id === r1.id)?.negatives).toBe(2);
  });

  it('sanitises garbage develop settings and odd manifest shapes', async () => {
    const d = sanitizeDevelop({ stockId: 'nope', push: 'x' as unknown as number, grain: 99, border: 'evil' as never, rotate: -1, palette: 'zzz', cameraId: 'nope' }, 'mono400');
    expect(d.stockId).toBe('sunny200'); // unknown stock falls back like getStock()
    expect(d.push).toBe(0);
    expect(d.grain).toBe(2);
    expect(d.rotate).toBe(3);
    expect(d.palette).toBeUndefined();
    expect(d.cameraId).toBeUndefined();
    expect(['none', 'film35', 'instant', 'print']).toContain(d.border);
    const manifest = { format: 'silvr-backup', version: 1, createdAt: 1, rolls: [null, { id: 'x' }, 5], photos: [], logRolls: 'nope', logFrames: [null], blobs: {} };
    const zip = await writeZip([{ name: 'manifest.json', data: new Blob([JSON.stringify(manifest)]) }]);
    expect(await restoreBackup(zip)).toMatchObject({ rolls: 0, photos: 0, logRolls: 0 });
    const newer = await writeZip([{ name: 'manifest.json', data: new Blob([JSON.stringify({ ...manifest, version: 99 })]) }]);
    await expect(restoreBackup(newer)).rejects.toMatchObject({ code: 'newer' });
  });

  it('skips damaged negatives and rejects foreign files', async () => {
    await library();
    const { blob } = await createBackup();
    const neg = (await readZip(blob)).find((e) => e.name.startsWith('negatives/'))!;
    // Flip the first payload byte of one negative (its stored checksum no longer matches).
    const buf = new Uint8Array(await blob.arrayBuffer());
    const name = new TextEncoder().encode(neg.name);
    let at = -1;
    for (let i = 0; i < buf.length - name.length; i++) if (buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 3 && buf[i + 3] === 4 && name.every((c, k) => buf[i + 30 + k] === c)) at = i + 30 + name.length;
    expect(at).toBeGreaterThan(0);
    buf[at] ^= 0xff;
    await clearAll();
    const res = await restoreBackup(new Blob([buf]));
    expect(res.damaged).toBe(1);
    expect(res.photos).toBe(2);
    await expect(restoreBackup(new Blob(['hello']))).rejects.toBeInstanceOf(BackupError);
    const notOurs = await writeZip([{ name: 'manifest.json', data: new Blob(['{"format":"other"}']) }]);
    await expect(restoreBackup(notOurs)).rejects.toBeInstanceOf(BackupError);
  });
});
