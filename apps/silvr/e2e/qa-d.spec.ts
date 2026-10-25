/**
 * QA block D (rounds 31-40): layout, motion, keyboard, accessibility per body,
 * languages, storage failure, offline, updates and hostile input — plus the
 * backup/restore round trip added in this pass.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { loadCamera, loadRoll, rewindAndDevelop, shoot, start } from './helpers';

const TABS = ['camera', 'lab', 'gallery', 'analog', 'settings'];
const CAMS = ['pro35', 'snap27', 'instasq', 'half72', 'zonelc', 'toy120', 'quad4', 'doublex', 'panox', 'fish180', 'cine', 'ccd03', 'pixel', 'range'];

async function overflowX(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

async function inViewport(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox();
  const vp = page.viewportSize()!;
  return !!box && box.x >= 0 && box.y >= 0 && box.x + box.width <= vp.width + 0.5 && box.y + box.height <= vp.height + 0.5;
}

async function wipe(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((ok) => {
        const q = indexedDB.deleteDatabase('silvr');
        q.onsuccess = q.onerror = q.onblocked = () => ok();
      }),
  );
  await page.reload();
  const skip = page.getByTestId('onb-skip');
  if (await skip.isVisible({ timeout: 3000 }).catch(() => false)) await skip.click();
}

test('R31 six viewports: no sideways scroll, shutter and tab bar on screen', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200', '12');
  for (const [w, h] of [
    [320, 568],
    [375, 667],
    [390, 844],
    [430, 932],
    [768, 1024],
    [1280, 800],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.getByTestId('tab-camera').click();
    expect(await inViewport(page, 'shutter'), `shutter @${w}`).toBe(true);
    expect(await inViewport(page, 'counter'), `counter @${w}`).toBe(true);
    for (const tab of TABS) {
      await page.getByTestId(`tab-${tab}`).click();
      expect(await overflowX(page), `${tab}@${w}x${h}`).toBeLessThanOrEqual(0);
      expect(await inViewport(page, `tab-${tab}`), `tab bar @${w}`).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('R32 landscape phone: camera stays usable', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const errors = await start(page);
  await page.getByTestId('btn-load').scrollIntoViewIfNeeded();
  await loadRoll(page, 'mono400', '12');
  expect(await inViewport(page, 'shutter')).toBe(true);
  expect(await overflowX(page)).toBeLessThanOrEqual(0);
  await shoot(page, 1);
  await expect(page.getByTestId('counter')).toContainText('01');
  expect(errors).toEqual([]);
});

test('R33 reduced motion: no long-running animations or transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await start(page);
  await loadCamera(page, 'instasq');
  await shoot(page, 1);
  await page.getByTestId('roll-btn').click();
  const long = await page.evaluate(() =>
    document
      .getAnimations()
      .map((a) => (a.effect?.getTiming().duration as number) ?? 0)
      .filter((d) => typeof d === 'number' && d > 1),
  );
  expect(long).toEqual([]);
});

test('R34 keyboard only: onboarding → load → shoot → develop → photo', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('onboarding')).toBeVisible();
  const tabTo = async (testId: string, max = 80) => {
    for (let i = 0; i < max; i++) {
      if (await page.evaluate((id) => document.activeElement?.getAttribute('data-testid') === id, testId)) return;
      await page.keyboard.press('Tab');
    }
    throw new Error(`${testId} not reachable by Tab`);
  };
  await tabTo('onb-skip');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('onboarding')).toBeHidden();
  await tabTo('btn-load');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('shutter')).toBeEnabled();
  await page.locator('body').click({ position: { x: 1, y: 1 } }).catch(() => undefined);
  for (let i = 1; i <= 2; i++) {
    await tabTo('shutter');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('counter')).toContainText(`0${i}`);
  }
  await tabTo('roll-btn');
  await page.keyboard.press('Enter');
  await tabTo('btn-rewind');
  await page.keyboard.press('Enter');
  await tabTo('confirm-ok');
  await page.keyboard.press('Enter');
  await tabTo('speed-instant');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('roll-screen')).toBeVisible();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(2, { timeout: 45_000 });
  await tabTo('thumb');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('print')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/photo/);
});

test('R35 axe WCAG 2.1 AA on every camera body (load panel + viewfinder)', async ({ page }) => {
  test.setTimeout(400_000);
  await start(page);
  const issues: string[] = [];
  const audit = async (name: string) => {
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    issues.push(...res.violations.map((v) => `${name}: ${v.id} × ${v.nodes.length} — ${v.nodes[0]?.target.join(' ')}`));
  };
  for (const id of CAMS) {
    await page.getByTestId(`camera-${id}`).click();
    await audit(`${id} load`);
    await loadCamera(page, id);
    await audit(`${id} viewfinder`);
    await wipe(page);
  }
  expect(issues).toEqual([]);
});

test('R36 both languages: no raw keys or unfilled placeholders on any screen', async ({ page }) => {
  await start(page);
  await loadRoll(page, 'sunny200', '12');
  await shoot(page, 1);
  const leaks: string[] = [];
  const scan = async (where: string) => {
    const text = await page.evaluate(() => document.body.innerText);
    const raw = text.match(/\b(?:cam|set|dr|view|lab|an|onb|tab|speed|common|palette|share|stock|era)\.[a-zA-Z][\w.]*/g) ?? [];
    const holes = text.match(/\{[a-z]+\}/g) ?? [];
    for (const m of [...raw, ...holes]) leaks.push(`${where}: ${m}`);
  };
  for (const lang of ['English', '한국어']) {
    await page.getByTestId('tab-settings').click();
    await page.getByRole('radio', { name: lang }).click();
    for (const tab of TABS) {
      await page.getByTestId(`tab-${tab}`).click();
      await scan(`${lang}/${tab}`);
    }
    await page.getByTestId('tab-camera').click();
    await page.getByTestId('roll-btn').click();
    await scan(`${lang}/roll-sheet`);
    await page.keyboard.press('Escape');
  }
  expect(leaks).toEqual([]);
});

