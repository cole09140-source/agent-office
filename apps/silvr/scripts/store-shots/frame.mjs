// Puts each raw screenshot into a store frame: Film Camela mark, localized caption, phone.
// usage: node scripts/store-shots/frame.mjs <shots dir> [--check]
//   reads  <dir>/<platform>/<locale>/raw/<n>-<scene>.png   (shots.spec.ts)
//   writes <dir>/<platform>/<locale>/<n>-<scene>.png        (store size from store-shots.data.json)
//   --check renders every caption on every platform without screenshots and reports fitting.
// Captions: store-shots.data.json (docs/03b ko·en, docs/03c others). A caption breaks after its
// first separator (, 、 ， 。 . ! ? ،) when text follows it, otherwise it wraps balanced; the first
// line is highlighted. Font size steps down until it fits in two lines.
import { chromium } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(here, 'store-shots.data.json'), 'utf8'));
const icon = readFileSync(join(here, '..', '..', 'public/icons/icon.svg'), 'utf8');

const root = process.argv[2];
const check = process.argv.includes('--check');
if (!root && !check) throw new Error('usage: node frame.mjs <shots dir> [--check]');

const SEP = /^(.*?[,、，。.!！?？،])\s*(\S.*)$/su;
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function html(platform, locale, caption, img) {
  const [W, H] = data.platforms[platform].size;
  const L = data.locales[locale];
  const s = Math.min(W / 1290, H / 2796) * (W / H > 0.55 ? 1.05 : 1); // tablets are wider: a bit more type
  const m = caption.match(SEP);
  const lines = m ? [m[1], m[2]] : [caption];
  const raw = data.platforms[platform].viewport;
  return `<!doctype html><html lang="${locale}" dir="${L.dir}"><head><meta charset="utf-8"><style>
    html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:radial-gradient(120% 70% at 50% 0%,#2a1f16 0%,#0e0d0c 60%);}
    body{position:relative;display:flex;flex-direction:column;align-items:center;font-family:${L.font};color:#f3efe8;}
    .brand{position:absolute;top:${92 * s}px;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:${18 * s}px;direction:ltr;}
    .brand svg{width:${64 * s}px;height:${64 * s}px;}
    .brand span{font:700 ${40 * s}px 'Segoe UI',sans-serif;letter-spacing:.01em;color:#d9d1c6;}
    .cap{height:${500 * s}px;width:100%;box-sizing:border-box;padding:0 ${60 * s}px;display:flex;align-items:flex-end;justify-content:center;}
    h1{margin:0;font-size:${96 * s}px;line-height:1.22;font-weight:800;text-align:center;text-wrap:balance;letter-spacing:${/^(ja|zh|ko|hi|ar)$/.test(locale) ? '0' : '-0.02em'};word-break:${locale === 'ko' ? 'keep-all' : 'normal'};}
    h1 .l{display:block;}
    h1 em{font-style:normal;color:#ff8a2b;}
    .phone{margin-top:${90 * s}px;height:${H - 710 * s}px;aspect-ratio:${raw[0]}/${raw[1]};border-radius:${70 * s}px;overflow:hidden;box-shadow:0 ${40 * s}px ${120 * s}px rgba(0,0,0,.6),0 0 0 ${6 * s}px #2b2621;background:#0e0d0c;}
    .phone img{width:100%;height:100%;display:block;}
  </style></head><body><div class="brand">${icon}<span>Film Camela</span></div><div class="cap"><h1 dir="${L.dir}">${lines.map((l) => `<span class="l">${esc(l)}</span>`).join('')}</h1></div><div class="phone">${img ? `<img src="${img}">` : ''}</div></body></html>`;
}

