import { expect, test } from '@playwright/test';
import { loadCamera, loadRoll, rewindAndDevelop, shoot, start } from './helpers';

test('shoot 12 → straight to the album → view → darkroom → contact sheet → delete', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e/.shots/02-camera-loaded.png' });
  await shoot(page, 12);
  // No roll size and no lab: the last shot is already a thumbnail next to the shutter.
  await expect(page.getByTestId('last-shot').locator('img').first()).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'e2e/.shots/03-after-12.png' });
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-open-roll').click();

  await expect(page.getByTestId('roll-screen')).toBeVisible();
  const thumbs = page.getByTestId('thumb');
  await expect(thumbs).toHaveCount(12);
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(12, { timeout: 45_000 });
  await page.screenshot({ path: 'e2e/.shots/04-roll.png' });

  await thumbs.first().click();
  await expect(page.getByTestId('print')).toBeVisible();
  const src1 = await page.getByTestId('print').getAttribute('src');
  const dims = await page.getByTestId('print').evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
  expect(dims[0]).toBeGreaterThan(dims[1]); // landscape 3:2 from a 16:9 fake camera
  expect(dims[0] / dims[1]).toBeCloseTo(1.5, 1);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: 'e2e/.shots/05-photo.png' });

  await page.getByTestId('btn-darkroom').click();
  await expect(page.getByTestId('darkroom-screen')).toBeVisible();
  await page.getByTestId('stock-neon800t').click();
  await page.getByTestId('sl-push').fill('1.5');
  await page.getByTestId('sl-expired').fill('0.4');
  await page.getByTestId('tg-date').check({ force: true });
  await page.getByRole('radio', { name: '35mm' }).click();
  // rotate twice (180°) keeps landscape; once makes it portrait — checked below
  await page.getByTestId('btn-rotate').click();
  await page.getByTestId('btn-rotate').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'e2e/.shots/06-darkroom.png', fullPage: true });
  await page.getByTestId('btn-dr-save').click();

  await expect(page.getByTestId('photo-screen')).toBeVisible();
  await expect(page.getByTestId('print')).toBeVisible();
  await expect.poll(async () => page.getByTestId('print').getAttribute('src')).not.toBe(src1);
  const dims2 = await page.getByTestId('print').evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
  expect(dims2[1]).toBeGreaterThan(dims[1]); // 35mm border adds bands
  await page.waitForTimeout(1300);
  await page.screenshot({ path: 'e2e/.shots/07-redeveloped.png' });

  // Save downloads the print
  const dl = page.waitForEvent('download');
  await page.getByTestId('btn-save').click();
  expect((await dl).suggestedFilename()).toMatch(/^FilmCamela_\d{8}_\d{6}_\d{2,}\.jpg$/);

  // swipe to next via button, then delete
  await page.getByTestId('btn-next').click();
  await expect(page.getByTestId('photo-screen')).toBeVisible();
  await page.getByTestId('btn-delete').click();
  await page.getByTestId('confirm-ok').click();
  await expect(page.getByTestId('photo-screen')).toBeVisible();

  // contact sheet from the roll
  await page.goBack();
  await expect(page.getByTestId('roll-screen')).toBeVisible();
  await expect(page.getByTestId('thumb')).toHaveCount(11);
  await page.getByTestId('btn-contact').click();
  await expect(page.getByTestId('contact-sheet').locator('img')).toBeVisible({ timeout: 45_000 });
  const dl2 = page.waitForEvent('download');
  await page.getByTestId('btn-contact-save').click();
  const file = await dl2;
  expect(file.suggestedFilename()).toMatch(/^FilmCamela_contact_/);
  await file.saveAs('e2e/.shots/08-contact-sheet.jpg');
  expect(errors).toEqual([]);
});

