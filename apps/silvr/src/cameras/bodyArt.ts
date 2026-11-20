/**
 * Photographic body art per camera (GPT-drawn, cropped from 2×2 sheets): the image shown around the live
 * preview on the camera screen. `win` is the black viewfinder window inside the image, as fractions of the
 * image (x, y = top-left corner). Filled in by scripts/bodies/crop.py; a camera without an entry keeps the
 * CSS back plate.
 */
export interface BodyArtEntry {
  src: string;
  /** Natural size of the image in px. */
  w: number;
  h: number;
  win: { x: number; y: number; w: number; h: number };
}

export const BODY_ART: Record<string, BodyArtEntry> = {};

export function bodyArtFor(cameraId: string): BodyArtEntry | undefined {
  return BODY_ART[cameraId];
}
