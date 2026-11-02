// Google Play feature graphic (1024×500 JPG, no alpha) per locale: app icon, the localized app
// name "<local film camera> - Film Camela", the Play short description and two raw phone shots.
// usage: node scripts/store-shots/play-assets.mjs <shots dir>
//   needs  <dir>/play-phone/<locale>/raw/ (shots.spec.ts), falls back to appstore-6.9 raws
//   writes <dir>/play-feature-graphic/<locale>/feature-graphic.jpg
// Texts come from store-shots.data.json (docs/03c section 0): no prices, "free" or rankings.
// The 512×512 Play icon is not made here (design/brand → play/icon-512.png, already uploaded).
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.argv[2];
if (!root) throw new Error('usage: node play-assets.mjs <shots dir>');
const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, 'store-shots.data.json'), 'utf8'));
const icon = readFileSync(join(here, '..', '..', 'public/icons/icon.svg'), 'utf8');
const png = (p) => `data:image/png;base64,${readFileSync(p).toString('base64')}`;
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const shot = (locale, scene) => {
  for (const platform of ['play-phone', 'appstore-6.9', 'appstore-6.5']) {
    const dir = join(root, platform, locale, 'raw');
    const f = existsSync(dir) && readdirSync(dir).find((n) => n.endsWith(`-${scene}.png`));
    if (f) return { src: png(join(dir, f)), aspect: data.platforms[platform].viewport.join('/') };
  }
  return null;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
for (const [locale, L] of Object.entries(data.locales)) {
  const a = shot(locale, 'camera');
  const b = shot(locale, 'roll');
  if (!a || !b) {
    console.warn(`skip ${locale}: no raw camera/roll shots`);
    continue;
  }
  const rtl = L.dir === 'rtl';
  await page.setContent(`<!doctype html><html lang="${locale}" dir="${L.dir}"><head><meta charset="utf-8"><style>
    html,body{margin:0;width:1024px;height:500px;overflow:hidden;background:radial-gradient(90% 120% at ${rtl ? '82%' : '18%'} 30%,#2b1a10 0%,#0e0d0c 62%);font-family:${L.font};color:#f3efe8;}
    .copy{position:absolute;${rtl ? 'right' : 'left'}:60px;top:0;bottom:0;width:480px;display:flex;flex-direction:column;justify-content:center;gap:20px;}
    .copy svg{width:92px;height:92px;filter:drop-shadow(0 10px 24px rgba(0,0,0,.5));}
    h1{margin:0;font-size:46px;line-height:1.12;font-weight:800;letter-spacing:${/^(ja|zh|ko|hi|ar)$/.test(locale) ? '0' : '-.02em'};}
    h1 .brand{display:block;color:#ff8a2b;font-family:'Segoe UI',sans-serif;direction:ltr;unicode-bidi:isolate;${rtl ? 'text-align:right;' : ''}}
    p{margin:0;font-size:19px;line-height:1.45;color:#c4bcb0;}
    .phone{position:absolute;width:190px;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.65),0 0 0 3px #2b2621;}
    .phone img{width:100%;height:100%;display:block;}
    .a{${rtl ? 'left:230px' : 'left:610px'};top:56px;transform:rotate(${rtl ? 6 : -6}deg);}
    .b{${rtl ? 'left:44px' : 'left:796px'};top:22px;transform:rotate(${rtl ? -5 : 5}deg);}
  </style></head><body>
    <div class="copy">${icon}<h1>${esc(L.name[0])} -<span class="brand">${esc(L.name[1])}</span></h1><p>${esc(L.short)}</p></div>
    <div class="phone a" style="aspect-ratio:${a.aspect}"><img src="${a.src}"></div>
    <div class="phone b" style="aspect-ratio:${b.aspect}"><img src="${b.src}"></div>
  </body></html>`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((i) => i.decode().catch(() => undefined)));
  });
  const over = await page.evaluate(() => document.querySelector('.copy').scrollHeight > 500);
  if (over) console.warn(`feature graphic ${locale}: copy taller than the canvas`);
  const out = join(root, 'play-feature-graphic', locale);
  mkdirSync(out, { recursive: true });
  // JPG: Play rejects feature graphics with an alpha channel.
  await page.screenshot({ path: join(out, 'feature-graphic.jpg'), type: 'jpeg', quality: 92 });
  console.log(`feature graphic ${locale}`);
}
await browser.close();
