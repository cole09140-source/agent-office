// Smoke test for the signed, R8-shrunk release APK. Release WebViews are not
// debuggable, so this drives the UI through the accessibility tree
// (uiautomator), using the English labels: onboarding → load → shoot →
// rewind → instant develop → open photo → Save to gallery → hardware back,
// plus v1.1: APK identity (label / package / version / not debuggable), cold start
// without a crash, MY tab, store billing absent on an emulator (no Play account)
// handled without a crash, and NO ad request at start-up. It never taps "Watch an
// ad": a release build requests the REAL ad unit, which must not be loaded or clicked
// on test devices (AdMob invalid traffic). Rewarded ads are covered by android-qa.mjs
// on the debug build (Google test unit).
// usage: node scripts/android-release-smoke.mjs <adb serial> <release.apk> <screenshot dir>
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [serial, apk, outDir = 'android-release-smoke'] = process.argv.slice(2);
if (!serial || !apk) throw new Error('usage: node android-release-smoke.mjs <serial> <release.apk> [out]');
// Store package id (applicationId). Java classes stay in app.silvr.camera, so components need the full class name.
const PKG = 'com.filmcamela.app';
const ACTIVITY = `${PKG}/app.silvr.camera.MainActivity`;
const LABEL = 'Film Camela';
const REAL_REWARDED = 'ca-app-pub-6568578451894077/6676086887';
const SDK = process.env.ANDROID_HOME || 'C:\\Android\\sdk';
const BT = join(SDK, 'build-tools', readdirSync(join(SDK, 'build-tools')).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop());
const adb = (...a) => execFileSync('adb', ['-s', serial, ...a], { encoding: 'utf8', maxBuffer: 64 << 20 });
const sh = (cmd) => adb('shell', cmd);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(outDir, { recursive: true });
const shot = (name) => writeFileSync(join(outDir, `${name}.png`), execFileSync('adb', ['-s', serial, 'exec-out', 'screencap', '-p'], { maxBuffer: 64 << 20 }));

/** All accessibility nodes on screen with their label and center. */
function nodes() {
  sh('uiautomator dump /sdcard/silvr-ui.xml');
  const xml = sh('cat /sdcard/silvr-ui.xml');
  return [...xml.matchAll(/<node [^>]*?text="([^"]*)"[^>]*?content-desc="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)].map((m) => ({
    label: `${m[1]} ${m[2]}`.trim(),
    x: (Number(m[3]) + Number(m[5])) >> 1,
    y: (Number(m[4]) + Number(m[6])) >> 1,
  }));
}
async function find(re, { last = false, timeout = 20000 } = {}) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    const hits = nodes().filter((n) => re.test(n.label));
    if (hits.length) return last ? hits[hits.length - 1] : hits[0];
    await sleep(700);
  }
  throw new Error(`not on screen: ${re}`);
}
// uiautomator's snapshot of a WebView sometimes lags behind (a sheet that is on screen
// is missing for seconds), so steps may name a fallback point measured on a Pixel 7
// (1080×2400) from the debug build. Fallback taps are reported, not hidden.
const fallbacks = [];
async function tap(re, opts = {}) {
  let n;
  try {
    n = await find(re, opts.fallback ? { ...opts, timeout: 8000 } : opts);
  } catch (e) {
    if (!opts.fallback) throw e;
    n = { label: `${re} (fallback point)`, x: opts.fallback[0], y: opts.fallback[1] };
    fallbacks.push(String(re));
  }
  sh(`input tap ${n.x} ${n.y}`);
  await sleep(900);
  return n.label;
}
// Roll button in the reskinned camera: "12 left · Sunny 200" before the first shot,
// "3 shots Send to lab · Sunny 200" after (Camera.tsx rollBtnLabel, en).
const ROLL_BTN = /(\d+ left|\d+ shots? .*Send to lab|Finish (pack|card)) · /;
const galleryCount = () => {
  try {
    return sh("ls '/sdcard/Pictures/Film Camela'").split(/\s+/).filter((f) => /\.(jpg|png)$/.test(f)).length;
  } catch {
    return 0;
  }
};

const steps = [];
const step = async (name, fn) => {
  try {
    const note = await fn();
    steps.push({ name, ok: true, note: note ?? '' });
    console.log(`  ok  ${name}${note ? ` — ${note}` : ''}`);
  } catch (e) {
    steps.push({ name, ok: false, note: String(e.message ?? e) });
    console.log(`  FAIL ${name} — ${e.message ?? e}`);
    shot(`fail-${steps.length}`);
  }
};

