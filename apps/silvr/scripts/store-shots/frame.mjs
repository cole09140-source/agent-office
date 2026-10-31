// Puts each raw screenshot into a store frame with a caption on top.
// usage: node scripts/store-shots/frame.mjs <shots dir>   (expects <dir>/<project>/<n>-*.png)
import { chromium } from '@playwright/test';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CAPTIONS = {
  ko: ['14대의 카메라,\n각자 다른 촬영 방식', '한 장 한 장,\n필름처럼', '기다림의 길이는\n직접 정해요', '찍고 나서\n다시 현상', '롤 한 장으로\n공유', '실제 필름 카메라까지'],
  en: ['14 cameras,\neach shoots its own way', 'Every frame counts,\njust like film', 'You choose\nhow long to wait', 'Shoot now,\nre-develop later', 'Share the whole roll\nas one sheet', 'Tools for your\nreal film camera'],
};
const SIZES = { ios67: [1290, 2796], android: [1080, 1920] };

const root = process.argv[2];
if (!root) throw new Error('usage: node frame.mjs <shots dir>');
const browser = await chromium.launch();
for (const project of readdirSync(root).filter((d) => /^(ios67|android)-(ko|en)$/.test(d))) {
  const [device, lang] = project.split('-');
  const [W, H] = SIZES[device];
  const out = join(root, `${project}-framed`);
  mkdirSync(out, { recursive: true });
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  for (const file of readdirSync(join(root, project)).filter((f) => f.endsWith('.png')).sort()) {
    const n = Number(file[0]) - 1;
    const img = `data:image/png;base64,${readFileSync(join(root, project, file)).toString('base64')}`;
    const s = W / 1290; // scale everything from the 6.7" layout
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:radial-gradient(120% 70% at 50% 0%,#2a1f16 0%,#0e0d0c 60%);}
      body{display:flex;flex-direction:column;align-items:center;font-family:'Pretendard','Apple SD Gothic Neo','Malgun Gothic','Segoe UI',sans-serif;color:#f3efe8;}
      .cap{height:${500 * s}px;display:flex;align-items:flex-end;justify-content:center;}
      h1{margin:0;font-size:${96 * s}px;line-height:1.18;font-weight:800;text-align:center;white-space:pre-line;letter-spacing:-0.02em;}
      h1 em{font-style:normal;color:#ff8a2b;}
      .phone{margin-top:${90 * s}px;height:${H - 710 * s}px;aspect-ratio:${device === 'ios67' ? '1290/2796' : '1080/1920'};border-radius:${70 * s}px;overflow:hidden;box-shadow:0 ${40 * s}px ${120 * s}px rgba(0,0,0,.6),0 0 0 ${6 * s}px #2b2621;}
      .phone img{width:100%;height:100%;display:block;}
    </style></head><body><div class="cap"><h1>${CAPTIONS[lang][n].replace(/^([^,\n]+)/, '<em>$1</em>')}</h1></div><div class="phone"><img src="${img}"></div></body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(out, file) });
  }
  await page.close();
  console.log(`framed ${project}`);
}
await browser.close();
