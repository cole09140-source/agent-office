import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { advise, evFor, exactShutter, formatShutter, nearestShutter } from '../src/companion/exposure';
import { defaultDevelop } from '../src/film/resolve';
import { getStock } from '../src/film/stocks';
import { clearAll } from '../src/store/db';
import { addLogFrame, deleteLogRoll, listLogFrames, listLogRolls, logToCsv, saveLogFrame, saveLogRoll } from '../src/store/filmLog';
import {
  addShot,
  deletePhoto,
  deleteRoll,
  effectiveStatus,
  finishRoll,
  framesLeft,
  getActiveRoll,
  getBlob,
  importRoll,
  listPhotos,
  listRolls,
  loadRoll,
  readyAtFor,
  rushRoll,
  updateDevelop,
  blobKey,
  type Roll,
} from '../src/store/rolls';
import { DEFAULT_SETTINGS, loadSettings, patchSettings, saveSettings } from '../src/store/settings';
import { parseHash, routeToHash } from '../src/state/router';
import { MESSAGES, translate } from '../src/i18n';

const neg = () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
const dev = () => defaultDevelop(getStock('sunny200'), 1);

beforeEach(async () => {
  await clearAll();
});

describe('lab timing', () => {
  const t0 = new Date(2026, 9, 24, 22, 15).getTime();
  it('computes ready times', () => {
    expect(readyAtFor('instant', t0)).toBe(t0);
    expect(readyAtFor('1h', t0)).toBe(t0 + 3600_000);
    expect(readyAtFor('3d', t0)).toBe(t0 + 72 * 3600_000);
    const m = new Date(readyAtFor('morning', t0));
    expect([m.getDate(), m.getHours(), m.getMinutes()]).toEqual([25, 9, 0]);
  });
  it('"tomorrow 9 AM" is tomorrow even right after midnight', () => {
    const early = new Date(2026, 9, 24, 0, 30).getTime();
    expect(new Date(readyAtFor('morning', early)).getDate()).toBe(25);
  });
  it('handles month rollover', () => {
    const end = new Date(2026, 9, 31, 20).getTime();
    const m = new Date(readyAtFor('morning', end));
    expect([m.getMonth(), m.getDate()]).toEqual([10, 1]);
  });
  it('promotes developing rolls once ready', () => {
    const r = { status: 'developing', readyAt: 100 } as Roll;
    expect(effectiveStatus(r, 99)).toBe('developing');
    expect(effectiveStatus(r, 100)).toBe('developed');
  });
});

