// Drives the debug APK's real Android WebView: the main flow plus the native
// pieces (camera, haptics, hardware back, gallery save, share sheet, backup,
// location) and device conditions (process death, small screen, large font,
// offline, camera permission denied).
// Needs: debug APK installed on one adb device/emulator.
// usage: node scripts/android-qa.mjs <adb serial> <screenshot dir>
import { _android as android } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [serial = 'emulator-5554', outDir = 'android-qa'] = process.argv.slice(2);
const PKG = 'app.silvr.camera';
const GALLERY = '/sdcard/Pictures/SILVR';
const adb = (...a) => execFileSync('adb', ['-s', serial, ...a], { encoding: 'utf8', maxBuffer: 64 << 20 });
const adbBin = (...a) => execFileSync('adb', ['-s', serial, ...a], { maxBuffer: 64 << 20 });
const sh = (cmd) => adb('shell', cmd);
mkdirSync(outDir, { recursive: true });

const results = [];
const check = async (name, fn) => {
  try {
    const note = await fn();
    results.push({ name, ok: true, note: note ?? '' });
    console.log(`  ok  ${name}${note ? ` — ${note}` : ''}`);
  } catch (e) {
    results.push({ name, ok: false, note: String(e.message ?? e).split('\n')[0] });
    console.log(`  FAIL ${name} — ${String(e.message ?? e).split('\n')[0]}`);
  }
};
const shot = (name) => writeFileSync(join(outDir, `${name}.png`), adbBin('exec-out', 'screencap', '-p'));
const back = () => sh('input keyevent 4');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const focusedWindow = () => sh('dumpsys window displays').match(/mCurrentFocus=.*$/m)?.[0] ?? '';
const isChooser = (w) => /chooser|resolver|ShareSheet|intentresolver/i.test(w);
const galleryCount = () => {
  try {
    return sh(`ls ${GALLERY}`).split(/\s+/).filter((f) => /\.(jpg|png)$/.test(f)).length;
  } catch {
    return 0;
  }
};

const device = (await android.devices()).find((d) => d.serial() === serial);
if (!device) throw new Error(`adb device ${serial} not found`);
const errors = [];
let page;
/** (Re)launches the app and attaches to its WebView. */
async function launch({ clear = false } = {}) {
  if (clear) sh(`pm clear ${PKG}`);
  else sh(`am force-stop ${PKG}`);
  sh(`am start -n ${PKG}/.MainActivity`);
  await sleep(4000);
  await attach();
}
async function attach() {
  page = await (await device.webView({ pkg: PKG })).page();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  // Capacitor's debug bridge logs every rejected plugin call; a dismissed share sheet is handled by the app.
  page.on('console', (m) => m.type() === 'error' && !/Share canceled/.test(m.text()) && errors.push(`console: ${m.text()}`));
  await page.waitForLoadState('domcontentloaded');
}
const tid = (id) => page.getByTestId(id);
const visible = async (id, timeout = 15000) => tid(id).first().waitFor({ state: 'visible', timeout });
const hidden = async (id, timeout = 15000) => tid(id).first().waitFor({ state: 'hidden', timeout });
const toastText = async () => {
  await page.locator('.toast').first().waitFor({ state: 'visible', timeout: 10000 });
  return (await page.locator('.toast').first().textContent())?.trim();
};
const counter = () => page.evaluate(() => document.querySelector('[data-testid=counter]')?.textContent ?? '');
const shoot = async (n) => {
  for (let i = 0; i < n; i++) {
    const before = await counter();
    await tid('shutter').click();
    await page.waitForFunction((b) => (document.querySelector('[data-testid=counter]')?.textContent ?? '') !== b, before, { timeout: 15000 });
  }
};
const covered = (ids) =>
  page.evaluate((ids) => ids.filter((id) => {
    const el = document.querySelector(`[data-testid=${id}]`);
    if (!el) return true;
    const b = el.getBoundingClientRect();
    return !document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)?.closest(`[data-testid=${id}]`);
  }), ids);

sh(`rm -rf ${GALLERY}`);
await launch({ clear: true });
sh(`pm grant ${PKG} android.permission.CAMERA`);
await launch();
console.log(`SILVR Android QA on ${serial} (Android ${sh('getprop ro.build.version.release').trim()}, WebView ${(await page.evaluate(() => navigator.userAgent)).match(/Chrome\/([\d.]+)/)?.[1]})`);

await check('onboarding shows and skips', async () => {
  await visible('onboarding');
  shot('01-onboarding');
  await tid('onb-skip').click();
  await hidden('onboarding');
});

await check('camera preview runs (native permission)', async () => {
  // The <video> is never attached (frames are drawn by WebGL), so judge the viewfinder by its pixels:
  // a live scene compresses to a far bigger PNG than a black or placeholder box.
  await visible('btn-load', 20000);
  await sleep(3000);
  const bytes = (await page.locator('.viewfinder').first().screenshot()).length;
  shot('02-camera');
  if (bytes < 4000) throw new Error(`viewfinder looks empty (${bytes} B)`);
  return `viewfinder PNG ${Math.round(bytes / 1024)} KB`;
});

