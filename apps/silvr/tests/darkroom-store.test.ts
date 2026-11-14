import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultBorderFor, defaultDevelop, developKey, effectiveLook } from '../src/film/resolve';
import { getStock } from '../src/film/stocks';
import { getCamera } from '../src/cameras/models';
import { clearAll } from '../src/store/db';
import { addShot, applyDevelops, blobKey, deletePhoto, duplicatePhoto, finishRoll, getBlob, getPhoto, getRoll, listPhotos, loadRoll, restoreDevelops } from '../src/store/rolls';
import { fileName } from '../src/platform/share';

const neg = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
const dev = (stock = 'sunny200', seed = 1) => defaultDevelop(getStock(stock), seed);

beforeEach(async () => {
  await clearAll();
});

async function finishedRoll(n: number) {
  const roll = await loadRoll('sunny200', 12, '3:2');
  for (let i = 0; i < n; i++) await addShot(roll.id, neg(), dev('sunny200', i + 1), { width: 3, height: 2 });
  await finishRoll(roll.id, 'instant');
  return roll.id;
}

describe('apply to roll undo', () => {
  it('restores every frame and the roll film in one step', async () => {
    const rollId = await finishedRoll(3);
    const before = await listPhotos(rollId);
    const undo = await applyDevelops(
      before.map((p) => [p.id, { ...p.develop, stockId: 'mono400', grain: 2 }]),
      { id: rollId, stockId: 'mono400' },
    );
    expect((await getRoll(rollId))?.stockId).toBe('mono400');
    expect((await listPhotos(rollId)).every((p) => p.develop.stockId === 'mono400')).toBe(true);
    expect(undo.frames).toHaveLength(3);

    expect(await restoreDevelops(undo)).toBe(3);
    const after = await listPhotos(rollId);
    expect(after.map((p) => p.develop)).toEqual(before.map((p) => p.develop));
    expect((await getRoll(rollId))?.stockId).toBe('sunny200');
  });

  it('skips frames deleted after the apply', async () => {
    const rollId = await finishedRoll(2);
    const ps = await listPhotos(rollId);
    const undo = await applyDevelops(ps.map((p) => [p.id, { ...p.develop, push: 1 }]));
    await deletePhoto(ps[0].id);
    expect(await restoreDevelops(undo)).toBe(1);
    expect(await getPhoto(ps[0].id)).toBeUndefined();
    expect((await getPhoto(ps[1].id))?.develop.push).toBe(0);
  });
});

describe('save as new photo', () => {
  it('copies the frame with new settings and keeps the original', async () => {
    const rollId = await finishedRoll(2);
    const [a] = await listPhotos(rollId);
    const copy = await duplicatePhoto(a.id, { ...a.develop, stockId: 'mono400' });
    expect(copy).toBeDefined();
    expect(copy!.id).not.toBe(a.id);
    expect(copy!.frame).toBe(3);
    expect(copy!.takenAt).toBe(a.takenAt);
    expect((await getPhoto(a.id))?.develop.stockId).toBe('sunny200');
    expect((await getPhoto(copy!.id))?.develop.stockId).toBe('mono400');
    expect(await getBlob(blobKey.neg(copy!.id))).toBeDefined();
    const roll = await getRoll(rollId);
    expect(roll?.shots).toBe(3);
    expect(roll!.capacity).toBeGreaterThanOrEqual(3);
    // Deleting the original leaves the copy's negative alone.
    await deletePhoto(a.id);
    expect(await getBlob(blobKey.neg(copy!.id))).toBeDefined();
  });

  it('numbers after the copy on a roll still in the camera', async () => {
    const roll = await loadRoll('ccd', 99, '4:3', Date.now(), 'ccd03');
    const s = await addShot(roll.id, neg(), dev('ccd'), { width: 4, height: 3 });
    const copy = await duplicatePhoto(s.photo.id, { ...s.photo.develop, tone: 'warm' });
    expect(copy?.frame).toBe(2);
    const next = await addShot(roll.id, neg(), dev('ccd'), { width: 4, height: 3 });
    expect(next.photo.frame).toBe(3);
    expect(next.roll.shots).toBe(2); // the copy used no exposure
  });

  it('returns undefined for a missing photo', async () => {
    expect(await duplicatePhoto('nope', dev())).toBeUndefined();
  });
});

describe('borders and digital looks', () => {
  it('never puts 35mm sprockets on 120 or instant bodies', () => {
    const mono = getStock('mono400');
    expect(mono.defaultBorder).toBe('film35');
    expect(defaultBorderFor(getCamera('twin66'), mono)).toBe('none');
    expect(defaultBorderFor(getCamera('toy120'), mono)).toBe('none');
    expect(defaultBorderFor(getCamera('pro35'), mono)).toBe('film35');
    expect(defaultBorderFor(getCamera('instasq'), getStock('insta600'))).toBe('instant');
    expect(defaultBorderFor(null, mono)).toBe('film35');
  });

  it('tones change the look and the cache key; no tone keeps old keys', () => {
    const base = dev('ccd');
    expect(developKey(base)).not.toContain('warm');
    const warm = { ...base, tone: 'warm' as const };
    expect(developKey(warm)).not.toBe(developKey(base));
    const st = getStock('ccd');
    expect(effectiveLook(st, warm).gain[2]).toBeLessThan(effectiveLook(st, base).gain[2]);
    expect(effectiveLook(st, { ...base, tone: 'washed' }).saturation).toBeLessThan(effectiveLook(st, base).saturation);
  });
});

describe('file names', () => {
  it('adds the frame number so imported photos never collide', () => {
    const ts = new Date(2026, 10, 2, 0, 7, 13).getTime();
    expect(fileName('FilmCamela', ts, 'jpg', 3)).toBe('FilmCamela_20261102_000713_03.jpg');
    expect(fileName('FilmCamela', ts)).toBe('FilmCamela_20261102_000713.jpg');
    expect(fileName('FilmCamela', ts, 'png', 123)).toBe('FilmCamela_20261102_000713_123.png');
  });
});

describe('contact sheet crop', () => {
  it('finds the picture inside a bordered print', async () => {
    const { borderImageRect } = await import('../src/film/overlays');
    expect(borderImageRect('none', 300, 200)).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    const r = borderImageRect('film35', 300, 200);
    expect(r.x).toBeGreaterThan(0);
    expect(r.y).toBeGreaterThan(r.x); // sprocket bands top and bottom on a landscape frame
    expect(r.x * 2 + r.w).toBeCloseTo(1, 2);
    expect(r.y * 2 + r.h).toBeCloseTo(1, 2);
  });
});
