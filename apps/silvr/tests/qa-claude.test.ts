import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultDevelop } from '../src/film/resolve';
import { getStock } from '../src/film/stocks';
import { translate } from '../src/i18n';
import { createBackup, restoreBackup } from '../src/store/backup';
import { clearAll } from '../src/store/db';
import { deleteLogFrame, listLogFrames, saveLogFrame, saveLogRoll } from '../src/store/filmLog';
import { importRoll, listPhotos, listRolls, printKeyFor, type Photo } from '../src/store/rolls';
import { writeZip } from '../src/store/zip';

const bytes = (...b: number[]) => new Blob([new Uint8Array(b)], { type: 'image/jpeg' });
const dev = (stamp = false) => defaultDevelop(getStock('sunny200'), 1, { dateStamp: stamp });

describe('English plurals', () => {
  it('picks the singular for 1 and leaves Korean alone', () => {
    expect(translate('en', 'gal.frames', { n: 1 })).toBe('1 frame');
    expect(translate('en', 'gal.frames', { n: 3 })).toBe('3 frames');
    expect(translate('en', 'set.backup.restored', { rolls: 1, photos: 2 })).toBe('Restored · 1 roll, 2 photos added');
    expect(translate('en', 'set.backup.skipped', { n: 1 })).toBe('1 item already here was left as it was');
    expect(translate('ko', 'gal.frames', { n: 1 })).toBe('1장');
  });
});

describe('print cache key', () => {
  it('ignores the date format unless a date is printed', () => {
    const p = { develop: dev(false) } as Photo;
    expect(printKeyFor(p, 'YMD')).toBe(printKeyFor(p, 'DMY'));
    const stamped = { develop: dev(true) } as Photo;
    expect(printKeyFor(stamped, 'YMD')).not.toBe(printKeyFor(stamped, 'DMY'));
    expect(printKeyFor({ ...stamped, undated: true }, 'YMD')).toBe(printKeyFor({ ...stamped, undated: true }, 'DMY'));
  });
});

describe('restore edge cases', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('keeps an imported roll longer than 1000 photos and photos from before 1970', async () => {
    const items = Array.from({ length: 1001 }, (_, i) => ({ negative: bytes(i % 250), width: 3, height: 2, takenAt: i === 0 ? -1.5e11 : i, develop: dev() }));
    const roll = await importRoll('sunny200', items);
    const { blob, summary } = await createBackup();
    expect(summary.photos).toBe(1001);
    await clearAll();
    const res = await restoreBackup(blob);
    expect(res).toMatchObject({ rolls: 1, photos: 1001, damaged: 0 });
    const photos = await listPhotos(roll.id);
    expect(photos.some((p) => p.takenAt < 0)).toBe(true);
  }, 30_000);

  it('counts unreadable rolls and photos as damaged instead of hiding them', async () => {
    const manifest = {
      format: 'silvr-backup',
      version: 1,
      createdAt: 1,
      rolls: [{ id: 'bad', stockId: 'sunny200', capacity: 0, shots: 0, status: 'developed', kind: 'camera', createdAt: 1 }],
      photos: [{ id: 'p', rollId: 'bad', frame: 1, width: 3, height: 2, takenAt: 1, develop: {} }],
      logRolls: [],
      logFrames: [],
      blobs: {},
    };
    const zip = await writeZip([{ name: 'manifest.json', data: new Blob([JSON.stringify(manifest)]) }]);
    expect(await restoreBackup(zip)).toMatchObject({ rolls: 0, photos: 0, damaged: 2 });
    expect(await listRolls()).toHaveLength(0);
  });

  it('does not duplicate a log frame number or overfill a log roll on merge', async () => {
    const lr = await saveLogRoll({ camera: 'FM2', film: 'HP5', iso: 400, exposures: 2, startedAt: 1, note: '' });
    await saveLogFrame({ rollId: lr.id, frame: 1, aperture: '', shutter: '', lens: '', note: '', takenAt: 1 });
    const second = await saveLogFrame({ rollId: lr.id, frame: 2, aperture: '', shutter: '', lens: '', note: '', takenAt: 2 });
    const { blob } = await createBackup();
    await deleteLogFrame(second.id);
    await saveLogFrame({ rollId: lr.id, frame: 2, aperture: 'f/8', shutter: '', lens: '', note: '', takenAt: 3 });
    await restoreBackup(blob);
    const frames = await listLogFrames(lr.id);
    expect(frames.map((f) => f.frame).sort()).toEqual([1, 2]);
  });
});