await check('load roll and shoot 3, shutter vibrates', async () => {
  await tid('stock-sunny200').first().click();
  await page.getByRole('radio', { name: /^12/ }).click();
  await tid('btn-load').click();
  await shoot(3);
  shot('03-shooting');
  const vib = sh('dumpsys vibrator_manager');
  if (!vib.includes(PKG)) throw new Error('no vibration recorded for the app');
  return `counter ${(await counter()).trim()}`;
});

await check('hardware back closes the roll sheet first', async () => {
  await tid('roll-btn').click();
  await visible('roll-sheet');
  back();
  await hidden('roll-sheet');
  if (!(await tid('camera-screen').isVisible())) throw new Error('left the camera screen');
});

await check('roll survives the process being killed in the background', async () => {
  sh('input keyevent 3'); // home
  await sleep(1500);
  sh(`am kill ${PKG}`);
  await sleep(1000);
  sh(`am start -n ${PKG}/.MainActivity`);
  await sleep(4000);
  await attach();
  await visible('shutter', 20000);
  const c = (await counter()).replace(/\s/g, '');
  if (!c.startsWith('03')) throw new Error(`counter after restart: ${c}`);
  return `counter ${c}`;
});

await check('rewind → instant develop → roll with 3 prints', async () => {
  await tid('roll-btn').click();
  await tid('btn-rewind').click();
  await tid('confirm-ok').click();
  await tid('speed-instant').click();
  await visible('roll-screen');
  await page.waitForFunction(() => document.querySelectorAll('[data-testid=thumb] img').length === 3, null, { timeout: 60000 });
  shot('04-roll');
});

await check('photo opens with a full-size print', async () => {
  await tid('thumb').first().click();
  await visible('print');
  await page.waitForFunction(() => document.querySelector('[data-testid=print]')?.naturalWidth > 0);
  const [w, h] = await tid('print').evaluate((i) => [i.naturalWidth, i.naturalHeight]);
  shot('05-photo');
  return `${w}×${h}`;
});

await check('Save puts the print in the gallery (Pictures/SILVR), no share sheet', async () => {
  const before = galleryCount();
  await tid('btn-save').click();
  const msg = await toastText();
  await sleep(800);
  if (isChooser(focusedWindow())) throw new Error('share sheet opened');
  const after = galleryCount();
  shot('06-save');
  if (after !== before + 1) throw new Error(`gallery ${before} → ${after}`);
  const media = sh(`content query --uri content://media/external/images/media --projection _display_name:relative_path --where "relative_path LIKE 'Pictures/SILVR%'"`);
  if (!/SILVR_\d{8}_\d{6}\.(jpg|png)/.test(media)) throw new Error('not indexed in MediaStore');
  return `"${msg}", gallery ${before} → ${after}, in MediaStore`;
});

await check('Share opens the system share sheet', async () => {
  await tid('btn-share').click();
  await sleep(2500);
  const top = focusedWindow();
  shot('07-share');
  if (!isChooser(top)) throw new Error(`no share sheet: ${top}`);
  back();
  await sleep(1000);
  if (!focusedWindow().includes(PKG)) throw new Error('app not in front after closing the sheet');
});

await check('darkroom re-develop and save', async () => {
  await visible('btn-darkroom');
  await tid('btn-darkroom').click();
  await visible('darkroom-screen');
  await tid('stock-mono400').click();
  shot('08-darkroom');
  await tid('btn-dr-save').click();
  await visible('photo-screen');
});

await check('hardware back walks history: photo → roll', async () => {
  back();
  await visible('roll-screen');
});

await check('contact sheet Save goes to the gallery', async () => {
  const before = galleryCount();
  await tid('btn-contact').click();
  await page.locator('[data-testid=contact-sheet] img').waitFor({ state: 'visible', timeout: 60000 });
  await tid('btn-contact-save').click();
  await page.locator('.toast', { hasText: /saved|저장/i }).first().waitFor({ state: 'visible', timeout: 10000 });
  const msg = await page.locator('.toast', { hasText: /saved|저장/i }).first().textContent();
  await sleep(800);
  const after = galleryCount();
  shot('09-contact');
  back();
  if (after !== before + 1) throw new Error(`gallery ${before} → ${after}`);
  return `"${msg}", gallery ${before} → ${after}`;
});

await check('backup file: create and hand to the share sheet', async () => {
  await tid('tab-settings').click();
  await tid('btn-backup').click();
  await visible('btn-backup-save', 60000);
  const status = await tid('backup-status').textContent();
  await tid('btn-backup-save').click();
  await sleep(2500);
  const top = focusedWindow();
  shot('10-backup');
  if (!isChooser(top)) throw new Error(`no share sheet: ${top}`);
  back();
  await sleep(800);
  return status?.trim();
});

