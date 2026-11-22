import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { CAMERAS } from '../src/cameras/models';
import { normalizePins, orderByPins, setPinned } from '../src/cameras/pins';
import { clearAll } from '../src/store/db';
import { loadSettings, patchSettings, patchSettingsWith } from '../src/store/settings';

const cams = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const ids = (r: { items: { id: string }[] }) => r.items.map((c) => c.id).join('');

describe('camera pins', () => {
  it('keeps the normal order when nothing is pinned', () => {
    expect(ids(orderByPins(cams, []))).toBe('abcd');
    expect(orderByPins(cams, []).pinnedCount).toBe(0);
  });

  it('puts pinned cameras first, in pin order, then the rest in normal order', () => {
    const r = orderByPins(cams, ['c', 'a']);
    expect(ids(r)).toBe('cabd');
    expect(r.pinnedCount).toBe(2);
  });

  it('ignores unknown ids, duplicates and junk', () => {
    const r = orderByPins(cams, ['gone', 'd', 'd', 42, null, '', 'b']);
    expect(ids(r)).toBe('dbac');
    expect(r.pinnedCount).toBe(2);
    expect(ids(orderByPins(cams, 'not-an-array'))).toBe('abcd');
    expect(ids(orderByPins(cams, undefined))).toBe('abcd');
  });

  it('pins append to the end and unpinning removes', () => {
    expect(setPinned([], 'a', true)).toEqual(['a']);
    expect(setPinned(['a', 'b'], 'a', true)).toEqual(['b', 'a']);
    expect(setPinned(['a', 'b'], 'a', false)).toEqual(['b']);
    expect(setPinned(['a'], 'zzz', false)).toEqual(['a']);
    expect(setPinned(undefined, 'a', true)).toEqual(['a']);
    expect(normalizePins(['x', 'x', 'y'])).toEqual(['x', 'y']);
  });

  it('works with the real catalogue (any size)', () => {
    const last = CAMERAS[CAMERAS.length - 1].id;
    const r = orderByPins(CAMERAS, [last]);
    expect(r.items[0].id).toBe(last);
    expect(r.items).toHaveLength(CAMERAS.length);
    expect(new Set(r.items.map((c) => c.id)).size).toBe(CAMERAS.length);
  });
});

describe('pinned cameras in settings', () => {
  beforeEach(async () => {
    await clearAll();
  });

  it('defaults to no pins', async () => {
    expect((await loadSettings()).pinnedCameras).toEqual([]);
  });

  it('merges pins from concurrent writers instead of overwriting', async () => {
    await Promise.all([
      patchSettingsWith((s) => ({ pinnedCameras: setPinned(s.pinnedCameras, CAMERAS[0].id, true) })),
      patchSettingsWith((s) => ({ pinnedCameras: setPinned(s.pinnedCameras, CAMERAS[1].id, true) })),
      patchSettings({ sound: false }),
    ]);
    const s = await loadSettings();
    expect([...s.pinnedCameras].sort()).toEqual([CAMERAS[0].id, CAMERAS[1].id].sort());
    expect(s.sound).toBe(false);
  });

  it('survives corrupt stored pins', async () => {
    await patchSettings({ pinnedCameras: 'oops' as unknown as string[] });
    expect((await loadSettings()).pinnedCameras).toEqual([]);
  });
});
