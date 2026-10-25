import { expect, test, type Page } from '@playwright/test';
import { loadCamera, rewindAndDevelop, shoot, start } from './helpers';

/** Expected print shape per camera (fake camera is landscape 16:9). */
const CASES: { id: string; presses: number; ratio: number; tol?: number; check?: 'fisheye' | 'pixel' | 'quad' | 'half' }[] = [
  { id: 'pro35', presses: 1, ratio: 1.5 },
  { id: 'snap27', presses: 1, ratio: 1.5 },
  { id: 'instasq', presses: 1, ratio: 0.87, tol: 0.05 }, // square image inside an instant frame
  { id: 'half72', presses: 2, ratio: 1.53, tol: 0.03, check: 'half' },
  { id: 'zonelc', presses: 1, ratio: 1.5 },
  { id: 'toy120', presses: 1, ratio: 1 },
  { id: 'quad4', presses: 1, ratio: 1.5, tol: 0.04, check: 'quad' },
  { id: 'doublex', presses: 2, ratio: 1.5 },
  { id: 'panox', presses: 1, ratio: 65 / 24, tol: 0.06 },
  { id: 'fish180', presses: 1, ratio: 1, check: 'fisheye' },
  { id: 'cine', presses: 1, ratio: 2.39, tol: 0.06 },
  { id: 'ccd03', presses: 1, ratio: 4 / 3 },
  { id: 'pixel', presses: 1, ratio: 8 / 7, tol: 0.03, check: 'pixel' },
  { id: 'range', presses: 1, ratio: 1.2, tol: 0.25 }, // mono film → 35mm strip border
];

async function pixels(page: Page, w: number, h: number) {
  return page.getByTestId('print').evaluate(
    (img: HTMLImageElement, [W, H]) => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d')!;
      g.imageSmoothingEnabled = false;
      g.drawImage(img, 0, 0, W, H);
      return Array.from(g.getImageData(0, 0, W, H).data);
    },
    [w, h],
  );
}

for (const cse of CASES) {
  test(`camera ${cse.id}: shoots, develops and prints in its own format`, async ({ page }) => {
    const errors = await start(page);
    await loadCamera(page, cse.id);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `e2e/.shots/cam-${cse.id}-vf.png` });
    for (let i = 0; i < cse.presses; i++) {
      if (cse.id === 'doublex' && i === 0) {
        await page.getByTestId('shutter').click();
        await expect(page.locator('.vf-ghost')).toBeVisible();
      } else {
        await shoot(page, 1);
      }
    }
    if (cse.id === 'doublex') await expect(page.locator('.vf-ghost')).toHaveCount(0);
    await rewindAndDevelop(page);
    await page.getByTestId('thumb').first().click();
    await expect(page.getByTestId('print')).toBeVisible({ timeout: 45_000 });
    const [w, h] = await page.getByTestId('print').evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
    expect(w / h).toBeCloseTo(cse.ratio, 0);
    expect(Math.abs(w / h - cse.ratio)).toBeLessThan(cse.tol ?? 0.03);
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `e2e/.shots/cam-${cse.id}-print.png` });

    if (cse.check === 'fisheye') {
      const d = await pixels(page, 40, 40);
      const corner = d[0] + d[1] + d[2];
      const centre = d[(20 * 40 + 20) * 4] + d[(20 * 40 + 20) * 4 + 1] + d[(20 * 40 + 20) * 4 + 2];
      expect(corner).toBeLessThan(40); // black outside the circle
      expect(centre).toBeGreaterThan(150);
    }
    if (cse.check === 'pixel') {
      // Only the 4 palette tones (moss) may appear.
      const pal = [
        [15, 56, 15],
        [48, 98, 48],
        [139, 172, 15],
        [155, 188, 15],
      ];
      const d = await pixels(page, 64, 56);
      for (let i = 0; i < d.length; i += 4 * 7) {
        const near = pal.some((p) => Math.abs(p[0] - d[i]) + Math.abs(p[1] - d[i + 1]) + Math.abs(p[2] - d[i + 2]) < 24);
        expect(near, `pixel ${i / 4}: ${d[i]},${d[i + 1]},${d[i + 2]}`).toBe(true);
      }
    }
    if (cse.check === 'quad' || cse.check === 'half') {
      // The frame line between sub-frames is dark.
      const d = await pixels(page, 201, 100);
      const at = (x: number, y: number) => d[(y * 201 + x) * 4] + d[(y * 201 + x) * 4 + 1] + d[(y * 201 + x) * 4 + 2];
      expect(at(100, 30)).toBeLessThan(at(60, 30));
    }
    expect(errors).toEqual([]);
  });
}

