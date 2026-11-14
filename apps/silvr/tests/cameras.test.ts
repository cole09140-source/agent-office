import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { blendDouble, exposureSpec, halfLayout, quadLayout } from '../src/cameras/compose';
import { canLoad, CAMERAS, ejectsPrints, filmsFor, getCamera, PALETTE_IDS, PIXEL_PALETTES } from '../src/cameras/models';
import { ditherIndex, lensUv, renderCpu } from '../src/film/cpuRender';
import { aspectRatio, cropForAspect } from '../src/film/geometry';
import { digitAdvance, formatDigitalStamp } from '../src/film/overlays';
import { defaultDevelop, developKey, effectiveLook, resolveLook } from '../src/film/resolve';
import { pixelCells } from '../src/film/shader';
import { getStock, STOCKS } from '../src/film/stocks';
import { cameraDescription, cameraEra, stockDescription } from '../src/i18n';
import { signalLang } from '../src/state/lang';
import { clearAll } from '../src/store/db';
import { addShot, developAllNow, finishRoll, getPending, getRoll, inCamera, listPhotos, listRolls, loadRoll, OPEN_CAPACITY, savePending, viewable, type Roll } from '../src/store/rolls';

describe('camera catalogue', () => {
  it('has 32 distinct, well-formed bodies', () => {
    expect(CAMERAS).toHaveLength(32);
    expect(new Set(CAMERAS.map((c) => c.id)).size).toBe(32);
    for (const c of CAMERAS) {
      expect(canLoad(c, c.defaultStock), `${c.id} default film`).toBe(true);
      expect(c.capacities.length).toBeGreaterThan(0);
      expect(c.capacities.every((n) => n > 0)).toBe(true);
      expect(c.formats.length).toBeGreaterThan(0);
      c.formats.forEach((f) => expect(aspectRatio(f)).toBeGreaterThanOrEqual(1));
      if (c.capture === 'half') expect(c.capacities.every((n) => n % 2 === 0)).toBe(true);
      if (c.films !== 'any') c.films.forEach((id) => expect(getStock(id).id).toBe(id));
      expect(c.lens.soft).toBeGreaterThanOrEqual(-1);
      expect(c.lens.soft).toBeLessThanOrEqual(1);
    }
  });
  it('keeps sensor stocks exclusive to their digital bodies', () => {
    expect(filmsFor(getCamera('pro35')).some((s) => s.exclusive)).toBe(false);
    expect(filmsFor(getCamera('ccd03')).map((s) => s.id)).toEqual(['ccd']);
    expect(filmsFor(getCamera('pixel')).map((s) => s.id)).toEqual(['pixel']);
    expect(canLoad(getCamera('pro35'), 'ccd')).toBe(false);
    expect(filmsFor(getCamera('kidcam')).map((s) => s.id)).toEqual(['toycmos']);
    expect(filmsFor(getCamera('aqua27')).map((s) => s.id)).toEqual(['aqua400']);
    for (const id of ['aqua400', 'instawide', 'reel40', 'toycmos', 'vga98', 'ccd7', 'vgaphone', 'phone2mp', 'bbcurve', 'app10']) expect(canLoad(getCamera('pro35'), id), id).toBe(false);
  });
  it('gives every body its own look (new bodies are not recolours)', () => {
    const sig = (c: (typeof CAMERAS)[number]) => [c.body, c.viewfinder, c.formats.join(), c.border ?? '-', c.defaultStock, c.capture].join('|');
    expect(new Set(CAMERAS.map((c) => c.body)).size).toBe(CAMERAS.length);
    expect(new Set(CAMERAS.map(sig)).size).toBe(CAMERAS.length);
  });
  it('every body and film has Korean and English copy', () => {
    for (const lang of ['ko', 'en'] as const) {
      signalLang.value = lang;
      for (const c of CAMERAS) {
        expect(cameraDescription(c.id), `${lang} ${c.id}`).not.toBe('');
        if (lang === 'ko') expect(cameraEra(c.era), c.era).toMatch(/^\d{4} · [^A-Za-z]*(\d|SLR|TLR)?[^A-Za-z]*$/);
      }
      for (const st of STOCKS) expect(stockDescription(st.id), `${lang} ${st.id}`).not.toBe('');
    }
    signalLang.value = 'ko';
  });
  it('falls back to Pro 35 for unknown / legacy ids', () => {
    expect(getCamera(undefined).id).toBe('pro35');
    expect(getCamera('nope').id).toBe('pro35');
  });
  it('covers every distinct mechanism', () => {
    const caps = new Set(CAMERAS.map((c) => c.capture));
    expect([...caps].sort()).toEqual(['double', 'half', 'quad', 'single']);
    expect(CAMERAS.some((c) => c.flash === 'charge')).toBe(true);
    expect(CAMERAS.some((c) => c.lens.fisheye)).toBe(true);
    expect(CAMERAS.some((c) => c.lens.streak > 0)).toBe(true);
    expect(CAMERAS.filter((c) => c.instant).map((c) => c.id).sort()).toEqual(['bridge09', 'ccd03', 'curve07', 'filter10', 'flip03', 'floppy98', 'instasq', 'instaw', 'kidcam', 'pixel', 'slim06', 'touch07']);
    expect(CAMERAS.filter(ejectsPrints).map((c) => c.id).sort()).toEqual(['instasq', 'instaw']);
  });
  it('has 4-tone palettes ordered dark → light', () => {
    for (const id of PALETTE_IDS) {
      const lum = PIXEL_PALETTES[id].map((c) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11);
      for (let i = 1; i < 4; i++) expect(lum[i]).toBeGreaterThan(lum[i - 1]);
    }
  });
});