test('camera strip: photos are in the album at once, a new camera starts a new group, #/lab opens the album', async ({ page }) => {
  const errors = await start(page);
  await expect(page.getByTestId('tab-lab')).toHaveCount(0);
  await loadRoll(page, 'mono400');
  await shoot(page, 3);
  // Already in the album, while the camera keeps shooting.
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toHaveCount(1);
  await expect(page.getByTestId('roll-card')).toContainText(/Mono\s400/);
  await page.getByTestId('tab-camera').click();
  await expect(page.getByTestId('counter')).toContainText('03');
  // Another camera on the strip: shots go to a new group, the first one stays as it was.
  await loadCamera(page, 'snap27');
  await expect(page.getByTestId('counter')).toContainText('00');
  await shoot(page, 2);
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toHaveCount(2);
  await expect(page.getByTestId('roll-card').first()).toContainText('Snap');
  await page.getByTestId('roll-card').last().locator('.roll-meta').click();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(3, { timeout: 30_000 });
  // Old lab links land in the album.
  await page.goto('./#/lab');
  await expect(page.getByTestId('gallery-screen')).toBeVisible();
  expect(errors).toEqual([]);
});

test('data persists across reloads and an unused camera leaves no empty album entry', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200');
  await shoot(page, 2);
  await page.reload();
  await expect(page.getByTestId('counter')).toContainText('02');
  await rewindAndDevelop(page);
  // a 3:2 frame from the landscape test sensor comes back landscape
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible();
  const [w, h] = await page.getByTestId('print').evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
  expect(w).toBeGreaterThan(h);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: 'e2e/.shots/10-instant.png' });
  // passing through cameras without shooting adds nothing to the album
  await page.getByTestId('tab-camera').click();
  await loadCamera(page, 'snap27');
  await loadCamera(page, 'instasq');
  await loadCamera(page, 'pro35');
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('import photos from the gallery and develop them', async ({ page }) => {
  const errors = await start(page);
  await page.getByTestId('tab-gallery').click();
  await page.getByTestId('btn-import').click();
  await page.getByTestId('import-sheet').getByTestId('stock-velvet50').click();
  // a tiny generated PNG plus a non-image that must be rejected gracefully
  const png = await page.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 800;
    c.height = 1000;
    const g = c.getContext('2d')!;
    const gr = g.createLinearGradient(0, 0, 800, 1000);
    gr.addColorStop(0, '#4aa3df');
    gr.addColorStop(1, '#f4c542');
    g.fillStyle = gr;
    g.fillRect(0, 0, 800, 1000);
    const b = await new Promise<Blob>((r) => c.toBlob((x) => r(x!), 'image/png'));
    return Array.from(new Uint8Array(await b.arrayBuffer()));
  });
  await page.getByTestId('import-input').setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: Buffer.from(png) },
    { name: 'broken.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not an image') },
  ]);
  await expect(page.getByTestId('roll-screen')).toBeVisible();
  await expect(page.getByText('This file could not be imported.')).toBeVisible();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(1, { timeout: 30_000 });
  await page.getByTestId('thumb').first().click();
  const [w, h] = await page.getByTestId('print').evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight]);
  expect(w).toBeGreaterThan(800); // print border (Velvet 50 default) around a portrait image
  expect(h).toBeGreaterThan(w);
  expect(errors.filter((e) => !e.includes('import failed'))).toEqual([]);
});

