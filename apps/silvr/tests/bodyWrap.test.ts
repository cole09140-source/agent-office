import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BODY_WRAP, hasWrapArt, tileCount, WRAP_BEVEL, WRAP_COL_W, WRAP_DIAL_W, WRAP_MIN_GAP, WRAP_RESERVE, wrapLayout } from '../src/cameras/BodyWrap';
import { CAMERAS } from '../src/cameras/models';
import { fitContain } from '../src/film/geometry';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));

/** Natural size of a WebP from its header (VP8 / VP8L / VP8X). */
function webpSize(buf: Buffer): { w: number; h: number } {
  expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
  expect(buf.toString('ascii', 8, 12)).toBe('WEBP');
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  if (chunk === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
  throw new Error(`unknown webp chunk ${chunk}`);
}

/** The phone landscape screens the layout must hold on (CSS px), plus a notch on the left. */
const SCREENS: [number, number][] = [
  [915, 412],
  [863, 360],
  [844, 390],
  [740, 360],
];
const PADS = [
  { l: 8, t: 8, r: 8, b: 8 },
  { l: 40, t: 8, r: 8, b: 8 }, // notch on the left
  { l: 8, t: 8, r: 40, b: 8 }, // notch on the right
  { l: 52, t: 8, r: 52, b: 8 }, // both sides padded (a big notch)
];

describe('full-body wrap art (landscape)', () => {
  const entries = Object.entries(BODY_WRAP);

  it('belongs to real cameras only', () => {
    const ids = new Set(CAMERAS.map((c) => c.id));
    for (const [id] of entries) expect(ids.has(id), id).toBe(true);
    expect(hasWrapArt('no-such-camera')).toBe(false);
    expect(wrapLayout('no-such-camera', 863, 360)).toBeNull();
    if (entries.length) {
      expect(wrapLayout(entries[0][0], 0, 360)).toBeNull();
      expect(wrapLayout(entries[0][0], 863, 0)).toBeNull();
    }
  });

  it('every image exists in public/bodies/wrap with the recorded size, and nothing else is shipped', () => {
    for (const [id, art] of entries) {
      expect(art.src, id).toBe(`./bodies/wrap/${id}.webp`);
      const file = publicDir + art.src.replace(/^\.\//, '');
      expect(existsSync(file), file).toBe(true);
      expect(webpSize(readFileSync(file)), id).toEqual({ w: art.w, h: art.h });
    }
    const dir = publicDir + 'bodies/wrap/';
    const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.webp')) : [];
    expect(files.sort()).toEqual(entries.map(([id]) => `${id}.webp`).sort());
  });

  it('the images stay light (the whole set is precached for offline use)', () => {
    let total = 0;
    for (const [id, art] of entries) {
      const size = readFileSync(publicDir + art.src.replace(/^\.\//, '')).length;
      expect(size, id).toBeLessThan(260 * 1024);
      total += size;
    }
    expect(total).toBeLessThan(3.6 * 1024 * 1024);
  });

  it('windows are sane: one big window on the left, the body continuing to the right', () => {
    for (const [id, { w, h, win }] of entries) {
      expect(w / h, id).toBeGreaterThanOrEqual(1.9); // ~2.1:1 panels (legacy 2.6:1 wraps too)
      expect(w, id).toBeGreaterThanOrEqual(960);
      expect(win.x, id).toBeGreaterThan(0.01);
      expect(win.y, id).toBeGreaterThan(0.02);
      expect(win.y + win.h, id).toBeLessThan(0.98);
      expect(win.x + win.w, id).toBeLessThan(0.68); // the right part is body, for the controls
      expect(win.w, id).toBeGreaterThan(0.25);
      expect(win.h, id).toBeGreaterThanOrEqual(0.48);
      expect(win.h, id).toBeLessThanOrEqual(0.72); // the top plate shows whole: the window is not bigger than ~66%
      expect(win.r, id).toBeGreaterThanOrEqual(0);
      expect(win.r * w, id).toBeLessThan(Math.min(win.w * w, win.h * h) / 4);
    }
  });

  it('slices are sane: LEFT holds the window and its bevel, a narrow plain strip, RIGHT holds the right-hand details', () => {
    for (const [id, { win, slice, top }] of entries) {
      const s0 = slice.l;
      const s1 = 1 - slice.r;
      expect(s0, id).toBeGreaterThanOrEqual(win.x + win.w + WRAP_BEVEL); // the window's bevel is in LEFT
      const strip = s1 - s0;
      expect(strip, id).toBeGreaterThanOrEqual(0.015);
      expect(strip, id).toBeLessThanOrEqual(0.06);
      expect(slice.r, id).toBeGreaterThan(0.02);
      expect(slice.r, id).toBeLessThan(0.36);
      expect(slice.k, id).toBeGreaterThan(0);
      expect(slice.k, id).toBeLessThanOrEqual(slice.r);
      // the controls start below the top plate, never far below the window's top
      expect(top, id).toBeGreaterThan(0.05);
      expect(top, id).toBeLessThanOrEqual(win.y + 0.051);
    }
  });

  it('tile count: odd (the last tile meets RIGHT unmirrored) and close to the strip width', () => {
    expect(tileCount(0, 20)).toBe(0);
    expect(tileCount(-5, 20)).toBe(0);
    expect(tileCount(10, 20)).toBe(1);
    for (const w of [15, 47, 90, 133, 260]) {
      const n = tileCount(w, 20);
      expect(n % 2, `${w}`).toBe(1);
      expect(w / n / 20, `${w}`).toBeGreaterThan(0.55);
      expect(w / n / 20, `${w}`).toBeLessThan(1.8);
    }
  });

  it('layout: art height = screen height, the window inside the safe area and left of the controls, RIGHT whole', () => {
    expect(WRAP_RESERVE).toBe(WRAP_COL_W + WRAP_DIAL_W + 2 * WRAP_MIN_GAP);
    for (const [W, H] of SCREENS) {
      for (const pad of PADS) {
        for (const [id, art] of entries) {
          const L = wrapLayout(id, W, H, pad)!;
          const at = `${id} ${W}x${H} pad ${JSON.stringify(pad)}`;
          expect(L, at).toBeTruthy();
          const { win } = L;
          // inside the safe area
          expect(win.left, at).toBeGreaterThanOrEqual(pad.l);
          expect(win.top, at).toBeGreaterThanOrEqual(pad.t);
          expect(win.top + win.height, at).toBeLessThanOrEqual(H - pad.b);
          // left of the dial and the column
          expect(win.left + win.width, at).toBeLessThanOrEqual(W - pad.r - WRAP_RESERVE + 0.01);
          // the window keeps its aspect
          expect(win.width / win.height, at).toBeCloseTo((art.win.w * art.w) / (art.win.h * art.h), 6);
          // scaled to the screen's height on every common phone, with or without a notch
          const cover = L.scale >= H / art.h - 1e-9;
          if (pad.l + pad.r <= 48) expect(cover, at).toBe(true);
          if (cover) {
            expect(L.art.top, at).toBeLessThanOrEqual(0.01);
            expect(L.art.top + L.art.height, at).toBeGreaterThanOrEqual(H - 0.01);
          } else {
            expect(L.art.height / H, at).toBeGreaterThan(0.85);
          }
          // a big preview: the window takes most of the screen's height
          expect(win.height / H, at).toBeGreaterThan(cover ? 0.475 : 0.42);
          expect(L.radius, at).toBeCloseTo(art.win.r * art.w * L.scale, 6);

          // 3-slice: LEFT holds the window; RIGHT ends exactly at the screen's right edge, starts after the
          // window's bevel and always shows its details (k) whole; MIDDLE fills the gap between them.
          const s = L.scale;
          const bevelEnd = win.left + win.width + WRAP_BEVEL * art.w * s;
          expect(L.left.x, at).toBeLessThanOrEqual(win.left);
          // LEFT slides off the screen by at most 40% of the body left of the window for RIGHT (its left-hand details
          // stay); further only when the window itself would run under the controls
          if (win.left + win.width < W - pad.r - WRAP_RESERVE - 0.5) expect(L.left.x, at).toBeGreaterThanOrEqual(-0.4 * art.win.x * art.w * s - 0.01);
          expect(L.left.x + L.left.w, at).toBeGreaterThanOrEqual(bevelEnd - 0.01);
          expect(L.left.w, at).toBeCloseTo(art.slice.l * art.w * s, 6);
          expect(L.right.x + L.right.w, at).toBeCloseTo(W, 6);
          expect(L.right.x, at).toBeGreaterThanOrEqual(bevelEnd - 0.01);
          expect(L.right.w, at).toBeLessThanOrEqual(art.slice.r * art.w * s + 0.01);
          expect(L.right.w, at).toBeGreaterThanOrEqual(art.slice.k * art.w * s - 0.01);
          if (L.mid.w > 0) {
            expect(L.mid.x, at).toBeCloseTo(L.left.x + L.left.w, 6);
            expect(L.mid.x + L.mid.w, at).toBeCloseTo(L.right.x, 6);
            expect(L.mid.n % 2, at).toBe(1);
          } else {
            expect(L.mid.n, at).toBe(0);
          }
          // the art runs from its left edge (0, or right of a notch) to the screen's right edge
          expect(L.art.left, at).toBeLessThanOrEqual(pad.l + 0.01);
          expect(L.art.left + L.art.width, at).toBeCloseTo(W, 6);
          // the controls start below the top plate, near the window's top
          expect(L.ctlTop, at).toBeGreaterThanOrEqual(pad.t);
          expect(L.ctlTop, at).toBeCloseTo(Math.max(pad.t, L.art.top + art.top * art.h * s), 6);
          expect(L.ctlTop, at).toBeLessThan(win.top + win.height * 0.2);
        }
      }
    }
  });

  it('the preview is at least as big as with the cropped body (pro35 3:2 at 863x360: at least 320x213 with the whole top plate showing)', () => {
    if (!BODY_WRAP.pro35) return;
    const { win } = wrapLayout('pro35', 863, 360, { l: 8, t: 8, r: 8, b: 8 })!;
    const f = fitContain(win.width, win.height, 3 / 2);
    expect(f.width).toBeGreaterThanOrEqual(320);
    expect(f.height).toBeGreaterThanOrEqual(213);
  });

  it('a screen too narrow for the controls shrinks the art instead of covering the window', () => {
    for (const [id] of entries) {
      const L = wrapLayout(id, 600, 360, { l: 8, t: 8, r: 8, b: 8 })!;
      expect(L.win.left + L.win.width, id).toBeLessThanOrEqual(600 - 8 - WRAP_RESERVE + 0.01);
      expect(L.win.left, id).toBeGreaterThanOrEqual(8);
    }
  });
});
