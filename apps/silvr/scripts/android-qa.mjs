// Drives the debug APK's real Android WebView: the main flow plus the native
// pieces (camera, haptics, hardware back, gallery save, share sheet, backup,
// location) and device conditions (process death, small screen, large font,
// offline, camera permission denied) and v1.1 monetization (10 free shots a day,
// paywall on the 11th, MY tab, rewarded ad = Google TEST unit in debug builds,
// billing absent on an emulator without a Play account).
// Needs: debug APK installed on one adb device/emulator (with network for the ad check).
// usage: node scripts/android-qa.mjs <adb serial> <screenshot dir>   (QA_ONLY=<regex> for a subset)
import { _android as android } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [serial = 'emulator-5554', outDir = 'android-qa'] = process.argv.slice(2);
// Store package id (applicationId). Java classes stay in app.silvr.camera, so components need the full class name.
const PKG = 'com.filmcamela.app';
const ACTIVITY = `${PKG}/app.silvr.camera.MainActivity`;
const LABEL = 'Film Camela';
const FREE_SHOTS = 10; // src/monetize/config.ts FREE_SHOTS_PER_DAY
const TEST_REWARDED = 'ca-app-pub-3940256099942544/5224354917'; // Google's sample rewarded unit (debug builds)
const REAL_REWARDED = 'ca-app-pub-6568578451894077/6676086887'; // must never be requested by a debug build
const SDK = process.env.ANDROID_HOME || 'C:\\Android\\sdk';
const GALLERY = "'/sdcard/Pictures/Film Camela'"; // quoted for adb shell (space in the album name)
const adb = (...a) => execFileSync('adb', ['-s', serial, ...a], { encoding: 'utf8', maxBuffer: 64 << 20 });
const adbBin = (...a) => execFileSync('adb', ['-s', serial, ...a], { maxBuffer: 64 << 20 });
const sh = (cmd) => adb('shell', cmd);
mkdirSync(outDir, { recursive: true });

