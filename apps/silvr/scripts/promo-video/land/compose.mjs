// Composes the 16:9 landscape promo per Play listing language (1920×1080, 30 fps, AAC 48 kHz):
//   node scripts/promo-video/land/compose.mjs --clips <dir> --vo <dir> --sfx <dir> --music <mp3> --out <dir> [--locales ko-KR,en-US]
// --clips  record.mjs output: <ui>/{bodies,shoot,formats,album}/NNNN.jpg + frames.json
// --vo     narrate.mjs output: <locale>/<n>-<beat>.mp3 + durations.json
// --sfx    sfx.mjs output: slr.wav, booth.wav, leaf.wav (the app's own synthesized shutter sounds)
// Each scene lasts as long as its line needs; app clips are fitted to their scene. The camera never moves:
// cuts, short cross-fades and element entrances only. Music ducks under the voice.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..', '..', '..');
const require = createRequire(join(app, 'package.json'));
const { chromium } = require('@playwright/test');
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const clipsDir = resolve(arg('clips'));
const voDir = resolve(arg('vo'));
const sfxDir = resolve(arg('sfx'));
const music = resolve(arg('music'));
const musicAt = Number(arg('music-at', 166));
const out = resolve(arg('out'));
const copy = JSON.parse(readFileSync(join(here, 'copy.json'), 'utf8'));
const shots = JSON.parse(readFileSync(join(app, 'scripts', 'store-shots', 'store-shots.data.json'), 'utf8'));
const locales = (arg('locales') ?? Object.keys(copy.locales).join(',')).split(',');
const FPS = 30;
const FADE = 0.18;
mkdirSync(out, { recursive: true });

