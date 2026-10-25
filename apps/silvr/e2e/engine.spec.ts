/**
 * QA block C (rounds 21-30): engine tests against the real modules in a
 * browser (WebGL2 via SwiftShader) — GPU vs CPU parity, determinism, golden
 * statistics, extremes, size limits, performance and memory.
 */
import { expect, test, type Page } from '@playwright/test';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

test.describe.configure({ mode: 'serial' });

async function harness(page: Page) {
  await page.goto('./e2e/harness.html');
  await page.evaluate(async () => {
    const w = window as unknown as Record<string, unknown>;
    w.dev = await import('/src/film/develop.ts');
    w.resolve = await import('/src/film/resolve.ts');
    w.stocks = await import('/src/film/stocks.ts');
    w.cams = await import('/src/cameras/models.ts');
    // A deterministic test scene: gradient sky, bright sun, saturated blocks, dark ground.
    w.scene = (W: number, H: number) => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d')!;
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#4a90d9');
      sky.addColorStop(1, '#e8d8b0');
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#fffbe8';
      g.beginPath();
      g.arc(W * 0.72, H * 0.25, Math.min(W, H) * 0.09, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#c62828';
      g.fillRect(W * 0.15, H * 0.5, W * 0.15, H * 0.2);
      g.fillStyle = '#2e7d32';
      g.fillRect(0, H * 0.7, W, H * 0.3);
      g.fillStyle = '#ffd54f';
      g.fillRect(W * 0.5, H * 0.55, W * 0.08, H * 0.08);
      return c;
    };
  });
}

test('R21 GPU and CPU paths agree for every camera body', async ({ page }) => {
  await harness(page);
  const res = await page.evaluate(() => {
    const w = window as any;
    const out: Record<string, number> = {};
    for (const c of w.cams.CAMERAS) {
      const st = w.stocks.getStock(c.defaultStock);
      const d = w.resolve.defaultDevelop(st, 77, { cameraId: c.id, leak: 5 });
      const src = w.scene(240, 160);
      const gpu = w.dev.renderFilm(src, 240, 160, d, true).getContext('2d').getImageData(0, 0, 240, 160).data;
      const cpu = w.dev.renderFilm(src, 240, 160, d, false).getContext('2d').getImageData(0, 0, 240, 160).data;
      let diff = 0;
      for (let i = 0; i < gpu.length; i += 4) diff += Math.abs(gpu[i] - cpu[i]) + Math.abs(gpu[i + 1] - cpu[i + 1]) + Math.abs(gpu[i + 2] - cpu[i + 2]);
      out[c.id] = diff / (gpu.length / 4) / 3;
    }
    return out;
  });
  console.log('mean |GPU−CPU| per channel:', JSON.stringify(res));
  for (const [id, v] of Object.entries(res)) expect(v, id).toBeLessThan(12);
});

test('R22 GPU develop is deterministic for a given seed', async ({ page }) => {
  await harness(page);
  const same = await page.evaluate(() => {
    const w = window as any;
    const d = w.resolve.defaultDevelop(w.stocks.getStock('neon800t'), 4242, { cameraId: 'cine', leak: 9 });
    const a = w.dev.renderFilm(w.scene(300, 200), 300, 200, d, true).toDataURL();
    const b = w.dev.renderFilm(w.scene(300, 200), 300, 200, d, true).toDataURL();
    return a === b;
  });
  expect(same).toBe(true);
});

test('R23 golden statistics per film stock stay put', async ({ page }) => {
  await harness(page);
  const stats = await page.evaluate(() => {
    const w = window as any;
    const out: Record<string, number[]> = {};
    for (const st of w.stocks.STOCKS) {
      const d = w.resolve.defaultDevelop(st, 1, { grain: 0 });
      const px = w.dev.renderFilm(w.scene(200, 150), 200, 150, d, false).getContext('2d').getImageData(0, 0, 200, 150).data;
      const m = [0, 0, 0];
      for (let i = 0; i < px.length; i += 4) for (let k = 0; k < 3; k++) m[k] += px[i + k];
      out[st.id] = m.map((v) => Math.round(v / (px.length / 4)));
    }
    return out;
  });
  const file = 'e2e/golden/stock-stats.json';
  if (!existsSync(file) || process.env.UPDATE_GOLDEN) writeFileSync(file, JSON.stringify(stats, null, 2) + '\n');
  const golden = JSON.parse(readFileSync(file, 'utf8')) as Record<string, number[]>;
  for (const [id, m] of Object.entries(stats)) {
    expect(golden[id], `${id} missing from golden (run with UPDATE_GOLDEN=1)`).toBeDefined();
    golden[id].forEach((g, k) => expect(Math.abs(g - m[k]), `${id}[${k}]`).toBeLessThanOrEqual(2));
  }
});

