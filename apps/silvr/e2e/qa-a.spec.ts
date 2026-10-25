/**
 * QA block A (rounds 1-10): functional deep tests.
 */
import { expect, test, type Page } from '@playwright/test';
import { loadCamera, loadRoll, rewindAndDevelop, shoot, start } from './helpers';

const printSrc = (page: Page) => page.getByTestId('print').getAttribute('src');
async function openFirstPrint(page: Page) {
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible({ timeout: 45_000 });
}
async function canvasHash(page: Page) {
  return page.getByTestId('dr-canvas').evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    let h = 0;
    for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0;
    return `${c.width}x${c.height}:${h}`;
  });
}

test('R1 settings: date format re-develops prints, sound off creates no audio, mirror off', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __ac: number };
    w.__ac = 0;
    const AC = window.AudioContext;
    // @ts-expect-error counting wrapper
    window.AudioContext = class extends AC {
      constructor(...a: ConstructorParameters<typeof AudioContext>) {
        super(...a);
        w.__ac++;
      }
    };
  });
  const errors = await start(page);
  await page.getByTestId('tab-settings').click();
  await page.getByRole('switch', { name: /Shutter sound/ }).uncheck({ force: true });
  await page.getByTestId('tab-camera').click();
  await loadCamera(page, 'snap27'); // date imprint on by default
  await shoot(page, 1);
  expect(await page.evaluate(() => (window as unknown as { __ac: number }).__ac)).toBe(0);
  await rewindAndDevelop(page);
  await openFirstPrint(page);
  const a = await printSrc(page);
  await page.getByTestId('tab-settings').click();
  await page.getByRole('radio', { name: "10 24 '26" }).click();
  await page.getByTestId('tab-gallery').click();
  await page.getByTestId('roll-card').locator('.roll-meta').click();
  await openFirstPrint(page);
  await expect.poll(() => printSrc(page), { timeout: 30_000 }).not.toBe(a);
  expect(errors).toEqual([]);
});

test('R2 lab clock: tomorrow 9 AM and 3 days develop on their own', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-25T21:30:00') });
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 1);
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-morning').click();
  await expect(page.getByTestId('lab-item')).toContainText(/Ready in 11h 30m|Ready in 11h 29m/);
  await page.clock.fastForward(11.5 * 3600_000 + 60_000);
  await expect(page.getByText('Your Sunny 200 roll is developed')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('lab-item')).toHaveCount(0);

  await page.getByTestId('tab-camera').click();
  await loadRoll(page, 'mono400', '12');
  await shoot(page, 1);
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-3d').click();
  await expect(page.getByTestId('lab-item')).toContainText(/Ready in (3d|2d 23h)/);
  await page.clock.fastForward(71 * 3600_000);
  await expect(page.getByTestId('lab-item')).toHaveCount(1);
  await page.clock.fastForward(61 * 60_000);
  await expect(page.getByTestId('lab-item')).toHaveCount(0, { timeout: 10_000 });
});

