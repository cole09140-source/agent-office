import { renderCpu } from './cpuRender';
import { GlFilmRenderer } from './glRenderer';
import { getCamera, hasCamera } from '../cameras/models';
import { borderLayout, drawDateStamp, drawDust, drawWithBorder, formatDigitalStamp, formatStamp, type DateFormat } from './overlays';
import { resolveLook } from './resolve';
import { getStock } from './stocks';
import type { DevelopSettings } from './types';

export interface DevelopMeta {
  takenAt: number;
  frame: number;
  dateFormat: DateFormat;
}

export interface DevelopOutput {
  blob: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

export const EXPORT_MAX_LONG = 3600;
/** iOS Safari refuses canvases above 16,777,216 px; stay safely below. */
export const MAX_CANVAS_PIXELS = 16_000_000;
export const THUMB_MAX_LONG = 540;

/** The CPU fallback works at most at this long edge and scales up: 3600px takes many seconds on a phone. */
export const CPU_MAX_LONG = 1600;

let sharedRenderer: GlFilmRenderer | null | undefined;
let rendererFailedAt = 0;

function exportRenderer(): GlFilmRenderer | null {
  if (sharedRenderer && sharedRenderer.isLost) sharedRenderer = undefined;
  // A failed context can be temporary (too many contexts, GPU process restart): retry now and then.
  if (sharedRenderer === null && Date.now() - rendererFailedAt > 30_000) sharedRenderer = undefined;
  if (sharedRenderer === undefined) {
    const canvas = document.createElement('canvas');
    sharedRenderer = GlFilmRenderer.create(canvas);
    if (!sharedRenderer) rendererFailedAt = Date.now();
  }
  return sharedRenderer;
}

/** False when developing would fall back to the (slow) CPU path. */
export function gpuDevelopAvailable(): boolean {
  return !!exportRenderer();
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality);
  });
}

export function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/** Scales an image to fit `maxLong` and returns it on a canvas. */
export function scaleTo(src: CanvasImageSource, w: number, h: number, maxLong: number): HTMLCanvasElement {
  const k = Math.min(1, maxLong / Math.max(w, h));
  const c = makeCanvas(Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k)));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

/** Renders the film look onto a canvas of the given size (no border/overlays). */
export function renderFilm(source: CanvasImageSource & TexImageSource, w: number, h: number, dev: DevelopSettings, preferGpu = true): HTMLCanvasElement {
  const look = resolveLook(dev);
  const gl = preferGpu ? exportRenderer() : null;
  const out = makeCanvas(w, h);
  const ctx = out.getContext('2d')!;
  if (gl && Math.max(w, h) <= gl.maxTexture) {
    try {
      gl.setLook(look);
      gl.setSource(source, w, h);
      gl.render(w, h, { crop: { x: 0, y: 0, w: 1, h: 1 }, mirror: false });
      if (!gl.isLost) {
        ctx.drawImage(gl.gl.canvas as HTMLCanvasElement, 0, 0);
        return out;
      }
      console.warn('[silvr] WebGL context lost during develop, using CPU');
    } catch (err) {
      console.warn('[silvr] GPU develop failed, falling back to CPU', err);
    }
  }
  const k = Math.min(1, CPU_MAX_LONG / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * k));
  const ch = Math.max(1, Math.round(h * k));
  const work = k < 1 ? makeCanvas(cw, ch) : out;
  const wctx = work.getContext('2d')!;
  wctx.drawImage(source, 0, 0, cw, ch);
  const img = wctx.getImageData(0, 0, cw, ch);
  img.data.set(renderCpu({ data: img.data, width: cw, height: ch }, look));
  wctx.putImageData(img, 0, 0);
  if (work !== out) {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(work, 0, 0, w, h);
  }
  return out;
}

