// Film Camela icons. Source art: public/icons/icon.svg (+ icon-mono.svg for Android themed icons).
// icon.svg has two groups — #bg (background, clipped to a rounded square) and #mark (camera) — and every
// platform variant is derived from it here, so edit the SVG and re-run `node scripts/gen-icons.mjs`.
//
//   rounded    icon.svg as-is (transparent corners)        → favicon, PWA "any", legacy Android launcher
//   full       corner clip removed, opaque square          → iOS 1024, apple-touch, PWA maskable, store
//   fg / bg    108dp adaptive layers (512 art = centre 72dp) → Android adaptive foreground / background
//   mono       icon-mono.svg, same 108dp canvas            → Android 13+ themed icon
//
// The mark is drawn inside a 0.39 radius circle of the 512 artboard, so it already sits in the PWA maskable
// safe zone and, scaled to the centre 72dp, inside Android's 66dp adaptive safe zone — no extra padding needed.
import { chromium } from 'playwright';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const svg = readFileSync(`${root}public/icons/icon.svg`, 'utf8');
const monoSrc = readFileSync(`${root}public/icons/icon-mono.svg`, 'utf8');
const ADAPTIVE_VIEWBOX = 'viewBox="-128 -128 768 768"'; // 512 × 108/72 = 768
const art = {
  rounded: svg,
  full: svg.replace(' clip-path="url(#r)"', ''),
  fg: svg.replace(/<g id="bg"[\s\S]*?\n  <\/g>/, '').replace('viewBox="0 0 512 512"', ADAPTIVE_VIEWBOX),
  bg: svg
    .replace(' clip-path="url(#r)"', '')
    .replace(/<g id="mark"[\s\S]*?\n  <\/g>/, '')
    .replace('viewBox="0 0 512 512"', `${ADAPTIVE_VIEWBOX} preserveAspectRatio="xMidYMid slice"`),
  mono: monoSrc,
};
for (const [k, v] of Object.entries(art)) if (!v.includes('<svg ')) throw new Error(`bad svg variant ${k}`);

const browser = await chromium.launch();
const page = await browser.newPage();
// transparent=true keeps alpha (PNG RGBA); otherwise the page is painted near-black and the PNG is opaque RGB.
async function render(file, size, variant, { transparent = false, round = false } = {}) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:${transparent ? 'transparent' : '#0e0d0c'};width:${size}px;height:${size}px">` +
      `<div style="width:${size}px;height:${size}px;${round ? 'border-radius:50%;overflow:hidden' : ''}">` +
      `${art[variant].replace('<svg ', `<svg width="${size}" height="${size}" style="display:block" `)}</div></body></html>`,
  );
  await page.screenshot({ path: file, omitBackground: transparent });
}

// PWA / web
const icons = `${root}public/icons`;
await render(`${icons}/icon-192.png`, 192, 'rounded', { transparent: true });
await render(`${icons}/icon-512.png`, 512, 'rounded', { transparent: true });
await render(`${icons}/apple-touch-icon.png`, 180, 'full');
await render(`${icons}/maskable-512.png`, 512, 'full');
await render(`${icons}/store-1024.png`, 1024, 'full');

// Open Graph card
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(
  `<html><body style="margin:0;width:1200px;height:630px;background:radial-gradient(circle at 30% 40%,#2b1a10,#0e0d0c 70%);display:flex;align-items:center;gap:64px;padding:0 90px;box-sizing:border-box;font-family:system-ui">` +
    `<div style="width:300px;height:300px;flex:none">${svg.replace('<svg ', '<svg width="300" height="300" ')}</div>` +
    `<div><div style="font:800 76px ui-monospace,Consolas,monospace;letter-spacing:.12em;white-space:nowrap"><span style="color:#f3efe8">FILM</span> <span style="color:#ff8a2b">CAMELA</span></div>` +
    `<div style="color:#b8b0a5;font-size:38px;margin-top:18px;line-height:1.3">Shoot like film.<br/>Develop like a darkroom.</div></div></body></html>`,
);
await page.screenshot({ path: `${icons}/og.png` });
console.log('icons generated');

// Native app icons (run after `npx cap add ios|android`).
if (existsSync(`${root}ios/App/App/Assets.xcassets/AppIcon.appiconset`)) {
  // App Store icon: square, opaque (no alpha channel), iOS applies its own corner mask.
  await render(`${root}ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`, 1024, 'full');
}
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
if (existsSync(`${root}android/app/src/main/res`)) {
  for (const [d, k] of Object.entries(dens)) {
    const dir = `${root}android/app/src/main/res/mipmap-${d}`;
    const legacy = Math.round(48 * k);
    const layer = Math.round(108 * k);
    await render(`${dir}/ic_launcher.png`, legacy, 'rounded', { transparent: true }); // API < 26
    await render(`${dir}/ic_launcher_round.png`, legacy, 'full', { transparent: true, round: true });
    await render(`${dir}/ic_launcher_foreground.png`, layer, 'fg', { transparent: true });
    await render(`${dir}/ic_launcher_background.png`, layer, 'bg');
    await render(`${dir}/ic_launcher_monochrome.png`, layer, 'mono', { transparent: true });
  }
}
await browser.close();
console.log('native icons generated');