test('R24/R25 fisheye mask and pixel palette are exact on the GPU at awkward sizes', async ({ page }) => {
  await harness(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const fish = w.dev.renderFilm(w.scene(301, 301), 301, 301, w.resolve.defaultDevelop(w.stocks.getStock('mint400'), 3, { cameraId: 'fish180' }), true);
    const f = fish.getContext('2d').getImageData(0, 0, 301, 301).data;
    const corner = f[0] + f[1] + f[2];
    const centre = f[(150 * 301 + 150) * 4] + f[(150 * 301 + 150) * 4 + 1];
    const pal = w.cams.PIXEL_PALETTES.berry.map((c: number[]) => c.map((v) => Math.round(v * 255)));
    const px = w.dev.renderFilm(w.scene(1000, 875), 1000, 875, w.resolve.defaultDevelop(w.stocks.getStock('pixel'), 3, { cameraId: 'pixel', palette: 'berry' }), true);
    const p = px.getContext('2d').getImageData(0, 0, 1000, 875).data;
    let off = 0;
    for (let i = 0; i < p.length; i += 4) {
      const ok = pal.some((c: number[]) => Math.abs(c[0] - p[i]) + Math.abs(c[1] - p[i + 1]) + Math.abs(c[2] - p[i + 2]) <= 3);
      if (!ok) off++;
    }
    return { corner, centre, off };
  });
  expect(r.corner).toBe(0);
  expect(r.centre).toBeGreaterThan(100);
  expect(r.off).toBe(0);
});

test('R26 extreme develop settings never produce black, white or NaN frames', async ({ page }) => {
  await harness(page);
  const bad = await page.evaluate(() => {
    const w = window as any;
    const out: string[] = [];
    for (const st of w.stocks.STOCKS)
      for (const opts of [
        { push: 2, expired: 1, grain: 2, halation: 2, ev: 2 },
        { push: -2, expired: 1, grain: 0, halation: 0, ev: -2 },
        { push: 2, expired: 0, grain: 2, halation: 2, ev: -2, flash: true },
      ]) {
        const d = w.resolve.defaultDevelop(st, 9, { ...opts, cameraId: 'toy120', leak: 3 });
        const px = w.dev.renderFilm(w.scene(120, 90), 120, 90, d, true).getContext('2d').getImageData(0, 0, 120, 90).data;
        let sum = 0;
        for (let i = 0; i < px.length; i += 4) sum += px[i] + px[i + 1] + px[i + 2];
        const mean = sum / (px.length / 4) / 3;
        if (!(mean > 6 && mean < 250)) out.push(`${st.id} ${JSON.stringify(opts)} mean=${mean.toFixed(1)}`);
      }
    return out;
  });
  expect(bad).toEqual([]);
});

test('R27 large and odd-sized negatives develop within canvas limits', async ({ page }) => {
  await harness(page);
  const r = await page.evaluate(async () => {
    const w = window as any;
    const res: string[] = [];
    for (const [W, H, stock, border, cam] of [
      [4096, 4096, 'insta600', 'instant', 'instasq'],
      [4096, 1512, 'velvet50', 'print', 'panox'],
      [2, 900, 'mono400', 'film35', 'range'],
      [37, 23, 'sunny200', 'film35', 'snap27'],
    ] as [number, number, string, string, string][]) {
      const src = w.scene(W, H);
      const blob = await new Promise<Blob>((ok) => src.toBlob((b: Blob) => ok(b), 'image/jpeg', 0.9));
      const t0 = performance.now();
      const out = await w.dev.develop(blob, w.resolve.defaultDevelop(w.stocks.getStock(stock), 1, { border, cameraId: cam, dateStamp: true }), { takenAt: Date.now(), frame: 1, dateFormat: 'YMD' });
      res.push(`${W}x${H} → ${out.width}x${out.height} (${Math.round(out.width * out.height / 1e5) / 10}MP) ${Math.round(performance.now() - t0)}ms`);
      if (out.width * out.height > w.dev.MAX_CANVAS_PIXELS) throw new Error(`too big: ${res.at(-1)}`);
    }
    return res;
  });
  console.log(r.join('\n'));
  expect(r).toHaveLength(4);
});

