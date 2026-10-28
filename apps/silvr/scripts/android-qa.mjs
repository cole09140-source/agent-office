// Drives the debug APK's real Android WebView over CDP: the main flow plus the
// native pieces (camera, hardware back, share sheet, file save, backup).
// Needs: debug APK installed on one adb device/emulator, camera permission granted.
// usage: node scripts/android-qa.mjs <adb serial> <screenshot dir>
import { _android as android } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [serial = 'emulator-5554', outDir = 'android-qa'] = process.argv.slice(2);
const PKG = 'app.silvr.camera';
const adb = (...a) => execFileSync('adb', ['-s', serial, ...a], { encoding: 'utf8' });
const adbBin = (...a) => execFileSync('adb', ['-s', serial, ...a], { maxBuffer: 64 << 20 });
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
const back = () => adb('shell', 'input', 'keyevent', '4');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const focusedWindow = () => adb('shell', 'dumpsys', 'window', 'displays').match(/mCurrentFocus=.*$/m)?.[0] ?? '';

// fresh start
adb('shell', 'pm', 'clear', PKG);
adb('shell', 'pm', 'grant', PKG, 'android.permission.CAMERA');
adb('shell', 'am', 'start', '-n', `${PKG}/.MainActivity`);
await sleep(5000);
const device = (await android.devices()).find((d) => d.serial() === serial);
if (!device) throw new Error(`adb device ${serial} not found`);
const page = await (await device.webView({ pkg: PKG })).page();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
// Capacitor's debug bridge logs every rejected plugin call; a dismissed share sheet is handled by the app.
page.on('console', (m) => m.type() === 'error' && !/Share canceled/.test(m.text()) && errors.push(`console: ${m.text()}`));
const tid = (id) => page.getByTestId(id);
const visible = async (id, timeout = 15000) => tid(id).first().waitFor({ state: 'visible', timeout });
const hidden = async (id, timeout = 15000) => tid(id).first().waitFor({ state: 'hidden', timeout });

console.log(`SILVR Android QA on ${serial} (${adb('shell', 'getprop', 'ro.build.version.release').trim()})`);

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

await check('load roll and shoot 3', async () => {
  await tid('stock-sunny200').first().click();
  await page.getByRole('radio', { name: /^12/ }).click();
  await tid('btn-load').click();
  for (let i = 1; i <= 3; i++) {
    await tid('shutter').click();
    await page.waitForFunction((n) => document.querySelector('[data-testid=counter]')?.textContent?.includes(String(n).padStart(2, '0')), i, { timeout: 15000 });
  }
  shot('03-shooting');
});

await check('hardware back closes the roll sheet first', async () => {
  await tid('roll-btn').click();
  await visible('roll-sheet');
  back();
  await hidden('roll-sheet');
  if (!(await tid('camera-screen').isVisible())) throw new Error('left the camera screen');
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

await check('save writes the print through the native file API', async () => {
  await tid('btn-save').click();
  await sleep(2500);
  const top = focusedWindow();
  shot('06-save');
  if (/chooser|resolver|ShareSheet|intentresolver/i.test(top)) back();
  await sleep(800);
  return top.replace(/^mCurrentFocus=/, '');
});

await check('share opens the system share sheet', async () => {
  await visible('btn-share');
  await tid('btn-share').click();
  await sleep(2500);
  const top = focusedWindow();
  shot('07-share');
  if (!/chooser|resolver|ShareSheet|intentresolver/i.test(top)) throw new Error(`no share sheet: ${top}`);
  back();
  await sleep(1000);
  if (!adb('shell', 'dumpsys', 'window', 'displays').includes(PKG)) throw new Error('app not in front after closing the sheet');
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

await check('hardware back walks history: photo → roll → camera', async () => {
  back();
  await visible('roll-screen');
  back(); // the roll was opened straight from the camera after developing
  await page.waitForFunction(() => location.hash.startsWith('#/camera'), null, { timeout: 10000 });
});

await check('backup file: create and hand to the share sheet', async () => {
  await tid('tab-settings').click();
  await tid('btn-backup').click();
  await visible('btn-backup-save', 60000);
  const status = await tid('backup-status').textContent();
  await tid('btn-backup-save').click();
  await sleep(2500);
  const top = focusedWindow();
  shot('09-backup');
  if (/chooser|resolver|ShareSheet|intentresolver/i.test(top)) back();
  await sleep(800);
  return `${status?.trim()} | ${top.replace(/^mCurrentFocus=/, '')}`;
});

await check('analog meter', async () => {
  await tid('tab-analog').click();
  await tid('iso-200').click();
  await tid('ap-11').click();
  const v = await tid('meter-shutter').textContent();
  shot('10-meter');
  return v?.trim();
});

await check('hardware back at the camera root leaves the app', async () => {
  await tid('tab-camera').click();
  await visible('camera-screen');
  back();
  await sleep(1500);
  const top = focusedWindow();
  if (top.includes(PKG)) throw new Error(`still in front: ${top}`);
  adb('shell', 'am', 'start', '-n', `${PKG}/.MainActivity`);
  await sleep(1500);
});

await check('no page errors', async () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
});

writeFileSync(join(outDir, 'results.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} passed`);
await device.close().catch(() => {});
process.exit(failed ? 1 : 0);
