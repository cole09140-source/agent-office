import { describe, expect, it } from 'vitest';
import { tiltOf } from '../src/camera/level';
import { meterEv } from '../src/camera/meter';

describe('horizon level', () => {
  it('is level when up points to the top of the screen, for both landscape sides and portrait', () => {
    expect(tiltOf({ x: 0, y: 9.8, z: 0 }, 0)).toBeCloseTo(0); // portrait, upright
    expect(tiltOf({ x: 9.8, y: 0, z: 0 }, 90)).toBeCloseTo(0); // landscape, top of the phone to the left
    expect(tiltOf({ x: -9.8, y: 0, z: 0 }, 270)).toBeCloseTo(0); // landscape the other way
  });
  it('reports the tilt in degrees, and nothing when the phone lies flat', () => {
    const r = (10 * Math.PI) / 180;
    expect(tiltOf({ x: 9.8 * Math.sin(r), y: 9.8 * Math.cos(r), z: 0 }, 0)).toBeCloseTo(10);
    expect(tiltOf({ x: 0.3, y: 0.2, z: 9.8 }, 0)).toBeNull();
  });
});

describe('spot metering', () => {
  it('brings a spot to mid grey in 1/3 stops within ±2', () => {
    expect(meterEv(0.46)).toBe(0);
    expect(meterEv(0.95)).toBeLessThan(0); // a bright spot: darker
    expect(meterEv(0.15)).toBe(2); // very dark: capped
    expect(meterEv(1)).toBeGreaterThanOrEqual(-2);
    expect((meterEv(0.3) * 3) % 1).toBeCloseTo(0);
  });
});
