import { useEffect, useRef } from 'preact/hooks';
import { screenAngle } from '../camera/orientation';
import type { StageBox } from './BodyArt';
import { BODY_WRAP, bodyWrapFor, type BodyWrapEntry } from './bodyWrapData';

export { BODY_WRAP, bodyWrapFor, type BodyWrapEntry };

/*
 * FULL-BODY WRAP (landscape camera screen): the camera back covers the whole screen, edge to edge. The art
 * (scripts/bodies/wrap.py, ~2.6:1) is cover-fit by height and anchored at the left so its black window, where the
 * live preview goes, is always fully on screen; the mode dial and the control column are mounted on the plain
 * body to the right of the window. Portrait keeps the cropped body art (BodyArt.tsx).
 */

/** Widths of the mode dial and the control column in wrap mode (px), and the least body between them / the window. */
export const WRAP_DIAL_W = 92;
export const WRAP_COL_W = 120;
export const WRAP_MIN_GAP = 8;
/** Room the controls need right of the window: column + dial + a gap either side of the dial. */
export const WRAP_RESERVE = WRAP_COL_W + WRAP_DIAL_W + 2 * WRAP_MIN_GAP;
/** Least room between the window and the screen's (safe) top, bottom and left edges. */
const EDGE = 6;

/** The safe-area padding of the camera screen (px): the window keeps clear of a notch. */
export interface WrapPad {
  l: number;
  t: number;
  r: number;
  b: number;
}
const NO_PAD: WrapPad = { l: 0, t: 0, r: 0, b: 0 };

export interface WrapLayout {
  /** The whole image in screen px (it may run past the right edge: that part is clipped). */
  art: StageBox;
  /** The black window in screen px: the preview is fitted inside it. */
  win: StageBox;
  /** The window's corner radius in screen px. */
  radius: number;
  /** Screen px per image px. */
  scale: number;
}

/**
 * Where the wrap art and its window land on a W × H camera screen, or null without wrap art.
 * Cover-fit by height (the art was cropped to the rows that should show), the art's left edge at the screen's left
 * edge. When the window would run under the controls (`reserveRight` px at the right, inside the padding) the art
 * first slides left (cropping the body left of the window); only when that is not enough does the scale drop,
 * and the art then sits centred on the screen's height. The window is pushed right of a left notch when needed.
 * CONTRACT shared by the camera screen (caller: the preview and the controls) and WrapArt (drawing).
 */
export function wrapLayout(cameraId: string, W: number, H: number, pad: WrapPad = NO_PAD, reserveRight = WRAP_RESERVE): WrapLayout | null {
  const art = bodyWrapFor(cameraId);
  if (!art || !(W > 0) || !(H > 0)) return null;
  const wx = art.win.x * art.w;
  const wy = art.win.y * art.h;
  const ww = art.win.w * art.w;
  const wh = art.win.h * art.h;
  const right = W - pad.r - reserveRight; // the window ends before this
  const minLeft = pad.l + EDGE; // the window's left edge, at the furthest left it may go
  let scale = H / art.h;
  // Shrink only when even a window slid all the way left (the body strip left of it cropped) would run under
  // the controls, or when it would not fit the safe height.
  scale = Math.min(scale, (right - minLeft) / ww, (H - pad.t - pad.b - 2 * EDGE) / wh);
  scale = Math.max(scale, 0.01);
  const artW = art.w * scale;
  const artH = art.h * scale;
  // Left: the art's own edge at the screen's edge; pushed right of a notch, or slid left (its left margin
  // cropped) when the window would otherwise run under the controls.
  let left = Math.max(0, minLeft - wx * scale);
  const over = left + (wx + ww) * scale - right;
  if (over > 0) left -= over;
  // Top: centred on the height (0 when it covers), then nudged so the window clears the safe top / bottom.
  let top = (H - artH) / 2;
  const winTop = top + wy * scale;
  if (winTop < pad.t + EDGE) top += pad.t + EDGE - winTop;
  const winBottom = top + (wy + wh) * scale;
  if (winBottom > H - pad.b - EDGE) top -= winBottom - (H - pad.b - EDGE);
  return {
    art: { left, top, width: artW, height: artH },
    win: { left: left + wx * scale, top: top + wy * scale, width: ww * scale, height: wh * scale },
    radius: art.win.r * art.w * scale,
    scale,
  };
}

/** Whether a camera has wrap art (the landscape camera screen then becomes the full camera back). */
export function hasWrapArt(cameraId: string): boolean {
  return !!bodyWrapFor(cameraId);
}

/**
 * A soft light glint that drifts across the body as the phone tilts (deviceorientation), or sweeps slowly by
 * itself when there is no motion sensor (CSS: the idle animation, until the first tilt reading). Writes the
 * transform straight to the element (no re-render), at most once a frame. None with reduced motion (CSS hides
 * the layer; the listener is not added).
 */
export function useTiltGlint(ref: { current: HTMLElement | null }, active = true): void {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active || typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return;
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    let x = 0;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // The tilt that moves along the screen's width: gamma in portrait, beta when the screen is turned.
      const a = screenAngle() ?? 0;
      const v = a === 90 ? -e.beta : a === 270 ? e.beta : a === 180 ? -e.gamma : e.gamma;
      x = Math.max(-1, Math.min(1, v / 30));
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.classList.add('tilt');
        el.style.transform = `translate3d(${(x * 45).toFixed(1)}%, 0, 0)`;
      });
    };
    window.addEventListener('deviceorientation', onTilt);
    return () => {
      window.removeEventListener('deviceorientation', onTilt);
      cancelAnimationFrame(raf);
    };
  }, [active]);
}

/** The glint layer (decorative): place it inside a body-art clip, above the image, under the preview. */
export function BodyGlint() {
  const ref = useRef<HTMLDivElement>(null);
  useTiltGlint(ref);
  return (
    <div class="body-glint-clip" aria-hidden="true">
      <div class="body-glint" ref={ref} />
    </div>
  );
}

/**
 * The full camera back (decorative: aria-hidden, no pointer events), laid out by `wrapLayout`. Renders nothing
 * without wrap art or before the screen is measured.
 * CONTRACT: Camera.tsx places it inside `.cam-stage` (which then covers the whole camera screen) before the
 * viewfinder: <WrapArt cameraId layout />.
 */
export function WrapArt({ cameraId, layout }: { cameraId: string; layout: WrapLayout | null }) {
  const art = bodyWrapFor(cameraId);
  if (!art || !layout) return null;
  const { art: a } = layout;
  return (
    <div key={cameraId} class="wrap-art" aria-hidden="true" data-testid="wrap-art">
      <img
        class="wrap-art-img"
        src={art.src}
        width={art.w}
        height={art.h}
        alt=""
        decoding="async"
        draggable={false}
        style={{ left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` }}
      />
      <BodyGlint />
    </div>
  );
}
