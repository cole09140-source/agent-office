import { expect, test, type Page } from '@playwright/test';
import { start } from './helpers';

/** Camera ids in the picker, in on-screen order. */
async function order(page: Page): Promise<string[]> {
  return page
    .locator('.camera-strip [data-testid^="camera-"]')
    .evaluateAll((els) => els.map((el) => (el.getAttribute('data-testid') ?? '').replace(/^camera-/, '')));
}

test('pinned cameras move to the front, persist across reloads and can be unpinned', async ({ page }) => {
  const errors = await start(page);
  await expect(page.getByTestId('load-panel')).toBeVisible();
  const original = await order(page);
  expect(original.length).toBeGreaterThan(3);
  const selected = page.locator('.camera-strip .camera-card[aria-pressed="true"]');
  const selectedId = await selected.getAttribute('data-testid');

  // Pin the last camera: it jumps to the front, its toggle is pressed and keeps focus.
  const last = original[original.length - 1];
  const pinLast = page.getByTestId(`pin-${last}`);
  await expect(pinLast).toHaveAttribute('aria-pressed', 'false');
  await expect(pinLast).toHaveAccessibleName(/^Pin .+|^.+ 고정$/);
  await pinLast.click();
  await expect(pinLast).toHaveAttribute('aria-pressed', 'true');
  await expect(pinLast).toBeFocused();
  await expect(page.getByTestId('toast').first()).toContainText(/pinned|고정/i);
  await expect.poll(() => order(page)).toEqual([last, ...original.slice(0, -1)]);
  await expect(page.locator('.camera-divider')).toHaveCount(1);

  // Pin a second one with the keyboard: pins keep the order they were pinned in.
  const third = original[2];
  await page.getByTestId(`pin-${third}`).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId(`pin-${third}`)).toHaveAttribute('aria-pressed', 'true');
  const pinnedOrder = [last, third, ...original.filter((id) => id !== last && id !== third)];
  await expect.poll(() => order(page)).toEqual(pinnedOrder);

  // Selecting a camera is separate from pinning.
  await expect(selected).toHaveAttribute('data-testid', selectedId ?? '');

  // Still pinned after a reload (onboarding is already done).
  await page.reload();
  await expect(page.getByTestId('load-panel')).toBeVisible();
  await expect.poll(() => order(page)).toEqual(pinnedOrder);
  await expect(page.getByTestId(`pin-${last}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId(`pin-${third}`)).toHaveAttribute('aria-pressed', 'true');
  // The selected camera is still scrolled into view on first render.
  await expect(page.locator('.camera-strip .camera-card[aria-pressed="true"]')).toBeInViewport();

  // No horizontal page scroll on a narrow phone.
  await page.setViewportSize({ width: 360, height: 760 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);

  // Unpin both: back to the normal order, no divider.
  await page.getByTestId(`pin-${last}`).click();
  await page.getByTestId(`pin-${third}`).click();
  await expect(page.getByTestId(`pin-${last}`)).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => order(page)).toEqual(original);
  await expect(page.locator('.camera-divider')).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId('load-panel')).toBeVisible();
  await expect.poll(() => order(page)).toEqual(original);
  expect(errors).toEqual([]);
});
