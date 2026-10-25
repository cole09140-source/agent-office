import { mulberry32 } from './random';
import type { BorderStyle, FilmKind } from './types';

export type DateFormat = 'YMD' | 'MDY' | 'DMY';

type Ctx = CanvasRenderingContext2D;

const pad = (n: number) => String(n).padStart(2, '0');

/** Early digicam imprint, e.g. "2026.10.24 21:07". */
export function formatDigitalStamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Classic camera-back date imprint, e.g. "'26 10 24". */
export function formatStamp(ts: number, fmt: DateFormat): string {
  const d = new Date(ts);
  const y = `'${pad(d.getFullYear() % 100)}`;
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  if (fmt === 'MDY') return `${m} ${day} ${y}`;
  if (fmt === 'DMY') return `${day} ${m} ${y}`;
  return `${y} ${m} ${day}`;
}

// Seven-segment map: a b c d e f g
const SEGMENTS: Record<string, string> = {
  '0': 'abcdef',
  '1': 'bc',
  '2': 'abdeg',
  '3': 'abcdg',
  '4': 'bcfg',
  '5': 'acdfg',
  '6': 'acdefg',
  '7': 'abc',
  '8': 'abcdefg',
  '9': 'abcdfg',
};

/** Advance width of one imprint character (keep in sync with drawDigit). */
export function digitAdvance(ch: string, h: number): number {
  const w = h * 0.52;
  const t = h * 0.12;
  if (ch === ' ') return w * 0.55;
  if (ch === "'" || ch === '.' || ch === ':') return t * 2;
  return w + t * 1.2;
}

function drawDigit(ctx: Ctx, ch: string, x: number, y: number, h: number): number {
  const w = h * 0.52;
  const t = h * 0.12;
  if (ch === ' ') return digitAdvance(ch, h);
  if (ch === "'") {
    ctx.fillRect(x + t * 0.2, y, t * 0.8, h * 0.3);
    return digitAdvance(ch, h);
  }
  if (ch === '.') {
    ctx.fillRect(x + t * 0.4, y + h - t, t, t);
    return digitAdvance(ch, h);
  }
  if (ch === ':') {
    ctx.fillRect(x + t * 0.4, y + h * 0.25, t, t);
    ctx.fillRect(x + t * 0.4, y + h * 0.65, t, t);
    return digitAdvance(ch, h);
  }
  const segs = SEGMENTS[ch];
  if (!segs) return digitAdvance(ch, h);
  const half = h / 2;
  const skew = h * 0.08; // slight italic like real camera LCDs
  const seg = (sx: number, sy: number, sw: number, sh: number, yMid: number) => {
    const k = (yMid / h) * skew;
    ctx.fillRect(x + sx + skew - k, y + sy, sw, sh);
  };
  for (const s of segs) {
    switch (s) {
      case 'a': seg(t, 0, w - 2 * t, t, 0); break;
      case 'b': seg(w - t, t * 0.6, t, half - t, half * 0.5); break;
      case 'c': seg(w - t, half + t * 0.4, t, half - t, half * 1.5); break;
      case 'd': seg(t, h - t, w - 2 * t, t, h); break;
      case 'e': seg(0, half + t * 0.4, t, half - t, half * 1.5); break;
      case 'f': seg(0, t * 0.6, t, half - t, half * 0.5); break;
      case 'g': seg(t, half - t / 2, w - 2 * t, t, half); break;
    }
  }
  return digitAdvance(ch, h);
}

/** Orange LED date imprint, bottom-right of the image area. */
export function drawDateStamp(ctx: Ctx, text: string, imgX: number, imgY: number, imgW: number, imgH: number): void {
  const short = Math.min(imgW, imgH);
  const h = Math.max(8, short * 0.034);
  const margin = short * 0.045;
  let width = 0;
  for (const ch of text) width += digitAdvance(ch, h);
  let x = imgX + imgW - margin - width;
  const y = imgY + imgH - margin - h;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.shadowColor = 'rgba(255, 110, 20, 0.9)';
  ctx.shadowBlur = h * 0.45;
  ctx.fillStyle = 'rgba(255, 150, 50, 0.92)';
  for (const ch of text) x += drawDigit(ctx, ch, x, y, h);
  ctx.restore();
}

