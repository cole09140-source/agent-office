import { describe, expect, it } from 'vitest';
import { normalizeAngle, quarterTurnsFor, rotationFor, worldUpOnScreen } from '../src/camera/orientation';

// Poses as deviceorientation reports them (γ, β in degrees, device's natural portrait axes).
const UPRIGHT = { g: 0, b: 90 }; // held upright, top edge up
const TOP_LEFT = { g: -85, b: 5 }; // turned counter-clockwise: top edge points left, right edge up
const TOP_RIGHT = { g: 85, b: -5 }; // turned clockwise: top edge points right
const UPSIDE_DOWN = { g: 0, b: -90 }; // top edge down
const FLAT = { g: 0, b: 2 }; // lying face-up on a table

const base = { frameW: 1280, frameH: 720, viewW: 863, viewH: 360 };
const land = (pose: { g: number; b: number }, angle: number | null, extra: Partial<Parameters<typeof rotationFor>[0]> = {}) =>
  rotationFor({ ...base, gamma: pose.g, beta: pose.b, angle, ...extra });

describe('screen angle', () => {
  it('folds any angle to a quarter turn', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(450)).toBe(90);
    expect(normalizeAngle(180)).toBe(180);
    expect(normalizeAngle(-180)).toBe(180);
  });
  it('maps world-up into screen axes', () => {
    // Portrait screen, phone upright: up is the screen's top.
    const p = worldUpOnScreen(UPRIGHT.g, UPRIGHT.b, 0);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
    // Landscape screen at 90° (device turned CCW), held that way: up is still the screen's top.
    const l = worldUpOnScreen(TOP_LEFT.g, TOP_LEFT.b, 90);
    expect(l.y).toBeGreaterThan(0.9);
    // Same screen, phone held upright: the world's up points to the screen's left.
    const u = worldUpOnScreen(UPRIGHT.g, UPRIGHT.b, 90);
    expect(u.x).toBeCloseTo(-1);
    expect(u.y).toBeCloseTo(0);
  });
});

describe('quarterTurnsFor', () => {
  it('keeps the portrait UI mapping exactly (default angle 0)', () => {
    expect(quarterTurnsFor(null, null)).toBe(0);
    expect(quarterTurnsFor(0, 90)).toBe(0);
    expect(quarterTurnsFor(-85, 5)).toBe(3);
    expect(quarterTurnsFor(85, -5)).toBe(1);
    expect(quarterTurnsFor(70, 80)).toBe(0);
    expect(quarterTurnsFor(80, 165)).toBe(3);
    expect(quarterTurnsFor(-80, -165)).toBe(1);
    expect(quarterTurnsFor(-80, 15)).toBe(3);
    expect(quarterTurnsFor(10, 175)).toBe(0);
    // Upside down with the portrait UI: not turned (as before).
    expect(quarterTurnsFor(UPSIDE_DOWN.g, UPSIDE_DOWN.b, 0)).toBe(0);
  });
  it('turns relative to a landscape screen', () => {
    // Screen at 90° = device's top edge to the left. Holding it that way: the frame is already upright.
    expect(quarterTurnsFor(TOP_LEFT.g, TOP_LEFT.b, 90)).toBe(0);
    // Screen at 270° = top edge to the right, held that way: upright too.
    expect(quarterTurnsFor(TOP_RIGHT.g, TOP_RIGHT.b, 270)).toBe(0);
    // Held upright with the landscape UI: the frame's world lies on its side → a portrait photo.
    expect(quarterTurnsFor(UPRIGHT.g, UPRIGHT.b, 90)).toBe(1);
    expect(quarterTurnsFor(UPRIGHT.g, UPRIGHT.b, 270)).toBe(3);
    // Landscape the other way round while the screen stayed at 90° (it did not flip): upside down.
    expect(quarterTurnsFor(TOP_RIGHT.g, TOP_RIGHT.b, 90)).toBe(2);
    expect(quarterTurnsFor(TOP_LEFT.g, TOP_LEFT.b, 270)).toBe(2);
    // Upside-down portrait with the landscape UI.
    expect(quarterTurnsFor(UPSIDE_DOWN.g, UPSIDE_DOWN.b, 90)).toBe(3);
    expect(quarterTurnsFor(UPSIDE_DOWN.g, UPSIDE_DOWN.b, 270)).toBe(1);
    // Flat on a table: no reliable up, no turn.
    expect(quarterTurnsFor(FLAT.g, FLAT.b, 90)).toBe(0);
  });
  it('is the same pose whichever way the Euler angles wrap', () => {
    // Sideways and pointed above the horizon (β≈±180, γ flips sign) on a landscape screen.
    expect(quarterTurnsFor(80, 165, 270)).toBe(quarterTurnsFor(-80, 15, 270));
    expect(quarterTurnsFor(-80, -165, 90)).toBe(quarterTurnsFor(80, -15, 90));
  });
});

describe('rotationFor (captureRotation)', () => {
  it('landscape-locked UI: landscape hold → landscape photo, upright hold → portrait photo', () => {
    expect(land(TOP_LEFT, 90)).toBe(0);
    expect(land(TOP_RIGHT, 270)).toBe(0);
    expect(land(UPRIGHT, 90)).toBe(1);
    expect(land(UPRIGHT, 270)).toBe(3);
    expect(land(TOP_RIGHT, 90)).toBe(2);
  });
  it('reverses sideways turns for an un-mirrored selfie, never the upside-down one', () => {
    expect(land(UPRIGHT, 90, { unmirroredSelfie: true })).toBe(3);
    expect(land(UPRIGHT, 270, { unmirroredSelfie: true })).toBe(1);
    expect(land(TOP_RIGHT, 90, { unmirroredSelfie: true })).toBe(2);
    expect(land(TOP_LEFT, 90, { unmirroredSelfie: true })).toBe(0);
  });
  it('no gravity → no turn', () => {
    expect(rotationFor({ ...base, gamma: null, beta: null, angle: 90 })).toBe(0);
  });
  it('unknown screen angle with a landscape viewport → no turn (either side is possible)', () => {
    expect(land(UPRIGHT, null)).toBe(0);
  });
  it('portrait UI keeps the old behaviour', () => {
    const p = { frameW: 720, frameH: 1280, viewW: 412, viewH: 915 };
    expect(rotationFor({ ...p, gamma: TOP_LEFT.g, beta: TOP_LEFT.b, angle: 0 })).toBe(3);
    expect(rotationFor({ ...p, gamma: TOP_RIGHT.g, beta: TOP_RIGHT.b, angle: 0 })).toBe(1);
    expect(rotationFor({ ...p, gamma: UPRIGHT.g, beta: UPRIGHT.b, angle: 0 })).toBe(0);
    expect(rotationFor({ ...p, gamma: TOP_LEFT.g, beta: TOP_LEFT.b, angle: null })).toBe(3);
    expect(rotationFor({ ...p, gamma: TOP_RIGHT.g, beta: TOP_RIGHT.b, angle: 0, unmirroredSelfie: true })).toBe(3);
    // A landscape frame on the portrait UI is never turned (as before).
    expect(rotationFor({ ...p, frameW: 1280, frameH: 720, gamma: TOP_LEFT.g, beta: TOP_LEFT.b, angle: 0 })).toBe(0);
  });
  it('desktop / landscape-natural screens at 0° are never turned', () => {
    expect(rotationFor({ frameW: 1280, frameH: 720, viewW: 1440, viewH: 900, gamma: TOP_LEFT.g, beta: TOP_LEFT.b, angle: 0 })).toBe(0);
  });
});
