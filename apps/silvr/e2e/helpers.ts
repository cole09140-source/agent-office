import { expect, type Page } from '@playwright/test';

export async function start(page: Page, path = './') {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  await page.goto(path);
  const onb = page.getByTestId('onboarding');
  await expect(onb).toBeVisible();
  await page.getByTestId('onb-skip').click();
  await expect(onb).toBeHidden();
  return errors;
}

export async function loadRoll(page: Page, stock = 'sunny200', size = '12') {
  await page.getByTestId(`stock-${stock}`).first().click();
  await page.getByRole('radio', { name: new RegExp(`^${size}`) }).click();
  await page.getByTestId('btn-load').click();
  await expect(page.getByTestId('shutter')).toBeEnabled();
}

export async function shoot(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    const before = await page.getByTestId('counter').textContent();
    await page.getByTestId('shutter').click();
    await expect(page.getByTestId('counter')).not.toHaveText(before ?? '');
  }
}

/** Picks a camera body (and optionally film / roll size) and loads it. */
export async function loadCamera(page: Page, cameraId: string, opts: { stock?: string; size?: string } = {}) {
  await page.getByTestId(`camera-${cameraId}`).click();
  if (opts.stock) await page.getByTestId(`stock-${opts.stock}`).first().click();
  if (opts.size) await page.getByRole('radio', { name: new RegExp(`^${opts.size}`) }).click();
  await page.getByTestId('btn-load').click();
  await expect(page.getByTestId('shutter')).toBeEnabled();
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', cameraId);
}

/** Rewinds the loaded roll; non-instant cameras are developed instantly. */
export async function rewindAndDevelop(page: Page) {
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  const ok = page.getByTestId('confirm-ok');
  if (await ok.isVisible().catch(() => false)) await ok.click();
  const speed = page.getByTestId('speed-instant');
  await expect(speed.or(page.getByTestId('roll-screen'))).toBeVisible();
  if (await speed.isVisible().catch(() => false)) await speed.click();
  await expect(page.getByTestId('roll-screen')).toBeVisible();
  await expect(page.locator('[data-testid=thumb] img').first()).toBeVisible({ timeout: 45_000 });
}
