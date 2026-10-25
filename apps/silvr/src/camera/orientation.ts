/**
 * Tracks how the phone is physically held. The app UI is portrait-locked, so
 * the camera keeps delivering portrait frames even when the user turns the
 * phone sideways; we use gravity (deviceorientation) to rotate those shots.
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

/**
 * Pure mapping from tilt angles (degrees) to clockwise quarter turns needed to
 * make a portrait frame upright. Uses the world-up vector in device
 * coordinates, (−cosβ·sinγ, sinβ, cosβ·cosγ) for Z-X'-Y'' Euler angles, so it
 * stays correct when β/γ wrap (camera pointed above the horizon).
 * ux > 0: the device's right edge points up (top points left) → turn CCW (3).
 */
export function quarterTurnsFor(g: number | null, b: number | null): number {
  if (g === null || b === null) return 0;
  const rad = Math.PI / 180;
  const ux = -Math.cos(b * rad) * Math.sin(g * rad);
  const uy = Math.sin(b * rad);
  if (Math.abs(ux) <= Math.max(0.5, Math.abs(uy))) return 0;
  return ux < 0 ? 1 : 3;
}

/**
 * Quarter turns for a capture right now, only when the frame is portrait and
 * the UI is portrait. An un-mirrored selfie frame is left-right swapped
 * relative to the device, so its sideways turns are reversed.
 */
export function captureRotation(frameW: number, frameH: number, unmirroredSelfie = false): number {
  if (frameW >= frameH) return 0;
  if (typeof window !== 'undefined' && window.innerWidth > window.innerHeight) return 0;
  const q = quarterTurnsFor(gamma, beta);
  return unmirroredSelfie && q !== 0 ? 4 - q : q;
}
