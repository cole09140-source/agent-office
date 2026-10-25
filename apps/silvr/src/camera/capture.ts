import { canvasToBlob, makeCanvas } from '../film/develop';
import { cropForAspect, outputSize } from '../film/geometry';
import type { Aspect } from '../film/types';

export const NEGATIVE_MAX_LONG = 4096;

export interface Negative {
  blob: Blob;
  width: number;
  height: number;
}

/** Crops (and optionally mirrors) a frame into the stored "negative" JPEG. */
export async function makeNegative(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  aspect: Aspect | null,
  opts: { zoom?: number; mirror?: boolean; maxLong?: number } = {},
): Promise<Negative> {
  const crop = aspect ? cropForAspect(srcW, srcH, aspect, opts.zoom ?? 1) : { x: 0, y: 0, w: 1, h: 1 };
  const size = outputSize(srcW, srcH, crop, opts.maxLong ?? NEGATIVE_MAX_LONG);
  const c = makeCanvas(size.width, size.height);
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  if (opts.mirror) {
    ctx.translate(size.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, crop.x * srcW, crop.y * srcH, crop.w * srcW, crop.h * srcH, 0, 0, size.width, size.height);
  const blob = await canvasToBlob(c, 'image/jpeg', 0.95);
  return { blob, ...size };
}

export async function captureVideoFrame(video: HTMLVideoElement, aspect: Aspect, zoom: number, mirror: boolean): Promise<Negative> {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) throw new Error('Camera not ready');
  // Snapshot first so the frame can't change while we encode.
  const snap = makeCanvas(w, h);
  snap.getContext('2d')!.drawImage(video, 0, 0, w, h);
  return makeNegative(snap, w, h, aspect, { zoom, mirror });
}

/** Decodes an imported file (EXIF orientation respected) into a negative. */
export async function importFile(file: File): Promise<Negative & { takenAt: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    const neg = await makeNegative(bitmap, bitmap.width, bitmap.height, null);
    return { ...neg, takenAt: file.lastModified || Date.now() };
  } finally {
    bitmap.close?.();
  }
}