test('R37 no IndexedDB (locked-down private mode): app explains instead of crashing', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get() {
        return {
          open() {
            const req: Record<string, unknown> = {};
            setTimeout(() => {
              (req as { error: unknown }).error = new DOMException('blocked', 'InvalidStateError');
              (req.onerror as (() => void) | undefined)?.();
            });
            return req;
          },
          deleteDatabase() {
            return {};
          },
        };
      },
    });
  });
  const uncaught: string[] = [];
  page.on('pageerror', (e) => uncaught.push(e.message));
  await page.goto('./');
  await expect(page.getByTestId('onboarding').or(page.getByTestId('camera-screen'))).toBeVisible();
  if (await page.getByTestId('onb-skip').isVisible().catch(() => false)) await page.getByTestId('onb-skip').click();
  await page.getByTestId('btn-load').click();
  await expect(page.locator('.toast').first()).toBeVisible();
  await expect(page.getByTestId('btn-load')).toBeEnabled();
  expect(uncaught).toEqual([]);
});

test('R38 offline: shoot, develop and back up with no network', async ({ page, context }) => {
  await start(page);
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await loadRoll(page, 'neon800t', '12');
  await shoot(page, 2);
  await rewindAndDevelop(page);
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(2);
  await page.getByTestId('thumb').first().click();
  await expect(page.getByTestId('print')).toBeVisible();
  await page.getByTestId('tab-settings').click();
  const dl = page.waitForEvent('download');
  await page.getByTestId('btn-backup').click();
  expect((await dl).suggestedFilename()).toMatch(/^SILVR_backup_\d{8}_\d{6}\.zip$/);
  await context.setOffline(false);
});

test('R39 update with a roll in the camera keeps the roll and counter', async ({ page }) => {
  await start(page);
  await loadCamera(page, 'half72');
  await page.getByTestId('shutter').click(); // first half: pending
  await shoot(page, 1);
  await page.evaluate(async () => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  const counter = await page.getByTestId('counter').textContent();
  execSync('npx vite build', { stdio: 'ignore' });
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())!.update());
  await expect(page.locator('.update-bar')).toBeVisible({ timeout: 20_000 });
  const reload = page.waitForEvent('load');
  await page.locator('.update-bar button').click();
  await reload;
  await expect(page.getByTestId('camera-screen')).toHaveAttribute('data-camera', 'half72');
  await expect(page.getByTestId('counter')).toHaveText(counter ?? '');
});