const results = [];
// QA_ONLY=<regex>: run only matching checks (the cold start check always runs; it attaches to the WebView).
const ONLY = process.env.QA_ONLY ? new RegExp(process.env.QA_ONLY, 'i') : null;
const check = async (name, fn) => {
  if (ONLY && !ONLY.test(name) && !/^cold start/.test(name)) return;
  try {
    dismissSystemAnr();
    const note = await fn();
    results.push({ name, ok: true, note: note ?? '' });
    console.log(`  ok  ${name}${note ? ` — ${note}` : ''}`);
  } catch (e) {
    results.push({ name, ok: false, note: String(e.message ?? e).split('\n')[0] });
    console.log(`  FAIL ${name} — ${String(e.message ?? e).split('\n')[0]}`);
  }
};
/** A cold emulator often shows "System UI isn't responding": tap Wait so it does not cover the app or prompts. */
function dismissSystemAnr() {
  for (let i = 0; i < 3 && /Application Not Responding|Application Error/.test(focusedWindow()); i++) {
    const wait = uiFind(/aerr_wait|^Wait$|android:id\/button1 Wait/i);
    if (wait) sh(`input tap ${wait.x} ${wait.y}`);
    else back();
    execFileSync(process.execPath, ['-e', 'setTimeout(()=>{},800)']);
  }
}
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
const warnings = [];
let page;
/** (Re)launches the app and attaches to its WebView. */
async function launch({ clear = false } = {}) {
  if (clear) sh(`pm clear ${PKG}`);
  else sh(`am force-stop ${PKG}`);
  sh(`am start -n ${ACTIVITY}`);
  await sleep(4000);
  await attach();
}
async function attach() {
  page = await (await device.webView({ pkg: PKG })).page();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  // Capacitor's debug bridge logs every rejected plugin call; a dismissed share sheet is handled by the app.
  page.on('console', (m) => m.type() === 'error' && !/Share canceled/.test(m.text()) && errors.push(`console: ${m.text()} @ ${m.location()?.url ?? ''}`));
  page.on('console', (m) => m.type() === 'warning' && warnings.push(m.text()));
  page.on('response', (r) => r.status() >= 400 && errors.push(`http ${r.status()} ${r.url()}`));
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
    // A capture takes ~13 s on a cold x86 emulator (WebGL develop + IndexedDB write); 45 s leaves headroom.
    await page.waitForFunction((b) => (document.querySelector('[data-testid=counter]')?.textContent ?? '') !== b, before, { timeout: 45000 });
  }
};
/** Accessibility nodes (native dialogs / ad activity) from uiautomator, with label and center. */
function uiNodes() {
  sh('uiautomator dump /sdcard/fc-ui.xml');
  const xml = sh('cat /sdcard/fc-ui.xml');
  return [...xml.matchAll(/<node [^>]*>/g)].map(([n]) => {
    const a = (k) => n.match(new RegExp(` ${k}="([^"]*)"`))?.[1] ?? '';
    const b = a('bounds').match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/)?.slice(1).map(Number) ?? [0, 0, 0, 0];
    return { label: `${a('resource-id')} ${a('text')} ${a('content-desc')}`.trim(), x: (b[0] + b[2]) >> 1, y: (b[1] + b[3]) >> 1 };
  });
}
const uiFind = (re) => uiNodes().find((n) => re.test(n.label));
const cameraGranted = () => /android\.permission\.CAMERA: granted=true/.test(sh(`dumpsys package ${PKG}`));
const appAlive = () => sh(`pidof ${PKG} || true`).trim();
// MY tab: the new monetization tab may be called my or keep the old settings id; accept either.
const MY_TABS = ['tab-my', 'nav-my', 'tab-settings', 'nav-settings'];
async function myTabId() {
  for (const id of MY_TABS) if (await tid(id).first().isVisible().catch(() => false)) return id;
  throw new Error(`no MY tab (tried ${MY_TABS.join(', ')})`);
}
const openMy = async () => {
  const id = await myTabId();
  try {
    await tid(id).first().click({ timeout: 15000 });
  } catch (e) {
    const onTop = await tid(id).first().evaluate((el) => {
      const b = el.getBoundingClientRect();
      const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return top?.closest('[data-testid]')?.getAttribute('data-testid') ?? top?.className ?? 'none';
    }).catch(() => '?');
    shot('my-tab-blocked');
    throw new Error(`${id} not clickable, covered by "${onTop}" (${focusedWindow().replace(/^.*\{\S+ \S+ /, '')})`);
  }
  return id;
};
/** Stored quota record (IndexedDB silvr / kv['quota'], src/monetize/quota.ts). */
const readQuota = () =>
  page.evaluate(() => new Promise((res, rej) => {
    const open = indexedDB.open('silvr');
    open.onsuccess = () => {
      try {
        const r = open.result.transaction('kv').objectStore('kv').get('quota');
        r.onsuccess = () => res(r.result ?? null);
        r.onerror = () => rej(r.error);
      } catch (e) {
        res(null);
      }
    };
    open.onerror = () => rej(open.error);
  }));
/** Shots left as the UI shows it (camera pill, else MY count), falling back to the stored record. */
async function shotsLeft() {
  const pill = await page.evaluate(() => document.querySelector('[data-testid=shots-left]')?.getAttribute('data-n'));
  if (pill != null) return { n: Number(pill), from: 'shots-left pill' };
  const q = await readQuota();
  return { n: Math.max(0, FREE_SHOTS - (q?.freeUsedToday ?? 0)) + (q?.earnedBalance ?? 0), from: 'stored quota' };
}
/** Records every native plugin call (plugin, method, options) made from the page. */
const spyBridge = () =>
  page.evaluate(() => {
    const cap = window.Capacitor;
    if (!cap || cap.__fcSpy) return;
    cap.__fcSpy = [];
    const orig = cap.nativePromise.bind(cap);
    cap.nativePromise = (plugin, method, options) => {
      cap.__fcSpy.push({ plugin, method, options: JSON.stringify(options ?? null) });
      return orig(plugin, method, options);
    };
  });
