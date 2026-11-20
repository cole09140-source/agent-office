import { bodyArtFor, type BodyArtEntry } from './bodyArtData';

// The data lives in bodyArtData.ts, not bodyArt.ts: on a case-insensitive disk (Windows, default macOS) an
// import of './BodyArt' would resolve to bodyArt.ts first (.ts before .tsx). Everything is re-exported here.
export { BODY_ART, bodyArtFor, type BodyArtEntry } from './bodyArtData';

/** A box in stage pixels (relative to the top-left of `.cam-stage`). */
export interface StageBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The art's own box in the stage: contain-fit and centred (a wider-than-stage art fills the width). */
function artBox(art: BodyArtEntry, stageW: number, stageH: number): StageBox {
  const scale = Math.min(stageW / art.w, stageH / art.h);
  const width = art.w * scale;
  const height = art.h * scale;
  return { left: (stageW - width) / 2, top: (stageH - height) / 2, width, height };
}

/**
 * Where the body art's black window lands inside a stage of `stageW` × `stageH` px, or null when the camera
 * has no art. The art is laid out to fit the stage (contain, centred); Camera.tsx then fits the live preview
 * (with the camera's own aspect) inside this box and centres it there, so the art frames the preview.
 * CONTRACT shared by the camera-screen agent (caller) and the body-art agent (implementation).
 */
export function artWindowBox(cameraId: string, stageW: number, stageH: number): StageBox | null {
  const art = bodyArtFor(cameraId);
  if (!art || !(stageW > 0) || !(stageH > 0)) return null;
  const box = artBox(art, stageW, stageH);
  return {
    left: box.left + art.win.x * box.width,
    top: box.top + art.win.y * box.height,
    width: art.win.w * box.width,
    height: art.win.h * box.height,
  };
}

/**
 * The art window's corner radius in stage px for the same layout (0 without art). Camera.tsx can give the
 * viewfinder this border-radius so the preview's corners follow the window's rounded corners.
 */
export function artWindowRadius(cameraId: string, stageW: number, stageH: number): number {
  const art = bodyArtFor(cameraId);
  if (!art || !(stageW > 0) || !(stageH > 0)) return 0;
  return (art.win.r ?? 0) * artBox(art, stageW, stageH).width;
}

/**
 * The camera's photographic body drawn around the viewfinder, using the same layout as artWindowBox.
 * Decorative only (aria-hidden, no pointer events). Renders nothing for a camera without art.
 * CONTRACT: Camera.tsx places it inside `.cam-stage` before the viewfinder: <BodyArt cameraId stageW stageH />.
 */
export function BodyArt({ cameraId, stageW, stageH }: { cameraId: string; stageW: number; stageH: number }) {
  const art = bodyArtFor(cameraId);
  if (!art || !(stageW > 0) || !(stageH > 0)) return null;
  const box = artBox(art, stageW, stageH);
  // The box is sized from the known natural size, so nothing shifts while the image decodes.
  return (
    <img
      key={cameraId}
      class="body-art"
      src={art.src}
      width={art.w}
      height={art.h}
      alt=""
      aria-hidden="true"
      decoding="async"
      draggable={false}
      data-testid="body-art"
      style={{ left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` }}
    />
  );
}

/** Whether a camera has body art (Camera.tsx hides the CSS bezel then). */
export function hasBodyArt(cameraId: string): boolean {
  return !!bodyArtFor(cameraId);
}
