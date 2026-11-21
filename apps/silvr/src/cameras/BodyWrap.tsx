import { useEffect, useRef } from 'preact/hooks';
import { screenAngle } from '../camera/orientation';
import type { StageBox } from './BodyArt';
import { BODY_WRAP, bodyWrapFor, type BodyWrapEntry } from './bodyWrapData';

export { BODY_WRAP, bodyWrapFor, type BodyWrapEntry };

/*
 * FULL-BODY WRAP (landscape camera screen): the camera back covers the whole screen, edge to edge. The art
 * (scripts/bodies/panels.py, ~2.1:1) is scaled to the screen's height and drawn as a 3-slice:
 *   LEFT   [0, s0)  the black window (the live preview goes there), anchored at the screen's left edge,
 *   MIDDLE [s0, s1) a straight strip of plain body, mirrored-tiled across whatever width is left,
 *   RIGHT  [s1, w)  the right-hand dials and the end of the top plate, anchored at the screen's right edge,
 * so the top plate (printed name, dials, crank) is whole on every phone. The mode dial and the control column are
 * mounted on the plain body right of the window, below the top plate. Portrait keeps the cropped body art
 * (BodyArt.tsx).
 */

/** Widths of the mode dial and the control column in wrap mode (px), and the least body between them / the window. */
export const WRAP_DIAL_W = 92;
export const WRAP_COL_W = 120;
export const WRAP_MIN_GAP = 8;
/** Room the controls need right of the window: column + dial + a gap either side of the dial. */
export const WRAP_RESERVE = WRAP_COL_W + WRAP_DIAL_W + 2 * WRAP_MIN_GAP;
/** Least room between the window and the screen's (safe) top, bottom and left edges. */
const EDGE = 6;
/** The window's bevel / frame right of the black (fraction of the art width): RIGHT never covers it. */
export const WRAP_BEVEL = 0.025;
/** How much of the body left of the window LEFT may slide off the screen before the art is scaled down. */
const SLIDE = 0.4;

/** The safe-area padding of the camera screen (px): the window keeps clear of a notch. */
export interface WrapPad {
  l: number;
  t: number;
  r: number;
  b: number;
}
const NO_PAD: WrapPad = { l: 0, t: 0, r: 0, b: 0 };

/** One horizontal slice of the art on screen (px). */
export interface WrapSlice {
  x: number;
  w: number;
}

export interface WrapLayout {
  /** The art's band on screen: from LEFT's left edge to the screen's right edge, the art's height. */
  art: StageBox;
  /** LEFT (window side), MIDDLE (n mirrored tiles; w < 0: none, RIGHT overlaps LEFT by -w) and RIGHT (ends at the
   *  screen's right edge; narrower than the art's RIGHT when its plain start is clipped at the window's bevel). */
  left: WrapSlice;
  mid: WrapSlice & { n: number };
  right: WrapSlice;
  /** The black window in screen px: the preview is fitted inside it. */
  win: StageBox;
  /** The window's corner radius in screen px. */
  radius: number;
  /** Screen px per image px. */
  scale: number;
  /** Screen y where the plain body starts right of the window (below the top plate): the controls start here. */
  ctlTop: number;
}

/** The odd number of tiles (the last one then ends on s1 unmirrored, seamless with RIGHT) that best fits `w` with tiles of `tile` px. */
export function tileCount(w: number, tile: number): number {
  if (!(w > 0) || !(tile > 0)) return 0;
  let best = 1;
  for (let n = 3; n < 401 && (n - 2) * tile < w * 2; n += 2) {
    if (Math.abs(Math.log(w / (n * tile))) < Math.abs(Math.log(w / (best * tile)))) best = n;
  }
  return best;
}

/**
 * Where the wrap art, its three slices and its window land on a W × H camera screen, or null without wrap art.
 * Scaled to the screen's height (art height = H). LEFT starts at the screen's left edge (pushed right of a left
 * notch when the window needs it, or slid left — the body left of the window cropped — when the window would run
 * under the controls, `reserveRight` px at the right inside the padding); RIGHT ends at the screen's right edge.
 * Only when even that cannot keep the window clear of the controls, of the safe height, or of RIGHT does the scale
 * drop (the art then sits centred on the height).
 * CONTRACT shared by the camera screen (caller: the preview and the controls) and WrapArt (drawing).
 */
