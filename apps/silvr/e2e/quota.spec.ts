import { expect, test, type Page } from '@playwright/test';
import { loadRoll, shoot, start } from './helpers';

/** The stored quota record (IndexedDB silvr/kv['quota']). */
function readQuota(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ freeUsedToday: number; earnedBalance: number; adsWatchedToday: number; dayKey: string } | undefined>((resolve, reject) => {
        const open = indexedDB.open('silvr');
        open.onsuccess = () => {
          const r = open.result.transaction('kv').objectStore('kv').get('quota');
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        };
        open.onerror = () => reject(open.error);
      }),
  );
}

const EMPTY = /10 free shots|무료 10장/;

test('free tier: 10 shots a day, the 11th press is refused (QA hatch off)', async ({ page }) => {
  const errors = await start(page, './', { unlimited: false });
  expect(await page.evaluate(() => localStorage.getItem('fc-unlimited'))).toBeNull();
  await loadRoll(page, 'sunny200', '24');

  await shoot(page, 10);
  expect((await readQuota(page))?.freeUsedToday).toBe(10);

  const counter = (await page.getByTestId('counter').textContent()) ?? '';
  const paywall = page.getByTestId('paywall');
  await page.getByTestId('shutter').click();
  // Refused: the paywall sheet explains (no ad ever starts by itself).
  await expect(paywall).toBeVisible();
  await expect(paywall).toContainText(EMPTY);
  await expect(page.getByTestId('counter')).toHaveText(counter);
  await page.keyboard.press('Escape');
  await expect(paywall).toBeHidden();
  await expect(page.getByTestId('shutter')).toBeEnabled(); // refused, not stuck

  // The limit is stored, not per page load.
  await page.reload();
  await expect(page.getByTestId('shutter')).toBeEnabled();
  await page.getByTestId('shutter').click();
  await expect(paywall).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(paywall).toBeHidden();
  await expect(page.getByTestId('counter')).toHaveText(counter);
  const q = await readQuota(page);
  expect(q?.freeUsedToday).toBe(10);
  expect(q?.earnedBalance).toBe(0);

  // The web-only QA hatch (what every other spec runs with) lifts the limit without a reload.
  await page.evaluate(() => localStorage.setItem('fc-unlimited', '1'));
  await shoot(page, 1);
  expect((await readQuota(page))?.freeUsedToday).toBe(10); // unlimited presses are not counted

  expect(errors).toEqual([]);
});
