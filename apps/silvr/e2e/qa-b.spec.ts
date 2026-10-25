/**
 * QA block B (rounds 11-20): camera deep tests.
 */
import { expect, test, type Page } from '@playwright/test';
import { loadCamera, rewindAndDevelop, shoot, start } from './helpers';

const CAMS = ['pro35', 'snap27', 'instasq', 'half72', 'zonelc', 'toy120', 'quad4', 'doublex', 'panox', 'fish180', 'cine', 'ccd03', 'pixel', 'range'];
const presses = (id: string) => (id === 'half72' || id === 'doublex' ? 2 : 1);

async function shootFrame(page: Page, id: string) {
  for (let i = 0; i < presses(id); i++) {
    await page.getByTestId('shutter').click();
    await expect(page.getByTestId('shutter')).toBeEnabled({ timeout: 15_000 });
  }
}

test('R11 front camera on every body develops a print', async ({ page }) => {
  test.setTimeout(1_200_000);
  const errors = await start(page);
  await page.getByTestId('tab-camera').click();
  for (const id of CAMS) {
    const t0 = Date.now();
    await loadCamera(page, id);
    await page.getByTestId('btn-flip').click();
    await expect(page.getByTestId('btn-flip')).toHaveAttribute('data-facing', 'user');
    await expect(page.getByTestId('shutter')).toBeEnabled();
    await shootFrame(page, id);
    await rewindAndDevelop(page);
    await page.getByTestId('thumb').first().click();
    await expect(page.getByTestId('print')).toBeVisible({ timeout: 45_000 });
    await page.getByTestId('tab-camera').click();
    await page.getByTestId('btn-flip').click({ timeout: 2000 }).catch(() => undefined);
    console.log(`R11 ${id}: ${Math.round((Date.now() - t0) / 1000)}s`);
  }
  expect(errors).toEqual([]);
});

test('R12 self-timer works with every capture mechanism', async ({ page }) => {
  test.setTimeout(300_000);
  await start(page);
  for (const id of ['pro35', 'half72', 'quad4', 'doublex', 'instasq', 'ccd03']) {
    await page.getByTestId('tab-camera').click();
    await loadCamera(page, id);
    await page.getByTestId('btn-timer').click();
    const t0 = Date.now();
    await page.getByTestId('shutter').click();
    await expect(page.locator('.countdown')).toHaveText('3');
    await expect(page.locator('.cam-top')).toHaveClass(/locked/);
    await expect(page.getByTestId('shutter')).toBeEnabled({ timeout: 10_000 });
    expect(Date.now() - t0).toBeGreaterThan(2900);
    await expect(page.locator('.cam-top')).not.toHaveClass(/locked/);
    await page.getByTestId('btn-timer').click(); // 10 s
    await page.getByTestId('btn-timer').click(); // off
    if (presses(id) === 2) await page.getByTestId('shutter').click();
    await expect(page.getByTestId('shutter')).toBeEnabled({ timeout: 10_000 });
    await page.getByTestId(id === 'instasq' || id === 'ccd03' ? 'roll-btn' : 'roll-btn').click();
    await page.getByTestId('btn-rewind').click();
    await page.getByTestId('confirm-ok').click();
    const speed = page.getByTestId('speed-instant');
    await expect(speed.or(page.getByTestId('roll-screen'))).toBeVisible();
    if (await speed.isVisible()) await speed.click();
    await expect(page.getByTestId('thumb').first()).toBeVisible();
  }
});

test('R15 flash: only bodies with a flash show it, and the darkroom reflects whether it fired', async ({ page }) => {
  await start(page);
  for (const id of ['quad4', 'panox', 'cine', 'pixel', 'range']) {
    await page.getByTestId(`camera-${id}`).click();
    await page.getByTestId('btn-load').click();
    await expect(page.getByTestId('btn-flash')).toHaveCount(0);
    await page.getByTestId('camera-chip').click();
    await page.getByTestId('btn-rewind').click();
    await page.getByTestId('confirm-ok').click();
  }
  await loadCamera(page, 'pro35');
  await page.getByTestId('btn-flash').click(); // on
  await shoot(page, 1);
  await page.getByTestId('btn-flash').click(); // off
  await shoot(page, 1);
  await rewindAndDevelop(page);
  for (const [i, fired] of [
    [0, true],
    [1, false],
  ] as const) {
    await page.getByTestId('thumb').nth(i).click();
    await page.getByTestId('btn-darkroom').click();
    const toggle = page.getByRole('switch', { name: 'Flash look' });
    if (fired) await expect(toggle).toBeChecked();
    else await expect(toggle).not.toBeChecked();
    await page.goBack();
    await page.goBack();
  }
});

test('R16 half-frame roll shot to the end pairs every half and asks for the lab', async ({ page }) => {
  test.setTimeout(300_000);
  await start(page);
  await page.getByTestId('camera-half72').click();
  await page.getByRole('radio', { name: /^Half 24|^24 half/ }).click();
  await page.getByTestId('btn-load').click();
  for (let i = 0; i < 23; i++) {
    await page.getByTestId('shutter').click();
    await expect(page.getByTestId('counter')).toContainText(`${String(i + 1).padStart(2, '0')}/24`);
  }
  await page.getByTestId('shutter').click();
  await expect(page.getByTestId('speed-sheet')).toBeVisible();
  await page.getByTestId('speed-instant').click();
  await expect(page.getByTestId('thumb')).toHaveCount(12);
});