test('analog companion: Sunny 16 and film log CSV', async ({ page }) => {
  const errors = await start(page);
  await page.getByTestId('tab-analog').click();
  await page.getByTestId('iso-100').click();
  await page.getByTestId('ap-16').click();
  await page.getByTestId('meter-light').selectOption('sunny');
  await expect(page.getByTestId('meter-shutter')).toHaveText('1/125');
  await page.getByTestId('iso-400').click();
  await expect(page.getByTestId('meter-shutter')).toHaveText('1/500');
  await page.screenshot({ path: 'e2e/.shots/11-analog.png', fullPage: true });

  await page.getByTestId('btn-new-log').click();
  await page.getByTestId('log-camera').fill('Nikon FM2');
  await page.getByTestId('log-film').fill('Portra 400');
  await page.getByTestId('log-create').click();
  await expect(page.getByTestId('log-screen')).toBeVisible();
  for (const note of ['Han river', 'Cafe, window "light"']) {
    await page.getByTestId('btn-add-frame').click();
    await page.getByTestId('frame-note').fill(note);
    await page.getByTestId('frame-save').click();
  }
  await expect(page.getByTestId('log-frame')).toHaveCount(2);
  const dl = page.waitForEvent('download');
  await page.getByTestId('btn-csv').click();
  const path = await (await dl).path();
  const fs = await import('node:fs');
  const csv = fs.readFileSync(path!, 'utf8');
  expect(csv).toContain('Nikon FM2');
  expect(csv).toContain('"Cafe, window ""light"""');
  expect(csv.trim().split('\n')).toHaveLength(4);
  await page.reload();
  await expect(page.getByTestId('log-frame')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('settings: Korean UI, date stamp toggle, delete all data', async ({ page }) => {
  const errors = await start(page);
  await page.getByTestId('tab-settings').click();
  await page.getByRole('radio', { name: '한국어' }).click();
  await expect(page.getByTestId('tab-camera')).toContainText('카메라');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ko');
  await page.screenshot({ path: 'e2e/.shots/12-settings-ko.png', fullPage: true });
  await page.getByTestId('tab-camera').click();
  await expect(page.getByRole('group', { name: '카메라를 고르세요' })).toBeVisible();
  await page.reload();
  await expect(page.getByTestId('tab-camera')).toContainText('카메라');
  await page.getByTestId('tab-settings').click();
  await page.getByTestId('btn-reset').click();
  await page.getByTestId('confirm-ok').click();
  await expect(page.getByTestId('onboarding')).toBeVisible();
  expect(errors).toEqual([]);
});

test('Models tab: every camera at a glance, a tap shoots with it at once; the tab bar is centred', async ({ page }) => {
  const errors = await start(page);
  // Five tabs, Models right next to Camera, spread evenly across the bar.
  const tabs = page.locator('.tabbar button');
  await expect(tabs).toHaveCount(5);
  await expect(tabs.nth(1)).toHaveAttribute('data-testid', 'tab-models');
  const xs = await tabs.evaluateAll((els) => els.map((el) => el.getBoundingClientRect()).map((r) => [r.left, r.right]));
  const vw = page.viewportSize()!.width;
  expect(Math.abs(xs[0][0] - (vw - xs[4][1]))).toBeLessThanOrEqual(2);
  await page.getByTestId('tab-models').click();
  await expect(page.getByTestId('models-screen')).toBeVisible();
  await expect(page.locator('[data-testid^="model-"]')).toHaveCount(32);
  await page.getByTestId('model-instasq').click();
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', 'instasq');
  await expect(page.getByTestId('camera-instasq')).toHaveAttribute('aria-pressed', 'true');
  await shoot(page, 1);
  // Back in Models, the camera in use is marked.
  await page.getByTestId('tab-models').click();
  await expect(page.getByTestId('model-instasq')).toHaveAttribute('aria-current', 'true');
  expect(errors).toEqual([]);
});

test('GPT QA fixes: same camera from Models keeps its film; a sheet open blocks the Space shutter; pins keep the ring on the camera in use', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'mono400');
  await page.getByTestId('tab-models').click();
  await page.getByTestId('model-pro35').click();
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', 'pro35');
  await page.getByTestId('roll-btn').click();
  await expect(page.getByTestId('roll-sheet').getByTestId('stock-mono400')).toHaveAttribute('aria-checked', 'true');
  // Space while a sheet is open does not take a picture.
  await page.locator('[data-testid=roll-sheet] .muted').first().click();
  await page.keyboard.press(' ');
  await page.waitForTimeout(800);
  await expect(page.getByTestId('counter')).toContainText('00');
  // Pinning reorders the strip; the camera in use stays under the centre ring.
  await page.getByTestId('roll-sheet').getByTestId('pin-pro35').click();
  await page.keyboard.press('Escape');
  await loadCamera(page, 'curve07');
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('roll-sheet').getByTestId('pin-curve07').click();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const off = await page.evaluate(() => {
    const s = document.querySelector('.cam-rail-strip')!.getBoundingClientRect();
    const c = document.querySelector('.cam-rail-cell.on')!.getBoundingClientRect();
    return Math.abs(c.left + c.width / 2 - (s.left + s.width / 2));
  });
  expect(off).toBeLessThan(4);
  expect(errors).toEqual([]);
});

test('a new day starts a new album group for the same camera', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-11-12T22:00:00') });
  const errors = await start(page);
  await loadRoll(page, 'sunny200');
  await shoot(page, 2);
  await page.clock.fastForward(12 * 3600_000); // the next morning, app left open
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await expect(page.getByTestId('counter')).toContainText('00', { timeout: 10_000 });
  await shoot(page, 1);
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toHaveCount(2);
  // Each group is dated by the day its photos were taken (not the day it was closed).
  await expect(page.getByTestId('roll-card').last()).toContainText('Nov 12');
  await expect(page.getByTestId('roll-card').first()).toContainText('Nov 13');
  expect(errors).toEqual([]);
});

