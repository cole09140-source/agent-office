#!/usr/bin/env node
/**
 * Localization QA harness: screenshots every main state of the built app in one language and
 * runs layout / string checks on each, at every viewport size and text scale.
 *
 *   node scripts/l10n-shots.mjs --lang ja [--dist ./dist] [--out <dir>] [--sizes 360x640,390x844] [--scale 1,1.3]
 *
 * Options
 *   --lang    one code or a comma list (ko,en,ja,zh,es,fr,pt,ru,hi,ar)            (required)
 *   --dist    built app to serve (run `npx vite build` first; nothing is built here) (./dist)
 *   --out     output root; shots go to <out>/<lang>/<W>x<H>-<scale>/NN-<state>.png
 *   --sizes   CSS-pixel viewports                                                    (360x640,390x844)
 *   --scale   text scale = root font-size multiplier (like OS "large text")          (1,1.3)
 *   --dpr     device pixel ratio of the screenshots                                  (2)
 *   --only    regex: only capture states whose name matches (setup steps still run)
 *   --headed  show the browser
 *
 * Writes <out>/<lang>/report.json and report.md. Checks after every shot:
 *   clipped     text truncated by ellipsis / line-clamp / overflow:hidden, or wider/taller than its box
 *   overflow-x  page wider than the viewport, or elements sticking out of it
 *   leak        raw message keys, {placeholders}, ICU plural syntax, undefined/NaN
 *   break       words split mid-word across lines (any script but Han/kana);
 *               (ko/ja/zh/hi) one-character orphan lines in buttons / labels
 *   rtl         (ar) html dir, mirrored back/chevron icons, tab order, header back button side,
 *               Arabic text laid out LTR or explicitly left-aligned
 *   lang        <html lang> / dir not what the language should set
 *   fallback    English text visible for a key the locale file (src/locales/<lang>.ts) lacks
 *
 * The language is set through the browser locale (the app's "System" setting follows
 * navigator.languages); if that does not take, it falls back to the Settings language picker.
 * Uses the same fake camera as playwright.config.ts (e2e/.cache/scene.y4m).
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, devices } from '@playwright/test';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const { makeScene } = await import(pathToFileURL(join(ROOT, 'e2e', 'make-scene.mjs')).href);

const LANGS = {
  ko: { browser: 'ko-KR', html: 'ko', endonym: '한국어' },
  en: { browser: 'en-US', html: 'en', endonym: 'English' },
  ja: { browser: 'ja-JP', html: 'ja', endonym: '日本語' },
  zh: { browser: 'zh-CN', html: 'zh-CN', endonym: '简体中文' },
  es: { browser: 'es-ES', html: 'es', endonym: 'Español' },
  fr: { browser: 'fr-FR', html: 'fr', endonym: 'Français' },
  pt: { browser: 'pt-BR', html: 'pt-BR', endonym: 'Português (Brasil)' },
  ru: { browser: 'ru-RU', html: 'ru', endonym: 'Русский' },
  hi: { browser: 'hi-IN', html: 'hi', endonym: 'हिन्दी' },
  ar: { browser: 'ar', html: 'ar', endonym: 'العربية' },
};
const DEFAULT_OUT = 'C:\\Users\\cole0\\AppData\\Local\\Temp\\claude\\C--Users-cole0-Desktop------\\b67fe281-4c21-4af4-bdf2-974dca1cc1e0\\scratchpad\\l10n-shots';

// ---------------------------------------------------------------- args
function parseArgs(argv) {
  const a = { dist: join(ROOT, 'dist'), out: DEFAULT_OUT, sizes: '360x640,390x844', scale: '1,1.3', dpr: '2', only: '', headed: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--headed') a.headed = true;
    else if (k.startsWith('--')) {
      const [name, inline] = k.slice(2).split('=');
      a[name] = inline ?? argv[++i];
    }
  }
  if (!a.lang) {
    console.error('usage: node scripts/l10n-shots.mjs --lang <ko|en|ja|zh|es|fr|pt|ru|hi|ar>[,…] [--dist dir] [--out dir] [--sizes 360x640,390x844] [--scale 1,1.3] [--dpr 2] [--only regex] [--headed]');
    process.exit(2);
  }
  const langs = String(a.lang).split(',').map((s) => s.trim()).filter(Boolean);
  for (const l of langs) if (!LANGS[l]) throw new Error(`unknown --lang ${l} (use ${Object.keys(LANGS).join(', ')})`);
  const sizes = String(a.sizes).split(',').map((s) => {
    const m = s.trim().match(/^(\d+)x(\d+)$/);
    if (!m) throw new Error(`bad size "${s}" (use WxH)`);
    return { width: +m[1], height: +m[2] };
  });
  const scales = String(a.scale).split(',').map(Number).filter((n) => n > 0);
  return { langs, dist: resolve(a.dist), out: resolve(a.out), sizes, scales, dpr: Number(a.dpr) || 2, only: a.only ? new RegExp(a.only) : null, headed: a.headed };
}

// ---------------------------------------------------------------- static server
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8',
};
function serve(dir) {
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(dir, p));
    if (!file.startsWith(dir)) return res.writeHead(403).end();
    if (!existsSync(file) || statSync(file).isDirectory()) file = existsSync(join(file, 'index.html')) ? join(file, 'index.html') : join(dir, 'index.html');
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, url: `http://127.0.0.1:${server.address().port}/` })));
}

// ---------------------------------------------------------------- English fallback strings
/** Single-line `'key': 'value'` entries of a locale file (best effort; multi-line values are skipped). */
function readMessages(lang) {
  const f = join(ROOT, 'src', 'locales', `${lang}.ts`);
  if (!existsSync(f)) return null;
  const out = new Map();
  const re = /^\s*'([\w.-]+)':\s*(['"`])((?:\\.|(?!\2).)*)\2\s*,?\s*$/gm;
  for (const m of readFileSync(f, 'utf8').matchAll(re)) out.set(m[1], m[3].replace(/\\(['"`\\])/g, '$1'));
  return out;
}
/** English strings the app will show for keys the locale lacks (only placeholder-free ones). */
function fallbackStrings(lang) {
  if (lang === 'en' || lang === 'ko') return [];
  const en = readMessages('en');
  const own = readMessages(lang);
  if (!en || !own) return [];
  const ownValues = new Set(own.values());
  const list = [];
  for (const [k, v] of en) {
    if (own.has(k) || ownValues.has(v)) continue;
    // Real English words only: "ISO", "35mm", "© 2026 ATIUM GROUP Co., Ltd." are language-neutral.
    if (/[{}]/.test(v) || !/[a-z]{3,}/.test(v)) continue;
    list.push({ key: k, text: v });
  }
  return list;
}

// ---------------------------------------------------------------- in-page checks
/** Runs in the page. Returns [{type, selector, text, detail, offscreen?}]. */
export function domChecks({ lang, htmlLang, fallback }) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const issues = [];
  const add = (type, el, detail, extra = {}) => {
    const r = el?.getBoundingClientRect?.();
    issues.push({ type, selector: el ? sel(el) : '', text: el ? txt(el) : '', detail, offscreen: r ? r.bottom < 0 || r.top > H : false, ...extra });
  };
  function sel(el) {
    const parts = [];
    let e = el;
    for (let i = 0; e && e !== document.body && e !== document.documentElement && i < 4; i++) {
      const tid = e.getAttribute('data-testid');
      if (tid) {
        parts.unshift(`[data-testid="${tid}"]`);
        break;
      }
      let p = e.tagName.toLowerCase();
      if (e.id) {
        parts.unshift(`${p}#${e.id}`);
        break;
      }
      p += Array.from(e.classList).slice(0, 2).map((c) => `.${CSS.escape(c)}`).join('');
      const sibs = e.parentElement ? Array.from(e.parentElement.children).filter((s) => s.tagName === e.tagName) : [];
      if (sibs.length > 1) p += `:nth-of-type(${sibs.indexOf(e) + 1})`;
      parts.unshift(p);
      e = e.parentElement;
    }
    return parts.join(' > ');
  }
  function txt(el) {
    const t = (el.innerText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
    return t.slice(0, 80) || (el.getAttribute?.('aria-label') ?? '').slice(0, 80);
  }
  const shown = (el) =>
    el.getClientRects().length > 0 &&
    (el.checkVisibility ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) : true) &&
    !el.closest('[aria-hidden="true"], .sr-only, [hidden], [inert]');

  // Scope: the topmost open dialog (sheet / onboarding) plus toasts, else the whole page.
  const dialogs = Array.from(document.querySelectorAll('.sheet, .onboarding, [role="dialog"][aria-modal="true"]')).filter((d) => d.getClientRects().length && getComputedStyle(d).visibility !== 'hidden');
  const roots = [dialogs.at(-1) ?? document.body, ...Array.from(document.querySelectorAll('.toasts'))];
  const all = [];
  for (const r of roots) for (const el of r.querySelectorAll('*')) if (!all.includes(el)) all.push(el);
  const hasOwnText = (el) => Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
  const BOXED = 'button, a, label, h1, h2, h3, [role="radio"], [role="tab"], .chip, .seg button, .toast, .stock-name, .badge, .seg-label, th, dt';
  const texty = all.filter((el) => (hasOwnText(el) || el.matches(BOXED)) && !['SCRIPT', 'STYLE', 'svg', 'SVG', 'OPTION'].includes(el.tagName) && shown(el));

  // (a) clipped text
  for (const el of texty) {
    const s = getComputedStyle(el);
    if (!(el.innerText ?? '').trim()) continue;
    if (el.classList.contains('stock-strip') || /auto|scroll/.test(s.overflowX)) continue;
    const sw = el.scrollWidth, cw = el.clientWidth, sh = el.scrollHeight, ch = el.clientHeight;
    if (s.textOverflow === 'ellipsis' && sw > cw + 1) {
      add('clipped', el, `ellipsis: text ${sw}px in ${cw}px`);
      continue;
    }
    if (s.webkitLineClamp && s.webkitLineClamp !== 'none' && sh > ch + 2) {
      add('clipped', el, `line-clamp ${s.webkitLineClamp}: text ${sh}px in ${ch}px`);
      continue;
    }
    const hides = /hidden|clip/.test(s.overflowX + s.overflowY);
    if (hides && cw > 0 && ch > 0 && (sw > cw + 1 || sh > ch + 2)) {
      add('clipped', el, `overflow:hidden cuts text (${sw}x${sh} in ${cw}x${ch})`);
      continue;
    }
    if (el.matches(BOXED) && cw > 0) {
      // i18n.spec logic: measure the content itself (scrollWidth also counts ::after hit areas).
      const range = document.createRange();
      range.selectNodeContents(el);
      const rr = range.getBoundingClientRect();
      const box = cw - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      if (rr.width > box + 1) add('clipped', el, `text ${Math.round(rr.width)}px wider than box ${Math.round(box)}px`);
      else if (ch > 0 && rr.height > ch + Math.max(4, parseFloat(s.fontSize) * 0.6) && s.overflowY === 'visible') add('clipped', el, `text ${Math.round(rr.height)}px taller than box ${ch}px (spills out)`);
    }
  }

  // (b) horizontal overflow
  const se = document.scrollingElement ?? document.documentElement;
  if (se.scrollWidth > W + 1) issues.push({ type: 'overflow-x', selector: 'html', text: '', detail: `page scrollWidth ${se.scrollWidth}px > viewport ${W}px` });
  const clippedByAncestor = (el) => {
    for (let p = el.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.overflowX !== 'visible') {
        const pr = p.getBoundingClientRect();
        if (pr.left >= -1 && pr.right <= W + 1) return true;
      }
    }
    return false;
  };
  const offenders = [];
  for (const el of all) {
    if (!shown(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right <= W + 1 && r.left >= -1) continue;
    const pos = getComputedStyle(el).position;
    if ((r.left >= W || r.right <= 0) && (pos === 'absolute' || pos === 'fixed')) continue; // parked off-canvas on purpose
    if (clippedByAncestor(el)) continue;
    offenders.push(el);
  }
  for (const el of offenders.filter((o) => !offenders.some((p) => p !== o && p.contains(o))).slice(0, 8)) {
    const r = el.getBoundingClientRect();
    add('overflow-x', el, `sticks out of viewport: left ${Math.round(r.left)} right ${Math.round(r.right)} (viewport ${W})`);
  }

  // (c) raw keys / placeholders / ICU
  const PREFIXES = 'app|tab|common|cam|lab|gal|onb|speed|dr|view|roll|set|an|a11y|palette|share|hint|err|update|toast|dur|wait|stock|era';
  const pats = [
    [new RegExp(`\\b(?:${PREFIXES})\\.[a-zA-Z][\\w.]*`, 'g'), 'raw message key'],
    [/\{[a-zA-Z_]+\}/g, 'unfilled placeholder'],
    [/\{\s*\w+\s*,\s*(?:plural|select|selectordinal)\b|,\s*plural\s*,|\{\w+:[^}]*\|/g, 'ICU / plural syntax'],
    [/\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/g, 'undefined / NaN'],
  ];
  const scanText = (s, el, where) => {
    for (const [re, what] of pats) for (const m of s.match(re) ?? []) add('leak', el, `${what}${where}: ${m}`);
  };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || !n.textContent.trim() || ['SCRIPT', 'STYLE'].includes(el.tagName) || !el.getClientRects().length) continue;
    scanText(n.textContent, el, '');
  }
  for (const el of document.querySelectorAll('[aria-label],[title],[placeholder],img[alt]')) {
    for (const a of ['aria-label', 'title', 'placeholder', 'alt']) {
      const v = el.getAttribute(a);
      if (v) scanText(v, el, ` in @${a}`);
    }
  }

  // (d) line breaks: words split mid-word in every language (e.g. "Sunn|y 200" from overflow-wrap:anywhere
  // in a squeezed column); one-character orphan lines in buttons / labels for CJK and Hindi.
  {
    const seg = new Intl.Segmenter(lang, { granularity: 'grapheme' });
    // Han / kana may break anywhere; every other script (and digits) should only break at spaces.
    const letter = /^(?![\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])[\p{L}\p{M}\p{N}]/u;
    const isLetter = (g) => /\p{L}|\p{M}/u.test(g);
    const BREAKY = 'button, label, h1, h2, h3, [role="radio"], [role="tab"], .chip, .badge, .toast, th, dt, .seg-label, .tabbar span';
    const orphans = ['ko', 'ja', 'zh', 'hi'].includes(lang);
    const midWord = true;
    const cands = texty.filter((el) => el.matches(BREAKY) || hasOwnText(el));
    const seen = new Set();
    for (const el of cands) {
      if (seen.has(el) || Array.from(seen).some((s) => s.contains(el))) continue;
      // Graphemes of the element's visible text, each with the line it sits on.
      const items = [];
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let multi = false;
      let node = 0;
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (n.parentElement?.closest('.sr-only, [aria-hidden="true"]')) continue;
        const whole = document.createRange();
        whole.selectNodeContents(n);
        // One rect per line fragment: only text nodes that actually wrap matter.
        if (whole.getClientRects().length > 1) multi = true;
        node++;
        let off = 0;
        for (const { segment } of seg.segment(n.textContent)) {
          const r = document.createRange();
          r.setStart(n, off);
          r.setEnd(n, off + segment.length);
          off += segment.length;
          const rect = Array.from(r.getClientRects()).find((x) => x.width > 0);
          items.push({ g: segment, node, top: rect ? rect.top : null, h: rect ? rect.height : 0 });
        }
      }
      if (!items.some((i) => i.top !== null)) continue;
      // Group into lines.
      const lines = [];
      let cur = null;
      for (const it of items) {
        if (it.top === null) {
          if (cur) cur.push(it);
          continue;
        }
        if (!cur || Math.abs(it.top - cur.top) > Math.max(3, it.h * 0.5)) {
          cur = [it];
          cur.top = it.top;
          lines.push(cur);
        } else cur.push(it);
      }
      if (!multi || lines.length < 2) continue;
      const vis = (line) => line.map((i) => i.g).join('').trim();
      // Only real wraps count: both sides of the break in the same text node (not block children).
      const nodeLines = (nd) => new Set(lines.filter((l) => l.some((i) => i.node === nd && i.top !== null)));
      if (orphans && el.matches(BREAKY)) {
        for (const line of lines) {
          const shownG = line.filter((i) => i.top !== null && i.g.trim());
          if (shownG.length === 1 && isLetter(shownG[0].g) && nodeLines(shownG[0].node).size > 1) {
            add('break', el, `one-character orphan line "${shownG[0].g}" (${lines.length} lines)`);
            seen.add(el);
            break;
          }
        }
      }
      if (midWord && !seen.has(el)) {
        for (let i = 0; i < lines.length - 1; i++) {
          const a = lines[i].at(-1); // includes trailing whitespace, which makes it a normal break
          const b = lines[i + 1][0];
          if (a && b && a.node === b.node && letter.test(a.g) && letter.test(b.g) && getComputedStyle(el).hyphens !== 'auto') {
            add('break', el, `word split across lines: "…${vis(lines[i]).slice(-4)}|${vis(lines[i + 1]).slice(0, 4)}…"`);
            seen.add(el);
            break;
          }
        }
      }
    }
  }

  // (e) RTL / language attributes
  const html = document.documentElement;
  const rtl = lang === 'ar';
  if (html.getAttribute('lang') !== htmlLang) issues.push({ type: 'lang', selector: 'html', text: '', detail: `html lang="${html.getAttribute('lang')}", expected "${htmlLang}"` });
  if ((html.getAttribute('dir') ?? 'ltr') !== (rtl ? 'rtl' : 'ltr')) issues.push({ type: rtl ? 'rtl' : 'lang', selector: 'html', text: '', detail: `html dir="${html.getAttribute('dir')}", expected "${rtl ? 'rtl' : 'ltr'}"` });
  if (rtl) {
    for (const ic of document.querySelectorAll('.icon-back, .icon-chevron')) {
      if (!shown(ic)) continue;
      const tf = getComputedStyle(ic).transform;
      if (!/^matrix\(-1/.test(tf)) add('rtl', ic.closest('button, a, .row') ?? ic, `${ic.classList.contains('icon-back') ? 'back' : 'chevron'} icon not mirrored (transform ${tf})`);
    }
    const back = Array.from(document.querySelectorAll('header.hdr > button.icon-btn:first-child')).find(shown);
    if (back) {
      const r = back.getBoundingClientRect();
      if (r.left + r.width / 2 < W / 2) add('rtl', back, `header back button on the left (x=${Math.round(r.left)})`);
    }
    const tc = document.querySelector('[data-testid="tab-camera"]'), ts = document.querySelector('[data-testid="tab-settings"]');
    if (tc && ts && shown(tc) && shown(ts) && tc.getBoundingClientRect().x < ts.getBoundingClientRect().x) add('rtl', tc, 'tab bar runs left-to-right (Camera is left of Settings)');
    const next = document.querySelector('[data-testid="btn-next"]'), prev = document.querySelector('.viewer .nav.prev');
    if (next && prev && shown(next) && shown(prev) && next.getBoundingClientRect().x > prev.getBoundingClientRect().x) add('rtl', next, 'photo viewer "next" is on the right');
    const arabic = /[\u0600-\u06FF]/;
    // Bidi: neutral punctuation at the edge of an LTR run in an RTL paragraph is moved to the other
    // side ("1\u00D7" shows "\u00D71", "'26" shows "26'", "(.zip)" shows "(zip.)"). Needs <bdi> / dir=ltr / LRM.
    const isolated = (el) => {
      for (let e = el; e && e !== document.body; e = e.parentElement) {
        const st = getComputedStyle(e);
        // The app isolates many RTL blocks too; only an LTR (or auto / plaintext) context protects the run.
        if (e.tagName === 'BDI' || e.getAttribute('dir') === 'auto' || st.unicodeBidi === 'plaintext' || st.direction === 'ltr') return true;
        if (st.display !== 'inline' && e !== el) break;
      }
      return false;
    };
    const NEUTRAL = `'"\u2018\u2019\u201C\u201D()\\[\\]{}\u00D7\u00B7\u2022\u2026!?*/\\\\.,:;_~^-`;
    const edgeNeutral = new RegExp(`^\\s*[${NEUTRAL}]|[${NEUTRAL}]\\s*$`);
    const leadBeforeLatin = new RegExp(`(^|[\\s(\\[\u00AB])[.'\u2018\u2019"\u201C\u201D\u00D7](?=[A-Za-z0-9])`);
    for (const el of texty) {
      if (!hasOwnText(el) || el.closest('.viewfinder')) continue;
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
      if (!own || isolated(el) || /^[‎⁦‪‭]/.test(own)) continue;
      const pureLtr = !arabic.test(own) && /[A-Za-z0-9]/.test(own);
      if ((pureLtr && edgeNeutral.test(own)) || (!pureLtr && arabic.test(own) && leadBeforeLatin.test(own))) {
        add('rtl', el, `bidi: punctuation next to LTR text "${own.slice(0, 30)}" will be reordered (wrap in <bdi> / dir="ltr")`);
      } else if (pureLtr && !/[A-Za-z]/.test(own) && /\d\s+\S*\d/.test(own)) {
        add('rtl', el, `bidi: number groups "${own.slice(0, 30)}" display in reverse order in RTL (wrap in <bdi> / dir="ltr")`);
      }
    }
    for (const el of texty) {
      if (!hasOwnText(el) || el.closest('.viewfinder')) continue;
      const own = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join('');
      if (!arabic.test(own)) continue;
      const s = getComputedStyle(el);
      if (s.direction === 'ltr') add('rtl', el, 'Arabic text laid out left-to-right (direction:ltr)');
      else if (s.textAlign === 'left' && s.display !== 'inline') {
        const range = document.createRange();
        range.selectNodeContents(el);
        if (el.clientWidth - range.getBoundingClientRect().width > 24) add('rtl', el, 'Arabic text explicitly text-align:left');
      }
    }
  }

  // (f) English fallback strings visible
  if (fallback?.length) {
    const byText = new Map(fallback.map((f) => [f.text, f.key]));
    for (const el of texty) {
      const t = (el.innerText ?? '').replace(/\s+/g, ' ').trim();
      if (byText.has(t) && !Array.from(el.children).some((c) => (c.innerText ?? '').trim() === t)) add('fallback', el, `English fallback for missing key ${byText.get(t)}`);
    }
    for (const el of document.querySelectorAll('[aria-label]')) {
      const v = el.getAttribute('aria-label').trim();
      if (byText.has(v) && el.getClientRects().length) add('fallback', el, `English fallback in @aria-label for missing key ${byText.get(v)}`);
    }
  }

  // De-duplicate within this shot.
  const key = (i) => `${i.type}|${i.selector}|${i.detail}`;
  return issues.filter((i, k) => issues.findIndex((j) => key(j) === key(i)) === k);
}

// ---------------------------------------------------------------- one language
async function runLang(browser, baseUrl, opts, lang) {
  const L = LANGS[lang];
  const outLang = join(opts.out, lang);
  rmSync(outLang, { recursive: true, force: true });
  mkdirSync(outLang, { recursive: true });
  const fallback = fallbackStrings(lang);
  const t0 = Date.now();
  const report = { lang, dist: opts.dist, startedAt: new Date().toISOString(), sizes: opts.sizes, scales: opts.scales, notes: [], consoleErrors: [], shots: [] };

  const { viewport: _v, deviceScaleFactor: _d, ...pixel } = devices['Pixel 7'];
  /** A fresh profile (empty storage, onboarding and quick start showing). */
  async function openProfile(viewport) {
    const context = await browser.newContext({
      ...pixel,
      viewport,
      deviceScaleFactor: opts.dpr,
      locale: L.browser,
      permissions: ['camera'],
      serviceWorkers: 'block',
      reducedMotion: 'reduce',
    });
    context.setDefaultTimeout(6000);
    const p = await context.newPage();
    p.on('pageerror', (e) => report.consoleErrors.push(`pageerror: ${e.message}`));
    p.on('console', (m) => m.type() === 'error' && report.consoleErrors.push(`console: ${m.text()}`));
    return { context, page: p };
  }
  /** Every size / scale combo runs on its own fresh profile (a long-lived one piled up rolls and logs
   *  and got stuck after the first combo). */
  let page = null;

  const tid = (id) => page.locator(`[data-testid="${id}"]`).first();
  const isVis = (loc) => loc.isVisible().catch(() => false);
  const waitVis = (loc, timeout = 6000) => loc.waitFor({ state: 'visible', timeout });
  const sheetOpen = () => isVis(page.locator('.sheet').first());
  async function closeSheets() {
    for (let i = 0; i < 4 && (await sheetOpen()); i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  }
  async function dismissToasts() {
    for (let i = 0; i < 4; i++) {
      const x = page.locator('[data-testid="toast-close"]:visible').first();
      if (!(await x.count())) break;
      await x.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(120);
    }
  }
  /** Scrolls an element to the top of its scroller, clear of sticky / fixed bars above it. */
  async function reveal(loc) {
    await loc.evaluate((el) => {
      el.scrollIntoView({ block: 'start' });
      let cover = 0;
      const top = el.getBoundingClientRect().top;
      for (const o of document.querySelectorAll('body *')) {
        const ps = getComputedStyle(o).position;
        if ((ps !== 'sticky' && ps !== 'fixed') || o.contains(el) || !o.getClientRects().length) continue;
        const r = o.getBoundingClientRect();
        if (r.top <= top + 1 && r.bottom > top && r.height < window.innerHeight * 0.8) cover = Math.max(cover, r.bottom - top);
      }
      if (cover > 0) {
        let sc = el.parentElement;
        while (sc && !(/(auto|scroll)/.test(getComputedStyle(sc).overflowY) && sc.scrollHeight > sc.clientHeight)) sc = sc.parentElement;
        (sc ?? window).scrollBy(0, -(cover + 8));
      }
    });
  }
  async function tab(name) {
    await closeSheets();
    if (await isVis(tid('onboarding'))) await page.keyboard.press('Escape');
    await tid(`tab-${name}`).click();
    await page.waitForTimeout(150);
  }
  async function scrollTop() {
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      for (const el of document.querySelectorAll('.page, main, .darkroom, .dr-controls, .load-panel')) el.scrollTop = 0;
    });
  }
  async function shutterReady(timeout = 15000) {
    await page.waitForFunction(() => {
      const b = document.querySelector('[data-testid="shutter"]');
      return b && !b.disabled;
    }, null, { timeout });
  }
  async function shoot(n) {
    for (let i = 0; i < n; i++) {
      const before = await tid('counter').textContent();
      await tid('shutter').click();
      await page.waitForFunction((b) => document.querySelector('[data-testid="counter"]')?.textContent !== b, before, { timeout: 15000 });
    }
  }
  async function pickLangViaSettings() {
    await tab('settings');
    const opt = tid('lang-picker').locator(`[data-value="${lang}"]`);
    await opt.scrollIntoViewIfNeeded();
    await opt.click();
    await page.waitForFunction((h) => document.documentElement.lang === h, L.html, { timeout: 8000 });
  }

  let combo = null;
  let n = 0;
  const flags = new Set();
  /** One state: run the actions, screenshot, check. Never throws. */
  async function step(name, fn, { needs = [], sets, after } = {}) {
    const idx = ++n;
    const file = `${String(idx).padStart(2, '0')}-${name}.png`;
    const rel = `${combo.dir}/${file}`;
    const shot = { state: name, file: rel, size: combo.size, scale: combo.scale, ok: false, ms: 0, issues: [] };
    const s0 = Date.now();
    const missing = needs.filter((f) => !flags.has(f));
    if (missing.length) {
      shot.error = `skipped: needs ${missing.join(', ')}`;
      report.shots.push(shot);
      return;
    }
    const capture = !opts.only || opts.only.test(name);
    try {
      if (!name.includes('toast')) await dismissToasts();
      await fn();
      if (sets) flags.add(sets);
      if (capture) {
        await page.waitForTimeout(350);
        await page.evaluate(() => document.fonts?.ready);
        await page.screenshot({ path: join(outLang, combo.dir, file), animations: 'disabled', caret: 'hide' });
        shot.issues = (await page.evaluate(domChecks, { lang, htmlLang: L.html, fallback })).map((i) => ({ ...i, shot: rel }));
      }
      shot.ok = true;
    } catch (e) {
      shot.error = String(e?.message ?? e).split('\n')[0].slice(0, 300);
      try {
        await page.screenshot({ path: join(outLang, combo.dir, file.replace('.png', '.FAILED.png')) });
      } catch {}
    }
    if (after) {
      try {
        await after();
      } catch (e) {
        shot.afterError = String(e?.message ?? e).split('\n')[0].slice(0, 200);
        await closeSheets().catch(() => {});
      }
    }
    shot.ms = Date.now() - s0;
    if (capture || shot.error) report.shots.push(shot);
    const mark = shot.ok ? (shot.issues.length ? `${shot.issues.length} issue(s)` : 'ok') : `FAIL ${shot.error}`;
    console.log(`  ${rel}  ${mark}  (${shot.ms} ms)`);
  }

  /** Loads the app on the current profile and makes sure it is in `lang`, onboarding showing. */
  async function openApp() {
    await page.goto(baseUrl);
    await page.waitForLoadState('domcontentloaded');
    await waitVis(tid('onboarding'), 20000).catch(() => {});
    const now = await page.evaluate(() => document.documentElement.lang);
    if (now !== L.html) {
      const note = `browser locale ${L.browser} gave html lang "${now}"; switched with the Settings picker`;
      if (!report.notes.includes(note)) report.notes.push(note);
      await page.keyboard.press('Escape');
      await pickLangViaSettings();
      await tid('btn-replay-intro').click();
      await waitVis(tid('onboarding'));
    }
  }
  async function applyCombo(size, scale) {
    await page.setViewportSize(size);
    await page.evaluate((k) => {
      document.documentElement.style.setProperty('font-size', `${16 * k}px`, 'important');
      window.dispatchEvent(new Event('resize'));
    }, scale);
  }

  for (const size of opts.sizes) {
    for (const scale of opts.scales) {
      combo = { size: `${size.width}x${size.height}`, scale, dir: `${size.width}x${size.height}-${scale}` };
      mkdirSync(join(outLang, combo.dir), { recursive: true });
      console.log(`[${lang}] ${combo.dir}`);
      n = 0;
      flags.clear();
      // First-run states need an empty profile (quick start only shows before the first roll).
      const fresh = await openProfile(size);
      page = fresh.page;
      await openApp().catch((e) => report.notes.push(`${combo.dir}: fresh profile did not open: ${String(e?.message ?? e).split(/\r?\n/)[0]}`));
      await applyCombo(size, scale);

      // Onboarding 1-3 (fresh on the first pass, replayed from Settings afterwards).
      await step('onboarding-1', () => waitVis(tid('onboarding')), { sets: 'onb' });
      await step('onboarding-2', () => tid('onb-next').click(), { needs: ['onb'] });
      await step('onboarding-3', () => tid('onb-next').click(), {
        needs: ['onb'],
        after: async () => {
          await tid('onb-next').click();
          await tid('onboarding').waitFor({ state: 'hidden', timeout: 4000 }).catch(() => page.keyboard.press('Escape'));
        },
      });

      // Camera: load panel → all-cameras sheet → quick start.
      await step('camera-load-panel', async () => {
        await tab('camera');
        await waitVis(tid('load-panel'));
        await scrollTop();
      }, { sets: 'panel' });
      await step('camera-all-cameras', async () => {
        await tid('btn-all-cameras').click();
        await waitVis(tid('all-cameras'));
      }, { needs: ['panel'], after: closeSheets });
      await step('camera-quick-start', async () => {
        await reveal(tid('quick-start'));
      }, { needs: ['panel'] });
      // The same profile goes on: load a roll and shoot.
      await closeSheets();
      await step('camera-loaded', async () => {
        await tab('camera');
        await waitVis(tid('load-panel'));
        // The panel remembers the last body (the look-row pass uses Snap 27): back to Pro 35.
        const pro = tid('camera-pro35');
        if ((await pro.count()) && (await pro.getAttribute('aria-pressed')) !== 'true') await pro.click();
        const stock = tid('stock-sunny200');
        if (await isVis(stock)) await stock.click();
        const r12 = page.getByRole('radio', { name: /^12/ }).first();
        if (await isVis(r12)) await r12.click();
        await tid('btn-load').click();
        await shutterReady();
        await shoot(3);
        await scrollTop();
      }, { sets: 'loaded' });
      await step('camera-more-menu', async () => {
        await tid('btn-more').click();
        await waitVis(tid('cam-more'));
      }, {
        needs: ['loaded'],
        after: async () => {
          if (await isVis(tid('cam-more'))) await tid('btn-more').click();
          if (await isVis(tid('cam-more'))) await page.keyboard.press('Escape');
        },
      });
      await step('camera-timer-on', async () => {
        await tid('btn-timer').click();
        await page.waitForFunction(() => document.querySelector('[data-testid="btn-timer"]')?.classList.contains('on'), null, { timeout: 3000 });
      }, {
        needs: ['loaded'],
        after: async () => {
          for (let i = 0; i < 3; i++) {
            if (!(await tid('btn-timer').evaluate((b) => b.classList.contains('on')))) break;
            await tid('btn-timer').click();
          }
        },
      });
      await step('roll-sheet', async () => {
        await tid('roll-btn').click();
        await waitVis(tid('roll-sheet'));
      }, { needs: ['loaded'], sets: 'rollsheet' });
      await step('send-to-lab-confirm', async () => {
        await tid('btn-rewind').click();
        await waitVis(tid('confirm'));
      }, { needs: ['rollsheet'], sets: 'confirm' });
      await step('speed-sheet', async () => {
        await tid('confirm-ok').click();
        await waitVis(tid('speed-sheet'));
      }, { needs: ['confirm'], sets: 'speed' });
      await step('lab-developing', async () => {
        await tid('speed-morning').click();
        await waitVis(tid('lab-screen'));
        await waitVis(tid('lab-item'));
      }, { needs: ['speed'], sets: 'lab' });
      await step('lab-rush-confirm', async () => {
        await tid('btn-rush').click();
        await waitVis(tid('confirm'));
      }, { needs: ['lab'], sets: 'rush' });
      await step('toast-developed', async () => {
        await tid('confirm-ok').click();
        await waitVis(tid('toast'), 8000);
      }, { needs: ['rush'] });

      // Album → roll → selection → contact sheet → photo → info → darkroom → delete.
      await step('album', async () => {
        await tab('gallery');
        await waitVis(tid('gallery-screen'));
        await scrollTop();
      });
      await step('roll-screen', async () => {
        await page.locator('[data-testid="roll-card"]').filter({ hasNot: page.locator('.badge:not(.new)') }).first().locator('.roll-meta').click();
        await waitVis(tid('roll-screen'));
        await waitVis(page.locator('[data-testid="thumb"] img').first(), 45000);
      }, { sets: 'roll' });
      await step('roll-select-mode', async () => {
        await tid('btn-select').click();
        const tog = tid('sel-toggle');
        if (await isVis(tog)) await tog.click();
        else await tid('thumb').click();
      }, {
        needs: ['roll'],
        after: async () => {
          if (await isVis(tid('btn-select-cancel'))) await tid('btn-select-cancel').click();
        },
      });
      await step('contact-sheet', async () => {
        await tid('btn-contact').click();
        await waitVis(tid('contact-sheet').locator('img'), 45000);
      }, { needs: ['roll'], after: closeSheets });
      await step('photo-viewer', async () => {
        await tid('thumb').click();
        await waitVis(tid('print'), 20000);
        await page.waitForTimeout(1300);
      }, { needs: ['roll'], sets: 'photo' });
      await step('photo-info-sheet', async () => {
        await page.locator('.viewer header .icon-btn:has(.icon-info)').first().click();
        await waitVis(page.locator('.sheet dl.info').first());
      }, { needs: ['photo'], after: closeSheets });
      await step('darkroom', async () => {
        await tid('btn-darkroom').click();
        await waitVis(tid('darkroom-screen'));
        await page.waitForTimeout(500);
      }, { needs: ['photo'], sets: 'dark' });
      await step('darkroom-film-strip', async () => {
        await reveal(page.locator('.darkroom .stock-strip').first().locator('xpath=..'));
      }, { needs: ['dark'] });
      await step('darkroom-sliders', async () => {
        await reveal(page.locator('.darkroom .dr-controls input[type=range]').first().locator('xpath=ancestor::*[contains(@class,"slider") or self::label or self::div][1]'));
      }, { needs: ['dark'] });
      await step('darkroom-bottom', async () => {
        await page.evaluate(() => {
          const c = document.querySelector('.darkroom .dr-controls');
          c?.lastElementChild?.scrollIntoView({ block: 'end' });
          window.scrollTo(0, document.body.scrollHeight);
        });
      }, {
        needs: ['dark'],
        after: async () => {
          await page.goBack();
          await waitVis(tid('photo-screen'));
          if (await sheetOpen()) await closeSheets();
        },
      });
      await step('delete-confirm', async () => {
        if (!(await isVis(tid('photo-screen')))) throw new Error('not on the photo viewer');
        await tid('btn-delete').click();
        await waitVis(tid('confirm'));
      }, { needs: ['photo'], sets: 'delete' });
      await step('delete-undo-toast', async () => {
        await tid('confirm-ok').click();
        await waitVis(tid('toast-action'), 8000);
      }, { needs: ['delete'] });

      // Analog: meter → new log sheet → log → frame sheet.
      await step('analog-meter', async () => {
        await tab('analog');
        await waitVis(tid('analog-screen'));
        await scrollTop();
      }, { sets: 'analog' });
      await step('analog-new-log-sheet', async () => {
        await tid('btn-new-log').scrollIntoViewIfNeeded();
        await tid('btn-new-log').click();
        await waitVis(tid('new-log'));
      }, { needs: ['analog'], sets: 'newlog' });
      await step('analog-log', async () => {
        await tid('log-camera').fill('Nikon FM2');
        await tid('log-film').fill('Portra 400');
        await tid('log-create').click();
        await waitVis(tid('log-screen'));
      }, { needs: ['newlog'], sets: 'log' });
      await step('analog-frame-sheet', async () => {
        await tid('btn-add-frame').click();
        await waitVis(tid('add-frame'));
      }, { needs: ['log'], after: closeSheets });

      // Darkroom look row: only fixed-film / digital bodies have it, so one Snap 27 frame, developed instantly.
      await step('darkroom-look-row', async () => {
        await tab('camera');
        await waitVis(tid('load-panel'));
        await tid('camera-snap27').click();
        await tid('btn-load').click();
        await shutterReady();
        await shoot(1);
        await tid('roll-btn').click();
        await tid('btn-rewind').click();
        const ok = tid('confirm-ok');
        await waitVis(ok.or(tid('speed-sheet')));
        if (await isVis(ok)) await ok.click();
        await tid('speed-instant').click();
        await waitVis(tid('roll-screen'), 15000);
        await waitVis(page.locator('[data-testid="thumb"] img').first(), 45000);
        await tid('thumb').click();
        await waitVis(tid('print'), 20000);
        await tid('btn-darkroom').click();
        await waitVis(tid('dr-look'));
        await reveal(tid('dr-look'));
      });

      // Settings.
      await step('settings-top', async () => {
        await tab('settings');
        await waitVis(tid('settings-screen'));
        await scrollTop();
      }, { sets: 'settings' });
      await step('settings-backup', async () => {
        const b = page.locator('[data-testid="btn-backup"], [data-testid="btn-backup-save"]').first();
        await reveal(b.locator('xpath=ancestor::section[1]'));
      }, { needs: ['settings'] });
      await step('settings-language', async () => {
        await reveal(tid('lang-picker').locator('xpath=ancestor::*[contains(@class,"field") or self::section][1]'));
      }, { needs: ['settings'] });
      await fresh.context.close().catch(() => {});
    }
  }

  report.durationMs = Date.now() - t0;
  writeReports(outLang, report);
  return report;
}

// ---------------------------------------------------------------- reports
function writeReports(dir, report) {
  writeFileSync(join(dir, 'report.json'), JSON.stringify(report, null, 2));
  const all = report.shots.flatMap((s) => s.issues);
  const groups = new Map();
  for (const i of all) {
    const k = `${i.type}|${i.selector}|${i.detail.replace(/\d+(\.\d+)?px/g, '#px').replace(/\(\d+x\d+ in \d+x\d+\)/, '')}|${i.text}`;
    if (!groups.has(k)) groups.set(k, { ...i, shots: [] });
    groups.get(k).shots.push(i.shot);
  }
  const types = ['clipped', 'overflow-x', 'leak', 'break', 'rtl', 'lang', 'fallback'];
  const count = (t) => [...groups.values()].filter((g) => g.type === t).length;
  const failed = report.shots.filter((s) => !s.ok);
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const L = [];
  L.push(`# Film Camela l10n shots — ${report.lang}`, '');
  L.push(`- dist: \`${report.dist}\``);
  L.push(`- sizes: ${report.sizes.map((s) => `${s.width}x${s.height}`).join(', ')} · text scale: ${report.scales.join(', ')}`);
  L.push(`- shots: ${report.shots.filter((s) => s.ok).length} ok, ${failed.length} failed/skipped · runtime ${(report.durationMs / 1000).toFixed(0)} s`);
  L.push(`- unique issues: ${types.map((t) => `${t} ${count(t)}`).join(' · ')}`);
  for (const n of report.notes) L.push(`- note: ${n}`);
  L.push('');
  if (failed.length) {
    L.push('## States not captured', '', '| shot | error |', '|---|---|');
    for (const s of failed) L.push(`| ${esc(s.file)} | ${esc(s.error)} |`);
    L.push('');
  }
  for (const t of types) {
    const list = [...groups.values()].filter((g) => g.type === t);
    if (!list.length) continue;
    L.push(`## ${t} (${list.length})`, '', '| selector | text | detail | seen in |', '|---|---|---|---|');
    list.sort((a, b) => b.shots.length - a.shots.length);
    for (const g of list) {
      const seen = g.shots.slice(0, 4).join('<br>') + (g.shots.length > 4 ? `<br>+${g.shots.length - 4} more` : '');
      L.push(`| \`${esc(g.selector)}\` | ${esc(g.text)} | ${esc(g.detail)}${g.offscreen ? ' (below the fold)' : ''} | ${seen} |`);
    }
    L.push('');
  }
  if (report.consoleErrors.length) {
    L.push('## Console errors', '');
    for (const e of [...new Set(report.consoleErrors)].slice(0, 30)) L.push(`- ${esc(e).slice(0, 300)}`);
    L.push('');
  }
  writeFileSync(join(dir, 'report.md'), L.join('\n'));
}

// ---------------------------------------------------------------- main
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!existsSync(join(opts.dist, 'index.html'))) {
    console.error(`no build at ${opts.dist} (run: npx vite build --outDir <dir>, then pass --dist <dir>)`);
    process.exit(2);
  }
  const scene = makeScene(join(ROOT, 'e2e', '.cache', 'scene.y4m'));
  const { server, url } = await serve(opts.dist.endsWith(sep) ? opts.dist : opts.dist + sep);
  let browser;
  let exit = 0;
  try {
    browser = await chromium.launch({
      headless: !opts.headed,
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${scene}`, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    });
    for (const lang of opts.langs) {
      const r = await runLang(browser, url, opts, lang);
      const issues = r.shots.reduce((a, s) => a + s.issues.length, 0);
      console.log(`[${lang}] done in ${(r.durationMs / 1000).toFixed(0)} s: ${r.shots.filter((s) => s.ok).length} shots, ${r.shots.filter((s) => !s.ok).length} failed, ${issues} issue hits → ${join(opts.out, lang, 'report.md')}`);
    }
  } catch (e) {
    console.error(e);
    exit = 1;
  } finally {
    await browser?.close().catch(() => {});
    server.close();
    server.closeAllConnections?.();
  }
  process.exit(exit);
}
// Importable (e.g. to unit-test domChecks); runs only when executed directly.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await main();
