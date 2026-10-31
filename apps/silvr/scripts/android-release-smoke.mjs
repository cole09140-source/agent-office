// Smoke test for the signed, R8-shrunk release APK. Release WebViews are not
// debuggable, so this drives the UI through the accessibility tree
// (uiautomator), using the English labels: onboarding → load → shoot →
// rewind → instant develop → open photo → Save to gallery → hardware back.
// usage: node scripts/android-release-smoke.mjs <adb serial> <release.apk> <screenshot dir>
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [serial, apk, outDir = 'android-release-smoke'] = process.argv.slice(2);
if (!serial || !apk) throw new Error('usage: node android-release-smoke.mjs <serial> <release.apk> [out]');
const PKG = 'app.silvr.camera';
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
const galleryCount = () => {
  try {
    return sh('ls /sdcard/Pictures/SILVR').split(/\s+/).filter((f) => /\.(jpg|png)$/.test(f)).length;
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

try {
  adb('uninstall', PKG);
} catch {
  /* not installed */
}
adb('install', apk);
sh(`pm grant ${PKG} android.permission.CAMERA`);
sh('rm -rf /sdcard/Pictures/SILVR');
sh(`am start -n ${PKG}/.MainActivity`);
await sleep(6000);
console.log(`SILVR release smoke on ${serial}`);

await step('app starts (onboarding)', async () => {
  await tap(/^Skip$/);
  shot('r1-start');
});
await step('load a roll', async () => {
  await tap(/^Load this film$/);
  await find(/Take photo/);
});
await step('shoot 3 frames', async () => {
  for (let i = 0; i < 3; i++) {
    await tap(/Take photo/);
    await sleep(1200);
  }
  shot('r2-shooting');
  return (await find(/· \d+ left/)).label;
});
await step('rewind and develop instantly', async () => {
  await tap(/· \d+ left/); // the roll button, not the viewfinder counter
  await tap(/^Rewind$/);
  await tap(/^Rewind$/, { last: true, fallback: [798, 2224] }); // confirm dialog
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

writeFileSync(join(outDir, 'results.json'), JSON.stringify(steps, null, 2));
const failed = steps.filter((s) => !s.ok).length;
console.log(`${steps.length - failed}/${steps.length} passed${fallbacks.length ? ` (fallback points used for ${fallbacks.join(', ')})` : ''}`);
process.exit(failed ? 1 : 0);
