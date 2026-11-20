import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { artWindowBox, BODY_ART, bodyArtFor, hasBodyArt } from '../src/cameras/BodyArt';
import { CAMERAS } from '../src/cameras/models';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));

/** Natural size of a lossy/lossless WebP from its header (VP8 / VP8L / VP8X). */
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

describe('camera body art', () => {
  it('every camera has art, and only real cameras do', () => {
    for (const c of CAMERAS) {
      expect(bodyArtFor(c.id), c.id).toBeTruthy();
      expect(hasBodyArt(c.id)).toBe(true);
    }
    const ids = new Set(CAMERAS.map((c) => c.id));
    for (const id of Object.keys(BODY_ART)) expect(ids.has(id), id).toBe(true);
    expect(hasBodyArt('no-such-camera')).toBe(false);
    expect(artWindowBox('no-such-camera', 360, 300)).toBeNull();
  });

  it('every image exists in public/bodies with the recorded size', () => {
    for (const [id, art] of Object.entries(BODY_ART)) {
      expect(art.src, id).toBe(`./bodies/${id}.webp`);
      const file = publicDir + art.src.replace(/^\.\//, '');
      expect(existsSync(file), file).toBe(true);
      expect(webpSize(readFileSync(file)), id).toEqual({ w: art.w, h: art.h });
    }
  });

  it('windows are sane', () => {
    for (const [id, { w, h, win }] of Object.entries(BODY_ART)) {
      expect(w, id).toBeGreaterThan(300);
      expect(h, id).toBeGreaterThan(200);
      expect(win.x, id).toBeGreaterThan(0.05);
      expect(win.y, id).toBeGreaterThan(0.05);
      expect(win.x + win.w, id).toBeLessThan(0.95);
      expect(win.y + win.h, id).toBeLessThan(0.95);
      expect(win.w, id).toBeGreaterThanOrEqual(0.4);
      expect(win.h, id).toBeGreaterThanOrEqual(0.4);
      // roughly centred
      expect(Math.abs(win.x + win.w / 2 - 0.5), id).toBeLessThan(0.12);
      expect(Math.abs(win.y + win.h / 2 - 0.5), id).toBeLessThan(0.15);
    }
  });

  it('artWindowBox stays inside the stage and keeps the window aspect', () => {
    for (const [stageW, stageH] of [
      [360, 300],
      [412, 520],
    ]) {
      for (const [id, art] of Object.entries(BODY_ART)) {
        const box = artWindowBox(id, stageW, stageH)!;
        expect(box, id).toBeTruthy();
        expect(box.left, id).toBeGreaterThan(0);
        expect(box.top, id).toBeGreaterThan(0);
        expect(box.left + box.width, id).toBeLessThan(stageW);
        expect(box.top + box.height, id).toBeLessThan(stageH);
        expect(box.width / box.height, id).toBeCloseTo((art.win.w * art.w) / (art.win.h * art.h), 6);
        // contain-fit: the art touches the stage on at least one axis
        const scale = Math.min(stageW / art.w, stageH / art.h);
        expect(box.width, id).toBeCloseTo(art.win.w * art.w * scale, 6);
      }
    }
  });

  it('returns null for an unmeasured stage', () => {
    const id = CAMERAS[0].id;
    expect(artWindowBox(id, 0, 300)).toBeNull();
    expect(artWindowBox(id, 360, 0)).toBeNull();
  });
});
