import { cropExposure, toNegative } from '../cameras/compose';
import { makeCanvas } from '../film/develop';
import { exifTakenAt } from './exif';

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

/**
 * Decodes an imported file (EXIF orientation respected) into a negative. `dated` is true
 * when the shooting time came from EXIF; otherwise takenAt is only the file's time.
 */
export async function importFile(file: File): Promise<Negative & { takenAt: number; dated: boolean }> {
  const shot = exifTakenAt(await file.slice(0, 256 * 1024).arrayBuffer());
  const bitmap = await createImageBitmap(file);
  try {
    const neg = await toNegative(cropExposure(bitmap, bitmap.width, bitmap.height, null));
    return { ...neg, takenAt: shot ?? (file.lastModified || Date.now()), dated: shot !== null };
  } finally {
    bitmap.close?.();
  }
}
