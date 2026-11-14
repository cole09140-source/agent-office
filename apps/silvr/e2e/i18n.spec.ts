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
      // Measure the content itself: scrollWidth also counts the chips' ::after hit area (inset −2px).
      // Screen-reader-only text (.sr-only, 1px and clipped) is not part of the visible label.
      const rects = Array.from(el.childNodes)
        .filter((n) => !(n instanceof HTMLElement && n.classList.contains('sr-only')))
        .map((n) => {
          const range = document.createRange();
          range.selectNodeContents(n);
          return range.getBoundingClientRect();
        })
        .filter((r) => r.width > 0);
      const content = rects.length ? Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left)) : 0;
      const box = el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (content > box + 1 && style.overflowX !== 'auto' && !el.classList.contains('stock-strip')) {
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
  await expect(page.getByText('필름처럼, 한 장씩')).toBeVisible();
  await snap('onboarding');
  await page.getByTestId('onb-skip').click();
  await expect(page.getByRole('group', { name: '카메라를 고르세요' })).toBeVisible();
  await snap('camera');
  await loadRoll(page, 'neon800t', '24');
  await shoot(page, 2);
  await snap('shooting');
  await page.getByTestId('roll-btn').click();
  await snap('camera-sheet');
  await page.keyboard.press('Escape');
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