describe('roll lifecycle', () => {
  it('loads, shoots, fills and develops a roll', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    await expect(loadRoll('mono400', 12, '3:2')).rejects.toThrow();
    for (let i = 1; i <= 12; i++) {
      const res = await addShot(roll.id, neg(), dev(), { width: 30, height: 20 });
      expect(res.photo.frame).toBe(i);
      expect(res.finished).toBe(i === 12);
      expect(framesLeft(res.roll)).toBe(12 - i);
    }
    await expect(addShot(roll.id, neg(), dev(), { width: 30, height: 20 })).rejects.toThrow(/full/);
    const now = Date.now();
    const done = await finishRoll(roll.id, '1h', now);
    expect(done?.status).toBe('developing');
    expect(await getActiveRoll()).toBeUndefined();
    expect((await listRolls(now)).find((r) => r.id === roll.id)?.status).toBe('developing');
    expect((await listRolls(now + 3600_001)).find((r) => r.id === roll.id)?.status).toBe('developed');
  });
  it('rush develops immediately', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(roll.id, '3d');
    await rushRoll(roll.id);
    expect((await listRolls()).find((r) => r.id === roll.id)?.status).toBe('developed');
  });
  it('discards an empty roll on rewind', async () => {
    const roll = await loadRoll('sunny200', 24, '3:2');
    expect(await finishRoll(roll.id, 'instant')).toBeNull();
    expect(await listRolls()).toHaveLength(0);
  });
  it('rejects shots on a roll that is not loaded', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(roll.id, 'instant');
    await expect(addShot(roll.id, neg(), dev(), { width: 3, height: 2 })).rejects.toThrow(/not loaded/);
  });
  it('stores negatives and removes all blobs on delete', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    const { photo } = await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    const b2 = await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    expect(await getBlob(blobKey.neg(photo.id))).toBeDefined();
    await finishRoll(roll.id, 'instant');
    await deletePhoto(photo.id);
    expect(await getBlob(blobKey.neg(photo.id))).toBeUndefined();
    const rolls = await listRolls();
    expect(rolls[0].coverPhotoId).toBe(b2.photo.id);
    await deletePhoto(b2.photo.id);
    expect(await listRolls()).toHaveLength(0); // last photo removes the roll
  });
  it('deleteRoll removes photos', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(roll.id, 'instant');
    await deleteRoll(roll.id);
    expect(await listPhotos(roll.id)).toHaveLength(0);
  });
  it('re-develop keeps the negative and updates the recipe', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    const { photo } = await addShot(roll.id, neg(), dev(), { width: 3, height: 2 });
    const updated = await updateDevelop(photo.id, { ...photo.develop, stockId: 'mono400', push: 1 });
    expect(updated?.develop.stockId).toBe('mono400');
    expect(await getBlob(blobKey.neg(photo.id))).toBeDefined();
  });
  it('imports photos as a developed roll', async () => {
    const roll = await importRoll('insta600', [
      { negative: neg(), width: 3, height: 2, takenAt: 1, develop: dev() },
      { negative: neg(), width: 3, height: 2, takenAt: 2, develop: dev() },
    ]);
    expect(roll.status).toBe('developed');
    expect((await listPhotos(roll.id)).map((p) => p.frame)).toEqual([1, 2]);
  });
});

describe('settings', () => {
  it('defaults and persists', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
    await saveSettings({ ...DEFAULT_SETTINGS, lang: 'en', defaultRollSize: 36 });
    expect((await loadSettings()).defaultRollSize).toBe(36);
  });

  it('merges concurrent changes instead of overwriting the whole object', async () => {
    await Promise.all([patchSettings({ sound: false }), patchSettings({ grid: true })]); // two tabs
    const s = await loadSettings();
    expect(s.sound).toBe(false);
    expect(s.grid).toBe(true);
  });
});

describe('film log', () => {
  it('saves rolls/frames and exports CSV safely', async () => {
    const r = await saveLogRoll({ camera: 'FM2', film: 'Tri, "X"', iso: 400, exposures: 36, startedAt: 1, note: '' });
    await saveLogFrame({ rollId: r.id, frame: 2, aperture: 'f/8', shutter: '1/250', lens: '50mm', note: 'hello, "world"', takenAt: 0 });
    await saveLogFrame({ rollId: r.id, frame: 1, aperture: 'f/4', shutter: '1/60', lens: '', note: '', takenAt: 0 });
    const frames = await listLogFrames(r.id);
    expect(frames.map((f) => f.frame)).toEqual([1, 2]);
    const csv = logToCsv(r, frames);
    expect(csv).toContain('"hello, ""world"""');
    expect(csv.split('\n')[1]).toBe('frame,datetime,aperture,shutter,lens,note,lat,lon');
    await deleteLogRoll(r.id);
    expect(await listLogRolls()).toHaveLength(0);
    expect(await listLogFrames(r.id)).toHaveLength(0);
  });

  it('numbers frames in one transaction: no duplicates, never past the roll, nothing for a deleted roll', async () => {
    const r = await saveLogRoll({ camera: 'FM2', film: 'HP5', iso: 400, exposures: 3, startedAt: 1, note: '' });
    const base = { rollId: r.id, aperture: 'f/8', shutter: '1/125', lens: '', note: '', takenAt: 1 };
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => addLogFrame(base))); // e.g. two tabs / double taps
    expect(results.filter(Boolean)).toHaveLength(3);
    expect((await listLogFrames(r.id)).map((f) => f.frame)).toEqual([1, 2, 3]);
    await deleteLogRoll(r.id);
    expect(await addLogFrame(base)).toBeNull();
    expect(await listLogFrames(r.id)).toHaveLength(0);
  });
});

