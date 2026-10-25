import { describe, expect, it } from 'vitest';
import { renderCpu } from '../src/film/cpuRender';
import { cropForAspect, fitContain, outputSize } from '../src/film/geometry';
import { borderLayout, formatStamp } from '../src/film/overlays';
import { buildLut, channelCurve, defaultDevelop, developKey, effectiveLook, lightLeaks, resolveLook, sCurve, shoulder } from '../src/film/resolve';
import { getStock, STOCKS } from '../src/film/stocks';

function gradient(w: number, h: number) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      data[i] = (x / (w - 1)) * 255;
      data[i + 1] = (y / (h - 1)) * 255;
      data[i + 2] = ((x + y) / (w + h - 2)) * 255;
      data[i + 3] = 255;
    }
  return { data, width: w, height: h };
}

describe('film stocks', () => {
  it('has 12 unique stocks with sane parameters', () => {
    expect(STOCKS).toHaveLength(12);
    expect(new Set(STOCKS.map((s) => s.id)).size).toBe(12);
    for (const s of STOCKS) {
      expect(s.look.matrix).toHaveLength(9);
      expect(s.leakChance).toBeGreaterThanOrEqual(0);
      expect(s.leakChance).toBeLessThanOrEqual(1);
      expect(s.iso).toBeGreaterThan(0);
    }
  });
  it('keeps a free tier and a pro tier', () => {
    expect(STOCKS.filter((s) => !s.pro).length).toBeGreaterThanOrEqual(6);
    expect(STOCKS.some((s) => s.pro)).toBe(true);
  });
  it('falls back to the default stock for unknown ids', () => {
    expect(getStock('nope').id).toBe('sunny200');
  });
});

describe('tone curve', () => {
  it('S-curve is identity at contrast 1 and fixes pivot', () => {
    for (const v of [0, 0.2, 0.5, 0.9, 1]) expect(sCurve(v, 1)).toBeCloseTo(v);
    expect(sCurve(0.5, 1.6)).toBeCloseTo(0.5);
    expect(sCurve(0.25, 1.6)).toBeLessThan(0.25);
    expect(sCurve(0.75, 1.6)).toBeGreaterThan(0.75);
  });
  it('shoulder rolls highlights off below 1', () => {
    expect(shoulder(0.5)).toBe(0.5);
    expect(shoulder(1.4)).toBeLessThan(1);
    expect(shoulder(1.4)).toBeGreaterThan(shoulder(1.0));
  });
  it('every stock LUT is monotonic per channel and stays in range', () => {
    for (const s of STOCKS) {
      for (const push of [-2, 0, 2]) {
        for (const expired of [0, 1]) {
          const look = effectiveLook(s, defaultDevelop(s, 1, { push, expired }));
          const lut = buildLut(look);
          for (let c = 0; c < 3; c++) {
            for (let i = 1; i < 256; i++) expect(lut[i * 4 + c]).toBeGreaterThanOrEqual(lut[(i - 1) * 4 + c]);
          }
        }
      }
    }
  });
  it('lift sets the black point (faded base)', () => {
    const s = getStock('dream160');
    expect(channelCurve(0, s.look, 0)).toBeCloseTo(s.look.lift[0]);
  });
});

