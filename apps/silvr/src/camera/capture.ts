import { cropExposure, toNegative } from '../cameras/compose';
import { makeCanvas } from '../film/develop';

export interface Negative {
  blob: Blob;
  width: number;
  height: number;
}

/** Grabs the current video frame so it can't change while we crop/encode. */
export function snapshotVideo(video: HTMLVideoElement): HTMLCanvasElement {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) throw new Error('Camera not ready');
  const snap = makeCanvas(w, h);
  snap.getContext('2d')!.drawImage(video, 0, 0, w, h);
  return snap;
}

/** Decodes an imported file (EXIF orientation respected) into a negative. */
export async function importFile(file: File): Promise<Negative & { takenAt: number }> {
  const bitmap = await createImageBitmap(file);
  try {
    const neg = await toNegative(cropExposure(bitmap, bitmap.width, bitmap.height, null));
    return { ...neg, takenAt: file.lastModified || Date.now() };
  } finally {
    bitmap.close?.();
  }
}
