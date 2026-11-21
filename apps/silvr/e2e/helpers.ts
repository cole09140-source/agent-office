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

/**
 * Opens the camera's "more" popover (format, zoom, EV, palette, date, grid live there since the
 * 2026-11 deck redesign); a no-op when it is already open. Waits while the deck is locked by a capture.
 */
export async function openMore(page: Page) {
  const more = page.getByTestId('btn-more');
  if ((await more.getAttribute('aria-expanded')) !== 'true') await more.click();
  await expect(page.getByTestId('cam-more')).toBeVisible();
}

/** Picks a camera on the strip under the viewfinder (and optionally its film); it is ready at once. */
export async function loadCamera(page: Page, cameraId: string, opts: { stock?: string; size?: string } = {}) {
  // Tapping the camera already in use opens its film sheet instead, so only tap another one.
  if ((await page.getByTestId(`camera-${cameraId}`).getAttribute('aria-pressed')) !== 'true') await page.getByTestId(`camera-${cameraId}`).click();
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', cameraId);
  await expect(page.getByTestId(`camera-${cameraId}`)).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('shutter')).toBeEnabled();
  // The strip settles on the picked camera (no later pick from the drag that scrolled it into view).
  await page.waitForTimeout(400);
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', cameraId);
  if (opts.stock) await pickFilm(page, opts.stock);
}

/** Opens the photos of the camera in use: the newest group in the album. */
export async function openCurrentRoll(page: Page) {
  await openTab(page, 'gallery');
  await page.getByTestId('roll-card').first().locator('.roll-meta').click();
  await expect(page.getByTestId('roll-screen')).toBeVisible();
}

/** Opens one settings group (MY tab) as its sheet. */
export async function openSetting(page: Page, key: 'lang' | 'shoot' | 'date' | 'backup' | 'storage' | 'about') {
  await openTab(page, 'settings');
  await page.getByTestId(`set-row-${key}`).click();
  await expect(page.getByTestId(`sheet-${key}`)).toBeVisible();
}

export async function closeSheet(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(350);
}

/** Opens the photos of the camera in use (they are in the album as soon as they are taken). */
export async function rewindAndDevelop(page: Page) {
  await openCurrentRoll(page);
  await expect(page.locator('[data-testid=thumb] img').first()).toBeVisible({ timeout: 45_000 });
}

/**
 * Goes to a top-level screen the way a landscape user does (the app is landscape-only, there is no tab bar):
 * from the camera through the gear menu, back to the camera with the header's camera button, otherwise by
 * the route (pushed screens such as a photo have their own back buttons). Uses the tab bar if it is shown.
 */
export async function openTab(page: Page, name: 'camera' | 'models' | 'gallery' | 'analog' | 'settings') {
  const tab = page.getByTestId(`tab-${name}`);
  if (await tab.isVisible().catch(() => false)) {
    await tab.click();
    return;
  }
  const onCamera = await page.getByTestId('camera-screen').isVisible().catch(() => false);
  if (name === 'camera') {
    if (onCamera) return;
    const home = page.getByTestId('btn-to-camera');
    if (await home.isVisible().catch(() => false)) {
      await home.click();
      return;
    }
  } else if (onCamera) {
    const more = page.getByTestId('btn-more');
    if (await more.isEnabled().catch(() => false)) {
      if ((await more.getAttribute('aria-expanded')) !== 'true') await more.click();
      await page.getByTestId(`more-nav-${name}`).click();
      return;
    }
  }
  await page.evaluate((n) => {
    location.hash = `#/${n}`;
  }, name);
}
