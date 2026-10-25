import { mulberry32 } from './random';
import { getCamera, hasCamera, PIXEL_PALETTES } from '../cameras/models';
import { getStock } from './stocks';
import type { DevelopSettings, FilmLook, FilmStock, LightLeak, ResolvedLook, RGB } from './types';

const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export const PUSH_RANGE = [-2, 2] as const;

export function defaultDevelop(stock: FilmStock, seed: number, opts: Partial<DevelopSettings> = {}): DevelopSettings {
  return {
    stockId: stock.id,
    push: 0,
    expired: 0,
    grain: 1,
    halation: 1,
    leak: null,
    flash: stock.defaultFlash,
    dateStamp: false,
    border: stock.defaultBorder,
    seed,
    ...opts,
  };
}

/** Film-like highlight shoulder: linear up to `knee`, then a soft roll-off approaching 1. */
export function shoulder(v: number, knee = 0.8): number {
  if (v <= knee) return v;
  const room = 1 - knee;
  return knee + room * Math.tanh((v - knee) / room);
}

/** Symmetric power S-curve around `pivot`. contrast=1 is identity. */
export function sCurve(v: number, contrast: number, pivot = 0.5): number {
  v = clamp(v);
  if (contrast === 1) return v;
  if (v < pivot) return pivot * Math.pow(v / pivot, contrast);
  return 1 - (1 - pivot) * Math.pow((1 - v) / (1 - pivot), contrast);
}

/** Per-channel transfer: exposure → shoulder → S-curve → gamma → lift/gain. */
export function channelCurve(x: number, look: FilmLook, c: 0 | 1 | 2): number {
  let v = x * Math.pow(2, look.exposure);
  v = shoulder(v);
  v = sCurve(v, look.contrast);
  v = Math.pow(v, look.gamma[c]);
  return clamp(look.lift[c] + (look.gain[c] - look.lift[c]) * v);
}

export function buildLut(look: FilmLook): Uint8Array {
  const lut = new Uint8Array(256 * 4);
  for (let i = 0; i < 256; i++) {
    const x = i / 255;
    lut[i * 4] = Math.round(channelCurve(x, look, 0) * 255);
    lut[i * 4 + 1] = Math.round(channelCurve(x, look, 1) * 255);
    lut[i * 4 + 2] = Math.round(channelCurve(x, look, 2) * 255);
    lut[i * 4 + 3] = 255;
  }
  return lut;
}

const add = (a: RGB, b: RGB, k = 1): RGB => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const mul = (a: RGB, b: RGB): RGB => [a[0] * b[0], a[1] * b[1], a[2] * b[2]];

/**
 * Applies the develop recipe (push/pull, expiry, flash, user multipliers) on
 * top of the stock's intrinsic look. Pure so it can be unit tested.
 */
export function effectiveLook(stock: FilmStock, dev: DevelopSettings): FilmLook {
  const base = stock.look;
  const p = clamp(dev.push, PUSH_RANGE[0], PUSH_RANGE[1]);
  const e = clamp(stock.baseExpired + dev.expired);
  const l: FilmLook = { ...base, gamma: [...base.gamma], lift: [...base.lift], gain: [...base.gain] };

  // Exposure compensation dial on the camera.
  l.exposure += clamp(dev.ev ?? 0, -2, 2);

  // Push processing: more density & contrast, coarser grain. Pull: the reverse.
  l.exposure += 0.3 * p;
  l.contrast *= 1 + 0.16 * p;
  l.saturation *= 1 + 0.05 * p;
  l.grain *= p >= 0 ? 1 + 0.45 * p : 1 + 0.18 * p;
  l.grainSize *= 1 + 0.12 * Math.max(p, 0);
  l.lift = l.lift.map((v) => v * (1 - 0.15 * p)) as RGB;

  // Expired film: base fog (magenta/warm), lost contrast & saturation, yellowed highlights.
  if (e > 0) {
    l.exposure -= 0.25 * e;
    l.contrast *= 1 - 0.3 * e;
    l.saturation *= 1 - 0.38 * e;
    l.lift = add(l.lift, [0.07, 0.04, 0.075], e);
    l.gain = mul(l.gain, [1, 1 - 0.05 * e, 1 - 0.14 * e]);
    l.shadowTint = add(l.shadowTint, [0.03, -0.01, 0.03], e);
    l.highlightTint = add(l.highlightTint, [0.03, 0.02, -0.03], e);
    l.grain *= 1 + 0.9 * e;
    l.dust += 0.4 * e;
    l.vignette += 0.15 * e;
  }

  // On-camera flash: hot centre, deeper fall-off, punchier tones.
  if (dev.flash) {
    l.exposure += 0.1;
    l.contrast *= 1.08;
    l.vignette += 0.25;
  }

  l.grain *= clamp(dev.grain, 0, 2);
  l.halation *= clamp(dev.halation, 0, 2);
  l.bloom *= clamp(0.5 + dev.halation / 2, 0, 1.5);
  l.contrast = Math.max(0.5, l.contrast);
  l.saturation = Math.max(0, l.saturation);
  l.vignette = clamp(l.vignette, 0, 1);
  l.dust = clamp(l.dust, 0, 1);
  return l;
}

