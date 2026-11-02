import { canvasToBlob, makeCanvas, MAX_CANVAS_PIXELS } from './develop';

export interface ContactFrame {
  image: CanvasImageSource;
  width: number;
  height: number;
  frame: number;
  /** The picture inside the print, as fractions (no border): film strips show only this part. */
  crop?: { x: number; y: number; w: number; h: number };
}

export interface ContactMeta {
  title: string;
  subtitle: string;
  /** Camera body name, printed at the top right of the sheet. */
  camera?: string;
  /** Instant prints: laid out as loose prints, not on film strips. */
  instant?: boolean;
}

/** How the frames sit on the sheet: frames per strip, cell shape (width / height), film strip or loose prints. */
export interface SheetGrid {
  cols: number;
  cellRatio: number;
  strip: boolean;
}

/** A frame reduced to its picture: width/height become the picture's, sx/sy its offset in the print. */
type SheetFrame = ContactFrame & { sx?: number; sy?: number };
function bare(f: ContactFrame): SheetFrame {
  if (!f.crop) return f;
  const sx = Math.round(f.crop.x * f.width);
  const sy = Math.round(f.crop.y * f.height);
  const w = Math.max(1, Math.min(f.width - sx, Math.round(f.crop.w * f.width)));
  const h = Math.max(1, Math.min(f.height - sy, Math.round(f.crop.h * f.height)));
  return { ...f, sx, sy, width: w, height: h };
}

