import { expect, test } from '@playwright/test';
import { loadRoll, shoot, start } from './helpers';

test('storage full: the shot fails gracefully with a clear message and nothing is half-saved', async ({ page }) => {
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 1);
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args: Parameters<IDBObjectStore['put']>) {
      if (this.name === 'blobs') throw new DOMException('full', 'QuotaExceededError');
      return put.apply(this, args);
    };
  });
  await page.getByTestId('shutter').click();
  await expect(page.getByText('Storage is full')).toBeVisible();
  await expect(page.getByTestId('counter')).toContainText('01'); // frame not consumed
  await expect(page.getByTestId('shutter')).toBeEnabled();
  await page.reload();
  await expect(page.getByTestId('counter')).toContainText('01');
});

test('two tabs stay in sync', async ({ context }) => {
  const a = await context.newPage();
  await start(a);
  const b = await context.newPage();
  await b.goto('./');
  await expect(b.getByTestId('load-panel')).toBeVisible();
  await loadRoll(a, 'mono400', '12');
  await expect(b.getByTestId('counter')).toBeVisible(); // B learns about A's roll
  await shoot(a, 1);
  await expect(b.getByTestId('counter')).toContainText('01');
});

test('a corrupt negative shows an error state instead of hanging', async ({ page }) => {
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 2);
  // Corrupt the first negative in storage.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('silvr');
        open.onsuccess = () => {
          const db = open.result;
          const t = db.transaction('blobs', 'readwrite');
          const s = t.objectStore('blobs');
          const keys = s.getAllKeys();
          keys.onsuccess = () => {
            const k = (keys.result as string[]).find((x) => x.endsWith(':neg'))!;
            s.put(new Blob(['garbage'], { type: 'image/jpeg' }), k);
          };
          t.oncomplete = () => resolve();
          t.onerror = () => reject(t.error);
        };
      }),
  );
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-instant').click();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator('.thumb-wait.err')).toHaveCount(1);
});
