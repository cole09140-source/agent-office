import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { defaultDevelop } from '../src/film/resolve';
import { getStock } from '../src/film/stocks';
import { clearAll } from '../src/store/db';
import { addShot, blobKey, deletePhoto, deleteRoll, finishRoll, getActiveRoll, getBlob, getPhoto, listPhotos, listRolls, loadRoll, restorePhoto, restoreRoll, savePending } from '../src/store/rolls';

const neg = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
const dev = () => defaultDevelop(getStock('sunny200'), 1);

beforeEach(async () => {
  await clearAll();
});

describe('photo delete undo', () => {
  it('restores the photo, its negative, the count and the cover', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    const a = await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(roll.id, 'instant');
    const before = (await listRolls())[0];
    const snap = await deletePhoto(a.photo.id);
    expect(snap?.photo.id).toBe(a.photo.id);
    expect(await getBlob(blobKey.neg(a.photo.id))).toBeUndefined();
    expect((await listRolls())[0].shots).toBe(1);

    expect(await restorePhoto(snap!)).toBe(true);
    expect(await getPhoto(a.photo.id)).toBeDefined();
    expect(await getBlob(blobKey.neg(a.photo.id))).toBeDefined();
    const after = (await listRolls())[0];
    expect(after.shots).toBe(2);
    expect(after.coverPhotoId).toBe(before.coverPhotoId);
    expect((await listPhotos(roll.id)).map((p) => p.frame)).toEqual([1, 2]);
    // A second undo is a no-op.
    expect(await restorePhoto(snap!)).toBe(false);
  });

  it('brings back a roll the delete emptied', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    const a = await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(roll.id, 'instant');
    const snap = await deletePhoto(a.photo.id);
    expect(await listRolls()).toHaveLength(0);
    expect(await restorePhoto(snap!)).toBe(true);
    const rolls = await listRolls();
    expect(rolls).toHaveLength(1);
    expect(rolls[0].shots).toBe(1);
  });

  it('does not restore into a roll deleted as a whole meanwhile', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    const a = await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(roll.id, 'instant');
    const snap = await deletePhoto(a.photo.id);
    expect(snap?.rollRemoved).toBe(false);
    await deleteRoll(roll.id);
    expect(await restorePhoto(snap!)).toBe(false);
    expect(await getPhoto(a.photo.id)).toBeUndefined();
    expect(await listRolls()).toHaveLength(0);
  });

  it('keeps frames consumed on a loaded roll', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    const a = await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    const snap = await deletePhoto(a.photo.id);
    expect((await listRolls())[0].shots).toBe(1);
    expect(await restorePhoto(snap!)).toBe(true);
    expect((await listRolls())[0].shots).toBe(1);
    expect(await listPhotos(roll.id)).toHaveLength(1);
  });
});

describe('roll delete undo', () => {
  it('restores the roll, its photos and their negatives', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    const a = await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    const b = await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(roll.id, 'instant');
    const before = (await listRolls())[0];
    const snap = await deleteRoll(roll.id);
    expect(snap?.roll.id).toBe(roll.id);
    expect(snap?.photos).toHaveLength(2);
    expect(await listRolls()).toHaveLength(0);
    expect(await getBlob(blobKey.neg(a.photo.id))).toBeUndefined();

    expect(await restoreRoll(snap!)).toBe(true);
    const after = await listRolls();
    expect(after).toHaveLength(1);
    expect(after[0].shots).toBe(before.shots);
    expect(after[0].coverPhotoId).toBe(before.coverPhotoId);
    expect((await listPhotos(roll.id)).map((p) => p.id).sort()).toEqual([a.photo.id, b.photo.id].sort());
    expect(await getBlob(blobKey.neg(b.photo.id))).toBeDefined();
    // A second undo is a no-op.
    expect(await restoreRoll(snap!)).toBe(false);
  });

  it('returns nothing for a roll that is already gone', async () => {
    expect(await deleteRoll('nope')).toBeUndefined();
  });

  it('brings back a loaded roll with its pending half', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await savePending(roll.id, neg(), { kind: 'half', takenAt: 1, width: 3, height: 2 });
    const snap = await deleteRoll(roll.id);
    expect(await getActiveRoll()).toBeUndefined();
    expect(await restoreRoll(snap!)).toBe(true);
    expect((await getActiveRoll())?.id).toBe(roll.id);
    expect(await getBlob(`pending:${roll.id}`)).toBeDefined();
  });

  it('does not restore a loaded roll once another roll is in the camera', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    const snap = await deleteRoll(roll.id);
    const other = await loadRoll('sunny200', 24, '3:2');
    expect(await restoreRoll(snap!)).toBe(false);
    expect((await listRolls()).map((r) => r.id)).toEqual([other.id]);
  });
});
