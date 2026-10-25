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
 * Pure mapping from tilt angles to clockwise quarter turns needed to make a
 * portrait frame upright. gamma < 0: left edge down (top points left).
 */
export function quarterTurnsFor(g: number | null, b: number | null): number {
  if (g === null || b === null) return 0;
  if (Math.abs(g) < 50 || Math.abs(b) > 40) return 0;
  return g < 0 ? 3 : 1;
}

/** Quarter turns for a capture right now, only when the frame is portrait and the UI is portrait. */
export function captureRotation(frameW: number, frameH: number): number {
  if (frameW >= frameH) return 0;
  if (typeof window !== 'undefined' && window.innerWidth > window.innerHeight) return 0;
  return quarterTurnsFor(gamma, beta);
}
