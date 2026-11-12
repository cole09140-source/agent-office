import { expect, type Page } from '@playwright/test';

/**
 * Opens the app and skips onboarding. By default the daily free-shot limit is lifted (web-only QA
 * hatch localStorage['fc-unlimited']='1', see src/monetize/config.ts) so long shooting tests are not
 * stopped after 10 shots; pass { unlimited: false } to test the limit itself.
 */
export async function start(page: Page, path = './', opts: { unlimited?: boolean } = {}) {
  const unlimited = opts.unlimited ?? true;
  await page.addInitScript((on: boolean) => {
    try {
      if (on) localStorage.setItem('fc-unlimited', '1');
      else localStorage.removeItem('fc-unlimited');
    } catch {
      /* storage blocked: the test decides what it expects */
    }
  }, unlimited);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  await page.goto(path);
  const onb = page.getByTestId('onboarding');
  await expect(onb).toBeVisible();
  await page.getByTestId('onb-skip').click();
  await expect(onb).toBeHidden();
  return errors;
}

/**
 * Picks a film for the camera in use through the camera sheet (the camera is always loaded now:
 * there is no roll size to choose). `_size` is kept so older call sites still read the same.
 */
export async function loadRoll(page: Page, stock = 'sunny200', _size?: string) {
  await expect(page.getByTestId('shutter')).toBeEnabled();
  await pickFilm(page, stock);
}

/** Opens the camera sheet, picks `stock` if this camera takes it, and closes the sheet again. */
export async function pickFilm(page: Page, stock: string) {
  await page.getByTestId('roll-btn').click();
  const sheet = page.getByTestId('roll-sheet');
  await expect(sheet).toBeVisible();
  const chip = sheet.getByTestId(`stock-${stock}`);
  if ((await chip.count()) && (await chip.getAttribute('aria-checked')) !== 'true') {
    await chip.click();
    await expect(chip).toHaveAttribute('aria-checked', 'true');
  }
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(page.getByTestId('shutter')).toBeEnabled();
}

export async function shoot(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    const before = await page.getByTestId('counter').textContent();
    await page.getByTestId('shutter').click();
    await expect(page.getByTestId('counter')).not.toHaveText(before ?? '');
  }
}

/** Picks a camera on the strip under the viewfinder (and optionally its film); it is ready at once. */
export async function loadCamera(page: Page, cameraId: string, opts: { stock?: string; size?: string } = {}) {
  await page.getByTestId(`camera-${cameraId}`).click();
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', cameraId);
  await expect(page.getByTestId(`camera-${cameraId}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('shutter')).toBeEnabled();
  // The strip settles on the picked camera (no later pick from the drag that scrolled it into view).
  await page.waitForTimeout(400);
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', cameraId);
  if (opts.stock) await pickFilm(page, opts.stock);
}

/** Opens the photos of the camera in use (they are in the album as soon as they are taken). */
export async function rewindAndDevelop(page: Page) {
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-open-roll').click();
  await expect(page.getByTestId('roll-screen')).toBeVisible();
  await expect(page.locator('[data-testid=thumb] img').first()).toBeVisible({ timeout: 45_000 });
}
