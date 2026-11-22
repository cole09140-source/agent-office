import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { start } from '../../e2e/helpers';

// Two clips per language, saved as timestamped JPEG frames (CDP screencast) that compose.mjs resamples:
//   shoot/   one shutter press, the shot in the corner, then the album folders and one folder
//   switch/  the camera strip: four bodies in a row, the viewfinder changing with each
const OUT = process.env.OUT ?? 'promo-clips';

async function record(page: Page, dir: string, run: () => Promise<void>) {
  mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames: { t: number; data: string }[] = [];
  cdp.on('Page.screencastFrame', (f) => {
    frames.push({ t: f.metadata.timestamp ?? Date.now() / 1000, data: f.data });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined);
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1170, maxHeight: 2280, everyNthFrame: 1 });
  await page.waitForTimeout(300);
  await run();
  await page.waitForTimeout(300);
  await cdp.send('Page.stopScreencast');
  const t0 = frames[0].t;
  const list = frames.map((f, i) => {
    const name = `${String(i).padStart(4, '0')}.jpg`;
    writeFileSync(join(dir, name), Buffer.from(f.data, 'base64'));
    return { file: name, t: +(f.t - t0).toFixed(3) };
  });
  writeFileSync(join(dir, 'frames.json'), JSON.stringify(list));
}

async function shoot(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    const before = await page.getByTestId('counter').textContent();
    await page.getByTestId('shutter').click();
    await expect(page.getByTestId('counter')).not.toHaveText(before ?? '');
    await page.waitForTimeout(900); // a different scene photo each time
  }
}

async function use(page: Page, id: string) {
  if ((await page.getByTestId(`camera-${id}`).getAttribute('aria-pressed')) !== 'true') await page.getByTestId(`camera-${id}`).click();
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', id);
  await expect(page.getByTestId('shutter')).toBeEnabled();
  await page.waitForTimeout(500);
}

async function quiet(page: Page) {
  for (const c of await page.getByTestId('toast-close').all()) await c.click().catch(() => undefined);
  await expect(page.getByTestId('toast')).toHaveCount(0, { timeout: 6000 }).catch(() => undefined);
}

test('promo clips', async ({ page }, info) => {
  const dir = join(OUT, info.project.name);
  await start(page);
  // A few shots on several bodies first, so the album has folders to show.
  for (const [id, n] of [['ccd03', 2], ['fish180', 2], ['instasq', 1], ['pro35', 3]] as const) {
    await use(page, id);
    await shoot(page, n);
  }
  await quiet(page);
  await page.waitForTimeout(2500);

  // Shoot first: Pro 35 still holds its group (a camera switch starts a new one), so its thumbnail shows.
  await record(page, join(dir, 'shoot'), async () => {
    await page.waitForTimeout(600);
    await page.getByTestId('shutter').click();
    await page.waitForTimeout(1900);
    await page.getByTestId('tab-gallery').click();
    await expect(page.getByTestId('folder-row')).toBeVisible();
    await page.waitForTimeout(1600);
    await page.getByTestId('folder-row').locator('.folder-meta').nth(1).click();
    await expect(page.getByTestId('folder-screen')).toBeVisible();
    await page.waitForTimeout(1600);
  });

  await page.getByTestId('tab-camera').click();
  await expect(page.getByTestId('shutter')).toBeEnabled();
  await quiet(page);
  await page.waitForTimeout(2000);
  await record(page, join(dir, 'switch'), async () => {
    await page.waitForTimeout(300);
    for (const id of ['snap27', 'instasq', 'half72', 'fish180']) {
      await page.getByTestId(`camera-${id}`).click();
      await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', id);
      await page.waitForTimeout(1250);
    }
  });

});
