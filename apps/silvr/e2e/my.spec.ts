import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { loadRoll, shoot, start, openSetting, closeSheet } from './helpers';

const PLAY = 'https://play.google.com/store/apps/details?id=com.filmcamela.app';

async function axe(page: Page, name: string): Promise<string[]> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  return res.violations.map((v) => `${name}: ${v.id} (${v.impact}) × ${v.nodes.length} — ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')}`);
}

test('free tier: shoot 10 → paywall → close → MY shows 0/10 and, on the web, "get the app"', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = await start(page, './', { unlimited: false });
  await loadRoll(page, 'sunny200', '24');
  await shoot(page, 10);

  // The 11th press: refused, and the paywall sheet opens (a modal dialog, labelled by its title).
  const counter = (await page.getByTestId('counter').textContent()) ?? '';
  await page.getByTestId('shutter').click();
  const paywall = page.getByRole('dialog', { name: /10 free shots are used up/ });
  await expect(paywall).toBeVisible();
  await expect(page.getByTestId('counter')).toHaveText(counter);
  // Focus starts on the calm choice, never on an ad; the web has no ads or store: it points to the app.
  await expect(page.getByTestId('pw-later')).toBeFocused();
  await expect(paywall.getByTestId('pw-watch-ad')).toHaveCount(0);
  await expect(paywall.getByTestId('pw-pro')).toHaveCount(0);
  await expect(paywall.getByTestId('get-app-play')).toHaveAttribute('href', PLAY);
  await expect(paywall.getByTestId('get-app-ios')).toHaveCount(0); // App Store link not live yet
  await expect(paywall).toContainText(/Back to 10 free shots at /);
  // Tab stays inside the sheet.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab');
    expect(await paywall.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  const issues = await axe(page, 'paywall');

  // "Come back tomorrow" closes it; focus goes back to the shutter.
  await page.getByTestId('pw-later').click();
  await expect(paywall).toBeHidden();
  await expect(page.getByTestId('shutter')).toBeFocused();

  // Esc closes it too (and a second refused press opens it again).
  await page.getByTestId('shutter').click();
  await expect(paywall).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(paywall).toBeHidden();

  // MY: 0 of 10 free shots, nothing earned, when they refill, and "get the app" (no ad / buy buttons on the web).
  await expect(page.getByTestId('tab-settings')).toHaveText('MY');
  await page.getByTestId('tab-settings').click();
  await expect(page.getByRole('heading', { level: 1, name: 'MY' })).toBeVisible();
  const shots = page.getByTestId('my-shots');
  await expect(shots).toHaveAttribute('data-state', 'empty');
  await expect(page.getByTestId('my-free-left')).toHaveText('00/10');
  await expect(shots).toContainText('0 of 10 free shots left today'); // the screen-reader sentence
  await expect(page.getByTestId('my-earned')).toHaveText('0 shots');
  await expect(page.getByTestId('my-reset')).toContainText(/Back to 10 free shots at \d/);
  const app = page.getByTestId('get-app');
  await expect(app).toBeVisible();
  await expect(app.getByTestId('get-app-play')).toHaveAttribute('href', PLAY);
  await expect(app.getByTestId('get-app-play')).toHaveAttribute('target', '_blank');
  await expect(page.getByTestId('btn-watch-ad')).toHaveCount(0);
  await expect(page.getByTestId('my-pro')).toHaveCount(0);
  await expect(page.getByTestId('btn-ad-privacy')).toHaveCount(0);
  // The settings are all still there, below.
  await expect(page.getByTestId('set-row-lang')).toBeVisible();
  await expect(page.getByTestId('set-row-backup')).toBeVisible();
  issues.push(...(await axe(page, 'my-empty')));

  // Korean: the same states in 해요체.
  await openSetting(page, 'lang');
  await page.getByTestId('lang-picker').locator('[data-value="ko"]').click();
  await closeSheet(page);
  await expect(page.getByTestId('tab-settings')).toHaveText('MY');
  await expect(shots).toContainText('오늘 무료 10장 중 0장 남았어요');
  await expect(app).toContainText('Google Play에서 받기');

  console.log(issues.join('\n'));
  expect(issues).toEqual([]);
  expect(errors).toEqual([]);
});

test('MY with the QA hatch (unlimited): no counter, no get-the-app card', async ({ page }) => {
  const errors = await start(page);
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('my-shots')).toHaveAttribute('data-state', 'unlimited');
  await expect(page.getByTestId('my-shots')).toContainText('Unlimited');
  await expect(page.getByTestId('get-app')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('MY on a fresh day: 10/10 with ten lit frame marks', async ({ page }) => {
  const errors = await start(page, './', { unlimited: false });
  await page.getByTestId('tab-settings').click();
  await expect(page.getByTestId('my-free-left')).toHaveText('10/10');
  await expect(page.locator('.my-marks i.on')).toHaveCount(10);
  await expect(page.getByTestId('my-shots')).toHaveAttribute('data-state', 'some');
  expect(errors).toEqual([]);
});