test('disposable: the flash must be charged before every flash shot', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'snap27');
  const flash = page.getByTestId('btn-flash');
  await expect(flash).toHaveAttribute('data-charge', 'empty');
  await flash.click();
  await expect(flash).toHaveAttribute('data-charge', 'charging');
  await expect(flash).toHaveAttribute('data-charge', 'ready', { timeout: 6000 });
  await shoot(page, 1);
  await expect(flash).toHaveAttribute('data-charge', 'empty');
  await expect(page.getByTestId('counter')).toContainText('01');
  await expect(page.getByTestId('counter')).toContainText('/27');
});

test('half-frame: a pending half survives a reload and pairs up', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'half72');
  await page.getByTestId('shutter').click();
  await expect(page.getByTestId('counter')).toContainText('1½');
  await expect(page.getByText('Next shot fills the B half')).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('counter')).toContainText('1½');
  await page.getByTestId('shutter').click();
  await expect(page.getByTestId('counter')).toContainText('2/72');
  // Starting a rewind and cancelling the lab sheet must not commit the pending half.
  await page.getByTestId('shutter').click();
  await expect(page.getByTestId('counter')).toContainText('3½');
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await expect(page.getByTestId('speed-sheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('counter')).toContainText('3½');
  // A lone first half is kept (with a blank B side) when the roll really goes to the lab.
  await rewindAndDevelop(page);
  await expect(page.getByTestId('thumb')).toHaveCount(2);
});

test('instant camera: print ejects, develops, and is viewable in the camera', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'instasq');
  await shoot(page, 1);
  await expect(page.locator('.eject')).toBeVisible();
  await expect(page.getByTestId('last-shot').locator('img')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toContainText('In camera');
  await page.getByTestId('roll-card').locator('.roll-meta').click();
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toHaveClass(/instant-dev/);
  await page.getByTestId('tab-camera').click();
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', 'instasq');
  await expect(page.getByTestId('counter')).toContainText('01/10');
});

test('pack finishes on its own: CCD card full → album, no lab', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'pixel');
  await page.getByTestId('btn-palette').click();
  await expect(page.getByTestId('btn-palette')).toContainText('mono');
  await shoot(page, 1);
  await expect(page.getByTestId('last-shot').locator('img')).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await expect(page.getByTestId('roll-screen')).toBeVisible();
  await page.getByTestId('tab-lab').click();
  await expect(page.getByTestId('lab-item')).toHaveCount(0);
});

test('exposure dial and pixel darkroom palette', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'pro35');
  await page.getByTestId('btn-ev').click();
  await page.getByTestId('sl-ev').fill('1');
  await expect(page.getByTestId('btn-ev')).toContainText('+1.0');
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click(); // empty roll → unload
  await expect(page.getByTestId('load-panel')).toBeVisible();

  await loadCamera(page, 'pixel');
  await shoot(page, 1);
  await page.getByTestId('last-shot').getByTestId('thumb').click();
  await expect(page.getByTestId('print')).toBeVisible({ timeout: 30_000 });
  const before = await page.getByTestId('print').getAttribute('src');
  await page.getByTestId('btn-darkroom').click();
  await expect(page.locator('.dr-controls .stock-strip')).toHaveCount(0); // pixel sensor is fixed
  await page.getByRole('radio', { name: 'sepia' }).click();
  await page.getByTestId('btn-dr-save').click();
  await expect.poll(async () => page.getByTestId('print').getAttribute('src'), { timeout: 30_000 }).not.toBe(before);
});

test('camera choice is remembered and film choices follow the body', async ({ page }) => {
  await start(page);
  await page.getByTestId('camera-cine').click();
  await expect(page.getByTestId('stock-neon800t')).toBeVisible();
  await expect(page.getByTestId('stock-sunny200')).toHaveCount(0);
  await page.getByTestId('camera-ccd03').click();
  await expect(page.getByText('Built-in film')).toBeVisible();
  await page.getByTestId('btn-load').click();
  await page.reload();
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', 'ccd03');
});