const spied = () => page.evaluate(() => window.Capacitor?.__fcSpy ?? []);
/** Fresh install state (quota, onboarding) with the camera already allowed; ends on the camera screen. */
async function fresh() {
  await launch({ clear: true });
  sh(`pm grant ${PKG} android.permission.CAMERA`);
  await launch();
  // A cleared app always starts with onboarding; wait for it instead of racing the first render.
  if (await tid('onboarding').first().waitFor({ state: 'visible', timeout: 20000 }).then(() => true, () => false)) {
    await tid('onb-skip').click();
    await hidden('onboarding');
  }
}
const covered = (ids) =>
  page.evaluate((ids) => ids.filter((id) => {
    const el = document.querySelector(`[data-testid=${id}]`);
    if (!el) return true;
    const b = el.getBoundingClientRect();
    return !document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2)?.closest(`[data-testid=${id}]`);
  }), ids);

sh(`rm -rf ${GALLERY}`);
sh('logcat -c');
sh('logcat -b crash -c');
console.log(`Film Camela Android QA on ${serial} (Android ${sh('getprop ro.build.version.release').trim()})`);

await check('cold start after a fresh install: process stays up, no crash', async () => {
  sh(`pm clear ${PKG}`); // also revokes runtime permissions → the prompt flow below runs for real
  const out = sh(`am start -W -n ${ACTIVITY}`);
  await sleep(5000);
  const pid = appAlive();
  if (!pid) throw new Error('process gone 5 s after cold start');
  await attach();
  const crash = sh('logcat -d -b crash');
  if (crash.includes(PKG)) throw new Error(`crash: ${crash.split('\n').find((l) => /Exception|Error/.test(l)) ?? 'see logcat -b crash'}`);
  console.log(`  (WebView ${(await page.evaluate(() => navigator.userAgent)).match(/Chrome\/([\d.]+)/)?.[1]})`);
  return `TotalTime ${out.match(/TotalTime: (\d+)/)?.[1] ?? '?'} ms, pid ${pid}`;
});

