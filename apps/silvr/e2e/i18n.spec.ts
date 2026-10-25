import { expect, test, type Page } from '@playwright/test';
import { loadRoll, shoot } from './helpers';

test.use({ locale: 'ko-KR' });

/** Elements whose text is clipped (overflowing their box). */
async function clipped(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('button, h1, h2, h3, label, .stock-name, .seg button, .chip, .toast'))) {
      const style = getComputedStyle(el);
      if (style.display === 'none' || el.offsetParent === null) continue;
      if (el.scrollWidth > el.clientWidth + 1 && style.overflowX !== 'auto' && !el.classList.contains('stock-strip')) {
        out.push(`${el.tagName.toLowerCase()}.${el.className}: "${el.textContent?.trim().slice(0, 30)}"`);
      }
    }
    return out;
  });
}

test('Korean locale: auto-detected, no clipped labels on any screen', async ({ page }) => {
  const problems: string[] = [];
  const snap = async (name: string) => {
    await page.waitForTimeout(300);
    await page.screenshot({ path: `e2e/.shots/ko-${name}.png` });
    problems.push(...(await clipped(page)).map((p) => `${name}: ${p}`));
  };
  await page.goto('./');
  await expect(page.getByText('필름처럼 찍고')).toBeVisible();
  await snap('onboarding');
  await page.getByTestId('onb-skip').click();
  await expect(page.getByText('카메라를 고르세요')).toBeVisible();
  await snap('camera');
  await loadRoll(page, 'neon800t', '24');
  await shoot(page, 2);
  await snap('shooting');
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await snap('confirm');
  await page.getByTestId('confirm-ok').click();
  await snap('speed');
  await page.getByTestId('speed-morning').click();
  await snap('lab');
  await page.getByTestId('btn-rush').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('tab-gallery').click();
  await snap('gallery');
  await page.getByTestId('roll-card').locator('.roll-meta').click();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(2, { timeout: 30_000 });
  await snap('roll');
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible();
  await page.waitForTimeout(1300);
  await snap('photo');
  await page.getByTestId('btn-darkroom').click();
  await snap('darkroom');
  await page.getByTestId('tab-analog').click();
  await snap('analog');
  await page.getByTestId('tab-settings').click();
  await snap('settings');
  console.log(problems.join('\n'));
  expect(problems).toEqual([]);
});