test('R28 preview render cost per camera (software GPU)', async ({ page }) => {
  await harness(page);
  const times = await page.evaluate(async () => {
    const w = window as any;
    const { GlFilmRenderer } = await import('/src/film/glRenderer.ts');
    const canvas = document.createElement('canvas');
    const gl = GlFilmRenderer.create(canvas)!;
    const src = w.scene(1280, 720);
    const out: Record<string, number> = {};
    for (const c of w.cams.CAMERAS) {
      gl.setLook(w.resolve.resolveLook(w.resolve.defaultDevelop(w.stocks.getStock(c.defaultStock), 1, { cameraId: c.id })));
      gl.setSource(src, 1280, 720);
      gl.render(720, 540, { crop: { x: 0, y: 0, w: 1, h: 1 }, mirror: false });
      gl.gl.finish();
      const t0 = performance.now();
      for (let i = 0; i < 5; i++) {
        gl.render(720, 540, { crop: { x: 0, y: 0, w: 1, h: 1 }, mirror: false, seed: i });
        gl.gl.readPixels(0, 0, 1, 1, gl.gl.RGBA, gl.gl.UNSIGNED_BYTE, new Uint8Array(4));
      }
      out[c.id] = Math.round((performance.now() - t0) / 5);
    }
    gl.dispose();
    return out;
  });
  console.log('ms per 720×540 preview frame (SwiftShader, CPU-emulated):', JSON.stringify(times));
  // Relative check: no body should cost more than 4× the cheapest (catches accidental heavy loops).
  const vals = Object.values(times);
  expect(Math.max(...vals)).toBeLessThan(Math.max(4 * Math.min(...vals), 60));
});

test('R29 repeated developing does not leak memory or GL contexts', async ({ page }) => {
  await harness(page);
  const r = await page.evaluate(async () => {
    const w = window as any;
    let live = 0;
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-ignore
    HTMLCanvasElement.prototype.getContext = function (type: string, ...a: unknown[]) {
      // @ts-ignore
      const ctx = orig.call(this, type, ...a);
      if (ctx && type === 'webgl2' && !(this as any).__c) {
        (this as any).__c = 1;
        live++;
        this.addEventListener('webglcontextlost', () => live--);
      }
      return ctx;
    };
    const src = w.scene(800, 600);
    const blob = await new Promise<Blob>((ok) => src.toBlob((b: Blob) => ok(b), 'image/jpeg', 0.9));
    const mem = () => (performance as any).memory?.usedJSHeapSize ?? 0;
    const d = w.resolve.defaultDevelop(w.stocks.getStock('sunny200'), 1, { cameraId: 'pro35' });
    for (let i = 0; i < 10; i++) await w.dev.develop(blob, { ...d, seed: i }, { takenAt: 0, frame: 1, dateFormat: 'YMD' });
    const before = mem();
    for (let i = 0; i < 60; i++) await w.dev.develop(blob, { ...d, seed: i }, { takenAt: 0, frame: 1, dateFormat: 'YMD' });
    await new Promise((r) => setTimeout(r, 500));
    return { live, growthMB: (mem() - before) / 1e6 };
  });
  console.log('memory growth after 60 develops:', r.growthMB.toFixed(1), 'MB; live GL contexts:', r.live);
  expect(r.live).toBeLessThanOrEqual(1);
  expect(r.growthMB).toBeLessThan(40);
});

test('R30 date stamps and borders at tiny and huge sizes', async ({ page }) => {
  await harness(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const out: string[] = [];
    for (const [W, H] of [
      [16, 16],
      [40, 30],
      [75, 300],
      [200, 150],
      [3000, 2000],
    ])
      for (const cam of ['snap27', 'ccd03'])
        for (const border of ['none', 'film35', 'instant', 'print']) {
          const d = w.resolve.defaultDevelop(w.stocks.getStock(cam === 'ccd03' ? 'ccd' : 'snap800'), 1, { cameraId: cam, dateStamp: true, border });
          const c = w.dev.composePrint(w.scene(W, H), d, { takenAt: Date.UTC(2026, 9, 25, 14, 3), frame: 7, dateFormat: 'YMD' });
          out.push(`${cam} ${border} ${W}x${H} → ${c.width}x${c.height}`);
        }
    return out;
  });
  expect(r).toHaveLength(40);
});
