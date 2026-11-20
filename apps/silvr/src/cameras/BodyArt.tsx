import { bodyArtFor } from './bodyArt';

/**
 * The camera's photographic body drawn around the viewfinder: positioned so its black window sits exactly
 * on the live preview (`width` × `height` px, centred in the stage). Decorative only. Renders nothing for a
 * camera without body art (the CSS back plate stays).
 * Contract (used by Camera.tsx): place it inside `.cam-stage`, before the viewfinder, with the frame size.
 */
export function BodyArt({ cameraId, width, height }: { cameraId: string; width: number; height: number }) {
  const art = bodyArtFor(cameraId);
  if (!art || !width || !height) return null;
  // Stub until the art lands: the implementation scales the image so win.w × imageWidth === width.
  return null;
}

/** Whether a camera has body art (Camera.tsx hides the CSS bezel then). */
export function hasBodyArt(cameraId: string): boolean {
  return !!bodyArtFor(cameraId);
}