await check(`installed app: launcher label "${LABEL}", icon, version`, async () => {
  const path = sh(`pm path ${PKG}`).match(/package:(\S+base\.apk)/)?.[1];
  if (!path) throw new Error('pm path found no base.apk');
  const local = join(tmpdir(), `fc-qa-${process.pid}.apk`);
  adb('pull', path, local);
  const bt = join(SDK, 'build-tools', readdirSync(join(SDK, 'build-tools')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop());
  const badging = execFileSync(join(bt, 'aapt2.exe'), ['dump', 'badging', local], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const label = badging.match(/application-label:'([^']*)'/)?.[1];
  const icon = badging.match(/application: label='[^']*' icon='([^']+)'/)?.[1];
  const launchable = badging.match(/launchable-activity: name='([^']+)'\s+label='([^']*)'/);
  const ver = badging.match(/versionCode='(\d+)' versionName='([^']+)'/);
  if (label !== LABEL) throw new Error(`label "${label}"`);
  if (!icon || !/mipmap/.test(icon)) throw new Error(`icon ${icon}`);
  if (launchable?.[1] !== 'app.silvr.camera.MainActivity' || (launchable[2] && launchable[2] !== LABEL)) throw new Error(`launcher activity ${launchable?.[1]} "${launchable?.[2]}"`);
  return `${label}, ${icon}, ${ver?.[2]} (${ver?.[1]})`;
});

await check('onboarding shows and skips', async () => {
  await visible('onboarding');
  shot('01-onboarding');
  await tid('onb-skip').click();
  await hidden('onboarding');
});

await check('camera permission prompt → "While using the app" → granted', async () => {
  try {
    let w = '';
    for (const until = Date.now() + 15000; Date.now() < until; await sleep(500)) {
      w = focusedWindow();
      if (/GrantPermissionsActivity|permissioncontroller/i.test(w)) break;
    }
    if (!/GrantPermissionsActivity|permissioncontroller/i.test(w)) throw new Error(`no system permission dialog (focus: ${w})`);
    shot('01b-permission');
    const allow = uiFind(/permission_allow_foreground_only_button|While using the app|앱 사용 중에만 허용/i) ?? uiFind(/permission_allow_button|permission_allow_one_time_button|^Allow$/i);
    if (!allow) throw new Error('no allow button in the dialog');
    sh(`input tap ${allow.x} ${allow.y}`);
    await sleep(1500);
    if (!cameraGranted()) throw new Error('CAMERA not granted after tapping allow');
    if (!focusedWindow().includes(PKG)) throw new Error('app not in front after the dialog');
    return allow.label.replace(/^com\.android\.permissioncontroller:id\//, '');
  } finally {
    // Keep the rest of the run meaningful even if the prompt flow failed.
    if (!cameraGranted()) {
      sh(`pm grant ${PKG} android.permission.CAMERA`);
      await launch();
    }
  }
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
  await tid('roll-btn').first().click();
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
  sh(`am start -n ${ACTIVITY}`);
  await sleep(4000);
  await attach();
  await visible('shutter', 20000);
  const c = (await counter()).replace(/\s/g, '');
  if (!c.startsWith('03')) throw new Error(`counter after restart: ${c}`);
  return `counter ${c}`;
});

await check('rewind → instant develop → roll with 3 prints', async () => {
  await tid('roll-btn').first().click();
  await tid('btn-rewind').click();
  // The confirm dialog and the develop-speed picker are optional in the reskinned camera (as in e2e/helpers.ts).
  await page.locator('[data-testid=confirm-ok],[data-testid=speed-instant],[data-testid=roll-screen]').first().waitFor({ state: 'visible', timeout: 15000 });
  if (await tid('confirm-ok').isVisible().catch(() => false)) await tid('confirm-ok').click();
  await page.locator('[data-testid=speed-instant],[data-testid=roll-screen]').first().waitFor({ state: 'visible', timeout: 15000 });
  if (await tid('speed-instant').isVisible().catch(() => false)) await tid('speed-instant').click();
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

await check('Save puts the print in the gallery (Pictures/Film Camela), no share sheet', async () => {
  const before = galleryCount();
  await tid('btn-save').click();
  const msg = await toastText();
  await sleep(800);
  if (isChooser(focusedWindow())) throw new Error('share sheet opened');
  const after = galleryCount();
  shot('06-save');
  if (after !== before + 1) throw new Error(`gallery ${before} → ${after}`);
  const media = sh(`content query --uri content://media/external/images/media --projection _display_name:relative_path --where "relative_path LIKE 'Pictures/Film Camela%'"`);
  if (!/FilmCamela_\d{8}_\d{6}(_\d+)?\.(jpg|png)/.test(media)) throw new Error('not indexed in MediaStore');
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
  await openMy();
  // v1.1: one button builds the file and hands it to the share sheet; "btn-backup-save" only shows
  // when that hand-off did not happen (older flow: build first, then save).
  const start = page.locator('[data-testid=btn-backup],[data-testid=btn-backup-save]').first();
  await start.scrollIntoViewIfNeeded();
  try {
    await start.click({ timeout: 15000 });
  } catch (e) {
    const blocker = await start.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const top = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return `${el.dataset.testid} disabled=${el.disabled} at ${Math.round(b.y)}/${innerHeight}; on top: ${top?.closest('[data-testid]')?.getAttribute('data-testid') ?? top?.className ?? 'none'}`;
    }).catch(() => 'not found');
    shot('10-backup-blocked');
    throw new Error(`backup button not clickable (${blocker})`);
  }
  let status = '';
  for (const until = Date.now() + 60000; Date.now() < until && !isChooser(focusedWindow()); await sleep(1000)) {
    if (await tid('btn-backup-save').isVisible().catch(() => false)) {
      status = (await tid('backup-status').textContent().catch(() => '')) ?? '';
      // Click from inside the page: the share sheet pauses the WebView at once, so a CDP click can
      // hang waiting for its own mouseup to finish.
      await page.evaluate(() => setTimeout(() => document.querySelector('[data-testid=btn-backup-save]')?.click(), 0));
      for (let i = 0; i < 10 && !isChooser(focusedWindow()); i++) await sleep(1000);
      break;
    }
  }
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

await check('shooting log CSV export hands the file to the share sheet', async () => {
  await tid('btn-csv').click();
  await sleep(2500);
  const top = focusedWindow();
  shot('12b-csv');
  if (!isChooser(top)) throw new Error(`no share sheet: ${top}`);
  back();
  await sleep(1000);
});

await check('legal pages open inside the app and link back to Settings', async () => {
  await openMy();
  await page.locator('a.row.link[href^="./privacy.html"]').first().click();
  await page.waitForURL(/privacy\.html/, { timeout: 10000 });
  shot('12c-privacy');
  await page.locator('.back a').click();
  await page.waitForURL(/#\/(settings|my)/, { timeout: 10000 });
  await page.locator('[data-testid=settings-screen],[data-testid=my-screen]').first().waitFor({ state: 'visible', timeout: 15000 });
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
    for (const tab of ['camera', 'lab', 'gallery', 'analog', (await myTabId()).replace(/^(tab|nav)-/, '')]) {
      await page.locator(`[data-testid=tab-${tab}],[data-testid=nav-${tab}]`).first().click();
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

// ---------------------------------------------------------------- v1.1 monetization (fresh install state)
// The web QA hatch (localStorage fc-unlimited) is ignored in the native app by design, so the real
// 10-a-day limit applies here.

await check('MY tab opens: shots card shows the 10 free shots, Pro card present', async () => {
  await fresh();
  const id = await openMy();
  await page.locator('[data-testid=my-section],[data-testid=my-shots],[data-testid=my-screen]').first().waitFor({ state: 'visible', timeout: 15000 });
  await sleep(1500); // quota + store state settle
  const free = (await tid('my-free-left').first().textContent().catch(() => null))?.trim();
  shot('17-my');
  if (free != null && Number(free.match(/\d+/)?.[0]) !== FREE_SHOTS) throw new Error(`free shots shown: "${free}"`);
  return `via ${id}, free left ${free ?? '(no my-free-left)'}`;
});

await check('billing on an emulator without a Play account: handled, no crash', async () => {
  // MY is open. Without a signed-in Play account the store connection fails: buy/restore must be
  // disabled or answer with a message, never crash or hang.
  await sleep(2500);
  const pro = tid('my-pro').first();
  await pro.waitFor({ state: 'visible', timeout: 10000 });
  await pro.scrollIntoViewIfNeeded();
  const buyDisabled = await tid('btn-buy').first().isDisabled().catch(() => null);
  const restoreDisabled = await tid('btn-restore-purchases').first().isDisabled().catch(() => null);
  const prices = await page.locator('[data-testid^=price-]').allTextContents().catch(() => []);
  let outcome = '';
  if (restoreDisabled === false) {
    await tid('btn-restore-purchases').first().click();
    outcome = (await toastText().catch(() => '(no toast)')) ?? '';
    await sleep(2000);
  }
  shot('18-billing');
  if (!appAlive()) throw new Error('app process died');
  if (!focusedWindow().includes(PKG)) throw new Error(`app not in front: ${focusedWindow()}`);
  const warn = warnings.find((w) => /billing|store|purchase/i.test(w));
  return `buy ${buyDisabled ? 'disabled' : 'enabled'}, restore ${restoreDisabled ? 'disabled' : `→ "${outcome}"`}, prices [${prices.map((p) => p.trim()).filter(Boolean).join(' | ') || 'none'}]${warn ? `, warn "${warn.slice(0, 80)}"` : ''}`;
});

await check(`${FREE_SHOTS} free shots a day: count drops per press, press ${FREE_SHOTS + 1} opens the paywall`, async () => {
  await tid('tab-camera').click();
  await tid('stock-sunny200').first().click();
  await page.getByRole('radio', { name: /^(24|36)/ }).first().click();
  await tid('btn-load').click();
  await visible('shutter');
  const start = await shotsLeft();
  if (start.n !== FREE_SHOTS) throw new Error(`starts at ${start.n} (${start.from})`);
  for (let i = 1; i <= FREE_SHOTS; i++) {
    await shoot(1);
    await sleep(300);
    const now = await shotsLeft();
    if (now.n !== FREE_SHOTS - i) throw new Error(`after ${i} shots: ${now.n} left (${now.from})`);
  }
  shot('19-quota-0');
  const before = await counter();
  await tid('shutter').click();
  await visible('paywall', 10000);
  await sleep(800);
  shot('20-paywall');
  if ((await counter()) !== before) throw new Error('11th press still took a photo');
  const q = await readQuota();
  if (q && q.freeUsedToday !== FREE_SHOTS) throw new Error(`stored freeUsedToday ${q.freeUsedToday}`);
  return `${FREE_SHOTS}→0 (${start.from}), stored freeUsedToday ${q?.freeUsedToday ?? '?'}`;
});

let adShown = false;
await check('watch ad in a debug build requests the Google TEST rewarded unit, never the real one', async () => {
  sh('logcat -c');
  await spyBridge();
  let btn = 'pw-watch-ad';
  if (!(await tid(btn).first().isVisible().catch(() => false))) {
    // No ad button on the paywall: try MY.
    if (await tid('paywall').first().isVisible().catch(() => false)) await tid('pw-later').click().catch(() => back());
    await openMy();
    btn = 'btn-watch-ad';
  }
  await tid(btn).first().waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForFunction((b) => !document.querySelector(`[data-testid=${b}]`)?.disabled, btn, { timeout: 15000 }).catch(() => {});
  await sleep(600); // the paywall ignores taps in its first 450 ms
  await tid(btn).first().click();
  let req = [];
  for (const until = Date.now() + 60000; Date.now() < until; await sleep(1000)) {
    if (/AdActivity/.test(focusedWindow())) adShown = true;
    req = (await spied().catch(() => req)).filter((c) => c.plugin === 'AdMob' && /RewardVideoAd/.test(c.method));
    if (adShown) break;
    const note = (await tid('ad-note').first().textContent().catch(() => '')) ?? '';
    if (req.length && /fail|couldn|error|실패/i.test(note)) break;
  }
  shot('21-ad');
  const log = adb('logcat', '-d');
  const sources = `${req.map((c) => c.options).join('\n')}\n${log}`;
  if (sources.includes(REAL_REWARDED)) throw new Error('REAL rewarded unit requested by a debug build');
  const inBridge = req.some((c) => c.options.includes(TEST_REWARDED));
  const inLogcat = log.includes(TEST_REWARDED);
  if (!inBridge && !inLogcat) {
    const all = (await spied().catch(() => [])).filter((c) => c.plugin === 'AdMob').map((c) => c.method);
    const why = errors.concat(log.split(/\r?\n/)).find((l) => /misconfiguration|consent|UMP|ConsentInformation/i.test(l));
    const note = (await tid('ad-note').first().textContent().catch(() => '')) ?? '';
    throw new Error(`no rewarded request (AdMob calls: ${all.join(', ') || 'none'}; note "${note.trim()}")${why ? ` — ${why.trim().slice(0, 220)}` : ''}`);
  }
  return `test unit in ${[inBridge && 'plugin call', inLogcat && 'logcat'].filter(Boolean).join(' + ')}; real unit absent; ad ${adShown ? 'shown' : 'not shown (no fill / offline?)'}`;
});

await check('rewarded TEST ad watched to the end credits +10 shots', async () => {
  if (!adShown) throw new Error('no ad on screen to watch (see previous check)');
  const before = (await readQuota())?.earnedBalance ?? 0;
  // Test rewarded ads run ~5–30 s; then a close control appears.
  for (const until = Date.now() + 90000; Date.now() < until && /AdActivity/.test(focusedWindow()); ) {
    await sleep(5000);
    const close = uiFind(/close|dismiss|skip|닫기/i);
    if (close) sh(`input tap ${close.x} ${close.y}`);
    else back();
    await sleep(1500);
    // Some test creatives ask "close video? you will lose the reward" — keep watching.
    const resume = uiFind(/resume|continue|계속/i);
    if (resume) sh(`input tap ${resume.x} ${resume.y}`);
  }
  if (/AdActivity/.test(focusedWindow())) throw new Error('ad still on screen after 90 s');
  await sleep(2000);
  const after = (await readQuota())?.earnedBalance ?? 0;
  const left = await shotsLeft();
  shot('22-rewarded');
  if (after !== before + 10) throw new Error(`earned ${before} → ${after}`);
  return `earned ${before} → ${after}, shots left ${left.n}`;
});

await check('no crash in logcat (crash buffer) for the whole run', async () => {
  const crash = sh('logcat -d -b crash');
  if (crash.includes(PKG)) throw new Error(crash.split('\n').find((l) => /Exception|Error/.test(l)) ?? 'see logcat -b crash');
  if (!appAlive()) throw new Error('app process not running at the end');
});

await check('no page errors', async () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
});

writeFileSync(join(outDir, 'results.json'), JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.ok).length;
console.log(`${results.length - failed}/${results.length} passed`);
await device.close().catch(() => {});
process.exit(failed ? 1 : 0);