/** Shrinks the caption until it is at most two lines and no wider than the frame; highlights line 1. */
async function fit(page) {
  return page.evaluate(async () => {
    await document.fonts.ready;
    const h = document.querySelector('h1');
    const base = parseFloat(getComputedStyle(h).fontSize);
    const lineCount = () => {
      const tops = new Set();
      // Text-node rects only (element boxes would add their own tops); one top per line.
      const lh = parseFloat(getComputedStyle(h).fontSize) / 2;
      const walk = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      for (let n = walk.nextNode(); n; n = walk.nextNode()) {
        const r = document.createRange();
        r.selectNodeContents(n);
        for (const rect of r.getClientRects()) if (rect.width > 1) tops.add(rect.top);
      }
      return [...tops].sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] > lh).length;
    };
    let size = base;
    while ((lineCount() > 2 || h.scrollWidth > h.clientWidth + 1) && size > base * 0.6) {
      size *= 0.94;
      h.style.fontSize = `${size}px`;
    }
    // A caption without a separator that fits on one line is narrowed into two balanced lines,
    // so every frame has the same two-line header with a highlighted first line.
    const spans0 = h.querySelectorAll('.l');
    if (spans0.length === 1 && lineCount() === 1) {
      const r = document.createRange();
      r.selectNodeContents(spans0[0]);
      const w = r.getBoundingClientRect().width;
      for (const k of [0.6, 0.7, 0.8]) {
        h.style.maxWidth = `${Math.ceil(w * k)}px`;
        if (lineCount() === 2) break;
      }
      if (lineCount() !== 2) h.style.maxWidth = '';
    }
    const lines = lineCount();
    // Highlight the first rendered line (the first span when the caption was split at a separator).
    const spans = h.querySelectorAll('.l');
    if (spans.length > 1) spans[0].innerHTML = `<em>${spans[0].innerHTML}</em>`;
    else if (lines > 1) {
      // One span wrapped by the browser: wrap the characters of its first line in <em>.
      const span = spans[0];
      const text = span.textContent;
      const node = span.firstChild;
      const r = document.createRange();
      let cut = text.length;
      const top0 = (() => { r.setStart(node, 0); r.setEnd(node, 1); return Math.round(r.getClientRects()[0].top); })();
      for (let i = 1; i < text.length; i++) {
        r.setStart(node, i);
        r.setEnd(node, i + 1);
        const rc = r.getClientRects()[0];
        if (rc && rc.width > 0 && rc.top > top0 + parseFloat(getComputedStyle(h).fontSize) / 2) { cut = i; break; }
      }
      // Pin the measured break as two block lines (no space added: CJK has none).
      const e = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      span.innerHTML = `<em style="display:block">${e(text.slice(0, cut).trimEnd())}</em><span style="display:block">${e(text.slice(cut).trimStart())}</span>`;
    }
    // RTL: isolate Latin runs (Pro, MY, Film Camela) so they sit in Arabic reading order.
    if (h.dir === 'rtl')
      for (const el of h.querySelectorAll('em, span')) {
        if (el.children.length) continue;
        el.innerHTML = el.textContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/[A-Za-z][A-Za-z0-9.'’-]*(?: [A-Za-z][A-Za-z0-9.'’-]*)*/g, '<bdi>$&</bdi>');
      }
    return { lines: lineCount(), shrink: +(size / base).toFixed(2) };
  });
}

const browser = await chromium.launch();
const report = [];
if (check) {
  for (const platform of Object.keys(data.platforms)) {
    const [W, H] = data.platforms[platform].size;
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    for (const locale of Object.keys(data.locales))
      for (const [id, caption] of Object.entries(data.locales[locale].captions)) {
        await page.setContent(html(platform, locale, caption, ''));
        const r = await fit(page);
        if (r.lines > 2 || r.shrink < 0.85) report.push(`${platform} ${locale} ${id}: ${r.lines} lines, size ×${r.shrink}`);
      }
    await page.close();
  }
  console.log(report.length ? report.join('\n') : 'all captions fit in two lines at ≥85% size');
} else {
  for (const platform of readdirSync(root).filter((d) => data.platforms[d])) {
    const [W, H] = data.platforms[platform].size;
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    for (const locale of readdirSync(join(root, platform)).filter((l) => data.locales[l] && existsSync(join(root, platform, l, 'raw')))) {
      const out = join(root, platform, locale);
      mkdirSync(out, { recursive: true });
      for (const file of readdirSync(join(out, 'raw')).filter((f) => /^\d+-[a-z]+\.png$/.test(f)).sort()) {
        const id = file.replace(/^\d+-|\.png$/g, '');
        const caption = data.locales[locale].captions[id];
        if (!caption) throw new Error(`no ${locale} caption for ${id}`);
        const img = `data:image/png;base64,${readFileSync(join(out, 'raw', file)).toString('base64')}`;
        await page.setContent(html(platform, locale, caption, img));
        const r = await fit(page);
        if (r.lines > 2 || r.shrink < 0.85) report.push(`${platform}/${locale}/${file}: ${r.lines} lines, size ×${r.shrink}`);
        await page.evaluate(() => Promise.all(Array.from(document.images).map((i) => i.decode().catch(() => undefined))));
        await page.screenshot({ path: join(out, file) });
      }
      console.log(`framed ${platform}/${locale}`);
    }
    await page.close();
  }
  if (report.length) console.warn(`caption fitting:\n${report.join('\n')}`);
}
await browser.close();