describe('capture geometry', () => {
  it('half-frame exposures are portrait 3:4 even from a landscape sensor', () => {
    const spec = exposureSpec(getCamera('half72'), '3:2');
    expect(spec).toEqual({ aspect: '4:3', orient: 'portrait' });
    const c = cropForAspect(1920, 1080, spec.aspect, 1, spec.orient);
    expect((1920 * c.w) / (1080 * c.h)).toBeCloseTo(3 / 4);
  });
  it('two halves make one ~3:2 frame with a frame line', () => {
    const L = halfLayout(300, 400);
    expect(L.width / L.height).toBeCloseTo(1.53, 1);
    expect(L.cells[1].x).toBeGreaterThan(L.cells[0].w);
  });
  it('quad grid keeps the sub-frame aspect and fires in reading order', () => {
    const L = quadLayout(300, 200);
    expect(L.width / L.height).toBeCloseTo(1.5, 1);
    expect(L.cells.map((c) => [c.x > 0 ? 1 : 0, c.y > 0 ? 1 : 0])).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]);
  });
  it('double exposure adds light without clipping a single exposure', () => {
    expect(blendDouble(0, 0)).toBe(0);
    expect(blendDouble(1, 0)).toBeCloseTo(0.82);
    expect(blendDouble(0.5, 0.5)).toBeGreaterThan(0.41);
    expect(blendDouble(1, 1)).toBeLessThanOrEqual(1);
  });
  it('the wide instant always frames landscape, even from a portrait sensor', () => {
    const spec = exposureSpec(getCamera('instaw'), '3:2');
    expect(spec).toEqual({ aspect: '3:2', orient: 'landscape' });
    const c = cropForAspect(1080, 1920, spec.aspect, 1, spec.orient);
    expect((1080 * c.w) / (1920 * c.h)).toBeCloseTo(1.5);
    expect(exposureSpec(getCamera('pro35'), '3:2').orient).toBe('auto');
  });
  it('new formats have the right ratios', () => {
    expect(aspectRatio('65:24')).toBeCloseTo(2.708, 2);
    expect(aspectRatio('2.39:1')).toBe(2.39);
    expect(aspectRatio('8:7')).toBeCloseTo(1.143, 2);
  });
});

