import { expect, test, type Page } from '@playwright/test';
import { loadRoll, rewindAndDevelop, shoot, start } from './helpers';

/** The 10 UI languages: picker value, <html lang>, endonym in the picker. */
const LANGS: [code: string, htmlLang: string, endonym: string][] = [
  ['ko', 'ko', '한국어'],
  ['en', 'en', 'English'],
  ['ja', 'ja', '日本語'],
  ['zh', 'zh-CN', '简体中文'],
  ['es', 'es', 'Español'],
  ['fr', 'fr', 'Français'],
  ['pt', 'pt-BR', 'Português (Brasil)'],
  ['ru', 'ru', 'Русский'],
  ['hi', 'hi', 'हिन्दी'],
  ['ar', 'ar', 'العربية'],
];
const TABS = ['camera', 'models', 'gallery', 'analog', 'settings'];
const PREFIXES = 'app|tab|common|cam|lab|gal|onb|speed|dr|view|roll|set|an|a11y|palette|share|hint|err|update|toast|dur|wait|stock|era|quota|my|pw|shots';

/** Raw keys, unfilled placeholders and plural syntax left in the visible text or labels. */
async function leaks(page: Page, where: string): Promise<string[]> {
  const text = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('[aria-label],[title],[placeholder],img[alt]')).map((el) =>
      ['aria-label', 'title', 'placeholder', 'alt'].map((a) => el.getAttribute(a) ?? '').join(' '),
    );
    return `${document.body.innerText}\n${labels.join('\n')}`;
  });
  const out = [
    ...(text.match(new RegExp(`\\b(?:${PREFIXES})\\.[a-zA-Z][\\w.]*`, 'g')) ?? []),
    ...(text.match(/\{[a-zA-Z]+\}/g) ?? []),
    ...(text.match(/,\s*plural\s*,|\{\w+:[^}]*\|/g) ?? []),
  ];
  return out.map((m) => `${where}: ${m}`);
}

async function pickLang(page: Page, code: string, htmlLang: string) {
  await page.getByTestId('tab-settings').click();
  const option = page.getByTestId('lang-picker').locator(`[data-value="${code}"]`);
  await option.click();
  await expect(option).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).toHaveAttribute('lang', htmlLang);
  await expect(page.locator('html')).toHaveAttribute('dir', code === 'ar' ? 'rtl' : 'ltr');
}

test('all 10 languages: picker, lang/dir, every screen without raw keys or console errors', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 2);
  await rewindAndDevelop(page);
  // A second roll still in the camera, so camera / lab / album show their "in camera" texts.
  await page.getByTestId('tab-camera').click();
  await loadRoll(page, 'mono400', '24');
  await shoot(page, 1);

  const problems: string[] = [];
  const shot = async (code: string, name: string) => {
    if (code === 'ar' || code === 'hi' || code === 'ru') await page.screenshot({ path: `e2e/.shots/lang-${code}-${name}.png` });
  };

  // The picker lists the endonyms, each marked with its own language.
  await page.getByTestId('tab-settings').click();
  for (const [code, htmlLang, endonym] of LANGS) {
    const option = page.getByTestId('lang-picker').locator(`[data-value="${code}"]`);
    await expect(option).toHaveText(endonym);
    await expect(option.locator('.seg-label')).toHaveAttribute('lang', htmlLang);
  }
  await expect(page.getByTestId('lang-picker').getByRole('radio')).toHaveCount(11);

  for (const [code, htmlLang] of LANGS) {
    await pickLang(page, code, htmlLang);
    // The tab bar is translated for every language (tab labels ship with each locale file).
    if (code !== 'en') await expect(page.getByTestId('tab-camera')).not.toHaveText('Camera');
    for (const tab of TABS) {
      await page.getByTestId(`tab-${tab}`).click();
      await page.waitForTimeout(150);
      problems.push(...(await leaks(page, `${code}/${tab}`)));
      await shot(code, tab);
    }
    // Album → roll → photo → darkroom.
    await page.getByTestId('tab-gallery').click();
    await page.getByTestId('roll-card').filter({ hasNot: page.locator('.badge:not(.new)') }).first().locator('.roll-meta').click();
    await expect(page.getByTestId('roll-screen')).toBeVisible();
    problems.push(...(await leaks(page, `${code}/roll`)));
    await page.getByTestId('thumb').first().click();
    await expect(page.getByTestId('print')).toBeVisible();
    problems.push(...(await leaks(page, `${code}/photo`)));
    await shot(code, 'photo');
    await page.getByTestId('btn-darkroom').click();
    await page.waitForTimeout(300);
    problems.push(...(await leaks(page, `${code}/darkroom`)));
    await shot(code, 'darkroom');
    // Roll sheet on the camera, then the intro.
    await page.getByTestId('tab-camera').click();
    await page.getByTestId('roll-btn').click();
    await expect(page.getByTestId('roll-sheet')).toBeVisible();
    problems.push(...(await leaks(page, `${code}/roll-sheet`)));
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('roll-sheet')).toBeHidden();
    await page.getByTestId('tab-settings').click();
    await page.getByTestId('btn-replay-intro').click();
    await expect(page.getByTestId('onboarding')).toBeVisible();
    problems.push(...(await leaks(page, `${code}/onboarding`)));
    await shot(code, 'onboarding');
    await page.getByTestId('onb-skip').click();
  }

  // "System" follows the device language again (en-US here) and survives a reload.
  await page.getByTestId('tab-settings').click();
  await page.getByTestId('lang-picker').locator('[data-value="ru"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  await expect(page.getByTestId('tab-camera')).toHaveText('Камера');
  await page.getByTestId('tab-settings').click();
  await page.getByTestId('lang-picker').locator('[data-value="auto"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  console.log(problems.join('\n'));
  expect(problems).toEqual([]);
  expect(errors).toEqual([]);
});

