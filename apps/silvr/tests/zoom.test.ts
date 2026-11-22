import { describe, expect, it } from 'vitest';
import { clampView, IDENTITY, pinchZoom, zoomAt, zoomLabel } from '../src/components/zoom';

describe('pinch zoom geometry', () => {
  it('keeps the scale in range and the picture covering its box', () => {
    expect(clampView({ s: 0.5, x: 10, y: 10 }, 100, 100, 4)).toEqual(IDENTITY);
    const v = clampView({ s: 2, x: 500, y: -500 }, 100, 80, 4);
    expect(v).toEqual({ s: 2, x: 50, y: -40 }); // at 2× a 100×80 box can move 50 / 40 px
    expect(clampView({ s: 9, x: 0, y: 0 }, 100, 100, 4).s).toBe(4);
  });
  it('zooms about the finger: the point under it stays put', () => {
    const v = zoomAt(IDENTITY, 2, 20, 10, 200, 200, 4);
    // content point under the finger before: (20 - 0) / 1 = 20; after: (20 - v.x) / 2 must be 20 too
    expect((20 - v.x) / v.s).toBeCloseTo(20);
    expect((10 - v.y) / v.s).toBeCloseTo(10);
    expect(zoomAt(v, 0.1, 0, 0, 200, 200, 4)).toEqual(IDENTITY); // pinching in past fit snaps back
  });
  it('camera pinch follows the finger spread, rounded to 0.1×, within the body limits', () => {
    expect(pinchZoom(1, 100, 150, 1, 3)).toBe(1.5);
    expect(pinchZoom(2, 100, 50, 1, 3)).toBe(1);
    expect(pinchZoom(1, 100, 1000, 1, 3)).toBe(3);
    expect(pinchZoom(1.3, 0, 50, 1, 3)).toBe(1.3);
    expect(zoomLabel(2)).toBe('2×');
    expect(zoomLabel(1.25)).toBe('1.3×');
  });
});
