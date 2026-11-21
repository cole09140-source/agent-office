// Landscape store screenshots (the app is landscape-only since 1.1.6): 6 frames × 10 locales, 1920×1080 JPEG
// (16:9, inside Play's 2:1 limit), each = a caption band + the real app screen captured on a sideways phone.
//
//   node scripts/store-shots/landscape.mjs --out <folder> [--dist <build>] [--locales ko,en] [--port 4791]
//
// Needs a build (npm run build → ./dist, or --dist) and ffmpeg. Scene photos: --scenes <dir with
// alley/seaside/cafe/neon .png> (default: Desktop\클로드코드\_결과물\SILVR_스토어_스크린샷\scenes).
// Output: <out>/<locale>/<n>-<scene>.jpg (framed) and <out>/<locale>/raw/<n>-<scene>.png.
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = resolve(here, '..', '..');
const require = createRequire(join(app, 'package.json'));
const { chromium } = require('@playwright/test');

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : d);
const out = opt('out');
if (!out) throw new Error('usage: node landscape.mjs --out <folder>');
const dist = resolve(opt('dist', join(app, 'dist')));
const port = Number(opt('port', 4791));
const scenesDir = opt('scenes', 'C:/Users/cole0/Desktop/클로드코드/_결과물/SILVR_스토어_스크린샷/scenes');
const data = JSON.parse(readFileSync(join(here, 'store-shots.data.json'), 'utf8'));

// Captions per frame, every locale (no trademarks).
const CAPTIONS = {
  ko: ['진짜 카메라처럼, 가로로 찍어요', '카메라 38대, 저마다의 몸체', '포토부스 4컷부터 4×5 대형까지', '고르는 재미, 카메라 도감', '찍는 순간, 라이트박스 위 슬라이드로', '원본이 남아, 언제든 다시 현상'],
  en: ['Shoot sideways, like a real camera', '38 cameras, each with its own body', 'From photo booth strips to 4×5 film', 'Pick from a contact sheet of cameras', 'Every shot lands on the light table', 'Originals kept — re-develop anytime'],
  ja: ['本物のカメラのように、横向きで撮影', '38台のカメラ、それぞれのボディ', 'フォトブースから4×5大判まで', '選ぶ楽しさ、カメラ図鑑', '撮った瞬間、ライトボックスのスライドに', '元データが残るから、いつでも再現像'],
  zh: ['像真正的相机一样横着拍', '38 台相机，各有各的机身', '从照相亭四格到 4×5 大画幅', '挑相机的乐趣，相机图鉴', '一拍下，就是灯箱上的幻灯片', '保留原图，随时重新冲洗'],
  es: ['Dispara en horizontal, como una cámara de verdad', '38 cámaras, cada una con su cuerpo', 'Del fotomatón a la película 4×5', 'Elige en una hoja de contactos', 'Cada foto llega a la mesa de luz', 'Originales guardados: revela otra vez cuando quieras'],
  fr: ['Photographiez à l’horizontale, comme un vrai appareil', '38 appareils, chacun son boîtier', 'Du photomaton à la chambre 4×5', 'Choisissez sur une planche contact', 'Chaque photo arrive sur la table lumineuse', 'Originaux conservés : redéveloppez quand vous voulez'],
  pt: ['Fotografe na horizontal, como uma câmera de verdade', '38 câmeras, cada uma com seu corpo', 'Da cabine de fotos ao filme 4×5', 'Escolha numa folha de contato', 'Cada foto vai para a mesa de luz', 'Originais guardados: revele de novo quando quiser'],
  ru: ['Снимайте горизонтально, как настоящей камерой', '38 камер, у каждой свой корпус', 'От фотобудки до плёнки 4×5', 'Выбирайте на контактном листе', 'Каждый кадр — на световом столе', 'Оригиналы сохраняются: проявляйте заново'],
  hi: ['असली कैमरे की तरह, आड़ा पकड़कर खींचें', '38 कैमरे, हर एक की अपनी बॉडी', 'फ़ोटो बूथ से 4×5 फ़िल्म तक', 'कैमरों की कॉन्टैक्ट शीट से चुनें', 'हर फ़ोटो सीधे लाइट टेबल पर', 'ओरिजिनल सुरक्षित — कभी भी दोबारा डेवलप करें'],
  ar: ['صوّر أفقيًا مثل كاميرا حقيقية', '38 كاميرا، لكل واحدة هيكلها', 'من كشك التصوير إلى فيلم 4×5', 'اختر من ورقة تلامس للكاميرات', 'كل صورة تصل إلى الطاولة الضوئية', 'الأصل محفوظ، أعد التحميض متى شئت'],
};
const SCENES = ['camera-pro35', 'camera-snap27', 'camera-booth4', 'models', 'album', 'photo'];
const locales = (opt('locales') ?? Object.keys(CAPTIONS).join(',')).split(',');

// 1. fake camera clip (landscape 1280×720, each photo 2 s)
const work = join(tmpdir(), 'filmcamela-store-land');
mkdirSync(work, { recursive: true });
const y4m = join(work, 'scene-land.y4m');
const photos = ['alley', 'seaside', 'cafe', 'neon'].map((n) => join(scenesDir, `${n}.png`));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...photos.flatMap((p) => ['-loop', '1', '-t', '2', '-i', p]), '-filter_complex', [...photos.map((_, i) => `[${i}:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=5,setsar=1[v${i}]`), `${photos.map((_, i) => `[v${i}]`).join('')}concat=n=${photos.length}:v=1:a=0,format=yuv420p[o]`].join(';'), '-map', '[o]', '-pix_fmt', 'yuv420p', y4m]);

