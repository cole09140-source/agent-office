/** QA R14: every camera with a portrait (phone) sensor keeps the right print shape. */
import { expect, test } from '@playwright/test';
import { loadCamera, rewindAndDevelop, start } from './helpers';

const CASES: [string, number, number][] = [
  // id, expected h/w (portrait) or w/h for landscape composites, tolerance
  ['pro35', 1.5, 0.03],
  ['half72', 1 / 1.53, 0.04], // two portrait halves always make a landscape frame
  ['quad4', 1.5, 0.05],
  ['panox', 2.58, 0.06],
  ['cine', 2.39, 0.06],
  ['fish180', 1, 0.02],
  ['pixel', 8 / 7, 0.03],
  ['ccd03', 4 / 3, 0.03],
];

for (const [id, ratio, tol] of CASES) {
  test(`R14 portrait sensor: ${id}`, async ({ page }) => {
    await start(page);
    await loadCamera(page, id);
    for (let i = 0; i < (id === 'half72' ? 2 : 1); i++) {
      await page.getByTestId('shutter').click();
      await expect(page.getByTestId('shutter')).toBeEnabled({ timeout: 15_000 });
    }
    await rewindAndDevelop(page);
    await page.getByTestId('thumb').first().click();
    await expect(page.getByTestId('print')).toBeVisible({ timeout: 45_000 });
    const [w, h] = await page.getByTestId('print').evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
    expect(Math.abs(h / w - ratio)).toBeLessThan(tol);
  });
}
