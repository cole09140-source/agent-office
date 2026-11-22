/**
 * Pinch / double-tap / wheel zoom for the viewer's print and the camera's preview.
 * Pure geometry first (unit-tested), then two small hooks on Pointer Events.
 */
import { useEffect, useRef, useState, type MutableRef } from 'preact/hooks';

/** A zoomed view: scale and offset (px, from the centre) of the content inside its box. */
export interface View {
  s: number;
  x: number;
  y: number;
}

export const IDENTITY: View = { s: 1, x: 0, y: 0 };

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Keeps the scale in [1, max] and the content covering its box (no empty edge while zoomed). */
export function clampView(v: View, w: number, h: number, max: number): View {
  const s = clamp(v.s, 1, max);
  if (s <= 1.001) return IDENTITY;
  const mx = (w * (s - 1)) / 2;
  const my = (h * (s - 1)) / 2;
  return { s, x: clamp(v.x, -mx, mx), y: clamp(v.y, -my, my) };
}

/** Zooms by `factor` keeping the point (px, py) — relative to the box centre — under the finger. */
export function zoomAt(v: View, factor: number, px: number, py: number, w: number, h: number, max: number): View {
  const s = clamp(v.s * factor, 1, max);
  const k = s / v.s;
  return clampView({ s, x: px - (px - v.x) * k, y: py - (py - v.y) * k }, w, h, max);
}

/** Camera zoom from a pinch: the starting zoom times the finger spread, rounded to 0.1×. */
export function pinchZoom(start: number, d0: number, d: number, min: number, max: number): number {
  if (d0 <= 0) return start;
  return Math.round(clamp(start * (d / d0), min, max) * 10) / 10;
}

/** "2×", "1.5×": what the camera shows for a zoom. */
export const zoomLabel = (z: number) => `${Number(z.toFixed(1))}×`;

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Pinch, drag (while zoomed), double-tap / double-click and ctrl+wheel (trackpad pinch) zoom of
 * `ref`'s content. Returns the view (apply as `translate(x, y) scale(s)`), a reset, and a ref that is
 * true while a gesture is going on or the content is zoomed — swipe-to-next must not fire then.
 */
export function usePinchView(ref: MutableRef<HTMLElement | null>, max = 4, resetKey?: unknown): { view: View; reset: () => void; busy: MutableRef<boolean> } {
  const [view, setView] = useState<View>(IDENTITY);
  const viewRef = useRef(view);
  viewRef.current = view;
  const busy = useRef(false);
  const reset = () => setView(IDENTITY);
  useEffect(() => setView(IDENTITY), [resetKey]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pts = new Map<number, { x: number; y: number }>();
    let pinch: { d: number; mx: number; my: number } | null = null;
    let drag: { x: number; y: number } | null = null;
    let lastTap = 0;
    const box = () => el.getBoundingClientRect();
    const rel = (x: number, y: number) => {
      const r = box();
      return { px: x - (r.left + r.width / 2), py: y - (r.top + r.height / 2), w: r.width, h: r.height };
    };
    const apply = (v: View) => {
      viewRef.current = v;
      setView(v);
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinch = { d: dist(a, b), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        drag = null;
        busy.current = true;
      } else if (pts.size === 1 && viewRef.current.s > 1) {
        drag = { x: e.clientX, y: e.clientY };
        busy.current = true;
      }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const d = dist(a, b);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const { px, py, w, h } = rel(mx, my);
        const v = zoomAt(viewRef.current, d / pinch.d, px, py, w, h, max);
        // the two fingers moving together also pan
        const r = box();
        apply(clampView({ ...v, x: v.x + (mx - pinch.mx), y: v.y + (my - pinch.my) }, r.width, r.height, max));
        pinch = { d, mx, my };
        e.preventDefault();
      } else if (drag) {
        const r = box();
        apply(clampView({ ...viewRef.current, x: viewRef.current.x + e.clientX - drag.x, y: viewRef.current.y + e.clientY - drag.y }, r.width, r.height, max));
        drag = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      }
    };
    const up = (e: PointerEvent) => {
      const had = pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 0) {
        drag = null;
        // still "busy" while zoomed, so a one-finger drag pans instead of turning the page
        setTimeout(() => (busy.current = viewRef.current.s > 1), 0);
        // double tap (touch / pen): zoom to 2.5× at the finger, or back to fit
        if (had && e.type === 'pointerup' && e.pointerType !== 'mouse') {
          const now = e.timeStamp;
          if (now - lastTap < 300) {
            toggleAt(e.clientX, e.clientY);
            lastTap = 0;
          } else lastTap = now;
        }
      }
    };
    const toggleAt = (x: number, y: number) => {
      const { px, py, w, h } = rel(x, y);
      apply(viewRef.current.s > 1 ? IDENTITY : zoomAt(IDENTITY, 2.5, px, py, w, h, max));
      busy.current = viewRef.current.s > 1;
    };
    const dbl = (e: MouseEvent) => toggleAt(e.clientX, e.clientY);
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey && viewRef.current.s <= 1) return; // a plain wheel only zooms out once zoomed
      e.preventDefault();
      const { px, py, w, h } = rel(e.clientX, e.clientY);
      apply(zoomAt(viewRef.current, Math.exp(-e.deltaY * 0.01), px, py, w, h, max));
      busy.current = viewRef.current.s > 1;
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move, { passive: false });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('dblclick', dbl);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('dblclick', dbl);
      el.removeEventListener('wheel', wheel);
    };
  }, [ref.current, max, resetKey]);
  return { view, reset, busy };
}

/**
 * Two-finger pinch (and ctrl+wheel) on `ref` sets a zoom in [min, max] — the camera preview.
 * `onPinch(true)` while fingers are down so the UI can show the zoom readout.
 */
export function usePinchZoom(ref: MutableRef<HTMLElement | null>, zoom: number, setZoom: (z: number) => void, min: number, max: number, enabled = true): boolean {
  const [active, setActive] = useState(false);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const pts = new Map<number, { x: number; y: number }>();
    let start: { d: number; z: number } | null = null;
    let hide: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      clearTimeout(hide);
      setActive(true);
    };
    const later = () => {
      clearTimeout(hide);
      hide = setTimeout(() => setActive(false), 900);
    };
    const down = (e: PointerEvent) => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        start = { d: dist(a, b), z: zoomRef.current };
        show();
      }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (start && pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const z = pinchZoom(start.z, start.d, dist(a, b), min, max);
        if (z !== zoomRef.current) setZoom(z);
        e.preventDefault();
      }
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size < 2 && start) {
        start = null;
        later();
      }
    };
    const wheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom(Math.round(clamp(zoomRef.current * Math.exp(-e.deltaY * 0.01), min, max) * 10) / 10);
      show();
      later();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move, { passive: false });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      clearTimeout(hide);
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [ref.current, min, max, enabled]);
  return active;
}