// Scene plan: min length, voice lead-in, tail after the voice, and for app scenes the clip window + sounds.
// Clip times come from record.mjs (record() idles 0.4 s before running each clip).
const PLAN = {
  hook: { min: 3.4, lead: 0.55, tail: 0.45 },
  bodies: { min: 4.2, lead: 0.2, tail: 0.4, clip: 'bodies', from: 0.35, maxSpeed: 2.0 },
  shoot: { min: 4.4, lead: 0.2, tail: 0.4, clip: 'shoot', from: 0.55, maxSpeed: 1.6, sfx: [['slr', 0.93], ['slr', 2.68], ['slr', 4.43], ['slr', 6.18]] },
  formats: { min: 5.2, lead: 0.2, tail: 0.4, clip: 'formats', from: 0.55, maxSpeed: 1.9, sfx: [['booth', 0.74]] },
  album: { min: 6.0, lead: 0.2, tail: 0.45, clip: 'album', from: 0.45, maxSpeed: 1.8 },
  end: { min: 3.8, lead: 0.35, tail: 1.5 },
};
// Opening wall: one still of every camera screen (record.mjs --wall; the four real-phone bodies are left out).
const wallDir = join(clipsDir, '_wall');
const stills = readdirSync(wallDir).filter((f) => f.endsWith('.jpg'));
const order = stills.map((f, i) => [((i * 7919) % 97) + i / 1000, f]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
const wall = Array.from({ length: 36 }, (_, i) => pathToFileURL(join(wallDir, order[i % order.length])).href);

const browser = await chromium.launch();
const work = join(tmpdir(), 'fc-promo-land-audio');
mkdirSync(work, { recursive: true });

for (const loc of locales) {
  const L = copy.locales[loc];
  const S = shots.locales[L.ui];
  const durs = JSON.parse(readFileSync(join(voDir, loc, 'durations.json'), 'utf8'));
  // timeline
  let t = 0;
  const segs = copy.beats.map((beat, i) => {
    const p = PLAN[beat];
    const len = Math.max(p.min, p.lead + durs[beat] + p.tail);
    const seg = { beat, i, from: t, to: t + len, len, p, cap: L.cap[i] };
    if (p.clip) {
      const dir = join(clipsDir, L.ui, p.clip);
      const frames = JSON.parse(readFileSync(join(dir, 'frames.json'), 'utf8'));
      const end = frames[frames.length - 1].t - 0.2;
      seg.clip = { dir, frames };
      seg.speed = Math.min(p.maxSpeed, Math.max(1, (end - p.from) / len));
    }
    t += len;
    return seg;
  });
  const TOTAL = t;
  const clipAt = (seg, lt) => seg.p.from + lt * seg.speed;
  const sfx = [];
  for (const seg of segs) for (const [name, ct] of seg.p.sfx ?? []) {
    const lt = (ct - seg.p.from) / seg.speed;
    if (lt >= 0 && lt < seg.len) sfx.push({ name, at: seg.from + lt, flash: name === 'slr' });
  }

  // video
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(here, 'stage.html')).href);
  await page.evaluate((c) => window.setup(c), {
    lang: S.browser, dir: S.dir, font: S.font, tag: L.tag, cta: L.cta, bodies: wall,
    icon: pathToFileURL(join(app, 'public', 'icons', 'icon-512.png')).href,
    grain: pathToFileURL(join(here, 'grain.png')).href,
  });
  const silent = join(work, `${loc}-video.mp4`);
  const reuse = process.argv.includes('--reuse-video') && existsSync(silent);
  const enc = reuse ? null : spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.ceil(TOTAL * FPS);
  let seed = 1;
  let grain = { gx: 0, gy: 0 };
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let fi = 0; fi < (reuse ? 0 : n); fi++) {
    const tt = fi / FPS;
    const layers = [];
    for (const seg of segs) {
      const last = seg === segs[segs.length - 1];
      if (tt < seg.from || tt >= seg.to + (last ? 1 : FADE)) continue;
      const lt = tt - seg.from;
      const layer = { kind: seg.beat === 'hook' ? 'hook' : seg.beat === 'end' ? 'end' : 'app', op: seg.i === 0 ? 1 : Math.min(1, lt / FADE), lt, cap: seg.cap };
      if (seg.clip) {
        const ct = clipAt(seg, lt);
        let f = seg.clip.frames[0];
        for (const fr of seg.clip.frames) if (fr.t <= ct) f = fr;
        layer.src = pathToFileURL(join(seg.clip.dir, f.file)).href;
      }
      layers.push(layer);
    }
    let flash = 0;
    for (const s of sfx) if (s.flash && tt >= s.at && tt < s.at + 0.22) flash = Math.max(flash, 0.35 * (1 - (tt - s.at) / 0.22));
    if (fi % 3 === 0) grain = { gx: Math.round(rnd() * 256), gy: Math.round(rnd() * 256) }; // grain boils at 10 fps (lighter on the encoder)
    await page.evaluate((st) => window.draw(st), { layers, flash, ...grain });
    const jpg = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once('drain', r));
  }
  if (enc) {
    enc.stdin.end();
    await new Promise((r, j) => enc.on('close', (code) => (code === 0 ? r() : j(new Error(`ffmpeg ${code}`)))));
  }
  await page.close();

  // audio: voice lines at their scene + lead, shutter sounds, music ducked under the voice
  const inputs = [];
  const filters = [];
  const voiceLabels = [];
  segs.forEach((seg, i) => {
    inputs.push('-i', join(voDir, loc, `${i + 1}-${seg.beat}.mp3`));
    const ms = Math.round((seg.from + seg.p.lead) * 1000);
    filters.push(`[${inputs.length / 2}:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-2:LRA=11,aresample=48000,adelay=${ms}|${ms}[v${i}]`); // input 0 = the video; every voice at the same loudness
    voiceLabels.push(`[v${i}]`);
  });
  filters.push(`${voiceLabels.join('')}amix=inputs=${voiceLabels.length}:normalize=0,volume=1.0,asplit=2[voice][key]`);
  const sfxLabels = [];
  sfx.forEach((s, i) => {
    inputs.push('-i', join(sfxDir, `${s.name}.wav`));
    const ms = Math.round(s.at * 1000);
    filters.push(`[${inputs.length / 2}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${s.name === 'slr' ? 0.7 : 1.6},adelay=${ms}|${ms}[s${i}]`);
    sfxLabels.push(`[s${i}]`);
  });
  inputs.push('-ss', String(musicAt), '-t', String(TOTAL + 1), '-i', music);
  const mi = inputs.filter((x) => x === '-i').length;
  const fadeOut = Math.max(0, TOTAL - 2.2).toFixed(2);
  filters.push(`[${mi}:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.30,afade=t=in:d=0.8,afade=t=out:st=${fadeOut}:d=2.2[m0]`);
  filters.push(`[m0][key]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[music]`);
  const all = ['[voice]', '[music]', ...sfxLabels];
  filters.push(`${all.join('')}amix=inputs=${all.length}:normalize=0,alimiter=limit=0.95,atrim=0:${TOTAL.toFixed(3)}[mix]`);
  const file = join(out, `FilmCamela_promo_${loc}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, ...inputs, '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[mix]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', file]);
  console.log(loc, `${TOTAL.toFixed(1)}s`, segs.map((s) => `${s.beat}:${s.len.toFixed(1)}${s.speed ? '@' + s.speed.toFixed(2) + 'x' : ''}`).join(' '), '→', file);
}
await browser.close();
