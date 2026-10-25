import { lattice, seedHash } from './random';
import type { ResolvedLook } from './types';

export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

const LR = 0.2126;
const LG = 0.7152;
const LB = 0.0722;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 4-channel value noise (see shader `vnoise4`); writes [lum, r, g, b] into `out`. */
function vnoise4(x: number, y: number, hs: number, out: number[]): void {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  let fx = x - ix;
  let fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  const a = lattice(ix, iy, hs);
  const b = lattice(ix + 1, iy, hs);
  const c = lattice(ix, iy + 1, hs);
  const d = lattice(ix + 1, iy + 1, hs);
  for (let k = 0; k < 4; k++) {
    const sh = k * 8;
    const va = ((a >>> sh) & 255) / 255;
    const vb = ((b >>> sh) & 255) / 255;
    const vc = ((c >>> sh) & 255) / 255;
    const vd = ((d >>> sh) & 255) / 255;
    out[k] = va + (vb - va) * fx + (vc - va) * fy + (va - vb - vc + vd) * fx * fy - 0.5;
  }
}

/** Area-averaged downsample used as the halation/bloom source. */
export function blurField(src: PixelBuffer, targetShort = 48): PixelBuffer {
  const f = Math.max(1, Math.floor(Math.min(src.width, src.height) / targetShort));
  const w = Math.max(1, Math.floor(src.width / f));
  const h = Math.max(1, Math.floor(src.height / f));
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let yy = 0; yy < f; yy++) {
        const row = (y * f + yy) * src.width;
        for (let xx = 0; xx < f; xx++) {
          const i = (row + x * f + xx) * 4;
          r += src.data[i];
          g += src.data[i + 1];
          b += src.data[i + 2];
        }
      }
      const n = f * f;
      const o = (y * w + x) * 4;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = b / n;
      out[o + 3] = 255;
    }
  }
  return { data: out, width: w, height: h };
}