console.log(`Film Camela release smoke on ${serial}`);
await step(`APK: ${PKG}, label "${LABEL}", release (not debuggable)`, async () => {
  const b = execFileSync(join(BT, 'aapt2.exe'), ['dump', 'badging', apk], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const pkg = b.match(/package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'/);
  const label = b.match(/application-label:'([^']*)'/)?.[1];
  if (pkg?.[1] !== PKG) throw new Error(`package ${pkg?.[1]}`);
  if (label !== LABEL) throw new Error(`label "${label}"`);
  if (/application-debuggable/.test(b)) throw new Error('debuggable APK — not a release build');
  return `${pkg[3]} (${pkg[2]}), target ${b.match(/targetSdkVersion:'(\d+)'/)?.[1]}`;
});

try {
  adb('uninstall', PKG);
} catch {
  /* not installed */
}
adb('install', apk);
sh(`pm grant ${PKG} android.permission.CAMERA`);
sh("rm -rf '/sdcard/Pictures/Film Camela'");
sh('logcat -c');
sh('logcat -b crash -c');
const startOut = sh(`am start -W -n ${ACTIVITY}`);
await sleep(6000);

await step('cold start: process up, no crash', async () => {
  const pid = sh(`pidof ${PKG} || true`).trim();
  if (!pid) throw new Error('process gone after cold start');
  if (sh('logcat -d -b crash').includes(PKG)) throw new Error('crash in logcat -b crash');
  return `TotalTime ${startOut.match(/TotalTime: (\d+)/)?.[1] ?? '?'} ms`;
});

await step('app starts (onboarding)', async () => {
  await tap(/^Skip$/);
  shot('r1-start');
});
await step('load a roll', async () => {
  await tap(/^Load this film$/);
  await find(/Take photo/);
});
await step('shoot 3 frames', async () => {
  // A capture takes 5–13 s on an x86 emulator and the shutter ignores presses while one is running (and
  // reads "Take photo · Starting camera…" until the preview is up), so press, then wait for the roll
  // button's count to move; press again only if it did not.
  const taken = async () => Number((await find(ROLL_BTN)).label.match(/^(\d+) shots?/)?.[1] ?? 0);
  for (let i = 1; i <= 3; i++) {
    for (const until = Date.now() + 90000; (await taken()) < i; ) {
      if (Date.now() > until) throw new Error(`stuck at ${await taken()} shots`);
      const s = await find(/^Take photo$/, { timeout: 30000 });
      sh(`input swipe ${s.x} ${s.y} ${s.x} ${s.y} 120`); // a short press, like a finger
      for (let w = 0; w < 15 && (await taken()) < i; w++) await sleep(1000);
    }
  }
  shot('r2-shooting');
  return (await find(ROLL_BTN)).label;
});
await step('rewind and develop instantly', async () => {
  await tap(ROLL_BTN); // the roll button ("3 shots Send to lab · Sunny 200"), not the viewfinder counter
  await tap(/^Send to lab$/); // roll sheet
  await tap(/^Send to lab$/, { last: true, fallback: [798, 2224] }); // confirm dialog
  await tap(/^Instant/, { fallback: [285, 1976] });
  await sleep(4000); // instant develop
  shot('r3-roll');
});
await step('open photo and Save to the gallery', async () => {
  await tap(/^Photo 1$/, { fallback: [203, 475] });
  await sleep(2000);
  const before = galleryCount();
  await tap(/^Save$/, { fallback: [416, 2066] });
  await sleep(2500);
  const after = galleryCount();
  shot('r4-saved');
  if (after !== before + 1) throw new Error(`gallery ${before} → ${after}`);
  return `gallery ${before} → ${after}`;
});
await step('hardware back returns to the roll', async () => {
  sh('input keyevent 4');
  await sleep(1500);
  const top = sh('dumpsys window displays').match(/mCurrentFocus=.*$/m)?.[0] ?? '';
  if (!top.includes(PKG)) throw new Error(`left the app: ${top}`);
  shot('r5-back');
});

await step('MY tab opens, store billing without a Play account is handled', async () => {
  if (!(sh('dumpsys window displays').match(/mCurrentFocus=.*$/m)?.[0] ?? '').includes(PKG)) {
    sh(`am start -n ${ACTIVITY}`); // an earlier step may have left the app
    await sleep(4000);
  }
  await tap(/^MY$/);
  await sleep(2500);
  const here = nodes();
  const restore = here.find((n) => /Restore purchases/.test(n.label));
  const buy = here.find((n) => /^Get Pro/.test(n.label));
  if (!here.some((n) => /Free today|Bonus shots|Pro plans|Unlimited shots/.test(n.label))) throw new Error('MY content not on screen');
  shot('r6-my');
  if (restore) {
    sh(`input tap ${restore.x} ${restore.y}`);
    await sleep(2500);
  }
  const alive = sh(`pidof ${PKG} || true`).trim();
  const top = sh('dumpsys window displays').match(/mCurrentFocus=.*$/m)?.[0] ?? '';
  if (!alive) throw new Error('app died after the restore tap');
  if (!top.includes(PKG)) throw new Error(`left the app: ${top}`);
  shot('r7-restore');
  return `buy ${buy ? 'shown' : 'not found'}, restore ${restore ? 'tapped' : 'not found'}`;
});

await step('no ad request without a "Watch an ad" tap, no crash for the whole run', async () => {
  const log = adb('logcat', '-d');
  if (log.includes(REAL_REWARDED)) throw new Error('real rewarded unit requested without a tap');
  if (sh('logcat -d -b crash').includes(PKG)) throw new Error('crash in logcat -b crash');
});

writeFileSync(join(outDir, 'results.json'), JSON.stringify(steps, null, 2));
const failed = steps.filter((s) => !s.ok).length;
console.log(`${steps.length - failed}/${steps.length} passed${fallbacks.length ? ` (fallback points used for ${fallbacks.join(', ')})` : ''}`);
process.exit(failed ? 1 : 0);