// 2. serve the build
const server = spawn('npx', ['vite', 'preview', '--outDir', `"${dist}"`, '--port', String(port), '--strictPort'], { cwd: app, shell: true, stdio: 'ignore' });
const base = `http://localhost:${port}/`;
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${y4m}`, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  for (const loc of locales) {
    const L = data.locales[loc];
    const dir = join(out, loc);
    mkdirSync(join(dir, 'raw'), { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: L.browser, permissions: ['camera'] });
    await ctx.addInitScript(() => localStorage.setItem('fc-unlimited', '1'));
    const page = await ctx.newPage();
    const tid = (id) => page.getByTestId(id);
    await page.goto(base);
    await tid('onb-skip').click();
    await sleep(2500);
    const pick = async (id) => {
      await page.evaluate((id) => {
        const el = document.querySelector(`[data-testid="camera-${id}"]`);
        el.scrollIntoView({ block: 'center' });
        el.click();
      }, id);
      await sleep(2200);
      await page.keyboard.press('Escape'); // a tap on the camera in use opens the film sheet
      await sleep(800);
    };
    const shoot = async (n, gap = 2300) => {
      for (let i = 0; i < n; i++) {
        await tid('shutter').click();
        await sleep(gap);
      }
    };
    const raw = (n, s) => join(dir, 'raw', `${n}-${s}.png`);
    // photos for the album first (several cameras, so the album has folders and a booth strip)
    await pick('snap27');
    await shoot(2);
    await pick('booth4');
    await shoot(1, 7500);
    await pick('view45');
    await shoot(1);
    await pick('pro35');
    await shoot(2);
    await sleep(1500);
    await page.screenshot({ path: raw(1, SCENES[0]) });
    await pick('snap27');
    await sleep(1200);
    await page.screenshot({ path: raw(2, SCENES[1]) });
    await pick('booth4');
    await sleep(1200);
    await page.screenshot({ path: raw(3, SCENES[2]) });
    await page.goto(`${base}#/models`);
    await sleep(1800);
    await page.screenshot({ path: raw(4, SCENES[3]) });
    await page.goto(`${base}#/gallery`);
    await sleep(2500);
    await page.screenshot({ path: raw(5, SCENES[4]) });
    // the newest photo in the viewer
    await tid('roll-card').first().locator('.roll-meta').click();
    await sleep(2000);
    await tid('thumb').first().click();
    await sleep(3000);
    await page.screenshot({ path: raw(6, SCENES[5]) });
    await ctx.close();

    // 3. frames: caption band + the screen, rendered as HTML (system fonts per script, RTL for Arabic)
    const fctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    const fp = await fctx.newPage();
    for (let n = 1; n <= SCENES.length; n++) {
      const img = readFileSync(raw(n, SCENES[n - 1])).toString('base64');
      const cap = CAPTIONS[loc][n - 1];
      await fp.setContent(`<!doctype html><html lang="${L.browser}" dir="${L.dir}"><head><meta charset="utf-8"><style>
        *{box-sizing:border-box;margin:0}
        body{width:1920px;height:1080px;overflow:hidden;background:radial-gradient(70% 90% at 85% -10%,rgba(211,50,43,.32),transparent 60%),#0b0a09;font-family:${L.font};color:#ece4d6}
        .cap{height:168px;display:flex;align-items:center;justify-content:center;gap:28px;padding:0 120px;text-align:center}
        .cap b{font-size:${cap.length > 34 ? 50 : 58}px;font-weight:800;letter-spacing:${loc === 'ar' || loc === 'hi' ? 0 : '-0.01em'};line-height:1.15}
        .edge{position:absolute;left:0;right:0;top:168px;height:14px;background:repeating-linear-gradient(90deg,#070605 0 14px,#211b16 14px 28px);opacity:.9}
        .shot{position:absolute;left:50%;top:196px;transform:translateX(-50%);width:1568px;height:882px;border-radius:30px;overflow:hidden;box-shadow:0 0 0 10px #15120f,0 0 0 12px #3a332c,0 30px 60px rgba(0,0,0,.6)}
        .shot img{width:100%;height:100%;display:block}
        .brand{position:absolute;bottom:0;right:28px;font:700 18px/1 'Segoe UI',sans-serif;letter-spacing:.3em;color:#e0a03a;opacity:.0}
      </style></head><body><div class="cap"><b>${cap}</b></div><div class="edge"></div><div class="shot"><img src="data:image/png;base64,${img}"></div></body></html>`);
      await fp.screenshot({ path: join(dir, `${n}-${SCENES[n - 1]}.jpg`), type: 'jpeg', quality: 88 });
    }
    await fctx.close();
    console.log(`${loc}: ${SCENES.length} frames`);
  }
} finally {
  await browser.close();
  server.kill();
  if (process.platform === 'win32') {
    try {
      execFileSync('powershell', ['-NoProfile', '-Command', `Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object { $_.CommandLine -match 'vite preview' -and $_.CommandLine -match '${port}' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`]);
    } catch {}
  }
}
writeFileSync(join(out, 'README.txt'), `Landscape store screenshots (1920×1080 JPEG), ${new Date().toISOString().slice(0, 10)}.\n${SCENES.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n`);
