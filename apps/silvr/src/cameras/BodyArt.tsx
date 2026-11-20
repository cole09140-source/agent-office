import { bodyArtFor } from './bodyArt';

/** A box in stage pixels (relative to the top-left of `.cam-stage`). */
export interface StageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Where the body art's black window lands inside a stage of `stageW` × `stageH` px, or null when the camera
 * has no art. The art is laid out to fit the stage (contain, centred); Camera.tsx then fits the live preview
 * (with the camera's own aspect) inside this box and centres it there, so the art frames the preview.
 * CONTRACT shared by the camera-screen agent (caller) and the body-art agent (implementation).
 */
export function artWindowBox(cameraId: string, stageW: number, stageH: number): StageBox | null {
  const art = bodyArtFor(cameraId);
  if (!art || !stageW || !stageH) return null;
  // Stub: real geometry comes with the art.
  return null;
}

/**
 * The camera's photographic body drawn around the viewfinder, using the same layout as artWindowBox.
 * Decorative only (aria-hidden, no pointer events). Renders nothing for a camera without art.
 * CONTRACT: Camera.tsx places it inside `.cam-stage` before the viewfinder: <BodyArt cameraId stageW stageH />.
 */
export function BodyArt({ cameraId, stageW, stageH }: { cameraId: string; stageW: number; stageH: number }) {
  const art = bodyArtFor(cameraId);
  if (!art || !stageW || !stageH) return null;
  return null;
}

/** Whether a camera has body art (Camera.tsx hides the CSS bezel then). */
export function hasBodyArt(cameraId: string): boolean {
  return !!bodyArtFor(cameraId);
}