const LEAK_COLORS: RGB[] = [
  [1, 0.42, 0.08],
  [1, 0.18, 0.06],
  [1, 0.72, 0.25],
  [0.95, 0.3, 0.45],
];

/** Deterministic light-leak layout for a seed: 1-3 warm blobs hugging an edge. */
export function lightLeaks(seed: number): LightLeak[] {
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const count = 1 + Math.floor(rnd() * 3);
  const edge = Math.floor(rnd() * 4); // all blobs share one edge, like a real leak
  const leaks: LightLeak[] = [];
  for (let i = 0; i < count; i++) {
    const along = 0.1 + rnd() * 0.8;
    const inset = -0.15 + rnd() * 0.25;
    const pos: [number, number] =
      edge === 0 ? [inset, along] : edge === 1 ? [1 - inset, along] : edge === 2 ? [along, inset] : [along, 1 - inset];
    leaks.push({
      x: pos[0],
      y: pos[1],
      radius: 0.25 + rnd() * 0.45,
      color: LEAK_COLORS[Math.floor(rnd() * LEAK_COLORS.length)],
      intensity: 0.45 + rnd() * 0.5,
    });
  }
  return leaks;
}

export function resolveLook(dev: DevelopSettings): ResolvedLook {
  const stock = getStock(dev.stockId);
  const l = effectiveLook(stock, dev);
  // Frames from before camera bodies existed (and imports) get a neutral lens.
  const lens = hasCamera(dev.cameraId) ? getCamera(dev.cameraId).lens : null;
  const pixel = stock.kind === 'pixel';
  return {
    lut: buildLut(l),
    saturation: l.saturation,
    matrix: l.matrix,
    shadowTint: l.shadowTint,
    highlightTint: l.highlightTint,
    mono: l.mono,
    grain: l.grain,
    grainSize: l.grainSize,
    grainChroma: l.grainChroma,
    halation: l.halation,
    halationColor: l.halationColor,
    bloom: l.bloom,
    vignette: clamp(l.vignette + (lens?.vignette ?? 0)),
    chroma: l.chroma + (lens?.chroma ?? 0),
    flash: dev.flash ? 1 : 0,
    leaks: dev.leak === null ? [] : lightLeaks(dev.leak),
    dust: l.dust,
    // Keep the shader seed small so float precision on mobile GPUs is preserved.
    seed: (dev.seed % 9973) / 7.3,
    distort: lens?.distort ?? 0,
    fisheye: lens?.fisheye ? 1 : 0,
    soft: lens?.soft ?? 0,
    streak: lens?.streak ?? 0,
    streakColor: lens?.streakColor ?? [0.35, 0.55, 1],
    pixel: pixel ? PIXEL_PALETTES[dev.palette ?? 'moss'] ?? PIXEL_PALETTES.moss : null,
  };
}

/** Stable key used to know whether a cached developed image is still valid. */
export function developKey(dev: DevelopSettings): string {
  return [
    dev.stockId,
    dev.push.toFixed(2),
    dev.expired.toFixed(2),
    dev.grain.toFixed(2),
    dev.halation.toFixed(2),
    dev.leak ?? '-',
    dev.flash ? 1 : 0,
    dev.dateStamp ? 1 : 0,
    dev.border,
    dev.seed,
    dev.rotate ?? 0,
    dev.cameraId ?? '-',
    (dev.ev ?? 0).toFixed(2),
    dev.palette ?? '-',
    RENDER_VERSION,
  ].join('|');
}

/** Bump when the render pipeline changes so cached prints re-develop. */
export const RENDER_VERSION = 2;