function sampleBilinear(buf: PixelBuffer, u: number, v: number, out: number[]): void {
  const x = Math.min(buf.width - 1, Math.max(0, u * buf.width - 0.5));
  const y = Math.min(buf.height - 1, Math.max(0, v * buf.height - 0.5));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(buf.width - 1, x0 + 1);
  const y1 = Math.min(buf.height - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;
  for (let c = 0; c < 3; c++) {
    const a = buf.data[(y0 * buf.width + x0) * 4 + c];
    const b = buf.data[(y0 * buf.width + x1) * 4 + c];
    const d = buf.data[(y1 * buf.width + x0) * 4 + c];
    const e = buf.data[(y1 * buf.width + x1) * 4 + c];
    out[c] = (a + (b - a) * fx + (d - a) * fy + (a - b - d + e) * fx * fy) / 255;
  }
}

/**
 * Reference implementation of the film pipeline (see shader.ts). Used when
 * WebGL2 is unavailable and by unit tests. `src` must already be cropped to
 * the output size.
 */
export function renderCpu(src: PixelBuffer, look: ResolvedLook): Uint8ClampedArray {
  const { width: W, height: H } = src;
  const out = new Uint8ClampedArray(W * H * 4);
  const blur = blurField(src);
  const lut = look.lut;
  const m = look.matrix;
  const maxSide = Math.max(W, H);
  const ax = W / maxSide;
  const ay = H / maxSide;
  const cornerLen = Math.hypot(0.5 * ax, 0.5 * ay);
  const grainPx = Math.max(0.5, look.grainSize * (Math.min(W, H) / 1200));
  const chromaPx = look.chroma * (Math.min(W, H) / 1200);
  const tmp = [0, 0, 0];
  const nz = [0, 0, 0, 0];
  const hs = seedHash(look.seed);
  const sample = (x: number, y: number, c: number) => {
    const xi = Math.min(W - 1, Math.max(0, Math.round(x)));
    const yi = Math.min(H - 1, Math.max(0, Math.round(y)));
    return src.data[(yi * W + xi) * 4 + c] / 255;
  };
  const lutC = (v: number, ch: number) => lut[Math.round(clamp01(v) * 255) * 4 + ch] / 255;

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const u = (px + 0.5) / W;
      const v = (py + 0.5) / H;
      const cx = (u - 0.5) * ax;
      const cy = (v - 0.5) * ay;
      const dist = Math.hypot(cx, cy) / cornerLen;

      const caScale = (chromaPx / maxSide) * 2 * dist;
      const cax = (u - 0.5) * caScale * W;
      const cay = (v - 0.5) * caScale * H;
      let r = sample(px + cax, py + cay, 0);
      let g = sample(px, py, 1);
      let b = sample(px - cax, py - cay, 2);

      sampleBilinear(blur, u, v, tmp);
      const br = tmp[0];
      const bg = tmp[1];
      const bb = tmp[2];

      const r1 = clamp01(m[0] * r + m[1] * g + m[2] * b);
      const g1 = clamp01(m[3] * r + m[4] * g + m[5] * b);
      const b1 = clamp01(m[6] * r + m[7] * g + m[8] * b);
      if (look.mono) {
        const y = r1 * look.mono[0] + g1 * look.mono[1] + b1 * look.mono[2];
        r = g = b = y;
      } else {
        const y = r1 * LR + g1 * LG + b1 * LB;
        r = clamp01(y + (r1 - y) * look.saturation);
        g = clamp01(y + (g1 - y) * look.saturation);
        b = clamp01(y + (b1 - y) * look.saturation);
      }
      r = lutC(r, 0);
      g = lutC(g, 1);
      b = lutC(b, 2);

      const y2 = r * LR + g * LG + b * LB;
      const sh = 1 - smoothstep(0, 0.5, y2);
      const hi = smoothstep(0.5, 1, y2);
      r = clamp01(r + look.shadowTint[0] * sh + look.highlightTint[0] * hi);
      g = clamp01(g + look.shadowTint[1] * sh + look.highlightTint[1] * hi);
      b = clamp01(b + look.shadowTint[2] * sh + look.highlightTint[2] * hi);

      const hm = smoothstep(0.55, 1, br * LR + bg * LG + bb * LB) * look.halation;
      r = 1 - (1 - r) * (1 - look.halationColor[0] * hm);
      g = 1 - (1 - g) * (1 - look.halationColor[1] * hm);
      b = 1 - (1 - b) * (1 - look.halationColor[2] * hm);

      let blr = br;
      let blg = bg;
      let blb = bb;
      if (look.mono) blr = blg = blb = br * look.mono[0] + bg * look.mono[1] + bb * look.mono[2];
      const bk = look.bloom * 0.35;
      r += bk * Math.max(blr - r, 0);
      g += bk * Math.max(blg - g, 0);
      b += bk * Math.max(blb - b, 0);

      const fl = 1 + look.flash * 0.3 * (1 - smoothstep(0, 0.7, dist));
      const vg = 1 - look.vignette * smoothstep(0.3, 1, dist);
      r *= fl * vg;
      g *= fl * vg;
      b *= fl * vg;

      for (const L of look.leaks) {
        const d = Math.hypot((u - L.x) * ax, (v - L.y) * ay) / L.radius;
        const a = 1 - smoothstep(0, 1, d);
        const k = a * a * L.intensity;
        r = 1 - (1 - clamp01(r)) * (1 - L.color[0] * k);
        g = 1 - (1 - clamp01(g)) * (1 - L.color[1] * k);
        b = 1 - (1 - clamp01(b)) * (1 - L.color[2] * k);
      }

      if (look.grain > 0) {
        const gx = (u * W) / grainPx;
        const gy = (v * H) / grainPx;
        const yg = clamp01(r * LR + g * LG + b * LB);
        const t = 2 * yg - 1;
        const amp = look.grain * (0.35 + 0.65 * (1 - t * t)) * 1.8;
        vnoise4(gx, gy, hs, nz);
        const gc = look.grainChroma;
        const n0 = nz[0] * (1 - gc);
        r += amp * (n0 + gc * nz[1]);
        g += amp * (n0 + gc * nz[2]);
        b += amp * (n0 + gc * nz[3]);
      }

      const o = (py * W + px) * 4;
      out[o] = clamp01(r) * 255 + 0.5;
      out[o + 1] = clamp01(g) * 255 + 0.5;
      out[o + 2] = clamp01(b) * 255 + 0.5;
      out[o + 3] = 255;
    }
  }
  return out;
}