describe('develop recipe', () => {
  const s = getStock('muse400');
  const base = effectiveLook(s, defaultDevelop(s, 1));
  it('push increases contrast, grain and density', () => {
    const p = effectiveLook(s, defaultDevelop(s, 1, { push: 2 }));
    expect(p.contrast).toBeGreaterThan(base.contrast);
    expect(p.grain).toBeGreaterThan(base.grain);
    expect(p.exposure).toBeGreaterThan(base.exposure);
  });
  it('pull softens contrast and grain', () => {
    const p = effectiveLook(s, defaultDevelop(s, 1, { push: -2 }));
    expect(p.contrast).toBeLessThan(base.contrast);
    expect(p.grain).toBeLessThan(base.grain);
  });
  it('expiry fogs the base, desaturates and adds dust', () => {
    const e = effectiveLook(s, defaultDevelop(s, 1, { expired: 1 }));
    expect(e.lift[0]).toBeGreaterThan(base.lift[0]);
    expect(e.saturation).toBeLessThan(base.saturation);
    expect(e.dust).toBeGreaterThan(base.dust);
    expect(e.contrast).toBeLessThan(base.contrast);
  });
  it('clamps out-of-range user values', () => {
    const e = effectiveLook(s, defaultDevelop(s, 1, { push: 99, grain: 99 }));
    const max = effectiveLook(s, defaultDevelop(s, 1, { push: 2, grain: 2 }));
    expect(e.contrast).toBeCloseTo(max.contrast);
    expect(e.grain).toBeCloseTo(max.grain);
  });
  it('does not mutate the stock definition', () => {
    const before = JSON.stringify(s.look);
    effectiveLook(s, defaultDevelop(s, 1, { push: 2, expired: 1, flash: true }));
    expect(JSON.stringify(s.look)).toBe(before);
  });
  it('developKey changes with any recipe field', () => {
    const d = defaultDevelop(s, 7);
    const k = developKey(d);
    expect(developKey({ ...d })).toBe(k);
    for (const patch of [{ push: 1 }, { expired: 0.5 }, { grain: 0.5 }, { leak: 3 }, { flash: !d.flash }, { dateStamp: true }, { border: 'instant' as const }, { seed: 8 }, { stockId: 'mono400' }]) {
      expect(developKey({ ...d, ...patch })).not.toBe(k);
    }
  });
});

describe('light leaks', () => {
  it('are deterministic per seed and hug one edge', () => {
    expect(lightLeaks(42)).toEqual(lightLeaks(42));
    expect(lightLeaks(42)).not.toEqual(lightLeaks(43));
    for (let seed = 0; seed < 50; seed++) {
      const leaks = lightLeaks(seed);
      expect(leaks.length).toBeGreaterThanOrEqual(1);
      expect(leaks.length).toBeLessThanOrEqual(3);
    }
  });
});

describe('CPU reference renderer', () => {
  const src = gradient(64, 48);
  it('is deterministic for the same seed', () => {
    const look = resolveLook(defaultDevelop(getStock('sunny200'), 5));
    expect(renderCpu(src, look)).toEqual(renderCpu(src, look));
  });
  it('grain seed changes the output', () => {
    const a = renderCpu(src, resolveLook(defaultDevelop(getStock('sunny200'), 5)));
    const b = renderCpu(src, resolveLook(defaultDevelop(getStock('sunny200'), 6)));
    expect(a).not.toEqual(b);
  });
  it('mono stocks produce neutral pixels when tints are zero', () => {
    const look = resolveLook(defaultDevelop(getStock('mono400'), 5, { grain: 0, leak: null }));
    const out = renderCpu(src, look);
    for (let i = 0; i < out.length; i += 4 * 37) {
      expect(Math.abs(out[i] - out[i + 1])).toBeLessThanOrEqual(1);
      expect(Math.abs(out[i + 1] - out[i + 2])).toBeLessThanOrEqual(1);
    }
  });
  it('vignette darkens corners relative to the centre', () => {
    const flat = { data: new Uint8ClampedArray(64 * 48 * 4).fill(160), width: 64, height: 48 };
    const look = resolveLook(defaultDevelop(getStock('snap800'), 5, { grain: 0, flash: false }));
    const out = renderCpu(flat, look);
    const at = (x: number, y: number) => out[(y * 64 + x) * 4 + 1];
    expect(at(0, 0)).toBeLessThan(at(32, 24));
  });
  it('light leaks brighten the frame', () => {
    const flat = { data: new Uint8ClampedArray(64 * 48 * 4).fill(60), width: 64, height: 48 };
    const s = getStock('sunny200');
    const sum = (a: Uint8ClampedArray) => a.reduce((x, v) => x + v, 0);
    const off = renderCpu(flat, resolveLook(defaultDevelop(s, 5, { grain: 0 })));
    const on = renderCpu(flat, resolveLook(defaultDevelop(s, 5, { grain: 0, leak: 11 })));
    expect(sum(on)).toBeGreaterThan(sum(off));
  });
  it('alpha is always opaque', () => {
    const out = renderCpu(src, resolveLook(defaultDevelop(getStock('insta600'), 9, { leak: 3, expired: 1 })));
    for (let i = 3; i < out.length; i += 4) expect(out[i]).toBe(255);
  });
});

