/**
 * Reading-direction helpers for right-to-left UIs (Arabic): arrow keys and horizontal strips
 * follow the reading order, not the screen's left/right.
 */
import { isRtl } from '../i18n';

/**
 * +1 for "next", −1 for "previous", 0 for any other key. Down/Up always mean next/previous;
 * Right is "next" in left-to-right UIs and "previous" in right-to-left ones (and Left the opposite).
 */
export function arrowStep(key: string): -1 | 0 | 1 {
  if (key === 'ArrowDown') return 1;
  if (key === 'ArrowUp') return -1;
  if (key === 'ArrowRight') return isRtl() ? -1 : 1;
  if (key === 'ArrowLeft') return isRtl() ? 1 : -1;
  return 0;
}

/**
 * Scrolls a horizontal strip so `el` sits in its middle. Works from the element's on-screen
 * position, so it is right for both scroll origins (LTR starts at the left, RTL at the right,
 * where scrollLeft runs negative).
 */
export function centerInStrip(strip: HTMLElement, el: HTMLElement): void {
  const s = strip.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  strip.scrollLeft += r.left + r.width / 2 - (s.left + s.width / 2);
}

/** Like centerInStrip, but only when `el` is not already fully visible. */
export function revealInStrip(strip: HTMLElement, el: HTMLElement): void {
  const s = strip.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  if (r.left < s.left || r.right > s.right) centerInStrip(strip, el);
}