const median = (xs: number[]) => {
  if (!xs.length) return 1.5;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/**
 * Real contact sheets: a 35mm strip holds six frames, 120 square negatives sit three or four to a
 * strip, wide panoramas three. Instant prints are laid out loose, four across.
 */
export function sheetGrid(frames: { width: number; height: number }[], opts: { instant?: boolean } = {}): SheetGrid {
  const portrait = frames.filter((f) => f.height > f.width).length > frames.length / 2;
  const long = median(frames.map((f) => Math.max(f.width, f.height) / Math.max(1, Math.min(f.width, f.height))));
  if (opts.instant) return { cols: 4, cellRatio: portrait ? 1 / long : long, strip: false };
  if (long < 1.2) return { cols: frames.length <= 12 ? 3 : 4, cellRatio: 1, strip: true }; // square (120, fisheye, pixel)
  const r = Math.min(long, 2.8);
  if (portrait) return { cols: 6, cellRatio: 1 / r, strip: true };
  return { cols: r >= 2 ? 3 : 6, cellRatio: r, strip: true };
}

function legacyGrid(portrait: boolean): SheetGrid {
  return { cols: 6, cellRatio: portrait ? 1 / 1.5 : 1.5, strip: true };
}

interface Layout {
  pad: number;
  gap: number;
  cellW: number;
  cellH: number;
  band: number;
  stripH: number;
  rows: number;
  header: number;
  H: number;
}

function layout(count: number, grid: SheetGrid, sheetW: number): Layout {
  const pad = Math.round(sheetW * 0.035);
  const gap = Math.round(sheetW * (grid.strip ? 0.006 : 0.02));
  const cellW = (sheetW - pad * 2 - gap * (grid.cols - 1)) / grid.cols;
  const cellH = cellW / grid.cellRatio;
  // Film rebate (sprocket band) above and below the frames, never fatter than a 35mm one.
  const band = grid.strip ? Math.round(Math.min(Math.min(cellW, cellH) * 0.16 * (grid.cellRatio < 1 ? 1 : Math.min(1.5, grid.cellRatio)), sheetW * 0.028)) : 0;
  const stripH = cellH + band * 2;
  const rows = Math.max(1, Math.ceil(count / grid.cols));
  const header = Math.round(sheetW * 0.07);
  const H = Math.round(pad * 2 + header + rows * stripH + (rows - 1) * gap * 3);
  return { pad, gap, cellW, cellH, band, stripH, rows, header, H };
}

/** Sheet height for a given width (same maths as the layout below). `portrait` is the old 35mm-only switch. */
export function sheetHeight(count: number, grid: boolean | SheetGrid, sheetW: number): number {
  return layout(count, typeof grid === 'boolean' ? legacyGrid(grid) : grid, sheetW).H;
}

/** Lays the whole roll out as film strips on a light-box sheet — one shareable image per roll. */
export async function contactSheet(input: ContactFrame[], meta: ContactMeta, preferredW = 2400): Promise<Blob> {
  // On film strips the sheet draws its own rebate and perforations: a print's own border
  // (35mm sprockets, a white print margin…) would double them, so only the picture goes on.
  const frames: SheetFrame[] = meta.instant ? input : input.map(bare);
  const grid = sheetGrid(frames, { instant: meta.instant });
  // Long rolls (99-shot card, 72 halves) would exceed iOS's 16.7 MP canvas cap: narrow the sheet.
  const area = preferredW * sheetHeight(frames.length, grid, preferredW);
  const sheetW = area > MAX_CANVAS_PIXELS ? Math.floor(preferredW * Math.sqrt(MAX_CANVAS_PIXELS / area) * 0.98) : preferredW;
  const { pad, gap, cellW, cellH, band, stripH, rows, header, H } = layout(frames.length, grid, sheetW);
  const cols = grid.cols;

  const c = makeCanvas(sheetW, H);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f2efe9';
  ctx.fillRect(0, 0, sheetW, H);

  ctx.fillStyle = '#1a1714';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${Math.round(header * 0.42)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.fillText(meta.title, pad, pad + header * 0.48);
  if (meta.camera) {
    ctx.textAlign = 'right';
    ctx.font = `700 ${Math.round(header * 0.3)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    ctx.fillText(meta.camera.toUpperCase(), sheetW - pad, pad + header * 0.48);
    ctx.textAlign = 'left';
  }
  ctx.fillStyle = '#6b645b';
  ctx.font = `500 ${Math.round(header * 0.24)}px ui-monospace, Menlo, monospace`;
  ctx.fillText(meta.subtitle, pad, pad + header * 0.86);

  for (let r = 0; r < rows; r++) {
    const y = pad + header + r * (stripH + gap * 3);
    if (grid.strip) {
      ctx.fillStyle = '#14110f';
      ctx.fillRect(pad - gap, y, sheetW - pad * 2 + gap * 2, stripH);
      // sprocket holes
      ctx.fillStyle = '#f2efe9';
      const holeW = band * 0.42;
      const holeH = band * 0.46;
      for (let hx = pad; hx < sheetW - pad - holeW; hx += band * 0.85) {
        ctx.fillRect(hx, y + band * 0.18, holeW, holeH);
        ctx.fillRect(hx, y + stripH - band * 0.18 - holeH, holeW, holeH);
      }
    }
    for (let i = 0; i < cols; i++) {
      const f = frames[r * cols + i];
      if (!f) break;
      const x = pad + i * (cellW + gap);
      const iy = y + band;
      if (!grid.strip) {
        // loose instant prints: a soft shadow under each
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x + gap * 0.25, iy + gap * 0.35, cellW, cellH);
      }
      // cover-fit the print (or its picture) into the cell
      const ox = f.sx ?? 0;
      const oy = f.sy ?? 0;
      const k = Math.max(cellW / f.width, cellH / f.height);
      const sw = cellW / k;
      const sh = cellH / k;
      ctx.drawImage(f.image, ox + (f.width - sw) / 2, oy + (f.height - sh) / 2, sw, sh, x, iy, cellW, cellH);
      if (grid.strip) {
        ctx.fillStyle = 'rgba(232,134,42,0.95)';
        ctx.font = `600 ${Math.round(band * 0.27)}px ui-monospace, Menlo, monospace`;
        // Edge numbers sit between the top sprocket row and the frame.
        ctx.fillText(`${f.frame}  ▶ ${f.frame}A`, x + band * 0.1, y + band * 0.94);
      } else {
        ctx.fillStyle = '#6b645b';
        ctx.font = `600 ${Math.round(gap * 0.9)}px ui-monospace, Menlo, monospace`;
        ctx.fillText(String(f.frame), x, iy + cellH + gap * 1.2);
      }
    }
  }
  return canvasToBlob(c, 'image/jpeg', 0.9);
}
