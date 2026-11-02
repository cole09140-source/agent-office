// One command for the whole store-shot set: build → fake-camera clip → capture (Playwright) →
// caption frames → Play feature graphics [→ homepage screenshots].
//
//   node scripts/store-shots/run.mjs --out <folder> [options]
//     --scenes <dir>      scene photos for the fake camera (alley/seaside/cafe/neon .png)
//                         default: Desktop\클로드코드\_결과물\SILVR_스토어_스크린샷\scenes
//     --dist <dir>        serve this existing build instead of building (never touches ./dist)
//     --platforms a,b     default: all in store-shots.data.json
//     --locales x,y       default: all 10
//     --workers N         parallel browsers (default 4)
//     --port N            preview port (default 4790)
//     --my 0|1            force the MY-tab frame off/on (default: on when the app has tab-my)
//     --home <dir>        also write film-camela-home/assets/shots/*.jpg (ko + en, ≤150 KB)
//     --skip-capture      only re-frame / re-make graphics from existing raws
//
// Output: <out>/<platform>/<locale>/<n>-<scene>.png (framed, store size), …/raw/ (unframed),
//         <out>/play-feature-graphic/<locale>/feature-graphic.jpg
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..', '..');
const args = process.argv.slice(2);
const opt = (k, d) => {
  const i = args.indexOf(`--${k}`);
  return i >= 0 ? args[i + 1] : d;
};
const flag = (k) => args.includes(`--${k}`);
const out = opt('out');
if (!out) throw new Error('usage: node scripts/store-shots/run.mjs --out <folder> [--dist d] [--platforms a,b] [--locales x,y] [--workers N] [--home dir]');
const work = join(tmpdir(), 'filmcamela-store-shots');
mkdirSync(work, { recursive: true });
const q = (p) => (process.platform === 'win32' ? `"${p}"` : p); // shell: true on Windows (npx.cmd)
const sh = (cmd, a, env = {}) => {
  const r = spawnSync(cmd, a, { cwd: app, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
  if (r.status !== 0) throw new Error(`${cmd} ${a.join(' ')} failed (${r.status})`);
};

if (!flag('skip-capture')) {
  // 1. build to a private folder (./dist stays as it is)
  let dist = opt('dist');
  if (!dist) {
    dist = join(work, 'dist');
    sh('npx', ['vite', 'build', '--outDir', q(dist), '--emptyOutDir']);
  }
  // 2. fake camera clip from the scene photos
  const scenes = opt('scenes', resolve(app, '..', '..', '..', '..', '_결과물', 'SILVR_스토어_스크린샷', 'scenes'));
  const photos = ['alley', 'seaside', 'cafe', 'neon'].map((n) => join(scenes, `${n}.png`));
  for (const p of photos) if (!existsSync(p)) throw new Error(`scene photo missing: ${p}`);
  const y4m = join(work, 'scene.y4m');
  if (!existsSync(y4m) || photos.some((p) => statSync(p).mtimeMs > statSync(y4m).mtimeMs)) execFileSync('node', [join(here, 'make-scene.mjs'), y4m, ...photos], { stdio: 'inherit' });
  // 3. capture every platform × locale
  const env = { SCENE: y4m, OUT: resolve(out), DIST: dist, PORT: opt('port', '4790'), WORKERS: opt('workers', '4') };
  if (opt('platforms')) env.PLATFORMS = opt('platforms');
  if (opt('locales')) env.LOCALES = opt('locales');
  if (opt('my')) env.MY = opt('my');
  sh('npx', ['playwright', 'test', '-c', 'scripts/store-shots/store-shots.config.ts', '--output', q(join(work, 'pw-results'))], env);
}
// 4. caption frames, 5. feature graphics
execFileSync('node', [join(here, 'frame.mjs'), resolve(out)], { cwd: app, stdio: 'inherit' });
execFileSync('node', [join(here, 'play-assets.mjs'), resolve(out)], { cwd: app, stdio: 'inherit' });

// 6. homepage screenshots (film-camela-home README table), 645 px wide JPG ≤ 150 KB
const home = opt('home');
if (home) {
  const map = { camera: 'camera', cameras: 'cameras', lab: 'lab', darkroom: 'darkroom', gallery: 'contact', meter: 'analog' };
  for (const [name, scene] of Object.entries(map))
    for (const [locale, suf] of [['ko', ''], ['en', '-en']]) {
      const dir = join(resolve(out), 'appstore-6.9', locale, 'raw');
      const f = existsSync(dir) && readdirSync(dir).find((n) => n.endsWith(`-${scene}.png`));
      if (!f) continue;
      const dst = join(home, `shot-${name}${suf}.jpg`);
      for (const q of [6, 8, 10, 12, 14]) {
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(dir, f), '-vf', 'scale=645:-2', '-q:v', String(q), dst]);
        if (statSync(dst).size <= 150 * 1024) break;
      }
      console.log(`home ${dst} ${Math.round(statSync(dst).size / 1024)} KB`);
    }
}
console.log(`done → ${resolve(out)}`);