describe('lens & sensor rendering', () => {
  it('lens mapping keeps the centre fixed', () => {
    for (const [d, f] of [
      [0.07, 0],
      [-0.03, 0],
      [0, 1],
    ]) {
      const [u, v] = lensUv(0.5, 0.5, 1, 1, d, f);
      expect(u).toBeCloseTo(0.5);
      expect(v).toBeCloseTo(0.5);
    }
  });
  it('barrel distortion keeps corners and magnifies the centre', () => {
    const [cu] = lensUv(1, 1, 1, 1, 0.1, 0);
    expect(cu).toBeCloseTo(1);
    const [mu] = lensUv(0.6, 0.5, 1, 1, 0.1, 0);
    expect(mu).toBeLessThan(0.6);
  });
  it('fisheye masks everything outside the circle', () => {
    expect(lensUv(0.02, 0.02, 1, 1, 0, 1)[2]).toBe(0);
    expect(lensUv(0.5, 0.3, 1, 1, 0, 1)[2]).toBe(1);
  });
  it('ordered dither covers all 4 tones on a gradient', () => {
    const seen = new Set<number>();
    for (let i = 0; i <= 64; i++) seen.add(ditherIndex(i / 64, i % 4, (i >> 2) % 4));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
    expect(ditherIndex(0, 0, 0)).toBe(0);
    expect(ditherIndex(1, 3, 3)).toBe(3);
  });
  it('pixel grid is 128 cells on the long side', () => {
    expect(pixelCells(1024, 896)).toEqual([128, 112]);
    expect(pixelCells(896, 1024)).toEqual([112, 128]);
  });

  const grad = (w: number, h: number) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        data[i] = (x / (w - 1)) * 255;
        data[i + 1] = (y / (h - 1)) * 255;
        data[i + 2] = 128;
        data[i + 3] = 255;
      }
    return { data, width: w, height: h };
  };

  it('pixel camera prints only palette colours', () => {
    const look = resolveLook(defaultDevelop(getStock('pixel'), 3, { cameraId: 'pixel', palette: 'ice' }));
    const out = renderCpu(grad(64, 56), look);
    const pal = PIXEL_PALETTES.ice.map((c) => c.map((v) => Math.round(v * 255)).join(','));
    for (let i = 0; i < out.length; i += 4) expect(pal).toContain(`${out[i]},${out[i + 1]},${out[i + 2]}`);
  });
  it('fisheye prints are black in the corners', () => {
    const look = resolveLook(defaultDevelop(getStock('mint400'), 3, { cameraId: 'fish180', grain: 0 }));
    const out = renderCpu(grad(48, 48), look);
    expect(out[0] + out[1] + out[2]).toBe(0);
  });
  it('anamorphic streak adds light beside a highlight', () => {
    const w = 96;
    const h = 40;
    const src = { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
    for (let i = 0; i < src.data.length; i += 4) src.data[i + 3] = 255;
    for (let y = 18; y < 22; y++) for (let x = 46; x < 50; x++) src.data.fill(255, (y * w + x) * 4, (y * w + x) * 4 + 3);
    const base = defaultDevelop(getStock('neon800t'), 3, { grain: 0, halation: 0 });
    const off = renderCpu(src, resolveLook(base));
    const on = renderCpu(src, resolveLook({ ...base, cameraId: 'cine' }));
    const at = (o: Uint8ClampedArray, x: number) => o[(20 * w + x) * 4 + 2];
    expect(at(on, 62)).toBeGreaterThan(at(off, 62));
  });
  it('exposure dial brightens, camera and palette change the develop key', () => {
    const st = getStock('sunny200');
    expect(effectiveLook(st, defaultDevelop(st, 1, { ev: 1 })).exposure).toBeGreaterThan(effectiveLook(st, defaultDevelop(st, 1)).exposure);
    const d = defaultDevelop(st, 1);
    expect(developKey({ ...d, cameraId: 'toy120' })).not.toBe(developKey(d));
    expect(developKey({ ...d, ev: 0.33 })).not.toBe(developKey(d));
    expect(developKey({ ...d, palette: 'ice' })).not.toBe(developKey(d));
  });
  it('a big flash fires harder than a normal one', () => {
    const st = getStock('sunny200');
    const d = defaultDevelop(st, 1, { flash: true });
    expect(resolveLook({ ...d, cameraId: 'party' }).flash).toBeGreaterThan(resolveLook({ ...d, cameraId: 'pro35' }).flash);
    expect(resolveLook({ ...d, cameraId: 'pro35' }).flash).toBe(1);
    expect(resolveLook({ ...d, cameraId: 'party', flash: false }).flash).toBe(0);
    expect(effectiveLook(st, d, 1.8).contrast).toBeGreaterThan(effectiveLook(st, d).contrast);
  });
  it('legacy frames without a camera get a neutral lens', () => {
    const look = resolveLook(defaultDevelop(getStock('sunny200'), 1));
    expect([look.distort, look.fisheye, look.soft, look.streak]).toEqual([0, 0, 0, 0]);
    expect(look.pixel).toBeNull();
  });
  it('every camera × every allowed film resolves to finite values', () => {
    for (const c of CAMERAS)
      for (const st of filmsFor(c)) {
        const l = resolveLook(defaultDevelop(st, 7, { cameraId: c.id, ev: 1, push: 1, expired: 0.5 }));
        for (const v of [l.vignette, l.chroma, l.grain, l.soft, l.distort, l.streak]) expect(Number.isFinite(v)).toBe(true);
      }
    expect(STOCKS.length).toBeGreaterThan(0);
  });
  it('digicam date imprint and 7-seg metrics', () => {
    expect(formatDigitalStamp(new Date(2003, 9, 5, 9, 7).getTime())).toBe('2003.10.05 09:07');
    expect(digitAdvance('.', 10)).toBeLessThan(digitAdvance('8', 10));
  });
});

