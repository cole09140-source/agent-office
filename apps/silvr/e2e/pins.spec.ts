import { expect, test, type Page } from '@playwright/test';
import { loadCamera, start } from './helpers';

/** Camera ids on the strip under the viewfinder, in on-screen order. */
async function order(page: Page): Promise<string[]> {
  return page
    .locator('.cam-rail-strip [data-testid^="camera-"]')
    .evaluateAll((els) => els.map((el) => (el.getAttribute('data-testid') ?? '').replace(/^camera-/, '')));
}

/** Pins or unpins a camera with a long press on its strip card. */
async function togglePin(page: Page, id: string, on: boolean) {
  const before = await order(page);
  await page.getByTestId(`camera-${id}`).click({ delay: 800 });
  await expect(page.getByTestId('toast').first()).toContainText(on ? /pinned|고정/i : /unpinned|풀었/i);
  await expect.poll(async () => (await order(page)).join(',')).not.toBe(before.join(','));
}

test('pinned cameras move to the front of the strip, persist across reloads and can be unpinned', async ({ page }) => {
  const errors = await start(page);
  await expect(page.getByTestId('camera-rail')).toBeVisible();
  const original = await order(page);
  expect(original.length).toBeGreaterThan(3);

  // Pin the last camera: it jumps to the front, behind a divider.
  const last = original[original.length - 1];
  await loadCamera(page, last);
  await togglePin(page, last, true);
  await expect.poll(() => order(page)).toEqual([last, ...original.slice(0, -1)]);
  await expect(page.locator('.cam-rail-divider')).toHaveCount(1);
  // Pinning does not change the camera in use.
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', last);

  // Pin a second one: pins keep the order they were pinned in.
  const third = original[2];
  await loadCamera(page, third);
  await togglePin(page, third, true);
  const pinnedOrder = [last, third, ...original.filter((id) => id !== last && id !== third)];
  await expect.poll(() => order(page)).toEqual(pinnedOrder);

  // Still pinned after a reload (onboarding is already done), the camera in use centred on the strip.
  await page.reload();
  await expect(page.getByTestId('camera-rail')).toBeVisible();
  await expect.poll(() => order(page)).toEqual(pinnedOrder);
  await expect(page.locator('.cam-rail-card[aria-pressed="true"]')).toHaveAttribute('data-testid', `camera-${third}`);
  await expect(page.locator('.cam-rail-card[aria-pressed="true"]')).toBeInViewport();

  // No horizontal page scroll on a narrow phone.
  await page.setViewportSize({ width: 360, height: 760 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  // Unpin both: back to the normal order, no divider.
  await togglePin(page, third, false);
  await loadCamera(page, last);
  await togglePin(page, last, false);
  await expect.poll(() => order(page)).toEqual(original);
  await expect(page.locator('.cam-rail-divider')).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId('camera-rail')).toBeVisible();
  await expect.poll(() => order(page)).toEqual(original);
  expect(errors).toEqual([]);
});
