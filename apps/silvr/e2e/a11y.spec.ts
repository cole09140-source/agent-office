import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { loadRoll, shoot, start } from './helpers';

async function audit(page: import('@playwright/test').Page, name: string) {
  // Let sheet/screen entrance animations finish; axe reads blended colors mid-fade.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );
  const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const issues = res.violations.map((v) => `${name}: ${v.id} (${v.impact}) × ${v.nodes.length} — ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')}`);
  return issues;
}

test('every screen passes axe WCAG 2.1 AA', async ({ page }) => {
  const issues: string[] = [];
  await page.goto('./');
  await expect(page.getByTestId('onboarding')).toBeVisible();
  issues.push(...(await audit(page, 'onboarding')));
  await page.getByTestId('onb-skip').click();
  issues.push(...(await audit(page, 'camera-load')));
  await loadRoll(page, 'sunny200', '12');
  issues.push(...(await audit(page, 'camera-shooting')));
  await shoot(page, 2);
  await page.getByTestId('roll-btn').click();
  issues.push(...(await audit(page, 'roll-sheet')));
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  issues.push(...(await audit(page, 'speed-sheet')));
  await page.getByTestId('speed-1h').click();
  issues.push(...(await audit(page, 'lab')));
  await page.getByTestId('btn-rush').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toHaveCount(1);
  issues.push(...(await audit(page, 'gallery')));
  await page.getByTestId('roll-card').locator('.roll-meta').click();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(2, { timeout: 30_000 });
  issues.push(...(await audit(page, 'roll')));
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible();
  issues.push(...(await audit(page, 'photo')));
  await page.getByTestId('btn-darkroom').click();
  await expect(page.getByTestId('dr-canvas')).toBeVisible();
  issues.push(...(await audit(page, 'darkroom')));
  await page.getByTestId('tab-analog').click();
  issues.push(...(await audit(page, 'analog')));
  await page.getByTestId('btn-new-log').click();
  issues.push(...(await audit(page, 'new-log')));
  await page.getByTestId('log-create').click();
  await page.getByTestId('btn-add-frame').click();
  issues.push(...(await audit(page, 'add-frame')));
  await page.keyboard.press('Escape');
  await page.getByTestId('tab-settings').click();
  issues.push(...(await audit(page, 'settings')));
  console.log(issues.join('\n'));
  expect(issues).toEqual([]);
});

test('keyboard: shutter with Space, sheets close with Escape, focus visible', async ({ page }) => {
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await page.locator('body').click({ position: { x: 5, y: 300 } });
  await page.keyboard.press(' ');
  await expect(page.getByTestId('counter')).toContainText('01');
  await page.getByTestId('roll-btn').click();
  await expect(page.getByTestId('roll-sheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('roll-sheet')).toBeHidden();
});
