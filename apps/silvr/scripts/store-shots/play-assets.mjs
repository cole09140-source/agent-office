// Google Play listing graphics: feature graphic (1024×500 JPG, ko/en) built from
// the app icon and two raw store screenshots, plus the 512×512 32-bit PNG icon.
// usage: node scripts/store-shots/play-assets.mjs <shots dir>   (needs <dir>/ios67-ko, ios67-en from shots.spec.ts)
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2];
if (!root) throw new Error('usage: node play-assets.mjs <shots dir>');
const app = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const icon = readFileSync(join(app, 'public/icons/icon.svg'), 'utf8');
const png = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const TAGLINE = { ko: '네거티브가 남는\n필름 카메라', en: 'The film camera\nthat keeps your negatives' };
const SUB = { ko: '카메라 14대 · 필름 16종 · 다크룸 재현상', en: '14 cameras · 16 film stocks · darkroom re-develop' };
const out = join(root, 'play');
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
for (const lang of ['ko', 'en']) {
  const shots = join(root, `ios67-${lang}`);
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;width:1024px;height:500px;overflow:hidden;background:radial-gradient(90% 120% at 18% 30%,#2b1a10 0%,#0e0d0c 62%);
      font-family:'Pretendard','Apple SD Gothic Neo','Malgun Gothic','Segoe UI',sans-serif;color:#f3efe8;}
    .copy{position:absolute;left:64px;top:0;bottom:0;width:470px;display:flex;flex-direction:column;justify-content:center;gap:18px;}
    .brand{display:flex;align-items:center;gap:16px;}
    .brand svg{width:72px;height:72px;}
    .word{font:800 40px/1 ui-monospace,'Consolas',monospace;letter-spacing:.32em;color:#ff8a2b;}
    h1{margin:0;font-size:${lang === 'ko' ? 44 : 38}px;line-height:1.18;font-weight:800;white-space:pre-line;letter-spacing:-.02em;}
    p{margin:0;font-size:19px;color:#b8b0a5;}
    .phone{position:absolute;width:196px;aspect-ratio:1290/2796;border-radius:26px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.65),0 0 0 3px #2b2621;}
    .phone img{width:100%;height:100%;display:block;}
    .a{left:600px;top:52px;transform:rotate(-6deg);}
    .b{left:790px;top:20px;transform:rotate(5deg);}
  </style></head><body>
    <div class="copy"><div class="brand">${icon}<span class="word">SILVR</span></div><h1>${TAGLINE[lang]}</h1><p>${SUB[lang]}</p></div>
    <div class="phone a"><img src="${png(join(shots, '2-shooting.png'))}"></div>
    <div class="phone b"><img src="${png(join(shots, '5-contact.png'))}"></div>
  </body></html>`);
  await page.evaluate(() => document.fonts.ready);
  // JPG: Play rejects feature graphics with an alpha channel.
  await page.screenshot({ path: join(out, `feature-graphic-${lang}.jpg`), type: 'jpeg', quality: 92 });
}
// 512×512 icon, 32-bit PNG with alpha as Play asks.
const iconPage = await browser.newPage({ viewport: { width: 512, height: 512 } });
await iconPage.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${icon.replace('<svg ', '<svg width="512" height="512" ')}</body></html>`);
await iconPage.screenshot({ path: join(out, 'icon-512.png'), omitBackground: true });
await browser.close();
console.log(`wrote ${out}`);