test('R40 hostile backups and names: rendered as text, no prototype pollution', async ({ page }) => {
  const errors = await start(page);
  const evil = '<img src=x onerror="window.__xss=1">';
  const manifest = {
    format: 'silvr-backup',
    version: 1,
    createdAt: 1,
    rolls: [{ id: 'r1', kind: 'import', stockId: evil, capacity: 1, shots: 0, aspect: '3:2', createdAt: 1, status: 'developed', __proto__: { polluted: 1 } }],
    photos: [{ id: '__proto__', rollId: 'r1', frame: 1, width: 1, height: 1, takenAt: 1, develop: { stockId: 'sunny200' } }],
    logRolls: [{ id: 'l1', camera: evil, film: '=HYPERLINK("http://x")', iso: 400, exposures: 36, startedAt: 1, note: evil }],
    logFrames: [],
    blobs: [],
  };
  const json = JSON.stringify(manifest).replace('"__proto__":{"polluted":1}', '"__proto__":{"polluted":1},"constructor":{"prototype":{"polluted":1}}');
  const buf = await page.evaluate(async (json) => {
    const enc = new TextEncoder();
    const data = enc.encode(json);
    // Tiny STORE zip writer (mirrors src/store/zip.ts) to craft the file in the page.
    const table = new Uint32Array(256).map((_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c >>> 0;
    });
    let c = ~0 >>> 0;
    for (const b of data) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
    const crc = ~c >>> 0;
    const name = enc.encode('manifest.json');
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, data.length, true);
    cd.setUint32(24, data.length, true);
    cd.setUint16(28, name.length, true);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, 1, true);
    end.setUint16(10, 1, true);
    end.setUint32(12, 46 + name.length, true);
    end.setUint32(16, 30 + name.length + data.length, true);
    const blob = new Blob([lh.buffer, name, data, cd.buffer, name, end.buffer]);
    return [...new Uint8Array(await blob.arrayBuffer())];
  }, json);
  await page.getByTestId('tab-settings').click();
  await page.getByTestId('restore-input').setInputFiles({ name: 'evil.zip', mimeType: 'application/zip', buffer: Buffer.from(buf) });
  await expect(page.getByTestId('backup-status')).not.toHaveText(/…|^$/);
  await page.getByTestId('tab-gallery').click();
  await page.getByTestId('tab-analog').click();
  await expect(page.getByText(evil).first()).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  expect(await page.evaluate(() => ({} as Record<string, unknown>).polluted)).toBeUndefined();
  expect(errors.filter((e) => !/Failed to load resource/.test(e))).toEqual([]);
});

test('U1 backup → wipe → restore brings back rolls, photos and the film log', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'mono400', '12');
  await shoot(page, 3);
  await rewindAndDevelop(page);
  await page.getByTestId('tab-analog').click();
  await page.getByTestId('btn-new-log').click();
  await page.getByTestId('log-camera').fill('Nikon FM2');
  await page.getByTestId('log-film').fill('HP5+');
  await page.getByTestId('log-create').click();
  await page.getByTestId('tab-settings').click();
  const dl = page.waitForEvent('download');
  await page.getByTestId('btn-backup').click();
  const file = await (await dl).path();
  await expect(page.getByTestId('backup-status')).toContainText(/1/);
  const bytes = readFileSync(file!);
  await page.getByTestId('btn-reset').click();
  await page.getByTestId('confirm-ok').click();
  await page.waitForLoadState('load');
  const skip = page.getByTestId('onb-skip');
  if (await skip.isVisible({ timeout: 5000 }).catch(() => false)) await skip.click();
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toHaveCount(0);
  await page.getByTestId('tab-settings').click();
  await page.getByTestId('restore-input').setInputFiles({ name: 'backup.zip', mimeType: 'application/zip', buffer: bytes });
  await expect(page.getByTestId('backup-status')).toContainText(/3/);
  await page.getByTestId('tab-gallery').click();
  await expect(page.getByTestId('roll-card')).toHaveCount(1);
  await page.getByTestId('roll-card').locator('.roll-meta').click();
  await expect(page.locator('[data-testid=thumb] img')).toHaveCount(3, { timeout: 45_000 });
  await page.getByTestId('tab-analog').click();
  await expect(page.getByText('Nikon FM2')).toBeVisible();
  // Restoring the same file again adds nothing.
  await page.getByTestId('tab-settings').click();
  await page.getByTestId('restore-input').setInputFiles({ name: 'backup.zip', mimeType: 'application/zip', buffer: bytes });
  await expect(page.getByTestId('backup-status')).toContainText(/0/);
  expect(errors).toEqual([]);
});
