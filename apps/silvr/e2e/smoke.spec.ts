import { expect, test } from '@playwright/test';

test('boots, onboarding, camera preview renders with WebGL', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto('./');
  await expect(page.getByTestId('onboarding')).toBeVisible();
  await page.getByTestId('onb-next').click();
  await page.getByTestId('onb-next').click();
  await page.getByTestId('onb-next').click();
  await expect(page.getByTestId('onboarding')).toBeHidden();
  await expect(page.getByTestId('load-panel')).toBeVisible();
  await expect(page.getByTestId('preview')).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'e2e/.shots/01-camera-load.png' });
  expect(errors).toEqual([]);
});
