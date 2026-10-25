import { canvasToBlob, makeCanvas } from '../film/develop';
import { cropForAspect, outputSize, type Orientation } from '../film/geometry';
import type { Aspect } from '../film/types';
import type { CameraModel } from './models';

/** Longest edge we keep for any negative. */
export const NEGATIVE_MAX_LONG = 4096;

export interface FrameSpec {
  aspect: Aspect;
  orient: Orientation;
}

/** Shape of a single exposure for a camera (half-frame halves are portrait 3:4). */
export function exposureSpec(camera: CameraModel, aspect: Aspect): FrameSpec {
  if (camera.capture === 'half') return { aspect: '4:3', orient: 'portrait' };
  return { aspect, orient: 'auto' };
}

/** Crops (and optionally mirrors) a source into one exposure canvas. */
export function cropExposure(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  spec: FrameSpec | null,
  opts: { zoom?: number; mirror?: boolean; maxLong?: number } = {},
): HTMLCanvasElement {
  const crop = spec ? cropForAspect(srcW, srcH, spec.aspect, opts.zoom ?? 1, spec.orient) : { x: 0, y: 0, w: 1, h: 1 };
  const size = outputSize(srcW, srcH, crop, opts.maxLong ?? NEGATIVE_MAX_LONG);
  const c = makeCanvas(size.width, size.height);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  if (opts.mirror) {
    ctx.translate(size.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, crop.x * srcW, crop.y * srcH, crop.w * srcW, crop.h * srcH, 0, 0, size.width, size.height);
  return c;
}

// ---------- layouts (pure, unit tested) ----------

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Two portrait halves side by side with a thin frame line, as on half-frame film. */
export function halfLayout(hw: number, hh: number): { width: number; height: number; cells: [Rect, Rect] } {
  const gap = Math.max(2, Math.round(hw * 0.04));
  return {
    width: hw * 2 + gap,
    height: hh,
    cells: [
      { x: 0, y: 0, w: hw, h: hh },
      { x: hw + gap, y: 0, w: hw, h: hh },
    ],
  };
}

/** 2×2 grid of equal frames (4-lens action camera), reading order = firing order. */
export function quadLayout(fw: number, fh: number): { width: number; height: number; cells: Rect[] } {
  const gap = Math.max(2, Math.round(Math.min(fw, fh) * 0.03));
  const cells: Rect[] = [];
  for (let i = 0; i < 4; i++) cells.push({ x: (i % 2) * (fw + gap), y: Math.floor(i / 2) * (fh + gap), w: fw, h: fh });
  return { width: fw * 2 + gap, height: fh * 2 + gap, cells };
}

/** Double exposure: each exposure at ~0.82 density, combined like light (screen). */
export function blendDouble(a: number, b: number): number {
  return 1 - (1 - 0.82 * a) * (1 - 0.82 * b);
}

// ---------- canvas composition ----------

export function composeHalf(left: HTMLCanvasElement, right: HTMLCanvasElement | null): HTMLCanvasElement {
  const L = halfLayout(left.width, left.height);
  const out = makeCanvas(L.width, L.height);
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = '#050505'; // unexposed film / frame line
  ctx.fillRect(0, 0, L.width, L.height);
  ctx.drawImage(left, L.cells[0].x, 0, L.cells[0].w, L.cells[0].h);
  if (right) ctx.drawImage(right, L.cells[1].x, 0, L.cells[1].w, L.cells[1].h);
  return out;
}

export function composeQuad(frames: HTMLCanvasElement[]): HTMLCanvasElement {
  const fw = frames[0].width;
  const fh = frames[0].height;
  const L = quadLayout(fw, fh);
  const out = makeCanvas(L.width, L.height);
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, L.width, L.height);
  frames.forEach((f, i) => {
    const c = L.cells[i];
    ctx.drawImage(f, c.x, c.y, c.w, c.h);
    // Each tiny plastic lens vignettes on its own.
    const g = ctx.createRadialGradient(c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h) * 0.25, c.x + c.w / 2, c.y + c.h / 2, Math.hypot(c.w, c.h) / 2);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(c.x, c.y, c.w, c.h);
  });
  return out;
}

export function composeDouble(first: CanvasImageSource, second: HTMLCanvasElement): HTMLCanvasElement {
  const w = second.width;
  const h = second.height;
  const out = makeCanvas(w, h);
  const ctx = out.getContext('2d')!;
  ctx.drawImage(first, 0, 0, w, h);
  const a = ctx.getImageData(0, 0, w, h);
  const b = second.getContext('2d')!.getImageData(0, 0, w, h);
  const ad = a.data;
  const bd = b.data;
  for (let i = 0; i < ad.length; i += 4) {
    ad[i] = blendDouble(ad[i] / 255, bd[i] / 255) * 255;
    ad[i + 1] = blendDouble(ad[i + 1] / 255, bd[i + 1] / 255) * 255;
    ad[i + 2] = blendDouble(ad[i + 2] / 255, bd[i + 2] / 255) * 255;
  }
  ctx.putImageData(a, 0, 0);
  return out;
}

/** A blank (unexposed) half for rewinding a half-frame roll mid-pair. */
export function blankLike(c: HTMLCanvasElement): HTMLCanvasElement {
  const b = makeCanvas(c.width, c.height);
  const ctx = b.getContext('2d')!;
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, b.width, b.height);
  return b;
}

export async function toNegative(c: HTMLCanvasElement): Promise<{ blob: Blob; width: number; height: number }> {
  return { blob: await canvasToBlob(c, 'image/jpeg', 0.95), width: c.width, height: c.height };
}

export async function blobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(blob);
  try {
    const c = makeCanvas(bmp.width, bmp.height);
    c.getContext('2d')!.drawImage(bmp, 0, 0);
    return c;
  } finally {
    bmp.close?.();
  }
}
