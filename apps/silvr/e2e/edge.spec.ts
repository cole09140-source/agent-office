import { expect, test } from '@playwright/test';
import { start } from './helpers';

test.describe('no camera permission', () => {
  test.use({ permissions: [] });
  test('shows a helpful error with an import fallback', async ({ browser }) => {
    const ctx = await browser.newContext({ permissions: [] });
    const page = await ctx.newPage();
    // Simulate a user who denied camera access.
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
    });
    await start(page);
    await expect(page.getByTestId('camera-error')).toBeVisible();
    await expect(page.getByTestId('camera-error')).toContainText('denied');
    await page.getByRole('button', { name: /Import/ }).click();
    await expect(page.getByTestId('import-sheet')).toBeVisible();
    await ctx.close();
  });
});

test('deep links and unknown routes', async ({ page }) => {
  const errors = await start(page, './#/photo/does-not-exist');
  await expect(page.getByTestId('photo-screen').or(page.locator('.page'))).toBeVisible();
  await page.goto('./#/nowhere');
  await expect(page.getByTestId('camera-screen')).toBeVisible();
  await page.goto('./#/roll/missing');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('gallery-screen')).toBeVisible();
  expect(errors).toEqual([]);
});

test('works offline after first load (service worker)', async ({ page, context }) => {
  let navigations = 0;
  page.on('load', () => navigations++);
  await start(page);
  await page.waitForTimeout(2500);
  expect(navigations, 'first install must not auto-reload').toBe(1);
  // legal page visited while online first, then the shell must still be the app
  await page.goto('./terms.html');
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId('camera-screen')).toBeVisible();
  await page.goto('./privacy.html');
  await expect(page.getByRole('heading', { name: '개인정보 처리방침' })).toBeVisible();
  // Visiting a legal page must not replace the cached app shell.
  await page.goto('./');
  await expect(page.getByTestId('camera-screen')).toBeVisible();
  await context.setOffline(false);
});

test('tablet / desktop layout has no horizontal overflow on every tab', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await start(page);
  for (const tab of ['camera', 'lab', 'gallery', 'analog', 'settings']) {
    await page.getByTestId(`tab-${tab}`).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, tab).toBeLessThanOrEqual(0);
  }
  await page.setViewportSize({ width: 320, height: 640 });
  for (const tab of ['camera', 'lab', 'gallery', 'analog', 'settings']) {
    await page.getByTestId(`tab-${tab}`).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `${tab}@320`).toBeLessThanOrEqual(0);
  }
});
