import { expect, test, type Locator, type Page } from '@playwright/test';
import { loadCamera, shoot, start } from './helpers';

/*
 * Landscape phone (project 'landscape-phone': Pixel 7 landscape, 863×360, isMobile): the camera screen is
 * the back of a digicam. [tab rail] | body art + live preview | vertical mode dial | control column
 * (release + W/T rocker · frame readout · D-pad · playback / MENU / flip). The viewport comes from the
 * project; nothing here sets it.
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

test.beforeEach(async ({ page }) => {
  await start(page);
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-layout', 'landscape');
});

test('digicam layout: every control on screen, once, clear of the LCD and of each other', async ({ page }) => {
  // Tele 20: flash, zoom, EV and three formats, so every D-pad key and the rocker are there.
  await loadCamera(page, 'bridge09');
  await expect(page.getByTestId('camera-rail')).toHaveAttribute('data-axis', 'y');

  const ids = ['shutter', 'btn-zoom', 'counter', 'btn-flash', 'btn-timer', 'btn-aspect', 'btn-ev', 'btn-film', 'btn-more', 'btn-flip'];
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
  // The playback slot: the last shot, or the way to the album before the first one.
  const playback = page.locator('[data-testid=last-shot], [data-testid=btn-last-album]');
  await expect(playback).toHaveCount(1);
  boxes.playback = await box(playback);
  await onScreen(page, boxes.playback, 'playback');

  const keys = Object.keys(boxes);
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) expect(overlaps(boxes[keys[i]], boxes[keys[j]], 1), `${keys[i]} vs ${keys[j]}`).toBe(false);

  // Column order, top to bottom: release → readout → D-pad → playback / MENU / flip.
  expect(cy(boxes.shutter)).toBeLessThan(cy(boxes.counter));
  expect(cy(boxes.counter)).toBeLessThan(cy(boxes['btn-film']));
  expect(cy(boxes['btn-film'])).toBeLessThan(cy(boxes['btn-more']));
  // D-pad: up flash, right timer, down format, left EV around the centre OK (hardware: never mirrored).
  const ok = boxes['btn-film'];
  expect(cy(boxes['btn-flash'])).toBeLessThan(ok.y);
  expect(cx(boxes['btn-timer'])).toBeGreaterThan(ok.x + ok.width);
  expect(cy(boxes['btn-aspect'])).toBeGreaterThan(ok.y + ok.height);
  expect(cx(boxes['btn-ev'])).toBeLessThan(ok.x);

  // The column and the dial sit beside the body, not on it; the art fills the stage (contain).
  const stage = await box(page.locator('.cam-stage'));
  const rail = await box(page.getByTestId('camera-rail'));
  const deck = await box(page.getByTestId('deck'));
  expect(overlaps(stage, rail)).toBe(false);
  expect(overlaps(stage, deck)).toBe(false);
  expect(rail.x).toBeGreaterThan(stage.x);
  expect(deck.x).toBeGreaterThan(rail.x);
  const art = await box(page.getByTestId('body-art'));
  expect(art.height >= stage.height - 2 || art.width >= stage.width - 2).toBe(true);
  // The preview sits inside the art.
  expect(vf.x).toBeGreaterThanOrEqual(art.x - 1);
  expect(vf.x + vf.width).toBeLessThanOrEqual(art.x + art.width + 1);
  // No page scroll sideways.
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test('shooting: a frame lands, the readout counts it, playback shows it', async ({ page }) => {
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

test('MENU opens on screen toward the LCD; the EV slider too; D-pad keys are not in it', async ({ page }) => {
  await loadCamera(page, 'bridge09');
  const deck = await box(page.getByTestId('deck'));
  await page.getByTestId('btn-more').click();
  const menu = page.getByTestId('cam-more');
  await expect(menu).toBeVisible();
  const m = await box(menu);
  await onScreen(page, m, 'menu');
  expect(m.x + m.width).toBeLessThanOrEqual(deck.x + 1); // opens leftwards from the column
  await expect(menu.getByTestId('btn-grid')).toBeVisible();
  await expect(menu.getByTestId('btn-date')).toBeVisible();
  for (const id of ['btn-aspect', 'btn-zoom', 'btn-ev']) await expect(menu.getByTestId(id)).toHaveCount(0);
  await page.getByTestId('btn-grid').click();
  await expect(page.getByTestId('btn-grid')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.grid-overlay')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();

  await page.getByTestId('btn-ev').click();
  await expect(page.getByTestId('btn-ev')).toHaveAttribute('aria-expanded', 'true');
  const ev = page.getByTestId('ev-row');
  await expect(ev).toBeVisible();
  const e = await box(ev);
  await onScreen(page, e, 'EV slider');
  expect(overlaps(e, deck)).toBe(false);
  await page.getByTestId('btn-ev').click();
  await expect(ev).toBeHidden();
});

test('D-pad, rocker and OK do what the deck chips did', async ({ page }) => {
  await loadCamera(page, 'bridge09');
  const zoom = page.getByTestId('btn-zoom');
  await expect(zoom).toHaveAttribute('aria-label', /1×/);
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-label', /2×/);
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-label', /4×/);
  await zoom.click();
  await expect(zoom).toHaveAttribute('aria-label', /1×/); // wraps back to wide

  const aspect = page.getByTestId('btn-aspect');
  const a0 = await aspect.getAttribute('aria-label');
  await aspect.click();
  await expect(aspect).not.toHaveAttribute('aria-label', a0 ?? '');

  const timer = page.getByTestId('btn-timer');
  await timer.click();
  await expect(timer).toHaveAttribute('aria-label', /3/);
  await timer.click();
  await timer.click();

  const flash = page.getByTestId('btn-flash');
  const f0 = await flash.getAttribute('aria-pressed');
  await flash.click();
  await expect(flash).not.toHaveAttribute('aria-pressed', f0 ?? '');

  await page.getByTestId('btn-film').click();
  await expect(page.getByTestId('roll-sheet')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('roll-sheet')).toBeHidden();
});

test.describe('right-to-left', () => {
  test.use({ locale: 'ar' });
  test('the screen mirrors (column at the inline end), the hardware does not', async ({ page }) => {
    await loadCamera(page, 'bridge09');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const stage = await box(page.locator('.cam-stage'));
    const rail = await box(page.getByTestId('camera-rail'));
    const deck = await box(page.getByTestId('deck'));
    expect(deck.x + deck.width).toBeLessThanOrEqual(rail.x + 1);
    expect(rail.x + rail.width).toBeLessThanOrEqual(stage.x + 1);
    const ok = await box(page.getByTestId('btn-film'));
    expect(cx(await box(page.getByTestId('btn-timer')))).toBeGreaterThan(ok.x + ok.width);
    expect(cx(await box(page.getByTestId('btn-ev')))).toBeLessThan(ok.x);
    await page.getByTestId('btn-more').click();
    const m = await box(page.getByTestId('cam-more'));
    await onScreen(page, m, 'menu (rtl)');
    expect(m.x).toBeGreaterThanOrEqual(deck.x + deck.width - 1); // opens rightwards, toward the LCD
  });
});
