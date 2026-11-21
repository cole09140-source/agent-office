import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BODY_WRAP, hasWrapArt, WRAP_COL_W, WRAP_DIAL_W, WRAP_MIN_GAP, WRAP_RESERVE, wrapLayout } from '../src/cameras/BodyWrap';
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
      expect(w / h, id).toBeGreaterThanOrEqual(2.45); // wider than the phones it covers
      expect(w, id).toBeGreaterThanOrEqual(1200);
      expect(win.x, id).toBeGreaterThan(0.01);
      expect(win.y, id).toBeGreaterThan(0.02);
      expect(win.y + win.h, id).toBeLessThan(0.98);
      expect(win.x + win.w, id).toBeLessThan(0.62); // the right part is body, for the controls
      expect(win.w, id).toBeGreaterThan(0.25);
      expect(win.h, id).toBeGreaterThanOrEqual(0.55);
      expect(win.r, id).toBeGreaterThanOrEqual(0);
      expect(win.r * w, id).toBeLessThan(Math.min(win.w * w, win.h * h) / 4);
    }
  });

  it('layout: covers the screen by height, the window fully inside the safe area and left of the controls', () => {
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
          // the window keeps its aspect; the art covers the screen's height and reaches past its right edge
          expect(win.width / win.height, at).toBeCloseTo((art.win.w * art.w) / (art.win.h * art.h), 6);
          // (shrunk only when the window would otherwise run under the controls: a narrow screen with a notch)
          const cover = L.scale >= H / art.h - 1e-9;
          if (cover) {
            expect(L.art.top, at).toBeLessThanOrEqual(0.01);
            expect(L.art.top + L.art.height, at).toBeGreaterThanOrEqual(H - 0.01);
          } else {
            expect(L.art.height / H, at).toBeGreaterThan(0.9);
            expect(pad.l + pad.r, at).toBeGreaterThan(16);
          }
          expect(L.art.left + L.art.width, at).toBeGreaterThanOrEqual(W);
          // without a notch on a common phone the art always covers (it slides left before it shrinks)
          if (pad.l + pad.r <= 16) expect(cover, at).toBe(true);
          // a big preview: the window takes most of the screen's height
          expect(win.height / H, at).toBeGreaterThan(0.6);
          expect(L.radius, at).toBeCloseTo(art.win.r * art.w * L.scale, 6);
        }
      }
    }
  });

  it('the preview is at least as big as with the cropped body (pro35 3:2 at 863x360: 351x234)', () => {
    if (!BODY_WRAP.pro35) return;
    const { win } = wrapLayout('pro35', 863, 360, { l: 8, t: 8, r: 8, b: 8 })!;
    const f = fitContain(win.width, win.height, 3 / 2);
    expect(f.width).toBeGreaterThanOrEqual(351);
    expect(f.height).toBeGreaterThanOrEqual(234);
  });

  it('a screen too narrow for the controls shrinks the art instead of covering the window', () => {
    for (const [id] of entries) {
      const L = wrapLayout(id, 600, 360, { l: 8, t: 8, r: 8, b: 8 })!;
      expect(L.win.left + L.win.width, id).toBeLessThanOrEqual(600 - 8 - WRAP_RESERVE + 0.01);
      expect(L.win.left, id).toBeGreaterThanOrEqual(8);
    }
  });
});
