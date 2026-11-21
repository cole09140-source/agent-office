import { expect, test, type Locator, type Page } from '@playwright/test';
import { loadCamera, shoot, start } from './helpers';

/*
 * Landscape phone (project 'landscape-phone': Pixel 7 landscape, 863×360, isMobile): no tab bar, the camera
 * screen is home. Body art (half of its frame) + live preview | vertical mode dial | one quiet column:
 * settings (gear) · flash · timer · frame counter · last shot · flip · SHUTTER in the bottom-right corner.
 * Format, zoom, EV, palette, date, grid and the way to the other screens live in the gear panel.
 * The viewport comes from the project; nothing here sets it.
 */

type Box = { x: number; y: number; width: number; height: number };

async function box(l: Locator): Promise<Box> {
  const b = await l.boundingBox();
  expect(b, 'element has a box').not.toBeNull();
  return b!;
}
const cx = (b: Box) => b.x + b.width / 2;
const cy = (b: Box) => b.y + b.height / 2;
const overlaps = (a: Box, b: Box, slack = 0.5) =>
  a.x + a.width > b.x + slack && b.x + b.width > a.x + slack && a.y + a.height > b.y + slack && b.y + b.height > a.y + slack;

async function onScreen(page: Page, b: Box, what: string) {
  const vp = page.viewportSize()!;
  expect(b.x, `${what} left edge`).toBeGreaterThanOrEqual(-0.5);
  expect(b.y, `${what} top edge`).toBeGreaterThanOrEqual(-0.5);
  expect(b.x + b.width, `${what} right edge`).toBeLessThanOrEqual(vp.width + 0.5);
  expect(b.y + b.height, `${what} bottom edge`).toBeLessThanOrEqual(vp.height + 0.5);
}

/** The camera whose card sits in the middle of the vertical dial. */
async function centredCamera(page: Page): Promise<string | null> {
  return page.getByTestId('camera-rail').evaluate((rail) => {
    const strip = rail.querySelector<HTMLElement>('.cam-rail-strip')!;
    const s = strip.getBoundingClientRect();
    const mid = s.top + s.height / 2;
    let best: string | null = null;
    let dist = Infinity;
    for (const el of Array.from(strip.querySelectorAll<HTMLElement>('[data-camera]'))) {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < dist) {
        dist = d;
        best = el.dataset.camera ?? null;
      }
    }
    return best;
  });
}

/** The column, the shutter in its bottom-right corner, everything clear of the preview and of each other. */
async function checkColumn(page: Page) {
  const vp = page.viewportSize()!;
  // A body without a flash keeps an empty slot there (the timer stays where the thumb expects it).
  const hasFlash = (await page.getByTestId('btn-flash').count()) > 0;
  const ids = ['btn-more', ...(hasFlash ? ['btn-flash'] : []), 'btn-timer', 'counter', 'btn-flip', 'shutter'];
  const vf = await box(page.locator('.viewfinder'));
  const boxes: Record<string, Box> = {};
  for (const id of ids) {
    const l = page.getByTestId(id);
    await expect(l, `${id} exists exactly once`).toHaveCount(1);
    await expect(l).toBeVisible();
    const b = await box(l);
    await onScreen(page, b, id);
    expect(overlaps(b, vf), `${id} is not over the live preview`).toBe(false);
    boxes[id] = b;
  }
  // The last-shot slot: the last shot, or the way to the album before the first one.
  const playback = page.locator('[data-testid=last-shot], [data-testid=btn-last-album]');
  await expect(playback).toHaveCount(1);
  boxes.playback = await box(playback);
  await onScreen(page, boxes.playback, 'playback');
  expect(overlaps(boxes.playback, vf)).toBe(false);

  const keys = Object.keys(boxes);
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) expect(overlaps(boxes[keys[i]], boxes[keys[j]], 1), `${keys[i]} vs ${keys[j]}`).toBe(false);

  // Generous hit targets.
  for (const id of ['btn-more', 'btn-timer', 'btn-flip', 'playback', ...(hasFlash ? ['btn-flash'] : [])]) {
    expect(boxes[id].width, `${id} width`).toBeGreaterThanOrEqual(43.5);
    expect(boxes[id].height, `${id} height`).toBeGreaterThanOrEqual(43.5);
  }

  // Top to bottom: gear → flash / timer → counter → last shot / flip → shutter.
  expect(cy(boxes['btn-more'])).toBeLessThan(cy(boxes['btn-timer']));
  if (hasFlash) expect(Math.abs(cy(boxes['btn-flash']) - cy(boxes['btn-timer']))).toBeLessThan(2);
  expect(cy(boxes['btn-timer'])).toBeLessThan(cy(boxes.counter));
  expect(cy(boxes.counter)).toBeLessThan(cy(boxes.playback));
  expect(Math.abs(cy(boxes.playback) - cy(boxes['btn-flip']))).toBeLessThan(2);
  expect(cy(boxes.playback)).toBeLessThan(cy(boxes.shutter));

  // The shutter is the hero, in the bottom-right corner (under the right thumb).
  const sh = boxes.shutter;
  expect(sh.width).toBeGreaterThanOrEqual(60);
  for (const k of keys) if (k !== 'shutter') expect(sh.width, `shutter bigger than ${k}`).toBeGreaterThan(boxes[k].width);
  expect(sh.x + sh.width, 'shutter near the right edge').toBeGreaterThan(vp.width - 56);
  expect(sh.y + sh.height, 'shutter near the bottom edge').toBeGreaterThan(vp.height - 32);
  for (const k of keys) if (k !== 'shutter') expect(cy(sh), `shutter below ${k}`).toBeGreaterThan(cy(boxes[k]));
  return boxes;
}

