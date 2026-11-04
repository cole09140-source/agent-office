import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearAll } from '../src/store/db';
import { addLogFrame, deleteLogFrame, listLogFrames, restoreLogFrame, saveLogRoll, updateLogFrame } from '../src/store/filmLog';

const base = { aperture: 'f/8', shutter: '1/125', lens: '50mm', note: '', takenAt: 1000 };

describe('film log edits', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('updates aperture / shutter / lens / note but keeps number, time and place', async () => {
    const r = await saveLogRoll({ camera: 'FM2', film: 'Portra', iso: 400, exposures: 36, startedAt: 0, note: '' });
    const f = (await addLogFrame({ rollId: r.id, ...base, lat: 37.5, lon: 127 }))!;
    const u = await updateLogFrame(f.id, { aperture: 'f/2.8', shutter: '1/500', note: 'window', frame: 9, takenAt: 5 } as never);
    expect(u).toMatchObject({ id: f.id, frame: 1, aperture: 'f/2.8', shutter: '1/500', lens: '50mm', note: 'window', takenAt: 1000, lat: 37.5, lon: 127 });
    expect((await listLogFrames(r.id))[0]).toEqual(u);
    expect(await updateLogFrame('missing', { note: 'x' })).toBeNull();
  });

  it('undo puts a deleted frame back with its number, but never duplicates or overfills', async () => {
    const r = await saveLogRoll({ camera: 'FM2', film: 'Portra', iso: 400, exposures: 2, startedAt: 0, note: '' });
    const f1 = (await addLogFrame({ rollId: r.id, ...base }))!;
    const f2 = (await addLogFrame({ rollId: r.id, ...base }))!;
    await deleteLogFrame(f2.id);
    expect(await restoreLogFrame(f2)).toBe(true);
    expect((await listLogFrames(r.id)).map((f) => f.frame)).toEqual([1, 2]);
    // full roll: nothing to restore into
    expect(await restoreLogFrame({ ...f1, id: 'other' })).toBe(false);
    // number reused after the delete: the old frame stays deleted
    await deleteLogFrame(f2.id);
    const again = (await addLogFrame({ rollId: r.id, ...base }))!;
    expect(again.frame).toBe(2);
    await deleteLogFrame(f1.id);
    expect(await restoreLogFrame(f2)).toBe(false);
    expect(await restoreLogFrame(f1)).toBe(true);
    expect((await listLogFrames(r.id)).map((f) => f.id)).toEqual([f1.id, again.id]);
  });
});