describe('Sunny 16', () => {
  it('sunny day at f/16 → 1/ISO', () => {
    expect(advise('sunny', 100, 16).label).toBe('1/125');
    expect(advise('sunny', 400, 16).label).toBe('1/500');
    expect(advise('sunny', 200, 16).label).toBe('1/250');
  });
  it('EV math', () => {
    expect(evFor('sunny', 100)).toBe(15);
    expect(evFor('sunny', 400)).toBe(17);
    expect(exactShutter(15, 16)).toBeCloseTo(256 / 32768);
    expect(nearestShutter(1 / 100)).toBeCloseTo(1 / 125);
    expect(formatShutter(2)).toBe('2"');
  });
  it('flags tripod and out-of-range', () => {
    expect(advise('night', 100, 16).outOfRange).toBe(false); // 16 s is on the dial
    expect(advise('night', 50, 22).outOfRange).toBe(true); // ~60 s
    expect(advise('indoor', 400, 2.8).tripod).toBe(false);
    expect(advise('indoor', 100, 8).tripod).toBe(true);
  });
});

describe('router', () => {
  it('round-trips routes', () => {
    for (const r of [{ name: 'camera' }, { name: 'roll', id: 'a b' }, { name: 'photo', id: 'x/y' }, { name: 'settings' }] as const) {
      expect(parseHash(routeToHash(r))).toEqual(r);
    }
    expect(parseHash('#/garbage')).toEqual({ name: 'camera' });
    expect(parseHash('#/photo')).toEqual({ name: 'gallery' });
  });
});

describe('i18n', () => {
  it('ko and en have identical keys and placeholders', () => {
    const ko = MESSAGES.ko as Record<string, string>;
    const en = MESSAGES.en as Record<string, string>;
    expect(Object.keys(en).sort()).toEqual(Object.keys(ko).sort());
    for (const k of Object.keys(ko)) {
      const ph = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect(ph(en[k]), k).toEqual(ph(ko[k]));
    }
  });
  it('interpolates', () => {
    expect(translate('en', 'cam.left', { n: 3 })).toBe('3 left');
    expect(translate('ko', 'cam.left', { n: 3 })).toBe('3장 남음');
  });
});

describe('transactions', () => {
  it('roll back every queued write when one write throws', async () => {
    const roll = await loadRoll('sunny200', 12, '3:2');
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'blobs') throw new DOMException('full', 'QuotaExceededError');
      return put.apply(this, args);
    };
    try {
      await expect(addShot(roll.id, neg(), dev(), { width: 3, height: 2 })).rejects.toThrow(/full/);
    } finally {
      IDBObjectStore.prototype.put = put;
    }
    expect((await getActiveRoll())?.shots).toBe(0);
    expect(await listPhotos(roll.id)).toHaveLength(0);
  });
});

describe('CSV export safety (QA R40)', () => {
  it('neutralises spreadsheet formulas in user text', () => {
    const csv = logToCsv(
      { id: 'r', camera: '=cmd', film: '@SUM(A1)', iso: 400, exposures: 36, startedAt: 0, note: '' },
      [{ id: 'f', rollId: 'r', frame: 1, aperture: 'f/8', shutter: '1/250', lens: '+x', note: '-2+3', takenAt: 0, lat: -33.9, lon: 151.2 }],
    );
    expect(csv).not.toMatch(/(^|,|# |\/ )[=+@-][^/0-9]/m);
    expect(csv).toContain("'=cmd");
    expect(csv).toContain(',-33.9,'); // numbers untouched
  });
});