await check('analog meter', async () => {
  await tid('tab-analog').click();
  await tid('iso-200').click();
  await tid('ap-11').click();
  const v = await tid('meter-shutter').textContent();
  shot('11-meter');
  return v?.trim();
});

await check('shooting log saves GPS coordinates when location is on', async () => {
  sh(`pm grant ${PKG} android.permission.ACCESS_FINE_LOCATION`);
  sh(`pm grant ${PKG} android.permission.ACCESS_COARSE_LOCATION`);
  adb('emu', 'geo', 'fix', '126.9780', '37.5665'); // Seoul City Hall (lon lat)
  await sleep(1500);
  await tid('btn-new-log').click();
  await tid('log-camera').fill('Nikon FM2');
  await tid('log-film').fill('Portra 400');
  await tid('log-create').click();
  await visible('log-screen');
  await tid('btn-add-frame').click();
  await page.locator('label.toggle', { hasText: /location|위치/i }).locator('input').check({ force: true });
  await tid('frame-save').click();
  await page.waitForFunction(() => document.querySelectorAll('[data-testid=log-frame]').length === 1, null, { timeout: 20000 });
  const frame = await page.evaluate(() => new Promise((res, rej) => {
    const open = indexedDB.open('silvr');
    open.onsuccess = () => {
      const req = open.result.transaction('logFrames').objectStore('logFrames').getAll();
      req.onsuccess = () => res(req.result[0]);
      req.onerror = () => rej(req.error);
    };
    open.onerror = () => rej(open.error);
  }));
  shot('12-log');
  if (typeof frame?.lat !== 'number') throw new Error(`no coordinates saved: ${JSON.stringify(frame)}`);
  return `${frame.lat}, ${frame.lon}`;
});

await check('small screen 360×640dp: print never covers the viewer buttons', async () => {
  sh('wm size 720x1280');
  sh('wm density 320');
  await sleep(2500);
  try {
    await tid('tab-gallery').click();
    await page.getByTestId('roll-card').first().locator('.roll-meta').click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid=thumb] img').length > 0, null, { timeout: 30000 });
    await tid('thumb').first().click();
    await visible('print');
    await sleep(1500);
    const [w, h] = await page.evaluate(() => [innerWidth, innerHeight]);
    const bad = await covered(['btn-share', 'btn-save', 'btn-darkroom', 'btn-delete']);
    shot('13-small-screen');
    if (bad.length) throw new Error(`covered at ${w}×${h}: ${bad.join(', ')}`);
    return `viewport ${w}×${h}`;
  } finally {
    sh('wm size reset');
    sh('wm density reset');
    await sleep(2000);
  }
});

await check('large system font (130%): no horizontal overflow on the main tabs', async () => {
  sh('settings put system font_scale 1.3');
  try {
    await launch();
    const overflow = [];
    for (const tab of ['camera', 'lab', 'gallery', 'analog', 'settings']) {
      await tid(`tab-${tab}`).click();
      await sleep(700);
      const o = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (o > 1) overflow.push(`${tab} +${o}px`);
      if (tab === 'camera') shot('14-font-130');
    }
    const size = await page.evaluate(() => getComputedStyle(document.body).fontSize);
    if (overflow.length) throw new Error(overflow.join(', '));
    return `body font ${size}`;
  } finally {
    sh('settings put system font_scale 1.0');
  }
});

await check('offline (airplane mode): app starts and shoots', async () => {
  sh('cmd connectivity airplane-mode enable');
  await sleep(1500);
  try {
    await launch();
    await tid('tab-camera').click();
    await tid('stock-sunny200').first().click();
    await tid('btn-load').click();
    await shoot(1);
    shot('15-offline');
    return `counter ${(await counter()).trim()}`;
  } finally {
    sh('cmd connectivity airplane-mode disable');
  }
});

await check('camera permission denied: app explains and offers import', async () => {
  sh(`pm revoke ${PKG} android.permission.CAMERA`);
  sh(`pm set-permission-flags ${PKG} android.permission.CAMERA user-fixed`);
  try {
    await launch();
    await tid('tab-camera').click();
    await visible('camera-error', 20000);
    const text = (await tid('camera-error').textContent())?.trim().slice(0, 60);
    shot('16-camera-denied');
    return text;
  } finally {
    sh(`pm clear-permission-flags ${PKG} android.permission.CAMERA user-fixed`);
    sh(`pm grant ${PKG} android.permission.CAMERA`);
  }
});

await check('hardware back at the camera root leaves the app', async () => {
  await launch();
  await tid('tab-camera').click();
  await visible('camera-screen');
  back();
  await sleep(1500);
  const top = focusedWindow();
  if (top.includes(PKG)) throw new Error(`still in front: ${top}`);
});

await check('no page errors', async () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
});

writeFileSync(join(outDir, 'results.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} passed`);
await device.close().catch(() => {});
process.exit(failed ? 1 : 0);
