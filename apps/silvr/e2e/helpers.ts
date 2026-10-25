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
