import { bodyArtFor, type BodyArtEntry } from './bodyArtData';
import { BodyGlint } from './BodyWrap';

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

/**
 * How much of each margin around the window is kept (2026-11-21: "the body 50% smaller, the picture
 * bigger"). The art is cropped to the window plus this share of the body on every side; the rest is
 * clipped, so the same stage gives the live preview a much larger window.
 */
export const ART_MARGIN_KEEP = 0.5;

/** The visible part of the art, as fractions of the full image (x, y = top-left). */
function cropOf(art: BodyArtEntry): { x: number; y: number; w: number; h: number } {
  const { win } = art;
  const x = win.x * (1 - ART_MARGIN_KEEP);
  const y = win.y * (1 - ART_MARGIN_KEEP);
  const right = win.x + win.w + (1 - win.x - win.w) * ART_MARGIN_KEEP;
  const bottom = win.y + win.h + (1 - win.y - win.h) * ART_MARGIN_KEEP;
  return { x, y, w: right - x, h: bottom - y };
}

/**
 * The visible (cropped) body's natural size in image px, or null without art. Camera.tsx gives the stage
 * this shape on the portrait screen, so no empty plate shows above / below the body.
 */
export function artFrameSize(cameraId: string): { w: number; h: number } | null {
  const art = bodyArtFor(cameraId);
  if (!art) return null;
  const c = cropOf(art);
  return { w: art.w * c.w, h: art.h * c.h };
}

interface ArtLayout {
  /** The visible body (the clip) in the stage: contain-fit and centred. */
  clip: StageBox;
  /** Stage px per image px. */
  scale: number;
  crop: { x: number; y: number; w: number; h: number };
}

function layout(art: BodyArtEntry, stageW: number, stageH: number): ArtLayout {
  const crop = cropOf(art);
  const vw = art.w * crop.w;
  const vh = art.h * crop.h;
  const scale = Math.min(stageW / vw, stageH / vh);
  const width = vw * scale;
  const height = vh * scale;
  return { clip: { left: (stageW - width) / 2, top: (stageH - height) / 2, width, height }, scale, crop };
}

/**
 * Where the body art's black window lands inside a stage of `stageW` × `stageH` px, or null when the camera
 * has no art. The visible (cropped) body is laid out to fit the stage (contain, centred); Camera.tsx then
 * fits the live preview (with the camera's own aspect) inside this box and centres it there.
 * CONTRACT shared by the camera screen (caller) and the body art (implementation).
 */
export function artWindowBox(cameraId: string, stageW: number, stageH: number): StageBox | null {
  const art = bodyArtFor(cameraId);
  if (!art || !(stageW > 0) || !(stageH > 0)) return null;
  const { clip, scale, crop } = layout(art, stageW, stageH);
  return {
    left: clip.left + (art.win.x - crop.x) * art.w * scale,
    top: clip.top + (art.win.y - crop.y) * art.h * scale,
    width: art.win.w * art.w * scale,
    height: art.win.h * art.h * scale,
  };
}

/**
 * The art window's corner radius in stage px for the same layout (0 without art). Camera.tsx gives the
 * viewfinder this border-radius so the preview's corners follow the window's rounded corners.
 */
export function artWindowRadius(cameraId: string, stageW: number, stageH: number): number {
  const art = bodyArtFor(cameraId);
  if (!art || !(stageW > 0) || !(stageH > 0)) return 0;
  return (art.win.r ?? 0) * art.w * layout(art, stageW, stageH).scale;
}

/**
 * The camera's photographic body drawn around the viewfinder, using the same layout as artWindowBox: a
 * clip box (the visible half of the body, rounded, its edges fading out so a printed name that runs
 * past the crop never ends in a hard cut) with the full image inside it. Decorative only (aria-hidden,
 * no pointer events). Renders nothing for a camera without art.
 * CONTRACT: Camera.tsx places it inside `.cam-stage` before the viewfinder: <BodyArt cameraId stageW stageH />.
 */
export function BodyArt({ cameraId, stageW, stageH }: { cameraId: string; stageW: number; stageH: number }) {
  const art = bodyArtFor(cameraId);
  if (!art || !(stageW > 0) || !(stageH > 0)) return null;
  const { clip, scale, crop } = layout(art, stageW, stageH);
  // Sized from the known natural size, so nothing shifts while the image decodes.
  return (
    <div
      key={cameraId}
      class="body-art"
      aria-hidden="true"
      data-testid="body-art"
      style={{ left: `${clip.left}px`, top: `${clip.top}px`, width: `${clip.width}px`, height: `${clip.height}px` }}
    >
      <img
        class="body-art-img"
        src={art.src}
        width={art.w}
        height={art.h}
        alt=""
        decoding="async"
        draggable={false}
        style={{
          left: `${-crop.x * art.w * scale}px`,
          top: `${-crop.y * art.h * scale}px`,
          width: `${art.w * scale}px`,
          height: `${art.h * scale}px`,
        }}
      />
      {/* A soft light glint across the body that follows the phone's tilt (BodyWrap.tsx). */}
      <BodyGlint />
    </div>
  );
}

/** Whether a camera has body art (Camera.tsx hides the CSS bezel then). */
export function hasBodyArt(cameraId: string): boolean {
  return !!bodyArtFor(cameraId);
}
