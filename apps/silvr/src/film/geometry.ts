import type { CropRect } from './glRenderer';
import type { Aspect } from './types';

export function aspectRatio(aspect: Aspect): number {
  switch (aspect) {
    case '3:2':
      return 1.5;
    case '4:3':
      return 4 / 3;
    case '65:24':
      return 65 / 24;
    case '2.39:1':
      return 2.39;
    case '8:7':
      return 8 / 7;
    default:
      return 1;
  }
}

export type Orientation = 'auto' | 'portrait' | 'landscape';

/**
 * Centered crop (normalized to the source) that matches `aspect`, keeping the
 * source orientation (portrait source → portrait frame) unless `orient` forces
 * one (half-frame halves are always portrait). `zoom` ≥ 1 crops in.
 */
export function cropForAspect(srcW: number, srcH: number, aspect: Aspect, zoom = 1, orient: Orientation = 'auto'): CropRect {
  const r = aspectRatio(aspect);
  const portrait = orient === 'auto' ? srcH > srcW : orient === 'portrait';
  const target = portrait ? 1 / r : r; // width / height
  const srcRatio = srcW / srcH;
  let w = 1;
  let h = 1;
  if (srcRatio > target) w = target / srcRatio;
  else h = srcRatio / target;
  const z = Math.max(1, zoom);
  w /= z;
  h /= z;
  return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

/** Output pixel size for a crop of a source, limited to `maxLong` on the long edge. */
export function outputSize(srcW: number, srcH: number, crop: CropRect, maxLong: number): { width: number; height: number } {
  let width = srcW * crop.w;
  let height = srcH * crop.h;
  const long = Math.max(width, height);
  if (long > maxLong) {
    const k = maxLong / long;
    width *= k;
    height *= k;
  }
  return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)) };
}

/** Size that covers a box (CSS object-fit: contain) for a given ratio. */
export function fitContain(boxW: number, boxH: number, ratio: number): { width: number; height: number } {
  if (boxW / boxH > ratio) return { width: Math.round(boxH * ratio), height: Math.round(boxH) };
  return { width: Math.round(boxW), height: Math.round(boxW / ratio) };
}
