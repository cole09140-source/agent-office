import { describe, expect, it } from 'vitest';
import { BACKS, backFor, backVars, contrast, FAMILIES, plateBackground } from '../src/cameras/backs/spec';
import { CAMERAS } from '../src/cameras/models';

describe('camera back plates', () => {
  it('every body has its own back, from one of the families', () => {
    for (const c of CAMERAS) {
      expect(BACKS[c.id], c.id).toBeDefined();
      expect(FAMILIES[backFor(c).family], c.id).toBeDefined();
    }
    expect(Object.keys(BACKS).every((id) => CAMERAS.some((c) => c.id === id))).toBe(true);
    expect(new Set(CAMERAS.map((c) => backFor(c).family)).size).toBeGreaterThanOrEqual(8);
  });

  it('no two bodies look the same (family + material + window + colours)', () => {
    const looks = CAMERAS.map((c) => {
      const b = backFor(c);
      return [b.family, b.material, b.window, b.body, b.band, b.shutter].join('|');
    });
    expect(new Set(looks).size).toBe(CAMERAS.length);
  });

  it('lettering stays readable: nameplate and button labels ≥ 4.5:1', () => {
    for (const c of CAMERAS) {
      const b = backFor(c);
      expect(contrast(b.plateInk, plateBackground(b)), `${c.id} nameplate`).toBeGreaterThanOrEqual(4.5);
      expect(contrast(b.btnInk, b.btn), `${c.id} buttons`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('unknown bodies fall back to a themed back by body style', () => {
    expect(backFor({ id: 'future-cam', body: 'instant' }).family).toBe('instant');
    expect(backFor({ id: 'future-cam', body: 'slr' }).family).toBe('leather');
  });

  it('exposes only --bp-* custom properties with colour values', () => {
    const v = backVars(backFor(CAMERAS[0]));
    for (const [k, val] of Object.entries(v)) {
      expect(k.startsWith('--bp-')).toBe(true);
      expect(val).toMatch(/^(#[0-9a-f]{6}|transparent)$/i);
    }
  });
});
