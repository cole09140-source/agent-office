import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { atomic, get, put, rq } from '../src/store/db';
it('atomic read-modify-write serialises concurrent increments', async () => {
  await put('kv', 0, 'n');
  await Promise.all(Array.from({ length: 10 }, () => atomic(['kv'], async (t) => {
    const v = (await rq(t.objectStore('kv').get('n'))) as number;
    await rq(t.objectStore('kv').put(v + 1, 'n'));
  })));
  expect(await get('kv', 'n')).toBe(10);
});
it('atomic aborts on throw', async () => {
  await put('kv', 5, 'm');
  await expect(atomic(['kv'], async (t) => { await rq(t.objectStore('kv').put(6, 'm')); throw new Error('boom'); })).rejects.toThrow('boom');
  expect(await get('kv', 'm')).toBe(5);
});

import { beforeEach, describe } from 'vitest';
import { defaultDevelop } from '../src/film/resolve';
import { getStock } from '../src/film/stocks';
import { clearAll } from '../src/store/db';
import { addShot, deletePhoto, finishRoll, getBlob, listPhotos, listRolls, loadRoll, markSeen, rushRoll } from '../src/store/rolls';

const neg = () => new Blob([new Uint8Array([1])], { type: 'image/jpeg' });
const dev = () => defaultDevelop(getStock('sunny200'), 1);

describe('concurrency (two tabs / rapid taps)', () => {
  beforeEach(async () => {
    await clearAll();
  });
  it('concurrent shots get distinct frames and never overrun the roll', async () => {
    const r = await loadRoll('sunny200', 3, '3:2');
    const results = await Promise.allSettled(Array.from({ length: 5 }, () => addShot(r.id, neg(), dev(), { width: 3, height: 2 })));
    expect(results.filter((x) => x.status === 'fulfilled')).toHaveLength(3);
    const frames = (await listPhotos(r.id)).map((p) => p.frame);
    expect(frames).toEqual([1, 2, 3]);
    expect((await listRolls()).find((x) => x.id === r.id)?.shots).toBe(3);
  });
  it('a shot racing a rewind never leaves an orphan photo', async () => {
    const r = await loadRoll('sunny200', 12, '3:2');
    const [shot] = await Promise.allSettled([addShot(r.id, neg(), dev(), { width: 3, height: 2 }), finishRoll(r.id, 'instant')]);
    const rolls = await listRolls();
    const photos = await listPhotos(r.id);
    if (rolls.length === 0) expect(photos).toHaveLength(0);
    else expect(photos.length).toBe(rolls[0].negatives);
    if (shot.status === 'fulfilled' && rolls.length) expect(await getBlob(`${shot.value.photo.id}:neg`)).toBeDefined();
  });
  it('two loads at once create exactly one loaded roll', async () => {
    const res = await Promise.allSettled([loadRoll('sunny200', 12, '3:2'), loadRoll('mono400', 12, '3:2')]);
    expect(res.filter((x) => x.status === 'fulfilled')).toHaveLength(1);
    expect((await listRolls()).filter((x) => x.status === 'loaded')).toHaveLength(1);
  });
  it('listing a just-developed roll never undoes markSeen', async () => {
    const r = await loadRoll('sunny200', 12, '3:2');
    await addShot(r.id, neg(), dev(), { width: 3, height: 2 });
    const t0 = Date.now();
    await finishRoll(r.id, '1h', t0);
    await Promise.all([markSeen(r.id), listRolls(t0 + 3600_001)]);
    const roll = (await listRolls(t0 + 3600_001)).find((x) => x.id === r.id)!;
    expect(roll.status).toBe('developed');
    expect(roll.seenAt).toBeDefined();
    await rushRoll(r.id);
  });
  it('deleting the last two photos at once removes the roll cleanly', async () => {
    const r = await loadRoll('sunny200', 12, '3:2');
    const a = await addShot(r.id, neg(), dev(), { width: 3, height: 2 });
    const b = await addShot(r.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(r.id, 'instant');
    await Promise.all([deletePhoto(a.photo.id), deletePhoto(b.photo.id)]);
    expect(await listRolls()).toHaveLength(0);
  });
});
