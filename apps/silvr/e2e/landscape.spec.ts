import { expect, test, type Locator, type Page } from '@playwright/test';
import { loadCamera, shoot, start } from './helpers';

/*
 * Landscape phone (project 'landscape-phone': Pixel 7 landscape, 863×360, isMobile): no tab bar, the camera
 * screen is home. A camera with full-body wrap art (public/bodies/wrap, data-wrap on the screen) becomes the
 * whole camera back: the art covers the screen edge to edge, the preview sits in its window, and the vertical
 * mode dial (a track set into the body) and the column are mounted on the body to the right. A camera without
 * it keeps body art (half of its frame) + live preview | vertical mode dial | one quiet column:
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

  // Top to bottom: gear → flash / timer → (counter) → last shot / flip → shutter. On a full-body wrap the
  // frame counter is a small plate on the body above the mode dial, level with the gear, left of the column.
  const wrap = await isWrap(page);
  expect(cy(boxes['btn-more'])).toBeLessThan(cy(boxes['btn-timer']));
  if (hasFlash) expect(Math.abs(cy(boxes['btn-flash']) - cy(boxes['btn-timer']))).toBeLessThan(2);
  if (wrap) {
    const deck = await box(page.getByTestId('deck'));
    const rail = await box(page.getByTestId('camera-rail'));
    expect(boxes.counter.x + boxes.counter.width, 'counter left of the column').toBeLessThanOrEqual(deck.x + 1);
    expect(boxes.counter.y + boxes.counter.height, 'counter above the dial').toBeLessThanOrEqual(rail.y + 1);
    expect(Math.abs(cx(boxes.counter) - cx(rail)), 'counter centred over the dial').toBeLessThan(2);
    expect(Math.abs(boxes.counter.y - boxes['btn-more'].y), 'counter level with the gear').toBeLessThan(2);
  } else {
    expect(cy(boxes['btn-timer'])).toBeLessThan(cy(boxes.counter));
    expect(cy(boxes.counter)).toBeLessThan(cy(boxes.playback));
  }
  expect(cy(boxes['btn-timer'])).toBeLessThan(cy(boxes.playback));
  expect(Math.abs(cy(boxes.playback) - cy(boxes['btn-flip']))).toBeLessThan(2);
  expect(cy(boxes.playback)).toBeLessThan(cy(boxes.shutter));

  // The shutter is the hero, in the bottom-right corner (under the right thumb). (The wrap's counter plate is as
  // wide as the dial but short: the shutter is still the biggest thing on the body.)
  const sh = boxes.shutter;
  expect(sh.width).toBeGreaterThanOrEqual(60);
  for (const k of keys) {
    if (k === 'shutter') continue;
    if (wrap && k === 'counter') expect(sh.width * sh.height, 'shutter bigger than the counter plate').toBeGreaterThan(boxes[k].width * boxes[k].height);
    else expect(sh.width, `shutter bigger than ${k}`).toBeGreaterThan(boxes[k].width);
  }
  expect(sh.x + sh.width, 'shutter near the right edge').toBeGreaterThan(vp.width - 56);
  expect(sh.y + sh.height, 'shutter near the bottom edge').toBeGreaterThan(vp.height - 32);
  for (const k of keys) if (k !== 'shutter') expect(cy(sh), `shutter below ${k}`).toBeGreaterThan(cy(boxes[k]));
  return boxes;
}

/** Whether the camera in use has full-body wrap art (the screen is the camera back). */
const isWrap = async (page: Page) => (await page.getByTestId('camera-screen').getAttribute('data-wrap')) === 'true';

/**
 * The body around the preview. Wrap: the art covers the screen and the window holds a big preview, clear of the
 * dial and the column (in that order, left to right, also in RTL). Cropped art: body | dial | column cells.
 */
