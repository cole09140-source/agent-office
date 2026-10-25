// Renders public/icons/icon.svg to the PNG sizes the PWA manifest and stores need.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const svg = readFileSync(`${root}public/icons/icon.svg`, 'utf8');
const targets = [
  { file: 'icon-192.png', size: 192, pad: 0 },
  { file: 'icon-512.png', size: 512, pad: 0 },
  { file: 'apple-touch-icon.png', size: 180, pad: 0 },
  { file: 'maskable-512.png', size: 512, pad: 0.12 },
  { file: 'store-1024.png', size: 1024, pad: 0 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const t of targets) {
  const inner = Math.round(t.size * (1 - t.pad * 2));
  await page.setViewportSize({ width: t.size, height: t.size });
  await page.setContent(
    `<html><body style="margin:0;background:#0e0d0c;display:grid;place-items:center;width:${t.size}px;height:${t.size}px">` +
      `<div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  );
  await page.screenshot({ path: `${root}public/icons/${t.file}`, omitBackground: false });
}
// Open Graph card
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(
  `<html><body style="margin:0;width:1200px;height:630px;background:radial-gradient(circle at 30% 40%,#2b1a10,#0e0d0c 70%);display:flex;align-items:center;gap:60px;padding:0 90px;box-sizing:border-box;font-family:system-ui">` +
    `<div style="width:300px;height:300px">${svg.replace('<svg ', '<svg width="300" height="300" ')}</div>` +
    `<div><div style="font:800 96px ui-monospace,monospace;letter-spacing:.3em;color:#ff8a2b">SILVR</div>` +
    `<div style="color:#f3efe8;font-size:40px;margin-top:12px">Shoot like film.<br/>Develop like a darkroom.</div></div></body></html>`,
);
await page.screenshot({ path: `${root}public/icons/og.png` });
await browser.close();
console.log('icons generated');

// Native app icons (run after `npx cap add ios|android`).
import { existsSync } from 'node:fs';
const b2 = await chromium.launch();
const p2 = await b2.newPage();
async function render(file, size, pad = 0, round = false, transparent = false) {
  const inner = Math.round(size * (1 - pad * 2));
  await p2.setViewportSize({ width: size, height: size });
  await p2.setContent(
    `<html><body style="margin:0;background:${transparent ? 'transparent' : '#0e0d0c'};display:grid;place-items:center;width:${size}px;height:${size}px">` +
      `<div style="width:${inner}px;height:${inner}px;${round ? 'border-radius:50%;overflow:hidden' : ''}">${svg.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`,
  );
  await p2.screenshot({ path: file, omitBackground: transparent });
}
if (existsSync(`${root}ios/App/App/Assets.xcassets/AppIcon.appiconset`)) {
  await render(`${root}ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`, 1024);
}
const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
if (existsSync(`${root}android/app/src/main/res`)) {
  for (const [d, k] of Object.entries(dens)) {
    const dir = `${root}android/app/src/main/res/mipmap-${d}`;
    await render(`${dir}/ic_launcher.png`, Math.round(48 * k));
    await render(`${dir}/ic_launcher_round.png`, Math.round(48 * k), 0, true, true);
    await render(`${dir}/ic_launcher_foreground.png`, Math.round(108 * k), 0.17, false, true);
  }
}
await b2.close();
console.log('native icons generated');