/** Seeded dust specks and the odd hair. White on negatives, dark on slides/instant. */
export function drawDust(ctx: Ctx, amount: number, seed: number, kind: FilmKind, x0: number, y0: number, w: number, h: number): void {
  if (amount <= 0) return;
  const rnd = mulberry32(seed ^ 0x51ed);
  const scale = Math.min(w, h) / 1200;
  const light = kind !== 'slide' && kind !== 'instant';
  ctx.save();
  ctx.fillStyle = light ? 'rgba(255,255,255,0.75)' : 'rgba(20,16,12,0.6)';
  ctx.strokeStyle = ctx.fillStyle;
  const specks = Math.round(amount * 45);
  for (let i = 0; i < specks; i++) {
    const r = (0.4 + rnd() * rnd() * 2.6) * scale * 1.6;
    ctx.globalAlpha = 0.25 + rnd() * 0.6;
    ctx.beginPath();
    ctx.ellipse(x0 + rnd() * w, y0 + rnd() * h, r, r * (0.5 + rnd() * 0.5), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  const hairs = amount > 0.3 ? Math.floor(rnd() * 3 * amount) + 1 : 0;
  ctx.lineWidth = Math.max(0.6, 1.1 * scale);
  for (let i = 0; i < hairs; i++) {
    ctx.globalAlpha = 0.35 + rnd() * 0.3;
    let px = x0 + rnd() * w;
    let py = y0 + rnd() * h;
    let ang = rnd() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    const len = (40 + rnd() * 120) * scale;
    for (let s = 0; s < 12; s++) {
      ang += (rnd() - 0.5) * 0.7;
      px += Math.cos(ang) * (len / 12);
      py += Math.sin(ang) * (len / 12);
      ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export interface BorderLayout {
  width: number;
  height: number;
  /** Where the image goes inside the bordered canvas. */
  img: { x: number; y: number; w: number; h: number };
}

export function borderLayout(style: BorderStyle, w: number, h: number): BorderLayout {
  const s = Math.min(w, h);
  if (style === 'instant') {
    const side = Math.round(s * 0.065);
    const bottom = Math.round(s * 0.26);
    return { width: w + side * 2, height: h + side + bottom, img: { x: side, y: side, w, h } };
  }
  if (style === 'print') {
    const m = Math.round(s * 0.04);
    return { width: w + m * 2, height: h + m * 2, img: { x: m, y: m, w, h } };
  }
  if (style === 'film35') {
    const landscape = w >= h;
    const band = Math.round(s * 0.16);
    const edge = Math.round(s * 0.025);
    return landscape
      ? { width: w + edge * 2, height: h + band * 2, img: { x: edge, y: band, w, h } }
      : { width: w + band * 2, height: h + edge * 2, img: { x: band, y: edge, w, h } };
  }
  return { width: w, height: h, img: { x: 0, y: 0, w, h } };
}

function roundRect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws a horizontal 35mm strip band (sprockets + edge print) in landscape coordinates. */
function drawFilmBand(ctx: Ctx, x: number, y: number, len: number, band: number, top: boolean, label: string, frame: number) {
  const holeW = band * 0.36;
  const holeH = band * 0.42;
  const pitch = band * 0.78;
  const holeY = top ? y + band * 0.12 : y + band - band * 0.12 - holeH;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  for (let hx = x + pitch * 0.3; hx < x + len - holeW; hx += pitch) {
    roundRect(ctx, hx, holeY, holeW, holeH, holeW * 0.18);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(232, 134, 42, 0.85)';
  const fs = band * 0.2;
  ctx.font = `600 ${fs}px ui-monospace, "SF Mono", Menlo, monospace`;
  ctx.textBaseline = 'middle';
  const ty = top ? y + band * 0.8 : y + band * 0.2;
  if (top) {
    ctx.fillText(label, x + len * 0.08, ty);
    ctx.fillText(label, x + len * 0.58, ty);
  } else {
    ctx.fillText(`${frame}`, x + len * 0.12, ty);
    ctx.fillText(`▶ ${frame}A`, x + len * 0.45, ty);
    ctx.fillText(`${frame + 1}`, x + len * 0.85, ty);
  }
}

export interface BorderMeta {
  label: string;
  frame: number;
}

/**
 * Composes the developed image into its border. `image` is drawn at layout.img.
 */
export function drawWithBorder(ctx: Ctx, image: CanvasImageSource, style: BorderStyle, layout: BorderLayout, meta: BorderMeta): void {
  const { width, height, img } = layout;
  if (style === 'instant') {
    ctx.fillStyle = '#f3f0e8';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, img.x, img.y, img.w, img.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = Math.max(1, img.w * 0.002);
    ctx.strokeRect(img.x, img.y, img.w, img.h);
    return;
  }
  if (style === 'print') {
    ctx.fillStyle = '#fbfaf7';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, img.x, img.y, img.w, img.h);
    return;
  }
  if (style === 'film35') {
    ctx.fillStyle = '#0d0b0a';
    ctx.fillRect(0, 0, width, height);
    const landscape = img.w >= img.h;
    if (landscape) {
      ctx.drawImage(image, img.x, img.y, img.w, img.h);
      drawFilmBand(ctx, 0, 0, width, img.y, true, meta.label, meta.frame);
      drawFilmBand(ctx, 0, img.y + img.h, width, img.y, false, meta.label, meta.frame);
    } else {
      // Work in landscape coordinates rotated onto the portrait canvas.
      ctx.save();
      ctx.translate(width, 0);
      ctx.rotate(Math.PI / 2);
      const L = height; // landscape width
      const band = img.x;
      ctx.save();
      ctx.translate(img.y, band + img.w);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(image, 0, 0, img.w, img.h);
      ctx.restore();
      drawFilmBand(ctx, 0, 0, L, band, true, meta.label, meta.frame);
      drawFilmBand(ctx, 0, band + img.w, L, band, false, meta.label, meta.frame);
      ctx.restore();
    }
    return;
  }
  ctx.drawImage(image, 0, 0, width, height);
}