const neg = () => new Blob([new Uint8Array([1])], { type: 'image/jpeg' });
const dev = () => defaultDevelop(getStock('sunny200'), 1);

describe('roll mechanics per camera', () => {
  beforeEach(async () => {
    await clearAll();
  });
  it('half-frame: halves count exposures, pairs make one negative, pending is persisted', async () => {
    const r = await loadRoll('mint400', 4, '3:2', Date.now(), 'half72');
    await savePending(r.id, neg(), { kind: 'half', takenAt: 1, width: 3, height: 4 });
    let roll = (await listRolls()).find((x) => x.id === r.id)!;
    expect([roll.shots, roll.negatives, roll.pending?.kind]).toEqual([1, 0, 'half']);
    expect(await getPending(r.id)).toBeDefined();
    const a = await addShot(r.id, neg(), dev(), { width: 7, height: 4 }, 1, 1);
    expect([a.roll.shots, a.photo.frame, a.roll.pending]).toEqual([2, 1, undefined]);
    expect(await getPending(r.id)).toBeUndefined();
    await savePending(r.id, neg(), { kind: 'half', takenAt: 2, width: 3, height: 4 });
    const b = await addShot(r.id, neg(), dev(), { width: 7, height: 4 }, 2, 1);
    expect([b.roll.shots, b.photo.frame, b.finished]).toEqual([4, 2, true]);
    roll = b.roll;
    expect(roll.negatives).toBe(2);
  });
  it('double exposure: the first exposure does not use a frame', async () => {
    const r = await loadRoll('muse400', 2, '3:2', Date.now(), 'doublex');
    const roll = await savePending(r.id, neg(), { kind: 'double', takenAt: 1, width: 3, height: 2 });
    expect(roll.shots).toBe(0);
    const res = await addShot(r.id, neg(), dev(), { width: 3, height: 2 }, 1, 1);
    expect(res.roll.shots).toBe(1);
  });
  it('a pending half cannot overrun the roll', async () => {
    const r = await loadRoll('mint400', 2, '3:2', Date.now(), 'half72');
    await savePending(r.id, neg(), { kind: 'half', takenAt: 1, width: 3, height: 4 });
    await addShot(r.id, neg(), dev(), { width: 7, height: 4 }, 1, 1);
    await expect(savePending(r.id, neg(), { kind: 'half', takenAt: 2, width: 3, height: 4 })).rejects.toThrow(/full/);
  });
  it('discarding a roll with only a pending half also drops the pending blob', async () => {
    const r = await loadRoll('mint400', 4, '3:2', Date.now(), 'half72');
    await savePending(r.id, neg(), { kind: 'half', takenAt: 1, width: 3, height: 4 });
    expect(await finishRoll(r.id, 'instant')).toBeNull();
    expect(await getPending(r.id)).toBeUndefined();
  });
  it('every camera roll (film too) is viewable while still in the camera', async () => {
    const film = await loadRoll('sunny200', 12, '3:2', Date.now(), 'pro35');
    // No lab wait any more: a loaded film roll already shows its photos.
    expect(viewable(film)).toBe(true);
    await finishRoll(film.id, 'instant');
    const r = await loadRoll('ccd', 99, '4:3', Date.now(), 'ccd03');
    await addShot(r.id, neg(), dev(), { width: 4, height: 3 });
    const roll = (await listRolls()).find((x) => x.id === r.id) as Roll;
    expect(inCamera(roll)).toBe(true);
    expect(viewable(roll)).toBe(true);
    expect(await listPhotos(r.id)).toHaveLength(1);
  });
  it('rolls left in the old lab are developed at once (unseen, so they show as new)', async () => {
    const r = await loadRoll('sunny200', 12, '3:2', Date.now(), 'pro35');
    await addShot(r.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(r.id, '3d');
    expect((await getRoll(r.id))?.status).toBe('developing');
    expect(await developAllNow()).toBe(1);
    const done = await getRoll(r.id);
    expect(done?.status).toBe('developed');
    expect(done?.seenAt).toBeUndefined();
    expect(viewable(done as Roll)).toBe(true);
    expect(await developAllNow()).toBe(0);
  });
  it('open-ended camera rolls fit the backup limit for camera rolls', () => {
    expect(OPEN_CAPACITY).toBeGreaterThan(36);
    expect(OPEN_CAPACITY).toBeLessThanOrEqual(1000);
  });
});

describe('pending exposure safety', () => {
  beforeEach(async () => {
    await clearAll();
  });
  it('refuses to overwrite a pending exposure', async () => {
    const r = await loadRoll('mint400', 4, '3:2', Date.now(), 'half72');
    await savePending(r.id, neg(), { kind: 'half', takenAt: 1, width: 3, height: 4 });
    await expect(savePending(r.id, neg(), { kind: 'half', takenAt: 2, width: 3, height: 4 })).rejects.toThrow(/pending/);
    expect((await listRolls()).find((x) => x.id === r.id)?.shots).toBe(1);
  });
  it('dropping a lost pending half refunds its counter step', async () => {
    const { dropPending } = await import('../src/store/rolls');
    const r = await loadRoll('mint400', 4, '3:2', Date.now(), 'half72');
    await savePending(r.id, neg(), { kind: 'half', takenAt: 1, width: 3, height: 4 });
    await dropPending(r.id);
    const roll = (await listRolls()).find((x) => x.id === r.id)!;
    expect([roll.shots, roll.pending]).toEqual([0, undefined]);
  });
  it('deleting a photo updates the negative count shown in the album', async () => {
    const { deletePhoto } = await import('../src/store/rolls');
    const r = await loadRoll('sunny200', 12, '3:2', Date.now(), 'pro35');
    const a = await addShot(r.id, neg(), dev(), { width: 3, height: 2 });
    await addShot(r.id, neg(), dev(), { width: 3, height: 2 });
    await finishRoll(r.id, 'instant');
    await deletePhoto(a.photo.id);
    const roll = (await listRolls()).find((x) => x.id === r.id)!;
    expect([roll.shots, roll.negatives]).toEqual([1, 1]);
  });
});

describe('engine hardening (QA R41)', () => {
  it('tiny slivers get no border (no zero-pitch sprocket loop)', async () => {
    const { borderLayout } = await import('../src/film/overlays');
    expect(borderLayout('film35', 2, 900)).toEqual({ width: 2, height: 900, img: { x: 0, y: 0, w: 2, h: 900 } });
    expect(borderLayout('instant', 15, 15).width).toBe(15);
    expect(borderLayout('film35', 16, 900).width).toBeGreaterThan(16);
    for (const b of ['slide', 'gate', 'sprocket'] as const) expect(borderLayout(b, 10, 900)).toEqual({ width: 10, height: 900, img: { x: 0, y: 0, w: 10, h: 900 } });
  });
  it('new borders: square slide mount, rounded cine gate, sprocket edges', async () => {
    const { borderLayout } = await import('../src/film/overlays');
    const slide = borderLayout('slide', 600, 400);
    expect(slide.width).toBe(slide.height);
    expect(slide.img.x + slide.img.w / 2).toBeCloseTo(slide.width / 2, 0);
    expect(slide.img.y + slide.img.h / 2).toBeCloseTo(slide.height / 2, 0);
    const gate = borderLayout('gate', 400, 300);
    expect(gate.width / gate.height).toBeCloseTo(430 / 330, 2);
    const land = borderLayout('sprocket', 650, 240);
    expect([land.width, land.img.x, land.img.y > 0]).toEqual([650, 0, true]);
    const port = borderLayout('sprocket', 240, 650);
    expect([port.height, port.img.y, port.img.x > 0]).toEqual([650, 0, true]);
  });
  it('contact sheets for the longest rolls stay under the iOS canvas cap', async () => {
    const { sheetHeight } = await import('../src/film/contactSheet');
    const { MAX_CANVAS_PIXELS } = await import('../src/film/develop');
    for (const [n, portrait] of [
      [99, false],
      [72, false],
      [72, true],
    ] as const) {
      const area = 2400 * sheetHeight(n, portrait, 2400);
      const w = area > MAX_CANVAS_PIXELS ? Math.floor(2400 * Math.sqrt(MAX_CANVAS_PIXELS / area) * 0.98) : 2400;
      expect(w * sheetHeight(n, portrait, w)).toBeLessThanOrEqual(MAX_CANVAS_PIXELS);
    }
  });
});

describe('QA R13: every camera × every allowed film develops a sane image (CPU)', () => {
  const grad = (w: number, h: number) => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        data[i] = 40 + (x / w) * 180;
        data[i + 1] = 60 + (y / h) * 150;
        data[i + 2] = 90 + ((x + y) / (w + h)) * 120;
        data[i + 3] = 255;
      }
    return { data, width: w, height: h };
  };
  for (const c of CAMERAS)
    for (const st of filmsFor(c))
      it(`${c.id} × ${st.id}`, () => {
        const out = renderCpu(grad(48, 36), resolveLook(defaultDevelop(st, 11, { cameraId: c.id })));
        let sum = 0;
        let min = 255;
        let max = 0;
        for (let i = 0; i < out.length; i += 4) {
          const y = (out[i] + out[i + 1] + out[i + 2]) / 3;
          sum += y;
          min = Math.min(min, y);
          max = Math.max(max, y);
        }
        const mean = sum / (out.length / 4);
        expect(mean, 'not crushed/blown').toBeGreaterThan(25);
        expect(mean).toBeLessThan(235);
        expect(max - min, 'has tonal range').toBeGreaterThan(30);
      });
});
