// Renders the app's own synthesized shutter sounds (src/cameras/sound.ts) to WAV for the promo soundtrack.
//   node scripts/promo-video/land/sfx.mjs --out <dir>   → slr.wav, leaf.wav, booth.wav (4 leaf clicks)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..', '..', '..');
const require = createRequire(join(app, 'package.json'));
const esbuild = require('esbuild');
const { chromium } = require('@playwright/test');
const out = resolve(process.argv[process.argv.indexOf('--out') + 1]);
mkdirSync(out, { recursive: true });

let src = readFileSync(join(app, 'src', 'cameras', 'sound.ts'), 'utf8');
// Every sound goes to the offline context the page sets up, instead of a live AudioContext.
src = src.replace(/function audio\(\)[^{]*\{[\s\S]*?\n\}\n/, 'function audio() { return (window as any).__off; }\n');
const { code } = await esbuild.transform(src, { loader: 'ts', format: 'iife', globalName: 'SFX' });

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.addScriptTag({ content: code });
const jobs = {
  slr: [['playShutter', 'slr', 0], ['playAdvance', 'slr', 0]],
  leaf: [['playShutter', 'leaf', 0]],
  booth: [0, 1.5, 3.0, 4.5].map((t) => ['playShutter', 'leaf', t]),
};
for (const [name, calls] of Object.entries(jobs)) {
  const wav = await page.evaluate(async (calls) => {
    const sr = 48000;
    const len = Math.max(...calls.map((c) => c[2])) + 0.8;
    const ac = new OfflineAudioContext(1, Math.ceil(sr * len), sr);
    // Schedule each call at its offset: the helpers use ac.currentTime, so shift through a proxy.
    for (const [fn, profile, at] of calls) {
      window.__off = new Proxy(ac, { get: (t, k) => (k === 'currentTime' ? at : typeof t[k] === 'function' ? t[k].bind(t) : t[k]) });
      window.SFX[fn](profile);
    }
    const buf = await ac.startRendering();
    const d = buf.getChannelData(0);
    const pcm = new DataView(new ArrayBuffer(44 + d.length * 2));
    const w = (o, s) => [...s].forEach((c, i) => pcm.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); pcm.setUint32(4, 36 + d.length * 2, true); w(8, 'WAVEfmt '); pcm.setUint32(16, 16, true); pcm.setUint16(20, 1, true); pcm.setUint16(22, 1, true);
    pcm.setUint32(24, sr, true); pcm.setUint32(28, sr * 2, true); pcm.setUint16(32, 2, true); pcm.setUint16(34, 16, true); w(36, 'data'); pcm.setUint32(40, d.length * 2, true);
    for (let i = 0; i < d.length; i++) pcm.setInt16(44 + i * 2, Math.max(-1, Math.min(1, d[i])) * 32767, true);
    return Array.from(new Uint8Array(pcm.buffer));
  }, calls);
  writeFileSync(join(out, `${name}.wav`), Buffer.from(wav));
  console.log(name, wav.length, 'bytes');
}
await browser.close();