test('Arabic: right-to-left layout, mirrored arrows and swipes, unmirrored viewfinder', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 3);
  await rewindAndDevelop(page);
  await pickLang(page, 'ar', 'ar');
  await page.setViewportSize({ width: 360, height: 740 });

  // No horizontal page overflow at 360 px on any tab.
  for (const tab of TABS) {
    await page.getByTestId(`tab-${tab}`).click();
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, tab).toBeLessThanOrEqual(1);
  }

  // Tab bar runs right to left: Camera is the rightmost tab.
  const cam = await page.getByTestId('tab-camera').boundingBox();
  const set = await page.getByTestId('tab-settings').boundingBox();
  expect(cam!.x).toBeGreaterThan(set!.x);

  // The viewfinder keeps left-to-right.
  await page.getByTestId('tab-camera').click();
  await loadRoll(page, 'mono400', '24');
  expect(await page.locator('.viewfinder').evaluate((el) => getComputedStyle(el).direction)).toBe('ltr');

  // Settings chevrons point the reading direction (mirrored).
  await page.getByTestId('tab-settings').click();
  const chevron = page.locator('.page.settings .icon-chevron').first();
  expect(await chevron.evaluate((el) => getComputedStyle(el).transform)).toMatch(/^matrix\(-1/);

  // Photo viewer: "next" sits on the left; ArrowLeft and a left-to-right swipe go to the next photo.
  await page.getByTestId('tab-gallery').click();
  await page.getByTestId('roll-card').first().locator('.roll-meta').click();
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible();
  const next = await page.getByTestId('btn-next').boundingBox();
  expect(next!.x).toBeLessThan(180);
  const pos = async () => (await page.locator('header').first().innerText()).match(/(\d+) \/ (\d+)/)?.[1];
  expect(await pos()).toBe('1');
  await page.keyboard.press('ArrowLeft');
  await expect.poll(pos).toBe('2');
  await page.keyboard.press('ArrowRight');
  await expect.poll(pos).toBe('1');
  // Swipe from left to right = next in RTL.
  const box = (await page.getByTestId('print').boundingBox())!;
  const y = box.y + box.height / 2;
  await page.evaluate(
    ({ x0, x1, y }) => {
      const el = document.querySelector('.viewer-stage')!;
      const touch = (x: number) => new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
      const target = el;
      target.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [touch(x0)], changedTouches: [touch(x0)] }));
      target.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [touch(x1)] }));
    },
    { x0: box.x + 20, x1: box.x + box.width - 20, y },
  );
  await expect.poll(pos).toBe('2');

  // Darkroom sliders: the filled part of the track starts at the right.
  await page.getByTestId('btn-darkroom').click();
  const fill = await page.locator('input[type=range]').first().evaluate((el) => getComputedStyle(el).getPropertyValue('--range-fill').trim());
  expect(fill).toBe('left');
  await page.screenshot({ path: 'e2e/.shots/lang-ar-darkroom-360.png' });
  expect(errors).toEqual([]);
});

test('a language picked offline still loads (locale chunks are precached)', async ({ page, context }) => {
  await start(page);
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await pickLang(page, 'hi', 'hi');
  await expect(page.getByTestId('tab-camera')).toHaveText('कैमरा');
  await pickLang(page, 'zh', 'zh-CN');
  await expect(page.getByTestId('tab-camera')).toHaveText('相机');
  await context.setOffline(false);
});