test('R17 quad lenses fire in sequence (~0.6 s) and announce progress', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'quad4');
  const t0 = Date.now();
  await page.getByTestId('shutter').click();
  await expect(page.locator('.vf-cell.on')).toHaveCount(1);
  await expect(page.getByTestId('shutter')).toBeEnabled({ timeout: 10_000 });
  expect(Date.now() - t0).toBeGreaterThan(550);
  await expect(page.getByTestId('announcer')).toContainText(/Frame 1|Lens 4\/4/);
});

test('R18 double exposure: ghost survives reload; rewinding keeps the lone first exposure', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'doublex');
  await page.getByTestId('shutter').click();
  await expect(page.locator('.vf-ghost')).toBeVisible();
  await expect(page.getByTestId('counter')).toContainText('00/');
  await page.reload();
  await expect(page.locator('.vf-ghost')).toBeVisible();
  await page.getByTestId('roll-btn').click();
  await page.getByTestId('btn-rewind').click();
  await page.getByTestId('confirm-ok').click();
  await page.getByTestId('speed-instant').click();
  await expect(page.getByTestId('thumb')).toHaveCount(1);
});

test('R19 instant pack shot to the end goes straight to the album, already seen', async ({ page }) => {
  test.setTimeout(300_000);
  await start(page);
  await loadCamera(page, 'instasq');
  await shoot(page, 9);
  await page.getByTestId('shutter').click();
  await expect(page.getByTestId('roll-screen')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('thumb')).toHaveCount(10);
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).not.toContainText('NEW');
  await expect(page.getByTestId('roll-card')).not.toContainText('새 롤');
  await page.getByTestId('tab-lab').click();
  await expect(page.getByTestId('lab-item')).toHaveCount(0);
});

test('R20 monkey test: 300 random actions keep every invariant', async ({ page }) => {
  test.setTimeout(900_000);
  const errors = await start(page);
  let seed = 1337;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const actions: (() => Promise<unknown>)[] = [
    () => page.getByTestId(`tab-${pick(['camera', 'lab', 'gallery', 'analog', 'settings'])}`).click({ timeout: 800 }),
    () => page.getByTestId(`camera-${pick(CAMS)}`).click({ timeout: 800 }),
    () => page.getByTestId('btn-load').click({ timeout: 800 }),
    () => page.getByTestId('shutter').click({ timeout: 800 }),
    () => page.getByTestId('shutter').click({ timeout: 800 }),
    () => page.getByTestId('btn-flip').click({ timeout: 800 }),
    () => page.getByTestId('btn-flash').click({ timeout: 800 }),
    () => page.getByTestId('btn-aspect').click({ timeout: 800 }),
    () => page.getByTestId('btn-zoom').click({ timeout: 800 }),
    () => page.getByTestId('btn-palette').click({ timeout: 800 }),
    () => page.getByTestId('roll-btn').click({ timeout: 800 }),
    () => page.getByTestId('btn-rewind').click({ timeout: 800 }),
    () => page.getByTestId('confirm-ok').click({ timeout: 800 }),
    () => page.getByTestId(`speed-${pick(['instant', '1h', 'morning', '3d'])}`).click({ timeout: 800 }),
    () => page.getByTestId('btn-rush').first().click({ timeout: 800 }),
    () => page.getByTestId('roll-card').first().locator('.roll-meta').click({ timeout: 800 }),
    () => page.getByTestId('thumb').first().click({ timeout: 800 }),
    () => page.getByTestId('btn-darkroom').click({ timeout: 800 }),
    () => page.keyboard.press('Escape'),
    () => page.goBack({ timeout: 2000 }),
    () => page.keyboard.press(' '),
  ];
  const t0 = Date.now();
  for (let i = 0; i < 300; i++) {
    const a = Math.floor(rnd() * actions.length);
    const ts = Date.now();
    await actions[a]().catch(() => undefined);
    if (Date.now() - ts > 10_000) console.log(`R20 slow step ${i}: action ${a} took ${Date.now() - ts}ms`);
    if (i % 25 === 0) {
      // A random Back can leave the app (to about:blank); come back before checking storage.
      if (!page.url().startsWith('http://localhost:4173/')) await page.goto('./');
      // Invariant: no roll in storage ever exceeds its capacity or has negatives > shots.
      const bad = await page.evaluate(
        () =>
          new Promise<string[]>((resolve) => {
            const open = indexedDB.open('silvr');
            open.onsuccess = () => {
              const r = open.result.transaction('rolls').objectStore('rolls').getAll();
              r.onsuccess = () =>
                resolve(
                  (r.result as { id: string; shots: number; capacity: number; negatives?: number }[])
                    .filter((x) => x.shots > x.capacity || (x.negatives ?? 0) > x.shots || x.shots < 0)
                    .map((x) => JSON.stringify(x)),
                );
            };
          }),
      );
      expect(bad, `step ${i}`).toEqual([]);
    }
  }
  console.log(`R20 300 actions in ${Math.round((Date.now() - t0) / 1000)}s`);
  expect(errors.filter((e) => !/net::ERR_ABORTED/.test(e))).toEqual([]);
});