test.beforeEach(async ({ page }) => {
  await start(page);
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-layout', 'landscape');
});

test('one column on the right, no tab bar, the preview big and clear of every control', async ({ page }) => {
  // Tele 20: flash, zoom, EV and three formats.
  await loadCamera(page, 'bridge09');
  await expect(page.getByTestId('camera-rail')).toHaveAttribute('data-axis', 'y');
  // No tab bar in phone landscape: the camera spans the full width.
  await expect(page.getByTestId('tab-camera')).toBeHidden();
  await checkColumn(page);

  // Format, zoom and EV are not on the column: they wait in the (closed) gear panel, once each.
  for (const id of ['btn-aspect', 'btn-zoom', 'btn-ev']) {
    await expect(page.getByTestId(id), `${id} once`).toHaveCount(1);
    await expect(page.getByTestId(id)).toBeHidden();
  }
  // The old D-pad / rocker / OK are gone; the film is on the selected dial card.
  await expect(page.locator('.dpad, .zoom-rocker, [data-testid=btn-film]')).toHaveCount(0);
  await expect(page.getByTestId('roll-btn')).toBeVisible();

  // Body | dial | column, left to right; nothing overlaps.
  const stage = await box(page.locator('.cam-stage'));
  const rail = await box(page.getByTestId('camera-rail'));
  const deck = await box(page.getByTestId('deck'));
  expect(overlaps(stage, rail)).toBe(false);
  expect(overlaps(stage, deck)).toBe(false);
  expect(overlaps(rail, deck)).toBe(false);
  expect(rail.x).toBeGreaterThan(stage.x);
  expect(deck.x).toBeGreaterThan(rail.x);
  expect(stage.x, 'the stage starts at the left edge (no rail)').toBeLessThan(24);

  // The visible half of the body fills the stage (contain) and frames a big preview.
  const art = await box(page.getByTestId('body-art'));
  expect(art.height >= stage.height - 2 || art.width >= stage.width - 2).toBe(true);
  const vf = await box(page.locator('.viewfinder'));
  expect(vf.x).toBeGreaterThanOrEqual(art.x - 1);
  expect(vf.x + vf.width).toBeLessThanOrEqual(art.x + art.width + 1);
  expect(vf.y).toBeGreaterThanOrEqual(art.y - 1);
  expect(vf.y + vf.height).toBeLessThanOrEqual(art.y + art.height + 1);
  expect(vf.width / art.width, 'preview takes most of the body').toBeGreaterThan(0.6);
  expect(vf.height / stage.height, 'preview takes most of the height').toBeGreaterThan(0.6);
  // No page scroll sideways.
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test('every body keeps the column layout (no flash slot, single format, instant, phone)', async ({ page }) => {
  for (const id of ['pro35', 'snap27', 'booth4', 'cine', 'flip03', 'aps97']) {
    await loadCamera(page, id);
    await checkColumn(page);
  }
});

test('shooting: a frame lands, the counter counts it, the last shot shows it', async ({ page }) => {
  await loadCamera(page, 'pro35');
  await expect(page.getByTestId('counter')).toContainText('00');
  await shoot(page, 1);
  await expect(page.getByTestId('counter')).toContainText('01');
  await expect(page.getByTestId('last-shot')).toBeVisible({ timeout: 15_000 });
  await onScreen(page, await box(page.getByTestId('last-shot')), 'last-shot');
  await shoot(page, 1);
  await expect(page.getByTestId('counter')).toContainText('02');
});

test('mode dial: vertical, tap picks, a drag picks the camera that stops in the ring, Up/Down step', async ({ page }) => {
  await loadCamera(page, 'pro35');
  // Cards stack top to bottom.
  const cells = page.locator('[data-testid=camera-rail] [data-camera]');
  const a = await box(cells.nth(0));
  const b = await box(cells.nth(1));
  expect(b.y).toBeGreaterThan(a.y + a.height - 1);
  expect(Math.abs(cx(a) - cx(b))).toBeLessThan(2);
  // The camera in use is centred in the dial.
  await expect.poll(() => centredCamera(page)).toBe('pro35');

  // Tap another card.
  await loadCamera(page, 'snap27');
  await expect.poll(() => centredCamera(page)).toBe('snap27');

  // Drag: the finger goes down on the dial, it scrolls two cards, the finger lifts → that camera is taken.
  const before = await page.getByTestId('camera-screen').getAttribute('data-camera');
  await page.getByTestId('camera-rail').evaluate((rail) => {
    const strip = rail.querySelector<HTMLElement>('.cam-rail-strip')!;
    strip.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
    strip.scrollTop += 150;
    strip.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }));
  });
  await expect(page.getByTestId('camera-screen')).not.toHaveAttribute('data-camera', before ?? '', { timeout: 5000 });
  const picked = await page.getByTestId('camera-screen').getAttribute('data-camera');
  await expect(page.getByTestId(`camera-${picked}`)).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => centredCamera(page)).toBe(picked);
  await expect(page.getByTestId('shutter')).toBeEnabled();

  // Keyboard: Down picks the next card below, Up the one above.
  const order = await cells.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.camera!));
  const at = order.indexOf(picked!);
  await page.getByTestId(`camera-${picked}`).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', order[at + 1]);
  await expect(page.getByTestId(`camera-${order[at + 1]}`)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', order[at]);
});