test('R3 import edge cases: alpha PNG, tiny, ultra-wide, empty, fake and SVG files', async ({ page }) => {
  await start(page);
  await page.getByTestId('tab-gallery').click();
  await page.getByTestId('btn-import').click();
  const files = await page.evaluate(async () => {
    const make = async (w: number, h: number, type: string, alpha = false) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d')!;
      if (!alpha) {
        g.fillStyle = '#4a8';
        g.fillRect(0, 0, w, h);
      } else {
        g.fillStyle = 'rgba(200,50,50,0.4)';
        g.fillRect(0, 0, w / 2, h);
      }
      const b = await new Promise<Blob>((r) => c.toBlob((x) => r(x!), type, 0.9));
      return Array.from(new Uint8Array(await b.arrayBuffer()));
    };
    return {
      alpha: await make(600, 400, 'image/png', true),
      tiny: await make(1, 1, 'image/png'),
      wide: await make(5000, 200, 'image/jpeg'),
    };
  });
  await page.getByTestId('import-input').setInputFiles([
    { name: 'alpha.png', mimeType: 'image/png', buffer: Buffer.from(files.alpha) },
    { name: 'tiny.png', mimeType: 'image/png', buffer: Buffer.from(files.tiny) },
    { name: 'wide.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(files.wide) },
    { name: 'empty.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(0) },
    { name: 'fake.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('nope') },
    { name: 'pic.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>') },
  ]);
  await expect(page.getByTestId('roll-screen')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-testid=thumb] img').first()).toBeVisible({ timeout: 45_000 });
  const n = await page.getByTestId('thumb').count();
  expect(n).toBeGreaterThanOrEqual(3);
  expect(n).toBeLessThanOrEqual(4);
  await expect(page.locator('.thumb-wait.err')).toHaveCount(0, { timeout: 45_000 });
});

test('R4 contact sheets work for half-frame, quad and pixel rolls', async ({ page }) => {
  await start(page);
  for (const [cam, presses] of [
    ['half72', 2],
    ['quad4', 1],
    ['pixel', 1],
  ] as const) {
    await page.getByTestId('tab-camera').click();
    await loadCamera(page, cam);
    await shoot(page, presses);
    await rewindAndDevelop(page);
    await page.getByTestId('btn-contact').click();
    await expect(page.getByTestId('contact-sheet').locator('img')).toBeVisible({ timeout: 45_000 });
    await page.keyboard.press('Escape');
  }
});

test('R5 darkroom: every control changes the print, reset restores it', async ({ page }) => {
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 1);
  await rewindAndDevelop(page);
  await openFirstPrint(page);
  await page.getByTestId('btn-darkroom').click();
  await expect(page.getByTestId('dr-canvas')).toBeVisible();
  await page.waitForTimeout(500);
  const base = await canvasHash(page);
  const steps: [string, () => Promise<void>][] = [
    ['film', () => page.getByTestId('stock-mint400').click()],
    ['push', () => page.getByTestId('sl-push').fill('1')],
    ['expired', () => page.getByTestId('sl-expired').fill('0.5')],
    ['grain', () => page.getByTestId('sl-grain').fill('2')],
    ['ev', () => page.getByTestId('sl-dr-ev').fill('-1')],
    ['leak', () => page.getByTestId('tg-leak').click({ force: true })],
    ['date', () => page.getByTestId('tg-date').click({ force: true })],
    ['border', () => page.getByRole('radio', { name: 'Instant' }).click()],
    ['rotate', () => page.getByTestId('btn-rotate').click()],
  ];
  let prev = base;
  for (const [name, act] of steps) {
    await act();
    await page.waitForTimeout(250);
    const h = await canvasHash(page);
    expect(h, name).not.toBe(prev);
    prev = h;
  }
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.waitForTimeout(400);
  // Reset returns to the frame as shot (saved rotation, leak, date, flash) — the untouched print.
  expect(await canvasHash(page)).toBe(base);
});

test('R6 viewer: arrows, swipe, delete-last returns to the album', async ({ page }) => {
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 2);
  await rewindAndDevelop(page);
  await openFirstPrint(page);
  await expect(page.locator('.hdr p')).toContainText('1 / 2');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.hdr p')).toContainText('2 / 2');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.hdr p')).toContainText('1 / 2');
  const box = (await page.locator('.viewer-stage').boundingBox())!;
  await page.locator('.viewer-stage').dispatchEvent('touchstart', { touches: [{ identifier: 1, clientX: box.x + 300, clientY: box.y + 200 }] });
  await page.locator('.viewer-stage').dispatchEvent('touchend', { changedTouches: [{ identifier: 1, clientX: box.x + 100, clientY: box.y + 205 }] });
  await expect(page.locator('.hdr p')).toContainText('2 / 2');
  for (let i = 0; i < 2; i++) {
    await page.getByTestId('btn-delete').click();
    await page.getByTestId('confirm-ok').click();
  }
  await expect(page.getByTestId('gallery-screen')).toBeVisible();
  await expect(page.getByTestId('roll-card')).toHaveCount(0);
});

