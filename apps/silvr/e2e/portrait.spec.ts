import { expect, test } from '@playwright/test';
import { loadRoll, shoot, start } from './helpers';

/** Phones deliver portrait frames; the whole pipeline must keep portrait orientation. */
test('portrait camera → portrait viewfinder and portrait prints for every format', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200', '12');
  const vf = await page.locator('.viewfinder').boundingBox();
  expect(vf!.height).toBeGreaterThan(vf!.width);
  expect(vf!.height / vf!.width).toBeCloseTo(1.5, 1);
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'e2e/.shots/13-portrait-camera.png' });
  await shoot(page, 1); // 3:2
  await page.getByTestId('btn-aspect').click(); // 4:3
  await shoot(page, 1);
  await page.getByTestId('btn-aspect').click(); // 1:1
  await shoot(page, 1);
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-instant').click();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(3, { timeout: 30_000 });
  const ratios: number[] = [];
  for (let i = 0; i < 3; i++) {
    await page.getByTestId('thumb').nth(i).click();
    await expect(page.getByTestId('print')).toBeVisible();
    ratios.push(await page.getByTestId('print').evaluate((img: HTMLImageElement) => img.naturalHeight / img.naturalWidth));
    await page.goBack();
  }
  expect(ratios[0]).toBeCloseTo(1.5, 1);
  expect(ratios[1]).toBeCloseTo(4 / 3, 1);
  expect(ratios[2]).toBeCloseTo(1, 1);
  expect(errors).toEqual([]);
});
