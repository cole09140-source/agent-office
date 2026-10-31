import { lattice, seedHash } from './random';
import { FISHEYE_A, pixelCells } from './shader';
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

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * Lens projection (see shader lensUv): maps an output uv to the source uv.
 * Returns [u, v, inside] where inside is the fisheye circle mask.
 */
export function lensUv(u: number, v: number, ax: number, ay: number, distort: number, fisheye: number): [number, number, number] {
  let px = (u - 0.5) * ax;
  let py = (v - 0.5) * ay;
  let inside = 1;
  if (fisheye > 0.5) {
    const R = 0.5 * Math.min(ax, ay);
    const r = Math.hypot(px, py);
    const rn = r / R;
    inside = 1 - smoothstep(0.985, 1, rn);
    const rs = Math.tan(Math.min(rn, 1) * FISHEYE_A) / Math.tan(FISHEYE_A);
    if (r > 0) {
      px = (px / r) * rs * R;
      py = (py / r) * rs * R;
    }
  } else if (distort !== 0) {
    const r2 = (px * px + py * py) / (0.25 * (ax * ax + ay * ay));
    const k = (1 + distort * r2) / (1 + Math.max(distort, 0));
    px *= k;
    py *= k;
  }
  return [px / ax + 0.5, py / ay + 0.5, inside];
}

/** Ordered-dither palette index (0..3) for a luminance at a pixel-grid cell. */
export function ditherIndex(luma: number, cellX: number, cellY: number): number {
  const t = (BAYER[(cellY & 3) * 4 + (cellX & 3)] + 0.5) / 16 - 0.5;
  return Math.min(3, Math.max(0, Math.floor(luma * 3 + 0.5 + t)));
}

/**
 * Reference implementation of the film pipeline (see shader.ts). Used when
 * WebGL2 is unavailable and by unit tests. `src` must already be cropped to
 * the output size.
 */
export function renderCpu(src: PixelBuffer, look: ResolvedLook): Uint8ClampedArray {
  const { width: W, height: H } = src;
  const out = new Uint8ClampedArray(W * H * 4);
  // Same reach as the shader's mip blur: ~2.5% blocks sampled with a 5-tap cross at ±1.5 blocks.
  const blur = blurField(src, 40);
  const tmpB = [0, 0, 0];
  const blur5 = (u: number, v: number, out: number[]) => {
    const du = 1.5 / blur.width;
    const dv = 1.5 / blur.height;
    sampleBilinear(blur, u, v, out);
    out[0] *= 2;
    out[1] *= 2;
    out[2] *= 2;
    // Unrolled offsets: this runs per pixel, so no arrays allocated here.
    for (let i = 0; i < 4; i++) {
      const a = i === 0 ? du : i === 1 ? -du : 0;
      const b = i === 2 ? dv : i === 3 ? -dv : 0;
      sampleBilinear(blur, u + a, v + b, tmpB);
      out[0] += tmpB[0];
      out[1] += tmpB[1];
      out[2] += tmpB[2];
    }
    out[0] /= 6;
    out[1] /= 6;
    out[2] /= 6;
  };
  const softField = look.soft !== 0 ? blurField(src, 250) : null;
  const cells = pixelCells(W, H);
  const tmpS = [0, 0, 0];
  const tmpK = [0, 0, 0];
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
  const sampleUv = (su: number, sv: number, c: number) => sample(su * W - 0.5, sv * H - 0.5, c);
  const sample = (x: number, y: number, c: number) => {
    const xi = Math.min(W - 1, Math.max(0, Math.round(x)));
    const yi = Math.min(H - 1, Math.max(0, Math.round(y)));
    return src.data[(yi * W + xi) * 4 + c] / 255;
  };
  // Linear interpolation between LUT entries, like the GPU's LINEAR texture filter.
  const lutC = (v: number, ch: number) => {
    const x = clamp01(v) * 255;
    const i0 = Math.floor(x);
    const i1 = Math.min(255, i0 + 1);
    const f = x - i0;
    return (lut[i0 * 4 + ch] * (1 - f) + lut[i1 * 4 + ch] * f) / 255;
  };

  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const u0 = (px + 0.5) / W;
      const v0 = (py + 0.5) / H;
      const cx = (u0 - 0.5) * ax;
      const cy = (v0 - 0.5) * ay;
      const dist = Math.hypot(cx, cy) / cornerLen;
      let qu = u0;
      let qv = v0;
      if (look.pixel) {
        qu = (Math.floor(u0 * cells[0]) + 0.5) / cells[0];
        qv = (Math.floor(v0 * cells[1]) + 0.5) / cells[1];
      }
      const [u, v, inside] = lensUv(qu, qv, ax, ay, look.distort, look.fisheye);

      const caScale = (chromaPx / maxSide) * 2 * dist;
      const cau = (u - 0.5) * caScale;
      const cav = (v - 0.5) * caScale;
      let r = sampleUv(u + cau, v + cav, 0);
      let g = sampleUv(u, v, 1);
      let b = sampleUv(u - cau, v - cav, 2);

      blur5(u, v, tmp);
      const br = tmp[0];
      const bg = tmp[1];
      const bb = tmp[2];

      if (softField) {
        sampleBilinear(softField, u, v, tmpS);
        if (look.soft > 0) {
          const k = look.soft * smoothstep(0.2, 1, dist);
          r += (tmpS[0] - r) * k;
          g += (tmpS[1] - g) * k;
          b += (tmpS[2] - b) * k;
        } else {
          const k = -look.soft * 1.5;
          r = clamp01(r + k * (r - tmpS[0]));
          g = clamp01(g + k * (g - tmpS[1]));
          b = clamp01(b + k * (b - tmpS[2]));
        }
      }

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

      if (look.pixel) {
        const q = ditherIndex(r * LR + g * LG + b * LB, Math.floor(u0 * cells[0]), Math.floor(v0 * cells[1]));
        const o = (py * W + px) * 4;
        out[o] = look.pixel[q][0] * 255; // Uint8ClampedArray rounds on assignment
        out[o + 1] = look.pixel[q][1] * 255;
        out[o + 2] = look.pixel[q][2] * 255;
        out[o + 3] = 255;
        continue;
      }

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

      if (look.streak > 0) {
        let acc = 0;
        for (let i = 1; i <= 6; i++) {
          const off = i * 0.035;
          const w = 1 - i / 7;
          sampleBilinear(blur, u + off, v, tmpK);
          acc += w * smoothstep(0.75, 1, tmpK[0] * LR + tmpK[1] * LG + tmpK[2] * LB);
          sampleBilinear(blur, u - off, v, tmpK);
          acc += w * smoothstep(0.75, 1, tmpK[0] * LR + tmpK[1] * LG + tmpK[2] * LB);
        }
        const k = (look.streak * 1.5 * acc) / 6;
        r = 1 - (1 - clamp01(r)) * (1 - look.streakColor[0] * k);
        g = 1 - (1 - clamp01(g)) * (1 - look.streakColor[1] * k);
        b = 1 - (1 - clamp01(b)) * (1 - look.streakColor[2] * k);
      }

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
        // NB: grain uses the lens-mapped uv, like the shader.
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
      out[o] = clamp01(r) * inside * 255; // Uint8ClampedArray rounds on assignment
      out[o + 1] = clamp01(g) * inside * 255;
      out[o + 2] = clamp01(b) * inside * 255;
      out[o + 3] = 255;
    }
  }
  return out;
}