test('R7 analog: exposure limit, frame delete, geolocation in CSV, CSV injection is neutralised', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 37.5665, longitude: 126.978 });
  await start(page);
  await page.getByTestId('tab-analog').click();
  await page.getByTestId('btn-new-log').click();
  await page.getByTestId('log-film').fill('=HYPERLINK("http://x")');
  await page.getByTestId('new-log').locator('select').nth(1).selectOption('12');
  await page.getByTestId('log-create').click();
  for (let i = 0; i < 12; i++) {
    await page.getByTestId('btn-add-frame').click();
    if (i === 0) {
      await page.getByTestId('frame-note').fill('+cmd|calc');
      await page.getByRole('switch', { name: /location/i }).check({ force: true });
    }
    await page.getByTestId('frame-save').click();
    await expect(page.getByTestId('log-frame')).toHaveCount(i + 1);
  }
  await expect(page.getByTestId('btn-add-frame')).toBeDisabled();
  await page.getByTestId('log-frame').last().getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByTestId('log-frame')).toHaveCount(11);
  await expect(page.getByTestId('btn-add-frame')).toBeEnabled();
  const dl = page.waitForEvent('download');
  await page.getByTestId('btn-csv').click();
  const csv = (await import('node:fs')).readFileSync((await (await dl).path())!, 'utf8');
  expect(csv).toContain('37.5665');
  expect(csv).not.toMatch(/(^|,)"?=HYPERLINK/m);
  expect(csv).not.toMatch(/(^|,)"?\+cmd/m);
});

test('R8 onboarding replay, language persistence, reset wipes pending exposures', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'half72');
  await page.getByTestId('shutter').click();
  await expect(page.getByTestId('counter')).toContainText('01/72');
  await page.getByTestId('tab-settings').click();
  await page.getByRole('button', { name: 'Replay intro' }).click();
  await expect(page.getByTestId('onboarding')).toBeVisible();
  await page.getByTestId('onb-skip').click();
  await page.getByRole('radio', { name: '한국어' }).click();
  await page.reload();
  await expect(page.getByTestId('tab-settings')).toContainText('설정');
  await page.getByTestId('tab-settings').click();
  await page.getByTestId('btn-reset').click();
  await page.getByTestId('confirm-ok').click();
  await expect(page.getByTestId('onboarding')).toBeVisible();
  const counts = await page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const open = indexedDB.open('silvr');
        open.onsuccess = () => {
          const db = open.result;
          const names = ['rolls', 'photos', 'blobs', 'logRolls', 'logFrames'];
          const t = db.transaction(names);
          Promise.all(names.map((n) => new Promise<number>((r) => (t.objectStore(n).count().onsuccess = (e) => r((e.target as IDBRequest<number>).result))))).then(resolve);
        };
      }),
  );
  expect(counts).toEqual([0, 0, 0, 0, 0]);
});

test('R9 navigation: back walks darkroom → photo → roll → album; bad deep links are safe', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 1);
  await rewindAndDevelop(page);
  await openFirstPrint(page);
  await page.getByTestId('btn-darkroom').click();
  await expect(page.getByTestId('darkroom-screen')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('photo-screen')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('roll-screen')).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('gallery-screen').or(page.getByTestId('camera-screen'))).toBeVisible();
  for (const h of ['#/darkroom/x', '#/log/x', '#/photo/', '#/roll/%E0%A4%A', '#/settings/extra/parts']) {
    await page.goto(`./${h}`);
    await page.waitForTimeout(300);
  }
  expect(errors.filter((e) => !/URIError/.test(e))).toEqual([]);
  expect(errors.filter((e) => /URIError/.test(e))).toEqual([]);
});

test('R10 lifecycle: a 12-exposure toy roll fills up and asks for the lab; instant camera unloads empty', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'toy120');
  await shoot(page, 11);
  await page.getByTestId('shutter').click();
  await expect(page.getByTestId('speed-sheet')).toBeVisible();
  await expect(page.getByTestId('speed-sheet')).toContainText('Roll finished');
  await page.getByTestId('speed-instant').click();
  await expect(page.getByTestId('thumb')).toHaveCount(12);
  await page.getByTestId('tab-camera').click();
  await loadCamera(page, 'instasq');
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await expect(page.getByTestId('load-panel')).toBeVisible();
});
