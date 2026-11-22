import { describe, expect, it } from 'vitest';
import { cameraFormat, canLoad, CAMERAS, defaultCapacity, filmsFor, getCamera } from '../src/cameras/models';
import { defaultDevelop, resolveLook } from '../src/film/resolve';
import { getStock } from '../src/film/stocks';

describe('film / body compatibility', () => {
  it("every camera's default stock is loadable in it", () => {
    for (const c of CAMERAS) expect(filmsFor(c).map((s) => s.id), c.id).toContain(c.defaultStock);
  });
  it('explicit film lists survive the format rule unchanged (no data mistakes)', () => {
    for (const c of CAMERAS) if (c.films !== 'any') expect(filmsFor(c).map((s) => s.id), c.id).toEqual(c.films);
  });
  it('no roll-film body offers instant packs or the disposable-only film', () => {
    for (const c of CAMERAS.filter((x) => cameraFormat(x) === 'roll')) {
      const films = filmsFor(c);
      expect(films.length, c.id).toBeGreaterThan(0);
      expect(films.some((s) => s.kind === 'instant'), c.id).toBe(false);
      expect(canLoad(c, 'snap800'), c.id).toBe(false);
    }
    for (const id of ['pro35', 'half72', 'range', 'twin66', 'toy120', 'party']) {
      expect(canLoad(getCamera(id), 'insta600'), id).toBe(false);
      expect(canLoad(getCamera(id), 'instamini'), id).toBe(false);
    }
  });
  it('instant bodies take instant packs only, disposables keep their own film', () => {
    for (const id of ['instasq', 'instaw']) {
      expect(cameraFormat(getCamera(id))).toBe('instant');
      expect(filmsFor(getCamera(id)).every((s) => s.kind === 'instant'), id).toBe(true);
    }
    // Each instant body takes its own pack only: square for Pop SQ, wide for Pop W.
    expect(filmsFor(getCamera('instasq')).map((s) => s.id)).toEqual(['insta600']);
    expect(filmsFor(getCamera('instaw')).map((s) => s.id)).toEqual(['instawide']);
    expect(filmsFor(getCamera('snap27')).map((s) => s.id)).toEqual(['snap800']);
    expect(filmsFor(getCamera('aqua27')).map((s) => s.id)).toEqual(['aqua400']);
  });
  it('roll sizes are listed largest first everywhere, defaults unchanged', () => {
    for (const c of CAMERAS) expect([...c.capacities].sort((a, b) => b - a), c.id).toEqual(c.capacities);
    for (const id of ['quad4', 'doublex', 'fish180', 'cine', 'party']) expect(defaultCapacity(getCamera(id)), id).toBe(24);
    expect(defaultCapacity(getCamera('pro35'))).toBe(36);
  });
  it('120 bodies get ordinary colour / BW roll stocks', () => {
    const twin = filmsFor(getCamera('twin66'));
    expect(twin.map((s) => s.id)).toEqual(expect.arrayContaining(['sunny200', 'mono400', 'muse400']));
    expect(twin.every((s) => s.kind !== 'instant' && !s.exclusive)).toBe(true);
  });
  it('old frames with a now-disallowed combo still resolve (history is not validated)', () => {
    const d = defaultDevelop(getStock('insta600'), 1, { cameraId: 'pro35' });
    expect(() => resolveLook(d)).not.toThrow();
  });
});

describe('contact sheet grid', () => {
  it('six frames per strip for 35mm, three or four for square, loose prints for instant', async () => {
    const { sheetGrid, sheetHeight } = await import('../src/film/contactSheet');
    const many = (w: number, h: number, n: number) => Array.from({ length: n }, () => ({ width: w, height: h }));
    expect(sheetGrid(many(1500, 1000, 36))).toMatchObject({ cols: 6, strip: true });
    expect(sheetGrid(many(1000, 1500, 36))).toMatchObject({ cols: 6, strip: true });
    expect(sheetGrid(many(1600, 1200, 99))).toMatchObject({ cols: 6 });
    expect(sheetGrid(many(1000, 1000, 12))).toMatchObject({ cols: 3, cellRatio: 1 });
    expect(sheetGrid(many(1000, 1000, 36))).toMatchObject({ cols: 4 });
    expect(sheetGrid(many(2708, 1000, 21))).toMatchObject({ cols: 3 });
    expect(sheetGrid(many(880, 1070, 10), { instant: true })).toMatchObject({ cols: 4, strip: false });
    expect(sheetHeight(36, sheetGrid(many(1500, 1000, 36)), 2400)).toBeGreaterThan(0);
  });
});
