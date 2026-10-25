import { canvasToBlob, makeCanvas } from './develop';

export interface ContactFrame {
  image: CanvasImageSource;
  width: number;
  height: number;
  frame: number;
}

export interface ContactMeta {
  title: string;
  subtitle: string;
}

/** Lays the whole roll out as 35mm strips on a light-box sheet — one shareable image per roll. */
export async function contactSheet(frames: ContactFrame[], meta: ContactMeta, sheetW = 2400): Promise<Blob> {
  const portraitCount = frames.filter((f) => f.height > f.width).length;
  const portrait = portraitCount > frames.length / 2;
  const cols = portrait ? 6 : 4;
  const pad = Math.round(sheetW * 0.035);
  const gap = Math.round(sheetW * 0.006);
  const cellW = (sheetW - pad * 2 - gap * (cols - 1)) / cols;
  const cellH = portrait ? cellW * 1.5 : cellW / 1.5;
  const band = Math.round(cellH * 0.16);
  const stripH = cellH + band * 2;
  const rows = Math.max(1, Math.ceil(frames.length / cols));
  const header = Math.round(sheetW * 0.07);
  const H = Math.round(pad * 2 + header + rows * stripH + (rows - 1) * gap * 3);

  const c = makeCanvas(sheetW, H);
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f2efe9';
  ctx.fillRect(0, 0, sheetW, H);

  ctx.fillStyle = '#1a1714';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 ${Math.round(header * 0.42)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.fillText(meta.title, pad, pad + header * 0.48);
  ctx.fillStyle = '#6b645b';
  ctx.font = `500 ${Math.round(header * 0.24)}px ui-monospace, Menlo, monospace`;
  ctx.fillText(meta.subtitle, pad, pad + header * 0.86);

  for (let r = 0; r < rows; r++) {
    const y = pad + header + r * (stripH + gap * 3);
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
    for (let i = 0; i < cols; i++) {
      const f = frames[r * cols + i];
      if (!f) break;
      const x = pad + i * (cellW + gap);
      const iy = y + band;
      // cover-fit the print into the cell
      const k = Math.max(cellW / f.width, cellH / f.height);
      const sw = cellW / k;
      const sh = cellH / k;
      ctx.drawImage(f.image, (f.width - sw) / 2, (f.height - sh) / 2, sw, sh, x, iy, cellW, cellH);
      ctx.fillStyle = 'rgba(232,134,42,0.95)';
      ctx.font = `600 ${Math.round(band * 0.27)}px ui-monospace, Menlo, monospace`;
      // Edge numbers sit between the top sprocket row and the frame.
      ctx.fillText(`${f.frame}  ▶ ${f.frame}A`, x + band * 0.1, y + band * 0.94);
    }
  }
  return canvasToBlob(c, 'image/jpeg', 0.9);
}
