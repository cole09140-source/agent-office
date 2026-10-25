// Generates a synthetic outdoor scene as a Y4M clip for Chrome's fake camera.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

export function makeScene(path, W = 1280, H = 720, frames = 4) {
  if (existsSync(path)) return path;
  mkdirSync(path.replace(/\/[^/]+$/, ''), { recursive: true });
  const header = Buffer.from(`YUV4MPEG2 W${W} H${H} F30:1 Ip A1:1 C420jpeg\n`);
  const chunks = [header];
  const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
  for (let f = 0; f < frames; f++) {
    const Y = Buffer.alloc(W * H);
    const U = Buffer.alloc((W / 2) * (H / 2));
    const V = Buffer.alloc((W / 2) * (H / 2));
    const rgb = (x, y) => {
      const u = x / W;
      const v = y / H;
      // sky
      let r = 90 + 120 * v, g = 150 + 70 * v, b = 235 - 40 * v;
      // sun
      const ds = Math.hypot(u - 0.72 - f * 0.002, v - 0.28) * 6;
      if (ds < 1) { r = 255; g = 245; b = 210; } else { const k = Math.exp(-(ds - 1) * 1.5) * 0.6; r += (255 - r) * k; g += (230 - g) * k; b += (180 - b) * k; }
      // hills
      const hill = 0.62 + 0.06 * Math.sin(u * 7 + 1) + 0.03 * Math.sin(u * 23);
      if (v > hill) { const d = (v - hill) * 3; r = 60 + 40 * d; g = 120 - 30 * d + 30 * Math.sin(u * 40) ; b = 50; }
      // red house
      if (u > 0.2 && u < 0.34 && v > 0.55 && v < 0.75) { r = 200; g = 60; b = 50; if (u > 0.25 && u < 0.29 && v > 0.64) { r = 40; g = 30; b = 25; } }
      // person-ish skin tone disc
      if (Math.hypot(u - 0.5, v - 0.6) < 0.06) { r = 225; g = 175; b = 140; }
      return [clamp(r), clamp(g), clamp(b)];
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const [r, g, b] = rgb(x, y);
      Y[y * W + x] = clamp(0.299 * r + 0.587 * g + 0.114 * b);
      if (x % 2 === 0 && y % 2 === 0) {
        const i = (y / 2) * (W / 2) + x / 2;
        U[i] = clamp(-0.1687 * r - 0.3313 * g + 0.5 * b + 128);
        V[i] = clamp(0.5 * r - 0.4187 * g - 0.0813 * b + 128);
      }
    }
    chunks.push(Buffer.from('FRAME\n'), Y, U, V);
  }
  writeFileSync(path, Buffer.concat(chunks));
  return path;
}
