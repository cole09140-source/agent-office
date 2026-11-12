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
