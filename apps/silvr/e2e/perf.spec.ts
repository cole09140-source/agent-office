import { expect, test } from '@playwright/test';
import { loadRoll, shoot, start } from './helpers';

test('no WebGL context or object-URL leaks while navigating', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __gl: number; __urls: Set<string> };
    w.__gl = 0;
    w.__urls = new Set();
    const getCtx = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error instrumentation
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      // @ts-expect-error passthrough
      const ctx = getCtx.call(this, type, ...rest);
      if (ctx && type === 'webgl2' && !(this as unknown as { __counted?: boolean }).__counted) {
        (this as unknown as { __counted?: boolean }).__counted = true;
        w.__gl++; // live contexts: +1 on create, -1 when lost/released
        this.addEventListener('webglcontextlost', () => w.__gl--);
      }
      return ctx;
    };
    const create = URL.createObjectURL;
    const revoke = URL.revokeObjectURL;
    URL.createObjectURL = (o: Blob | MediaSource) => {
      const u = create(o);
      w.__urls.add(u);
      return u;
    };
    URL.revokeObjectURL = (u: string) => {
      w.__urls.delete(u);
      revoke(u);
    };
  });
  const warnings: string[] = [];
  page.on('console', (m) => /WebGL/i.test(m.text()) && warnings.push(m.text()));
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 3);
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-instant').click();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(3, { timeout: 30_000 });
  const rollUrl = page.url();
  for (let i = 0; i < 8; i++) {
    await page.getByTestId('thumb').first().click();
    await expect(page.getByTestId('print')).toBeVisible();
    await page.getByTestId('btn-darkroom').click();
    await expect(page.getByTestId('dr-canvas')).toBeVisible();
    await page.getByTestId('sl-grain').fill(String(Math.round((0.5 + i * 0.1) * 10) / 10));
    await page.getByTestId('tab-camera').click();
    await expect(page.getByTestId('preview')).toBeVisible();
    await page.goto(rollUrl);
    await expect(page.locator('[data-testid=thumb] img')).toHaveCount(3);
  }
  // Live contexts: the shared export renderer (+ at most one camera preview, released on unmount).
  const stats = await page.evaluate(() => {
    const w = window as unknown as { __gl: number; __urls: Set<string> };
    return { gl: w.__gl, urls: w.__urls.size };
  });
  expect(stats.gl).toBeLessThanOrEqual(2);
  expect(stats.urls).toBeLessThanOrEqual(3); // only the 3 visible thumbnails
  expect(warnings.filter((w) => /too many active/i.test(w))).toEqual([]);
});

test('in-app navigation (no reloads) keeps contexts and URLs bounded', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __urls: Set<string>; __live: () => number };
    w.__urls = new Set();
    const create = URL.createObjectURL;
    const revoke = URL.revokeObjectURL;
    URL.createObjectURL = (o: Blob | MediaSource) => {
      const u = create(o);
      w.__urls.add(u);
      return u;
    };
    URL.revokeObjectURL = (u: string) => {
      w.__urls.delete(u);
      revoke(u);
    };
  });
  const warnings: string[] = [];
  page.on('console', (m) => /too many active webgl/i.test(m.text()) && warnings.push(m.text()));
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 2);
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-instant').click();
  for (let i = 0; i < 20; i++) {
    await page.getByTestId('tab-camera').click();
    await expect(page.getByTestId('preview')).toBeVisible();
    await page.getByTestId('tab-gallery').click();
    await page.getByTestId('roll-card').first().locator('.roll-meta').click();
    await page.getByTestId('thumb').first().click();
    await page.getByTestId('btn-darkroom').click();
    await expect(page.getByTestId('dr-canvas')).toBeVisible();
  }
  expect(warnings).toEqual([]);
  await page.getByTestId('tab-settings').click();
  const urls = await page.evaluate(() => (window as unknown as { __urls: Set<string> }).__urls.size);
  expect(urls).toBe(0);
});

test('develops a 12MP import in reasonable time', async ({ page }) => {
  await start(page);
  await page.getByTestId('tab-gallery').click();
  await page.getByTestId('btn-import').click();
  const png = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 4000;
    c.height = 3000;
    const g = c.getContext('2d')!;
    for (let i = 0; i < 400; i++) {
      g.fillStyle = `hsl(${i * 37}, 60%, ${30 + (i % 50)}%)`;
      g.fillRect((i * 97) % 4000, (i * 53) % 3000, 300, 200);
    }
    const b = await new Promise<Blob>((r) => c.toBlob((x) => r(x!), 'image/jpeg', 0.9));
    return Array.from(new Uint8Array(await b.arrayBuffer()));
  });
  const t0 = Date.now();
  await page.getByTestId('import-input').setInputFiles([{ name: 'big.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(png) }]);
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible({ timeout: 60_000 });
  const ms = Date.now() - t0;
  const dims = await page.getByTestId('print').evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
  console.log(`12MP import → print ${dims.join('x')} in ${ms} ms (software GPU)`);
  expect(Math.max(...dims)).toBeLessThanOrEqual(3600 * 1.1);
  expect(ms).toBeLessThan(30_000);
});
