/** Sunny 16 & exposure-value helpers for shooting real film. */

export type Light = 'snow' | 'sunny' | 'slightOvercast' | 'overcast' | 'heavyOvercast' | 'shade' | 'sunset' | 'indoorBright' | 'indoor' | 'night';

/** EV at ISO 100 for each lighting condition (standard exposure tables). */
export const LIGHT_EV100: Record<Light, number> = {
  snow: 16,
  sunny: 15,
  slightOvercast: 14,
  overcast: 13,
  heavyOvercast: 12,
  shade: 12,
  sunset: 11,
  indoorBright: 9,
  indoor: 7,
  night: 4,
};

export const LIGHTS = Object.keys(LIGHT_EV100) as Light[];

export const APERTURES = [1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22];
export const ISOS = [50, 100, 160, 200, 400, 800, 1600, 3200];

/** Standard marked shutter speeds in seconds, slow → fast. */
export const SHUTTERS = [30, 15, 8, 4, 2, 1, 1 / 2, 1 / 4, 1 / 8, 1 / 15, 1 / 30, 1 / 60, 1 / 125, 1 / 250, 1 / 500, 1 / 1000, 1 / 2000, 1 / 4000];

export function evFor(light: Light, iso: number, compensation = 0): number {
  return LIGHT_EV100[light] + Math.log2(iso / 100) + compensation;
}

/** Exact shutter time (s) for EV = log2(N²/t). */
export function exactShutter(ev: number, aperture: number): number {
  return (aperture * aperture) / Math.pow(2, ev);
}

/** Closest marked shutter speed in log space. */
export function nearestShutter(seconds: number): number {
  let best = SHUTTERS[0];
  let bestD = Infinity;
  for (const s of SHUTTERS) {
    const d = Math.abs(Math.log2(s) - Math.log2(seconds));
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

export function formatShutter(s: number): string {
  if (s >= 1) return `${Math.round(s)}"`;
  return `1/${Math.round(1 / s)}`;
}

export interface ExposureAdvice {
  ev: number;
  shutter: number;
  label: string;
  /** Exact time is beyond the marked range of a typical camera. */
  outOfRange: boolean;
  /** Below ~1/30 s a tripod is recommended. */
  tripod: boolean;
}

export function advise(light: Light, iso: number, aperture: number, compensation = 0): ExposureAdvice {
  const ev = evFor(light, iso, compensation);
  const exact = exactShutter(ev, aperture);
  const shutter = nearestShutter(exact);
  const outOfRange = exact > SHUTTERS[0] * 1.5 || exact < SHUTTERS[SHUTTERS.length - 1] / 1.5;
  return { ev, shutter, label: formatShutter(shutter), outOfRange, tripod: shutter > 1 / 30 + 1e-9 };
}
