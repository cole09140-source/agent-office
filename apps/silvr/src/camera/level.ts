/**
 * Horizon level for the camera: how far the picture's horizontal is tilted from the world's, in degrees
 * (0 = level; positive = the phone is turned clockwise, so the horizon line on screen tilts the other way).
 * From gravity (devicemotion accelerationIncludingGravity, device axes) turned into screen axes with the
 * screen angle — unlike deviceorientation's beta/gamma it has no gimbal lock when the phone stands sideways.
 */
import { screenAngle } from './orientation';
import { isIos } from '../platform/share';

let up: { x: number; y: number; z: number } | null = null;
let users = 0;

function onMotion(e: DeviceMotionEvent): void {
  const g = e.accelerationIncludingGravity;
  if (!g || g.x == null || g.y == null) return;
  // Android/Chrome report the reaction to gravity (+y when held upright); iOS reports gravity itself.
  const k = isIos() ? -1 : 1;
  up = { x: k * g.x, y: k * g.y, z: k * (g.z ?? 0) };
}

export function startLevel(): () => void {
  if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return () => undefined;
  if (users++ === 0) window.addEventListener('devicemotion', onMotion);
  return () => {
    if (--users === 0) {
      window.removeEventListener('devicemotion', onMotion);
      up = null;
    }
  };
}

/** Pure: the tilt (degrees, −180..180) of a device-axes up vector seen on a screen turned `angle`° CCW. Null when lying flat. */
export function tiltOf(v: { x: number; y: number; z?: number }, angle: number): number | null {
  const th = (angle * Math.PI) / 180;
  const c = Math.cos(th);
  const s = Math.sin(th);
  const sx = v.x * c - v.y * s;
  const sy = v.x * s + v.y * c;
  // pointing at the floor / sky: the horizon is not in the picture, nothing to level
  if (Math.hypot(sx, sy) < Math.abs(v.z ?? 0) * 0.5 || Math.hypot(sx, sy) < 2) return null;
  return (Math.atan2(sx, sy) * 180) / Math.PI;
}

export function levelTilt(): number | null {
  return up ? tiltOf(up, screenAngle() ?? 0) : null;
}