async function checkBody(page: Page) {
  const vp = page.viewportSize()!;
  const rail = await box(page.getByTestId('camera-rail'));
  const deck = await box(page.getByTestId('deck'));
  const vf = await box(page.locator('.viewfinder'));
  expect(overlaps(rail, deck)).toBe(false);
  expect(deck.x).toBeGreaterThan(rail.x);
  if (await isWrap(page)) {
    await expect(page.getByTestId('body-art')).toHaveCount(0);
    const art = await box(page.getByTestId('wrap-art'));
    // edge to edge
    expect(art.x).toBeLessThanOrEqual(0.5);
    expect(art.y).toBeLessThanOrEqual(0.5);
    expect(art.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(art.height).toBeGreaterThanOrEqual(vp.height - 1);
    // the window (preview) on the left, clear of the dial and the column, fully on screen
    await onScreen(page, vf, 'preview');
    expect(overlaps(vf, rail), 'preview clear of the dial').toBe(false);
    expect(overlaps(vf, deck), 'preview clear of the column').toBe(false);
    expect(vf.x + vf.width).toBeLessThanOrEqual(rail.x);
    // 3-slice: the art's RIGHT part (the right-hand dials, the end of the top plate) ends at the screen's right
    // edge, whole; LEFT (with the window) starts at the left edge
    const right = await box(page.locator('.wrap-art .wrap-right'));
    expect(Math.abs(right.x + right.width - vp.width), 'RIGHT ends at the right edge').toBeLessThan(1);
    expect(right.x, 'RIGHT starts right of the preview').toBeGreaterThanOrEqual(vf.x + vf.width - 1);
    await onScreen(page, right, 'art RIGHT');
    // the dial track is set into the body beside the window (level with it, most of its height), under the
    // frame counter; the dial and the column start below the top plate (never over the printed name / dials)
    expect(Math.abs(cy(rail) - cy(vf)), 'dial level with the window').toBeLessThan(vp.height * 0.12);
    expect(rail.height).toBeGreaterThan(vp.height * 0.42);
    expect(rail.height).toBeLessThan(vp.height * 0.9);
    const gear = await box(page.getByTestId('btn-more'));
    expect(gear.y, 'the column starts below the top plate').toBeGreaterThan(vp.height * 0.12);
    expect(rail.y, 'the dial starts below the top plate').toBeGreaterThan(gear.y);
    // a big preview (at least as big as with the cropped body): most of the height, or of the body's left half
    expect(vf.height / vp.height > 0.6 || vf.width / vp.width > 0.4, 'preview takes most of the window').toBe(true);
    return;
  }
  const stage = await box(page.locator('.cam-stage'));
  expect(overlaps(stage, rail)).toBe(false);
  expect(overlaps(stage, deck)).toBe(false);
  expect(rail.x).toBeGreaterThan(stage.x);
  expect(stage.x, 'the stage starts at the left edge (no rail)').toBeLessThan(24);
  // The visible half of the body fills the stage (contain) and frames a big preview.
  const art = await box(page.getByTestId('body-art'));
  expect(art.height >= stage.height - 2 || art.width >= stage.width - 2).toBe(true);
  expect(vf.x).toBeGreaterThanOrEqual(art.x - 1);
  expect(vf.x + vf.width).toBeLessThanOrEqual(art.x + art.width + 1);
  expect(vf.y).toBeGreaterThanOrEqual(art.y - 1);
  expect(vf.y + vf.height).toBeLessThanOrEqual(art.y + art.height + 1);
  expect(vf.width / art.width, 'preview takes most of the body').toBeGreaterThan(0.6);
  expect(vf.height / stage.height, 'preview takes most of the height').toBeGreaterThan(0.6);
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

  // Body | dial | column, left to right; nothing overlaps; a big preview.
  await checkBody(page);
  // No page scroll sideways.
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test('every body keeps the column layout (no flash slot, single format, instant, phone)', async ({ page }) => {
  for (const id of ['pro35', 'snap27', 'booth4', 'cine', 'flip03', 'aps97', 'instasq', 'view45', 'webcam02']) {
    await loadCamera(page, id);
    await checkColumn(page);
    await checkBody(page);
  }
});

test('full-body wrap: the camera back covers the screen, the controls wear the body, the camera feels alive', async ({ page }) => {
  await loadCamera(page, 'pro35');
  test.skip(!(await isWrap(page)), 'pro35 has no wrap art in this build');
  const screen = page.getByTestId('camera-screen');
  // The controls are skinned from the body's back spec (chrome buttons, knurled release with a red centre).
  await expect(screen).toHaveAttribute('data-btn', 'chrome');
  await expect(screen).toHaveAttribute('data-shutter', 'knurl');
  const look = await page.getByTestId('shutter').evaluate((el) => {
    const cs = getComputedStyle(el);
    const cap = getComputedStyle(el.querySelector('span')!);
    return { ring: cs.backgroundImage, cap: cap.backgroundImage + cap.backgroundColor };
  });
  expect(look.ring).toContain('conic-gradient');
  expect(look.cap).toMatch(/210, 58, 44|d23a2c/i);
  // The art decodes.
  await expect.poll(() => page.locator('.wrap-art-img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

  // Shutter: goes down while held, springs back on release (and the release takes the shot).
  const sh = page.getByTestId('shutter');
  const b = await box(sh);
  await page.mouse.move(cx(b), cy(b));
  await page.mouse.down();
  await expect(sh).toHaveAttribute('data-pressed', '');
  await page.mouse.up();
  await expect(sh).not.toHaveAttribute('data-pressed', '');
  // The frame counter rolls: the new figure comes in with the old one leaving (data-prev drives the roll).
  await expect(page.getByTestId('counter')).toContainText('01');
  await expect(page.locator('[data-testid=counter] .counter-tick')).toHaveAttribute('data-prev', '00');
  // The glint layer is there (decorative).
  await expect(page.locator('.wrap-art .body-glint')).toHaveCount(1);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('no glint, no counter roll, no flash pop', async ({ page }) => {
    await loadCamera(page, 'pro35');
    test.skip(!(await isWrap(page)), 'pro35 has no wrap art in this build');
    await expect(page.locator('.body-glint-clip')).toBeHidden();
    await shoot(page, 1);
    const anim = await page.locator('[data-testid=counter] .counter-tick').evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).not.toBe('counter-roll');
    await expect(page.locator('.flash-pop')).toHaveCount(0);
  });
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
    const rail = await box(page.getByTestId('camera-rail'));
    const deck = await box(page.getByTestId('deck'));
    // Same physical order as LTR: body (the preview in its window) | dial | column. The art is never mirrored.
    const body = (await isWrap(page)) ? await box(page.locator('.viewfinder')) : await box(page.locator('.cam-stage'));
    expect(rail.x).toBeGreaterThanOrEqual(body.x + body.width - 1);
    expect(deck.x).toBeGreaterThanOrEqual(rail.x + rail.width - 1);
    await checkBody(page);
    await checkColumn(page);
    await page.getByTestId('btn-more').click();
    const m = await box(page.getByTestId('cam-more'));
    await onScreen(page, m, 'gear panel (rtl)');
    expect(m.x + m.width).toBeLessThanOrEqual(deck.x + 1); // still opens leftwards, over the dial
    expect(await page.getByTestId('cam-more').evaluate((el) => getComputedStyle(el).direction)).toBe('rtl');
  });
});