describe('geometry', () => {
  it('crops landscape sources to landscape frames', () => {
    const c = cropForAspect(1920, 1080, '3:2');
    expect((1920 * c.w) / (1080 * c.h)).toBeCloseTo(1.5);
    expect(c.x + c.w / 2).toBeCloseTo(0.5);
  });
  it('crops portrait sources to portrait frames', () => {
    const c = cropForAspect(1080, 1920, '4:3');
    expect((1080 * c.w) / (1920 * c.h)).toBeCloseTo(3 / 4);
  });
  it('zoom crops further in, centred', () => {
    const a = cropForAspect(1000, 1000, '1:1', 1);
    const b = cropForAspect(1000, 1000, '1:1', 2);
    expect(b.w).toBeCloseTo(a.w / 2);
    expect(b.x).toBeCloseTo(0.25);
  });
  it('limits output size on the long edge', () => {
    const s = outputSize(4000, 3000, { x: 0, y: 0, w: 1, h: 1 }, 2000);
    expect(s).toEqual({ width: 2000, height: 1500 });
  });
  it('fits a ratio inside a box', () => {
    expect(fitContain(400, 800, 1.5)).toEqual({ width: 400, height: 267 });
    expect(fitContain(800, 400, 1.5)).toEqual({ width: 600, height: 400 });
  });
});

describe('overlays', () => {
  it('formats camera-back date stamps', () => {
    const ts = new Date(2026, 9, 4, 12).getTime();
    expect(formatStamp(ts, 'YMD')).toBe("'26 10 04");
    expect(formatStamp(ts, 'MDY')).toBe("10 04 '26");
    expect(formatStamp(ts, 'DMY')).toBe("04 10 '26");
  });
  it('lays out borders around the image', () => {
    expect(borderLayout('none', 300, 200)).toEqual({ width: 300, height: 200, img: { x: 0, y: 0, w: 300, h: 200 } });
    const inst = borderLayout('instant', 300, 300);
    expect(inst.height - inst.img.y - inst.img.h).toBeGreaterThan(inst.img.y * 3);
    const land = borderLayout('film35', 300, 200);
    expect(land.height).toBeGreaterThan(land.width - 300 + 200);
    const port = borderLayout('film35', 200, 300);
    expect(port.width - 200).toBeGreaterThan(port.height - 300);
  });
});

describe('mobile safety', () => {
  it('grain hash is deterministic, in range and well spread', async () => {
    const { hash2 } = await import('../src/film/random');
    expect(hash2(10, 20, 3.3)).toBe(hash2(10, 20, 3.3));
    let sum = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) {
      const v = hash2(i % 200, Math.floor(i / 200), 1.7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      sum += v;
    }
    expect(sum / n).toBeGreaterThan(0.48);
    expect(sum / n).toBeLessThan(0.52);
  });
  it('keeps bordered prints under the iOS canvas pixel cap', async () => {
    const { safeMaxLong, MAX_CANVAS_PIXELS } = await import('../src/film/develop');
    const dev = defaultDevelop(getStock('insta600'), 1);
    const long = safeMaxLong(4096, 4096, dev, 3600);
    const L = borderLayout('instant', long, long);
    expect(L.width * L.height).toBeLessThanOrEqual(MAX_CANVAS_PIXELS);
    expect(safeMaxLong(4000, 3000, defaultDevelop(getStock('sunny200'), 1), 3600)).toBe(3600);
  });
  it('maps phone tilt to capture rotation', async () => {
    const { quarterTurnsFor } = await import('../src/camera/orientation');
    expect(quarterTurnsFor(null, null)).toBe(0);
    expect(quarterTurnsFor(0, 90)).toBe(0); // upright portrait
    expect(quarterTurnsFor(-85, 5)).toBe(3); // top pointing left
    expect(quarterTurnsFor(85, -5)).toBe(1); // top pointing right
    expect(quarterTurnsFor(70, 80)).toBe(0); // tilted back, not sideways
  });
  it('rotation is part of the develop key', () => {
    const d = defaultDevelop(getStock('sunny200'), 1);
    expect(developKey({ ...d, rotate: 1 })).not.toBe(developKey(d));
    expect(developKey({ ...d, rotate: 0 })).toBe(developKey(d));
  });
});