/** Rotates a canvas by clockwise quarter turns. */
export function rotateCanvas(src: HTMLCanvasElement, quarterTurns: number): HTMLCanvasElement {
  const q = ((Math.round(quarterTurns) % 4) + 4) % 4;
  if (q === 0) return src;
  const swap = q % 2 === 1;
  const out = makeCanvas(swap ? src.height : src.width, swap ? src.width : src.height);
  const ctx = out.getContext('2d')!;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((q * Math.PI) / 2);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

/** Long-edge limit that keeps the bordered print under the iOS canvas pixel cap. */
export function safeMaxLong(srcW: number, srcH: number, dev: DevelopSettings, maxLong: number): number {
  const k = Math.min(1, maxLong / Math.max(srcW, srcH));
  const w = Math.round(srcW * k);
  const h = Math.round(srcH * k);
  const layout = borderLayout(dev.border, w, h);
  const area = layout.width * layout.height;
  if (area <= MAX_CANVAS_PIXELS) return maxLong;
  return Math.floor(Math.max(w, h) * Math.sqrt(MAX_CANVAS_PIXELS / area));
}

/** Film look + dust + date + border, synchronously. Used for exports and the darkroom preview. */
export function composePrint(negative: HTMLCanvasElement, dev: DevelopSettings, meta: DevelopMeta): HTMLCanvasElement {
  const src = rotateCanvas(negative, dev.rotate ?? 0);
  const w = src.width;
  const h = src.height;
  const film = renderFilm(src, w, h, dev);
  const stock = getStock(dev.stockId);
  const fctx = film.getContext('2d')!;
  const look = resolveLook(dev);
  drawDust(fctx, look.dust, dev.seed, stock.kind, 0, 0, w, h);
  const camera = hasCamera(dev.cameraId) ? getCamera(dev.cameraId) : null;
  if (dev.dateStamp && camera?.stamp !== 'none') {
    const text = camera?.stamp === 'digital' ? formatDigitalStamp(meta.takenAt) : formatStamp(meta.takenAt, meta.dateFormat);
    drawDateStamp(fctx, text, 0, 0, w, h);
  }
  const layout = borderLayout(dev.border, w, h);
  if (dev.border === 'none') return film;
  const out = makeCanvas(layout.width, layout.height);
  drawWithBorder(out.getContext('2d')!, film, dev.border, layout, {
    label: `SILVR ${stock.name.toUpperCase()}`,
    frame: meta.frame,
  });
  return out;
}

async function developNow(original: Blob, dev: DevelopSettings, meta: DevelopMeta, maxLong: number): Promise<DevelopOutput> {
  const bitmap = await createImageBitmap(original);
  try {
    const camMax = hasCamera(dev.cameraId) ? getCamera(dev.cameraId).maxLong : undefined;
    const limit = Math.min(maxLong, camMax ?? maxLong);
    const src = scaleTo(bitmap, bitmap.width, bitmap.height, safeMaxLong(bitmap.width, bitmap.height, dev, limit));
    const out = composePrint(src, dev, meta);
    // Pixel art stays lossless (JPEG would smear the 4-colour palette); everything else is JPEG.
    const lossless = getStock(dev.stockId).kind === 'pixel';
    const blob = await canvasToBlob(out, lossless ? 'image/png' : 'image/jpeg', 0.92);
    const thumbCanvas = scaleTo(out, out.width, out.height, THUMB_MAX_LONG);
    const thumb = await canvasToBlob(thumbCanvas, 'image/jpeg', 0.82);
    return { blob, thumb, width: out.width, height: out.height };
  } finally {
    bitmap.close?.();
  }
}

interface Job {
  id?: string;
  run: () => Promise<void>;
}
const urgent: Job[] = [];
const background: Job[] = [];
/** Ids promoted before their job reached the queue (still awaiting its negative), with when. */
const promoted = new Map<string, number>();
const PROMOTION_TTL_MS = 15_000;
let pumping = false;

async function pump(): Promise<void> {
  if (pumping) return;
  pumping = true;
  try {
    for (;;) {
      const job = urgent.shift() ?? background.shift();
      if (!job) break;
      await job.run();
    }
  } finally {
    pumping = false;
  }
}

/**
 * Develops a negative into a finished print. Jobs run one at a time (one GPU
 * context); `urgent` jobs (the print the user is looking at) jump ahead of
 * thumbnail work.
 */
export function develop(original: Blob, dev: DevelopSettings, meta: DevelopMeta, opts: { urgent?: boolean; maxLong?: number; id?: string } = {}): Promise<DevelopOutput> {
  return new Promise((resolve, reject) => {
    const job: Job = {
      id: opts.id,
      run: () => developNow(original, dev, meta, opts.maxLong ?? EXPORT_MAX_LONG).then(resolve, reject),
    };
    const at = opts.id ? promoted.get(opts.id) : undefined;
    if (opts.id) promoted.delete(opts.id);
    const isUrgent = opts.urgent || (at !== undefined && Date.now() - at < PROMOTION_TTL_MS);
    (isUrgent ? urgent : background).push(job);
    void pump();
  });
}

/** Moves a queued background job to the front (the user just opened that photo). */
export function promote(id: string): void {
  const i = background.findIndex((j) => j.id === id);
  if (i >= 0) urgent.push(...background.splice(i, 1));
  else if (!urgent.some((j) => j.id === id)) promoted.set(id, Date.now());
}
