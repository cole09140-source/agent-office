import { expect, test, type Page } from '@playwright/test';
import { loadRoll, shoot, start } from './helpers';

async function finishInstant(page: Page) {
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-instant').click();
  await expect(page.locator('[data-testid=thumb] img').first()).toBeVisible({ timeout: 40_000 });
}

/** Average red-ness of the left vs right third of the print (the red house sits on the left of the scene). */
async function redSide(page: Page): Promise<'left' | 'right'> {
  return page.getByTestId('print').evaluate((img: HTMLImageElement) => {
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 200;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0, 300, 200);
    const d = g.getImageData(0, 0, 300, 200).data;
    const score = (x0: number, x1: number) => {
      let s = 0;
      for (let y = 100; y < 160; y++) for (let x = x0; x < x1; x++) {
        const i = (y * 300 + x) * 4;
        s += d[i] - (d[i + 1] + d[i + 2]) / 2;
      }
      return s;
    };
    return score(0, 100) > score(200, 300) ? 'left' : 'right';
  });
}

test('front camera photos are mirrored like the preview (and not when disabled)', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 1); // rear
  await page.getByTestId('btn-flip').click();
  await expect(page.getByTestId('btn-flip')).toHaveAttribute('data-facing', 'user');
  await expect(page.getByTestId('shutter')).toBeEnabled();
  await shoot(page, 1); // front, mirrored
  await finishInstant(page);
  await page.getByTestId('thumb').nth(0).click();
  await expect(page.getByTestId('print')).toBeVisible();
  expect(await redSide(page)).toBe('left');
  await page.getByTestId('btn-next').click();
  await expect(page.getByTestId('print')).toBeVisible();
  expect(await redSide(page)).toBe('right');
  expect(errors).toEqual([]);
});

test('no WebGL2: falls back to plain video preview and CPU developing', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    // @ts-expect-error test override
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      if (type === 'webgl2' || type === 'webgl') return null;
      // @ts-expect-error passthrough
      return orig.call(this, type, ...rest);
    };
  });
  const errors = await start(page);
  await loadRoll(page, 'mono400', '12');
  await expect(page.locator('.fallback-video')).toBeVisible();
  await shoot(page, 1);
  await finishInstant(page);
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible({ timeout: 40_000 });
  // Mono stock → neutral grey pixels in the developed print.
  const chroma = await page.getByTestId('print').evaluate((img: HTMLImageElement) => {
    const c = document.createElement('canvas');
    c.width = 60;
    c.height = 40;
    const g = c.getContext('2d')!;
    g.drawImage(img, 0, 0, 60, 40);
    const d = g.getImageData(0, 0, 60, 40).data;
    let m = 0;
    // Centre only: the 35mm border carries orange edge print.
    for (let y = 12; y < 28; y++) for (let x = 12; x < 48; x++) {
      const i = (y * 60 + x) * 4;
      m = Math.max(m, Math.abs(d[i] - d[i + 2]));
    }
    return m;
  });
  expect(chroma).toBeLessThan(24);
  expect(errors).toEqual([]);
});

test('timer counts down before the exposure', async ({ page }) => {
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await page.getByTestId('btn-timer').click(); // 3 s
  await page.getByTestId('shutter').click();
  await expect(page.locator('.countdown')).toHaveText('3');
  await expect(page.getByTestId('counter')).toContainText('00');
  await expect(page.getByTestId('counter')).toContainText('01', { timeout: 6000 });
});

test('rapid shutter taps never exceed the roll capacity', async ({ page }) => {
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 10);
  const btn = page.getByTestId('shutter');
  await Promise.all([btn.click({ force: true }).catch(() => {}), btn.click({ force: true }).catch(() => {}), btn.click({ force: true }).catch(() => {}), page.keyboard.press(' ')]);
  await page.waitForTimeout(1500);
  for (let i = 0; i < 4; i++) await page.keyboard.press(' ').catch(() => {});
  await expect(page.getByTestId('speed-sheet')).toBeVisible();
  await expect(page.getByTestId('counter')).toContainText('12');
  await page.getByTestId('speed-instant').click();
  await expect(page.getByTestId('thumb')).toHaveCount(12);
});
