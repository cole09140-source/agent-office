import { expect, test, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadRoll, shoot, start } from '../../e2e/helpers';

// The six store screenshots listed in docs/03_STORE_LISTING.md.
test('store screenshots', async ({ page }, info) => {
  const dir = join(process.env.OUT ?? 'store-shots', info.project.name);
  mkdirSync(dir, { recursive: true });
  const snap = async (name: string) => {
    await settle(page);
    await page.screenshot({ path: join(dir, `${name}.png`) });
  };

  await start(page);
  // 1. camera shelf
  await page.getByTestId('camera-instasq').click();
  await page.getByTestId('camera-pro35').click();
  await snap('1-cameras');

  // 2. shooting, counter 07/24
  await loadRoll(page, 'muse400', '24');
  await shoot(page, 7);
  await page.waitForTimeout(1200);
  await snap('2-shooting');
  await shoot(page, 3);

  // 3. lab countdown (develop tomorrow morning)
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-morning').click();
  await expect(page.getByTestId('lab-item')).toHaveCount(1);
  // a second roll in the lab, so the countdown screen shows two
  await page.getByTestId('tab-camera').click();
  await loadRoll(page, 'mono400', '12');
  await shoot(page, 2);
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-3d').click();
  await expect(page.getByTestId('lab-item')).toHaveCount(2);
  await snap('3-lab');

  // develop the first roll now so the darkroom and contact sheet have prints
  await page.getByTestId('lab-item').filter({ hasText: 'Muse 400' }).getByTestId('btn-rush').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('tab-gallery').click();
  await page.getByTestId('roll-card').filter({ hasText: 'Muse 400' }).locator('.roll-meta').click();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(10, { timeout: 90_000 });

  // 5. contact sheet
  await page.getByTestId('btn-contact').click();
  await expect(page.getByTestId('contact-sheet').locator('img')).toBeVisible({ timeout: 60_000 });
  await snap('5-contact');
  await page.keyboard.press('Escape');

  // 4. darkroom
  await page.getByTestId('thumb').nth(1).click();
  await expect(page.getByTestId('print')).toBeVisible();
  await page.getByTestId('btn-darkroom').click();
  await expect(page.getByTestId('dr-canvas')).toBeVisible();
  await page.getByTestId('sl-push').fill('1');
  await snap('4-darkroom');

  // 6. Sunny 16 meter
  await page.getByTestId('tab-analog').click();
  await page.getByTestId('iso-200').click();
  await page.getByTestId('ap-11').click();
  await snap('6-meter');
});

/** Waits for animations, fonts and pending images so nothing is caught mid-transition. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined)));
    await Promise.all(Array.from(document.images).filter((i) => !i.complete).map((i) => new Promise((r) => (i.onload = i.onerror = r))));
  });
  await page.waitForTimeout(400);
}
