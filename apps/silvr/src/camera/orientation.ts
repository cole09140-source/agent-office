/**
 * Tracks how the phone is physically held, so a shot comes out upright whatever way it was held.
 *
 * Camera frames arrive upright relative to the SCREEN (the browser / WebView turns them with the display).
 * The UI does not follow the phone everywhere: on phones the app is landscape-locked like a digicam
 * (sensorLandscape: it flips between the two landscape sides, never to portrait), and on the web it may
 * be locked to portrait. Holding the phone upright with a landscape UI therefore gives a frame whose world
 * is lying on its side. Gravity (deviceorientation, in the device's own axes) tells us where "up" really
 * is; the screen orientation angle tells us how the screen's axes sit on the device. Together they give
 * the quarter turns that make the shot upright: upright hold → portrait photo, sideways → landscape.
 */
let gamma: number | null = null;
let beta: number | null = null;
let listening = false;

function onOrientation(e: DeviceOrientationEvent): void {
  gamma = e.gamma;
  beta = e.beta;
}

export function startOrientation(): void {
  if (listening || typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return;
  listening = true;
  window.addEventListener('deviceorientation', onOrientation);
}

/** iOS 13+ needs an explicit grant from a user gesture. Safe to call anywhere. */
export async function requestOrientationPermission(): Promise<void> {
  const DOE = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
  if (typeof DOE?.requestPermission !== 'function') return;
  try {
    await DOE.requestPermission();
  } catch {
    /* denied: users can still rotate in the darkroom */
  }
}

/** 0, 90, 180 or 270 (any angle folded into [0, 360) and snapped to a quarter turn). */
export function normalizeAngle(a: number): number {
  const q = Math.round((((a % 360) + 360) % 360) / 90) % 4;
  return q * 90;
}

/**
 * How far the screen content is turned on the device, counter-clockwise in degrees (the
 * `screen.orientation.angle` convention: 90 = the device turned a quarter counter-clockwise, its top to the
 * left). Falls back to the old `window.orientation` (−90 → 270). Null when neither is known.
 */
export function screenAngle(): number | null {
  if (typeof window === 'undefined') return null;
  const so = typeof screen !== 'undefined' ? (screen as Screen & { orientation?: { angle?: unknown } }).orientation?.angle : undefined;
  if (typeof so === 'number' && Number.isFinite(so)) return normalizeAngle(so);
  const wo = (window as unknown as { orientation?: unknown }).orientation;
  if (typeof wo === 'number' && Number.isFinite(wo)) return normalizeAngle(wo);
  return null;
}

/**
 * World-up as a unit-ish vector in SCREEN axes (x to the screen's right, y to the screen's top), from tilt
 * angles in degrees and the screen angle. World-up in device axes is (−cosβ·sinγ, sinβ) for Z-X'-Y''
 * Euler angles (correct when β/γ wrap, camera pointed above the horizon); the screen's up / right axes in
 * device axes are (sinθ, cosθ) / (cosθ, −sinθ).
 */
export function worldUpOnScreen(g: number, b: number, angle = 0): { x: number; y: number } {
  const rad = Math.PI / 180;
  const ux = -Math.cos(b * rad) * Math.sin(g * rad);
  const uy = Math.sin(b * rad);
  const th = normalizeAngle(angle) * rad;
  const c = Math.round(Math.cos(th));
  const s = Math.round(Math.sin(th));
  return { x: ux * c - uy * s, y: ux * s + uy * c };
}

/**
 * Pure mapping from tilt angles (degrees) and the screen angle to the clockwise quarter turns that make a
 * screen-upright frame upright in the world.
 * x > 0: the world's up points to the screen's right → turn CCW (3); x < 0 → CW (1).
 * Upside down (2) only when `upsideDown` is allowed: with the landscape-locked UI the screen normally
 * flips with the phone (then this stays 0), but when it does not, the frame is upside down. The portrait
 * UI keeps its old behaviour (sideways turns only).
 * Near flat (pointed at the sky / the floor) gives 0: no reliable "up".
 */
export function quarterTurnsFor(g: number | null, b: number | null, angle = 0, upsideDown = normalizeAngle(angle) % 180 !== 0): number {
  if (g === null || b === null) return 0;
  const { x, y } = worldUpOnScreen(g, b, angle);
  if (Math.abs(x) > Math.max(0.5, Math.abs(y))) return x < 0 ? 1 : 3;
  if (upsideDown && y < -0.5 && Math.abs(y) >= Math.abs(x)) return 2;
  return 0;
}

/**
 * The pure decision behind captureRotation (unit-tested): quarter turns for a frame of frameW × frameH
 * taken with the screen at `angle` (null: unknown) and a viewport of viewW × viewH.
 */
export function rotationFor(opts: {
  frameW: number;
  frameH: number;
  gamma: number | null;
  beta: number | null;
  angle: number | null;
  viewW: number;
  viewH: number;
  unmirroredSelfie?: boolean;
}): number {
  let angle = opts.angle;
  if (angle === null) {
    // Unknown screen angle: only the portrait case is safe (a landscape UI could be either side).
    if (opts.viewW > opts.viewH) return 0;
    angle = 0;
  }
  // Portrait screen (as on the portrait-locked web UI): only portrait frames are turned, as before.
  if (angle % 180 === 0 && opts.viewW <= opts.viewH && opts.frameW >= opts.frameH) return 0;
  // A screen that is portrait-natural at 0° but shows a landscape viewport (desktop, tablet, unlocked web):
  // keep the old rule (no turns) unless the angle says the screen is rotated.
  if (angle % 180 === 0 && opts.viewW > opts.viewH) return 0;
  const q = quarterTurnsFor(opts.gamma, opts.beta, angle);
  // An un-mirrored selfie frame is left-right swapped relative to the device: its sideways turns reverse.
  return opts.unmirroredSelfie && (q === 1 || q === 3) ? 4 - q : q;
}

/**
 * Quarter turns for a capture right now, relative to the current screen orientation and gravity.
 * An un-mirrored selfie frame is left-right swapped relative to the device, so its sideways turns are reversed.
 */
export function captureRotation(frameW: number, frameH: number, unmirroredSelfie = false): number {
  const hasWin = typeof window !== 'undefined';
  return rotationFor({
    frameW,
    frameH,
    gamma,
    beta,
    angle: screenAngle(),
    viewW: hasWin ? window.innerWidth : 0,
    viewH: hasWin ? window.innerHeight : 1,
    unmirroredSelfie,
  });
}
