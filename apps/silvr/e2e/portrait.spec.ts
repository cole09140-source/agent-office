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

/** A tall print must stay inside its stage on small phones; it used to cover the action buttons. */
for (const [w, h] of [[360, 640], [375, 667]]) {
  test(`small phone ${w}×${h}: a portrait print never covers the viewer or darkroom buttons`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await start(page);
    await loadRoll(page, 'sunny200', '12');
    await shoot(page, 1);
    await page.getByTestId('roll-btn').click();
    await page.getByTestId('btn-rewind').click();
    await page.getByTestId('confirm-ok').click();
    await page.getByTestId('speed-instant').click();
    await expect(page.locator('[data-testid=thumb] img')).toHaveCount(1, { timeout: 30_000 });
    await page.getByTestId('thumb').first().click();
    await expect(page.getByTestId('print')).toBeVisible();
    await page.waitForTimeout(1300);
    const covered = (ids: string[]) =>
      page.evaluate((ids) => ids.filter((id) => {
        const b = document.querySelector(`[data-testid=${id}]`)!.getBoundingClientRect();
        return !document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)?.closest(`[data-testid=${id}]`);
      }), ids);
    expect(await covered(['btn-share', 'btn-save', 'btn-darkroom', 'btn-delete'])).toEqual([]);
    await page.getByTestId('btn-darkroom').click();
    await expect(page.getByTestId('dr-canvas')).toBeVisible();
    await page.waitForTimeout(500);
    expect(await covered(['btn-dr-save'])).toEqual([]);
  });
}
