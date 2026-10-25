import { execSync } from 'node:child_process';
import { expect, test } from '@playwright/test';
import { loadRoll, shoot, start } from './helpers';

test('no CSP violations during a full session', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  await start(page);
  await loadRoll(page, 'insta600', '12');
  await shoot(page, 1);
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-instant').click();
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible();
  await page.getByTestId('btn-darkroom').click();
  await expect(page.getByTestId('dr-canvas')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([]);
});

test('user text is never interpreted as HTML', async ({ page }) => {
  let dialogs = 0;
  page.on('dialog', (d) => {
    dialogs++;
    void d.dismiss();
  });
  await start(page);
  await page.getByTestId('tab-analog').click();
  await page.getByTestId('btn-new-log').click();
  const evil = '<img src=x onerror=alert(1)><script>alert(2)</script>';
  await page.getByTestId('log-camera').fill(evil);
  await page.getByTestId('log-film').fill(evil);
  await page.getByTestId('log-create').click();
  await page.getByTestId('btn-add-frame').click();
  await page.getByTestId('frame-note').fill(evil);
  await page.getByTestId('frame-save').click();
  await expect(page.getByTestId('log-frame')).toContainText('<img src=x');
  await page.waitForTimeout(500);
  expect(dialogs).toBe(0);
  expect(await page.locator('img[src=x]').count()).toBe(0);
});

test('manifest and icons are valid for installation', async ({ page, request }) => {
  await page.goto('./');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  const res = await request.get(new URL(href!, page.url()).toString());
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBeTruthy();
  expect(m.display).toBe('standalone');
  expect(m.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const icon of m.icons) {
    const r = await request.get(new URL(icon.src, new URL(href!, page.url())).toString());
    expect(r.ok(), icon.src).toBe(true);
  }
  for (const p of ['privacy.html', 'terms.html', 'licenses.html', 'legal.css', 'icons/apple-touch-icon.png', 'icons/og.png']) {
    expect((await request.get(new URL(p, page.url()).toString())).ok(), p).toBe(true);
  }
});

test('a new deploy shows the update bar and reloads into the new version', async ({ page }) => {
  await start(page);
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const before = await page.evaluate(async () => (await fetch('./sw.js', { cache: 'no-store' })).text());
  execSync('npx vite build', { stdio: 'ignore' }); // new sw.js version
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update());
  await expect(page.locator('.update-bar')).toBeVisible({ timeout: 20_000 });
  await page.screenshot({ path: 'e2e/.shots/15-update.png' });
  const reload = page.waitForEvent('load');
  await page.locator('.update-bar button').click();
  await reload;
  const after = await page.evaluate(async () => (await fetch('./sw.js', { cache: 'no-store' })).text());
  expect(after).not.toBe(before);
  await expect(page.getByTestId('camera-screen')).toBeVisible();
});