test('gear panel: opens leftwards on screen, holds format / zoom / EV / date / grid and the other screens', async ({ page }) => {
  await loadCamera(page, 'bridge09');
  const deck = await box(page.getByTestId('deck'));
  const gear = page.getByTestId('btn-more');
  await gear.click();
  await expect(gear).toHaveAttribute('aria-expanded', 'true');
  const menu = page.getByTestId('cam-more');
  await expect(menu).toBeVisible();
  const m = await box(menu);
  await onScreen(page, m, 'gear panel');
  expect(m.x + m.width).toBeLessThanOrEqual(deck.x + 1); // opens leftwards from the column
  // Every row is reachable: the panel scrolls when it is taller than the screen. (Scrolled with scrollTop:
  // repeated scrollIntoViewIfNeeded calls over the live WebGL preview have crashed the headless shell.)
  const rows = ['btn-aspect', 'btn-zoom', 'btn-ev', 'btn-date', 'btn-grid', 'more-nav-models', 'more-nav-gallery', 'more-nav-analog', 'more-nav-settings'];
  for (const end of [false, true]) {
    await menu.evaluate((el, toEnd) => (el.scrollTop = toEnd ? el.scrollHeight : 0), end);
    for (const id of end ? rows.slice(-4) : rows.slice(0, 3)) {
      const row = menu.getByTestId(id);
      await expect(row, `${id} in the panel`).toHaveCount(1);
      const r = await box(row);
      expect(r.y, `${id} inside the panel`).toBeGreaterThanOrEqual(m.y - 1);
      expect(r.y + r.height, `${id} inside the panel`).toBeLessThanOrEqual(m.y + m.height + 1);
      expect(r.height, `${id} hit target`).toBeGreaterThanOrEqual(43.5);
    }
  }
  await menu.evaluate((el) => (el.scrollTop = 0));
  for (const id of rows) await expect(menu.getByTestId(id)).toHaveCount(1);

  // Zoom and format step (zoom wraps back to wide).
  const zoom = page.getByTestId('btn-zoom');
  await expect(zoom).toHaveAttribute('aria-label', /1×/);
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-label', /2×/);
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-label', /4×/);
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-label', /1×/);
  const aspect = page.getByTestId('btn-aspect');
  const a0 = await aspect.getAttribute('aria-label');
  await aspect.click();
  await expect(aspect).not.toHaveAttribute('aria-label', a0 ?? '');

  // EV: the slider opens inside the panel, under its row; the panel stays open.
  const evBtn = page.getByTestId('btn-ev');
  await evBtn.click();
  await expect(evBtn).toHaveAttribute('aria-expanded', 'true');
  const ev = menu.getByTestId('ev-row');
  await expect(ev).toBeVisible();
  await expect(menu).toBeVisible();
  const e = await box(ev);
  await onScreen(page, e, 'EV slider');
  expect(e.y).toBeGreaterThan((await box(evBtn)).y);
  await evBtn.click();
  await expect(ev).toBeHidden();

  // Grid.
  await page.getByTestId('btn-grid').click();
  await expect(page.getByTestId('btn-grid')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.grid-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  // The other screens: Models from the panel (and back to the camera from its header).
  await gear.click();
  await menu.evaluate((el) => (el.scrollTop = el.scrollHeight));
  await menu.getByTestId('more-nav-models').click();
  await expect(page.getByTestId('models-screen')).toBeVisible();
  await page.getByTestId('btn-to-camera').click();
  await expect(page.getByTestId('camera-screen')).toBeVisible();
  await gear.click();
  await menu.evaluate((el) => (el.scrollTop = el.scrollHeight));
  await menu.getByTestId('more-nav-settings').click();
  await expect(page.getByTestId('settings-screen')).toBeVisible();
});

test('column buttons and the dial card do what the deck chips did', async ({ page }) => {
  await loadCamera(page, 'bridge09');
  const timer = page.getByTestId('btn-timer');
  await timer.click();
  await expect(timer).toHaveAttribute('aria-label', /3/);
  await timer.click();
  await timer.click();

  const flash = page.getByTestId('btn-flash');
  const f0 = await flash.getAttribute('aria-pressed');
  await flash.click();
  await expect(flash).not.toHaveAttribute('aria-pressed', f0 ?? '');

  // The film: the selected card on the dial opens the film sheet.
  await page.getByTestId('camera-bridge09').click();
  await expect(page.getByTestId('roll-sheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('roll-sheet')).toBeHidden();
});

test.describe('right-to-left', () => {
  test.use({ locale: 'ar' });
  test('text mirrors, the column stays under the right thumb', async ({ page }) => {
    await loadCamera(page, 'bridge09');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const stage = await box(page.locator('.cam-stage'));
    const rail = await box(page.getByTestId('camera-rail'));
    const deck = await box(page.getByTestId('deck'));
    // Same physical order as LTR: body | dial | column.
    expect(rail.x).toBeGreaterThanOrEqual(stage.x + stage.width - 1);
    expect(deck.x).toBeGreaterThanOrEqual(rail.x + rail.width - 1);
    await checkColumn(page);
    await page.getByTestId('btn-more').click();
    const m = await box(page.getByTestId('cam-more'));
    await onScreen(page, m, 'gear panel (rtl)');
    expect(m.x + m.width).toBeLessThanOrEqual(deck.x + 1); // still opens leftwards, over the dial
    expect(await page.getByTestId('cam-more').evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
  });
});
