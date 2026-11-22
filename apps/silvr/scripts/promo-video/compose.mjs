// Composes the promo video (1080×1920, 30 fps) per language from:
//   --clips <dir>   record.spec.ts output: <lang>/{switch,shoot}/NNNN.jpg + frames.json
//   --broll <dir>   a_alley.png, b_cafe.png, c_beach.png (scene photos, no text); a_alley.mp4 etc.
//                   next to a photo (e.g. image-to-video from it) is played instead of the photo
//   --out <dir>     FilmCamela_promo_<LANG>.mp4
//   [--langs ko,en]
// Every frame is drawn by a headless page (stage.html) and piped to ffmpeg, so timing is exact.
// The camera never moves (no zoom or pan on the photos): cuts and short cross-fades only.
import { chromium } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..', '..');
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1] : d;
};
const clips = resolve(arg('clips', 'promo-clips'));
const broll = resolve(arg('broll', '.'));
const out = resolve(arg('out', '.'));
const langs = arg('langs', 'ko,en').split(',');
const FPS = 30;
const FADE = 0.25;

const COPY = {
  ko: {
    caps: ['필름 카메라 32대,\n폰 하나에', '옆으로 밀면\n카메라가 바뀌어요', '셔터는 한 번', '찍자마자 앨범으로,\n카메라별 폴더까지', '필름 그 느낌 그대로'],
    tag: '필름 카메라 32대',
    cta: 'Google Play에서 다운로드',
  },
  en: {
    caps: ['32 film cameras,\none phone', 'Swipe to switch\ncameras', 'One tap to shoot', 'Straight to your album,\nsorted by camera', 'That real film feel'],
    tag: '32 film cameras',
    cta: 'Get it on Google Play',
  },
};

const SEGMENTS = [
  { kind: 'still', src: 'a_alley.png', from: 0, to: 3.0, cap: 0 },
  { kind: 'app', clip: 'switch', from: 3.0, to: 8.0, cap: 1, speed: 1.5 },
  { kind: 'still', src: 'b_cafe.png', from: 8.0, to: 11.0, cap: 2 },
  { kind: 'app', clip: 'shoot', from: 11.0, to: 16.4, cap: 3 },
  { kind: 'still', src: 'c_beach.png', from: 16.4, to: 19.4, cap: 4 },
  { kind: 'end', from: 19.4, to: 22.4 },
];
const TOTAL = SEGMENTS[SEGMENTS.length - 1].to;

const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
mkdirSync(out, { recursive: true });
for (const f of ['a_alley.png', 'b_cafe.png', 'c_beach.png']) if (!existsSync(join(broll, f))) throw new Error(`missing ${join(broll, f)}`);

// Scene videos: decoded once to 1080×1920 JPEG frames (cover crop), shown frame by frame.
const sceneFrames = {};
for (const s of SEGMENTS.filter((x) => x.kind === 'still')) {
  const mp4 = join(broll, s.src.replace(/\.png$/, '.mp4'));
  if (!existsSync(mp4)) continue;
  const dir = join(tmpdir(), 'fc-promo-scenes', s.src.replace(/\.png$/, ''));
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  execFileSync(ffmpeg, ['-loglevel', 'error', '-i', mp4, '-vf', `fps=${FPS},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`, '-q:v', '2', join(dir, '%04d.jpg')]);
  sceneFrames[s.src] = readdirSync(dir).filter((f) => f.endsWith('.jpg')).sort().map((f) => pathToFileURL(join(dir, f)).href);
  console.log('scene video', s.src, sceneFrames[s.src].length, 'frames');
}

const browser = await chromium.launch();
for (const lang of langs) {
  const copy = COPY[lang];
  const clipData = {};
  for (const name of ['switch', 'shoot']) {
    const dir = join(clips, lang, name);
    const frames = JSON.parse(readFileSync(join(dir, 'frames.json'), 'utf8'));
    clipData[name] = { dir, frames, dur: frames[frames.length - 1].t };
  }
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(here, 'stage.html')).href + `?lang=${lang}`);
  await page.evaluate(
    ({ copy, broll, icon }) => window.setup(copy, broll, icon),
    { copy, broll: pathToFileURL(broll).href + '/', icon: pathToFileURL(join(app, 'public', 'icons', 'icon-512.png')).href },
  );
  const file = join(out, `FilmCamela_promo_${lang.toUpperCase()}.mp4`);
  const enc = spawn(ffmpeg, [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', file,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(TOTAL * FPS);
  for (let i = 0; i < n; i++) {
    const t = i / FPS;
    const layers = [];
    for (const s of SEGMENTS) {
      if (t < s.from || t >= s.to + (s === SEGMENTS[SEGMENTS.length - 1] ? 1 : FADE)) continue;
      const lt = t - s.from;
      // Fade in (not the first), and stay under the next segment while it fades in over it.
      const op = s.from === 0 ? 1 : Math.min(1, lt / FADE);
      const layer = { kind: s.kind, op, lt, cap: s.cap };
      if (s.kind === 'still') {
        const v = sceneFrames[s.src];
        // A scene video plays from its first frame and holds its last one.
        layer.src = v ? v[Math.min(v.length - 1, Math.floor(lt * FPS))] : s.src;
      }
      if (s.kind === 'app') {
        const c = clipData[s.clip];
        const slot = s.to - s.from;
        // Fixed speed (the clip may run past the slot), or just fast enough to fit the whole clip.
        const speed = s.speed ?? Math.max(1, (c.dur - 0.2) / slot);
        const ct = 0.2 + lt * speed;
        let f = c.frames[0];
        for (const fr of c.frames) if (fr.t <= ct) f = fr;
        layer.src = pathToFileURL(join(c.dir, f.file)).href;
      }
      layers.push(layer);
    }
    await page.evaluate((l) => window.draw(l), layers);
    const jpg = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!enc.stdin.write(jpg)) await new Promise((r) => enc.stdin.once('drain', r));
    if (i % 90 === 0) process.stdout.write(`${lang} ${i}/${n}\n`);
  }
  enc.stdin.end();
  await new Promise((r, j) => enc.on('close', (code) => (code === 0 ? r() : j(new Error(`ffmpeg ${code}`)))));
  await page.close();
  console.log('wrote', file);
}
await browser.close();