export function wrapLayout(cameraId: string, W: number, H: number, pad: WrapPad = NO_PAD, reserveRight = WRAP_RESERVE): WrapLayout | null {
  const art = bodyWrapFor(cameraId);
  if (!art || !(W > 0) || !(H > 0)) return null;
  const wx = art.win.x * art.w;
  const wy = art.win.y * art.h;
  const ww = art.win.w * art.w;
  const wh = art.win.h * art.h;
  const lw = art.slice.l * art.w;
  const rw = art.slice.r * art.w;
  const kw = Math.min(rw, art.slice.k * art.w); // the part of RIGHT that always shows
  const sw = art.w - lw - rw;
  const bev = WRAP_BEVEL * art.w;
  const right = W - pad.r - reserveRight; // the window ends before this
  const minLeft = pad.l + EDGE; // the window's left edge, at the furthest left it may go
  let scale = H / art.h;
  scale = Math.min(scale, (right - minLeft) / ww, (H - pad.t - pad.b - 2 * EDGE) / wh);
  // RIGHT's details (anchored at the right edge) start after the window's bevel: LEFT + window + bevel + kept part
  // <= W (the plain body before the details may slide under the bevel and is clipped). LEFT may slide left by up
  // to SLIDE of the body left of the window (keeping the window clear of a notch) before the scale drops: sA.
  // With the window held at `right` by the controls it holds up to sR.
  const cA = W / ((1 - SLIDE) * wx + ww + bev + kw);
  const sA = cA * (1 - SLIDE) * wx >= minLeft ? cA : (W - minLeft) / (ww + bev + kw);
  const sR = (W - right) / (bev + kw);
  scale = Math.max(Math.min(scale, Math.max(sA, sR)), 0.01);
  const artH = art.h * scale;
  // LEFT: at the screen's edge; pushed right of a notch, or slid left when the window would run under the controls
  // or RIGHT's details would not fit.
  let left = Math.max(0, minLeft - wx * scale);
  const over = left + (wx + ww) * scale - right;
  if (over > 0) left -= over;
  const tight = left + (wx + ww + bev + kw) * scale - W;
  if (tight > 0) left -= tight;
  // Top: centred on the height (0 when it covers), then nudged so the window clears the safe top / bottom.
  let top = (H - artH) / 2;
  const winTop = top + wy * scale;
  if (winTop < pad.t + EDGE) top += pad.t + EDGE - winTop;
  const winBottom = top + (wy + wh) * scale;
  if (winBottom > H - pad.b - EDGE) top -= winBottom - (H - pad.b - EDGE);
  const L = lw * scale;
  // RIGHT ends at the screen's right edge; on a narrow screen its plain start is clipped at the window's bevel.
  const rx = Math.max(W - rw * scale, left + (wx + ww + bev) * scale);
  const midW = rx - (left + L);
  return {
    art: { left, top, width: W - left, height: artH },
    left: { x: left, w: L },
    mid: { x: left + L, w: midW, n: tileCount(midW, sw * scale) },
    right: { x: rx, w: W - rx },
    win: { left: left + wx * scale, top: top + wy * scale, width: ww * scale, height: wh * scale },
    radius: art.win.r * art.w * scale,
    scale,
    ctlTop: Math.max(pad.t, top + art.top * artH),
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
 * The full camera back (decorative: aria-hidden, no pointer events), laid out by `wrapLayout` as three slices of
 * one image (one download): LEFT and RIGHT are the image itself, clipped; the MIDDLE strip is tiled as
 * backgrounds, every other tile mirrored so each joint meets the same column on both sides (seamless), an odd
 * count so the last tile meets RIGHT unmirrored. RIGHT over LEFT (a screen narrower than both) gets a soft edge.
 * Renders nothing without wrap art or before the screen is measured.
 * CONTRACT: Camera.tsx places it inside `.cam-stage` (which then covers the whole camera screen) before the
 * viewfinder: <WrapArt cameraId layout />.
 */
export function WrapArt({ cameraId, layout }: { cameraId: string; layout: WrapLayout | null }) {
  const art = bodyWrapFor(cameraId);
  if (!art || !layout) return null;
  const { art: a, left, mid, right, scale } = layout;
  const artW = art.w * scale;
  const px = (v: number) => `${Math.round(v * 100) / 100}px`;
  const band = { top: px(a.top), height: px(a.height) };
  const img = (dx: number) => ({ left: px(dx), top: '0px', width: px(artW), height: px(a.height) });
  // Neighbouring parts overlap by half a pixel: no hairline of the dark backdrop at a fractional joint.
  const join = mid.w > 0 ? 0.5 : 0;
  const tiles = [];
  if (mid.w > 0 && mid.n > 0) {
    const tw = mid.w / mid.n;
    const k = tw / ((1 - art.slice.l - art.slice.r) * artW); // the strip stretched a little to fit a whole number of tiles
    const bg = { backgroundImage: `url(${art.src})`, backgroundSize: `${px(artW * k)} ${px(a.height)}`, backgroundPosition: `${px(-art.slice.l * artW * k)} 0px` };
    for (let i = 0; i < mid.n; i++) {
      tiles.push(<i key={i} class={i % 2 ? 'wrap-tile flip' : 'wrap-tile'} style={{ ...bg, left: px(i * tw - (i ? 0.5 : 0)), width: px(tw + (i ? 0.5 : 0) + 0.5) }} />);
    }
  }
  return (
    <div key={cameraId} class="wrap-art" aria-hidden="true" data-testid="wrap-art">
      <div class="wrap-part wrap-left" style={{ left: px(left.x), width: px(left.w + join), ...band }}>
        <img class="wrap-art-img" src={art.src} width={art.w} height={art.h} alt="" decoding="async" draggable={false} style={img(0)} />
      </div>
      {tiles.length > 0 && (
        <div class="wrap-part wrap-mid" style={{ left: px(mid.x), width: px(mid.w), ...band }}>
          {tiles}
        </div>
      )}
      <div class={`wrap-part wrap-right${mid.w < 0 ? ' feather' : ''}`} style={{ left: px(right.x - join), width: px(right.w + join), ...band }}>
        <img class="wrap-art-part" src={art.src} alt="" decoding="async" draggable={false} style={img(a.left + a.width - artW - (right.x - join))} />
      </div>
      <BodyGlint />
    </div>
  );
}
