// Real landscape screen recordings for the 16:9 promo, per app language (CDP screencast → timestamped JPEGs).
//   node scripts/promo-video/land/record.mjs --out <dir> [--uis ko,en] [--dist ./dist] [--port 4792]
// Needs `npm run build` and ffmpeg. Fake camera = store scene photos (alley/seaside/cafe/neon), 1280×720.
// Clips per UI: bodies (camera switching), shoot (two shutter presses), formats (booth 4 strip, then 4×5),
// album (light table → photo → darkroom re-develop). Output <out>/<ui>/<clip>/NNNN.jpg + frames.json.
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..', '..', '..');
const require = createRequire(join(app, 'package.json'));
const { chromium } = require('@playwright/test');
const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const out = resolve(arg('out', 'promo-land-clips'));
const dist = resolve(arg('dist', join(app, 'dist')));
const port = Number(arg('port', 4792));
const uis = arg('uis', 'en,ko,ja,zh,es,fr,pt,ru,hi,ar').split(',');
const BROWSER_LOCALE = { en: 'en-US', ko: 'ko-KR', ja: 'ja-JP', zh: 'zh-CN', es: 'es-419', fr: 'fr-FR', pt: 'pt-BR', ru: 'ru-RU', hi: 'hi-IN', ar: 'ar' };
const scenes = 'C:/Users/cole0/Desktop/클로드코드/_결과물/SILVR_스토어_스크린샷/scenes';

const work = join(tmpdir(), 'filmcamela-promo-land');
mkdirSync(work, { recursive: true });
const y4m = join(work, 'scene.y4m');
const photos = ['alley', 'seaside', 'cafe', 'neon'].map((n) => join(scenes, `${n}.png`));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...photos.flatMap((p) => ['-loop', '1', '-t', '1.6', '-i', p]), '-filter_complex', [...photos.map((_, i) => `[${i}:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=10,setsar=1[v${i}]`), `${photos.map((_, i) => `[v${i}]`).join('')}concat=n=${photos.length}:v=1:a=0,format=yuv420p[o]`].join(';'), '-map', '[o]', '-pix_fmt', 'yuv420p', y4m]);