test('QA: no duplicate camera name or all-cameras button; a press right after a switch is taken with the new camera; the shutter row stays', async ({ page }) => {
  const errors = await start(page);
  await loadCamera(page, 'zonelc');
  // No camera name in the top bar and no "all cameras" button on the strip (Models covers it).
  await expect(page.getByTestId('camera-chip')).toHaveCount(0);
  await expect(page.getByTestId('btn-all-cameras')).toHaveCount(0);
  await loadCamera(page, 'toy120');
  // Switch and press at once: the shutter row never goes away, and the press lands on the new camera.
  const seen = await page.evaluate(async () => {
    let missing = 0;
    (document.querySelector('[data-testid=camera-pro35]') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 30));
    (document.querySelector('[data-testid=shutter]') as HTMLElement | null)?.click();
    const t0 = performance.now();
    while (performance.now() - t0 < 1500) {
      if (!document.querySelector('[data-testid=shutter]')) missing++;
      await new Promise((r) => requestAnimationFrame(r));
    }
    return missing;
  });
  expect(seen, 'frames without a shutter during the switch').toBe(0);
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', 'pro35');
  await expect(page.getByTestId('counter')).toContainText('01', { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('QA: the digicam readout counts shots (never 999); deleting a photo updates the album card of the camera in use', async ({ page }) => {
  const errors = await start(page);
  await loadCamera(page, 'ccd03');
  await expect(page.locator('.lcd-tr')).toContainText('00');
  await shoot(page, 2);
  await expect(page.locator('.lcd-tr')).toContainText('02');
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toContainText('2 frames');
  await page.getByTestId('roll-card').locator('.roll-meta').click();
  await expect(page.locator('[data-testid=thumb] img').first()).toBeVisible({ timeout: 30_000 });
  await page.getByTestId('thumb').first().click();
  await page.getByTestId('btn-delete').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toContainText('1 frame');
  await expect(page.getByTestId('roll-card')).not.toContainText('2 frames');
  // The empty thumbnail slot of a camera with no shots leads to the album.
  await page.getByTestId('tab-camera').click();
  await loadCamera(page, 'pro35');
  await page.getByTestId('btn-last-album').click();
  await expect(page.getByTestId('gallery-screen')).toBeVisible();
  expect(errors).toEqual([]);
});

test('album folders: all photos and one folder per camera, newest first, grouped by day', async ({ page }) => {
  const errors = await start(page);
  await shoot(page, 2);
  await loadCamera(page, 'ccd03');
  await shoot(page, 1);
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('folder-all')).toContainText('3 frames');
  await expect(page.getByTestId('folder-pro35')).toContainText('2 frames');
  await expect(page.getByTestId('folder-ccd03')).toContainText('1 frame');
  await page.getByTestId('folder-all').locator('.folder-meta').click();
  await expect(page.getByTestId('folder-screen')).toBeVisible();
  await expect(page.locator('.folder-day')).toHaveCount(1);
  await expect(page.getByTestId('thumb')).toHaveCount(3);
  await page.goBack();
  await page.getByTestId('folder-ccd03').locator('.folder-meta').click();
  await expect(page.getByTestId('thumb')).toHaveCount(1);
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});