const server = spawn('npx', ['vite', 'preview', '--outDir', `"${dist}"`, '--port', String(port), '--strictPort'], { cwd: app, shell: true, stdio: 'ignore' });
const base = `http://localhost:${port}/`;
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${y4m}`, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

async function record(page, dir, run) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', (f) => {
    frames.push({ t: f.metadata.timestamp ?? Date.now() / 1000, data: f.data });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => undefined);
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  await sleep(400);
  await run();
  await sleep(400);
  await cdp.send('Page.stopScreencast');
  await cdp.detach().catch(() => undefined);
  const t0 = frames[0].t;
  const list = frames.map((f, i) => {
    const name = `${String(i).padStart(4, '0')}.jpg`;
    writeFileSync(join(dir, name), Buffer.from(f.data, 'base64'));
    return { file: name, t: +(f.t - t0).toFixed(3) };
  });
  writeFileSync(join(dir, 'frames.json'), JSON.stringify(list));
  return list.length;
}

try {
  for (const ui of uis) {
    const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: BROWSER_LOCALE[ui], permissions: ['camera'] });
    await ctx.addInitScript(() => {
      localStorage.setItem('fc-unlimited', '1');
      // Store material shows no third-party trademarks: the four real-phone bodies stay out of the camera list.
      const hide = () => {
        const s = document.createElement('style');
        s.textContent = ['flip03', 'touch07', 'curve07', 'filter10'].map((id) => `[data-testid="camera-${id}"]`).join(',') + '{visibility:hidden!important}';
        document.head.append(s);
      };
      if (document.head) hide();
      else document.addEventListener('DOMContentLoaded', hide);
    });
    const page = await ctx.newPage();
    const tid = (id) => page.getByTestId(id);
    await page.goto(base);
    await tid('onb-skip').click();
    await sleep(2500);
    const pick = async (id, wait = 1500) => {
      await page.evaluate((id) => {
        const el = document.querySelector(`[data-testid="camera-${id}"]`);
        el.scrollIntoView({ block: 'center' });
        el.click();
      }, id);
      await sleep(wait);
    };
    const settle = async () => {
      await page.keyboard.press('Escape');
      await sleep(500);
      for (const c of await tid('toast-close').all()) await c.click().catch(() => undefined);
      await sleep(300);
    };
    const shoot = async (n, gap = 2000) => {
      for (let i = 0; i < n; i++) {
        await tid('shutter').click();
        await sleep(gap);
      }
    };
    const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
    if (only === 'shoot') {
      await pick('pro35');
      await settle();
      await sleep(1200);
      const n = await record(page, join(out, ui, 'shoot'), async () => {
        await sleep(500);
        await shoot(4, 1700);
      });
      console.log(ui, 'shoot', n);
      await ctx.close();
      continue;
    }
    // Photos for the album first.
    for (const [id, n, gap] of [['snap27', 1, 2000], ['instasq', 1, 2600], ['view45', 1, 2000], ['pro35', 2, 2000]]) {
      await pick(id);
      await settle();
      await shoot(n, gap);
    }
    await settle();
    await sleep(1500);
    const dir = join(out, ui);
    if (process.argv.includes('--wall')) {
      const ids = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="camera-"]')].map((e) => e.dataset.testid.slice(7)));
      const wallDir = join(out, '_wall');
      mkdirSync(wallDir, { recursive: true });
      for (const id of [...new Set(ids)].filter((x) => !['flip03', 'touch07', 'curve07', 'filter10', 'screen'].includes(x))) {
        await pick(id, 1600);
        await settle();
        await page.screenshot({ path: join(wallDir, `${id}.jpg`), type: 'jpeg', quality: 88 });
      }
      console.log('wall', ids.length);
      await ctx.close();
      continue;
    }
    const counts = {};
    counts.bodies = await record(page, join(dir, 'bodies'), async () => {
      for (const id of ['snap27', 'twin66', 'ccd03', 'fish180', 'half72', 'aqua27', 'pro35']) await pick(id, 1050);
    });
    await settle();
    await sleep(1200);
    counts.shoot = await record(page, join(dir, 'shoot'), async () => {
      await sleep(500);
      await shoot(4, 1700);
    });
    await pick('booth4', 1200);
    await settle();
    await sleep(800);
    counts.formats = await record(page, join(dir, 'formats'), async () => {
      await sleep(300);
      await tid('shutter').click();
      await sleep(6500);
      await pick('view45', 2600);
    });
    await settle();
    await pick('pro35', 1200);
    await settle();
    await tid('btn-more').click();
    await sleep(700);
    await tid('more-nav-gallery').click();
    await sleep(2500);
    counts.album = await record(page, join(dir, 'album'), async () => {
      await sleep(1200);
      // the Pro 35 shoot (a film camera whose stock can be changed in the darkroom)
      const pro = tid('roll-card').filter({ hasText: /pro\s*35/i });
      await ((await pro.count()) ? pro.first() : tid('roll-card').nth(1)).locator('.roll-meta').click();
      await sleep(1400);
      await tid('thumb').first().click();
      await sleep(3800); // the print develops on the light table
      await tid('btn-darkroom').click();
      await tid('darkroom-screen').waitFor({ timeout: 5000 }).catch(() => console.warn('no darkroom'));
      await sleep(1500);
      for (const s of ['stock-mono400', 'stock-neon800t', 'stock-dream160']) {
        await tid(s).click({ timeout: 3000 }).catch(() => console.warn('no', s));
        await sleep(1100);
      }
    });
    console.log(ui, JSON.stringify(counts));
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
  try {
    execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'vite preview' -and $_.CommandLine -match '${port}' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`]);
  } catch {}
}
