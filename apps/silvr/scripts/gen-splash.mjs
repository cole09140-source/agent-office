// Replaces Capacitor's default splash images with the Film Camela brand (keeps each file's size).
// Uses the camera mark from public/icons/icon.svg (background layer dropped) over the app's near-black.
import { chromium } from 'playwright';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const svg = readFileSync(`${root}public/icons/icon.svg`, 'utf8');
// Mark only, cropped to its bounds (the 512 artboard's mark spans roughly x 83–429, y 139–390).
const mark = svg.replace(/<g id="bg"[\s\S]*?\n  <\/g>/, '').replace('viewBox="0 0 512 512"', 'viewBox="76 128 360 268"');
const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/splash.*\.png$/i.test(f)) files.push(p);
  }
};
for (const d of ['ios/App/App/Assets.xcassets', 'android/app/src/main/res']) {
  try { walk(join(root, d)); } catch { /* platform not added */ }
}
const browser = await chromium.launch();
const page = await browser.newPage();
for (const f of files) {
  const dims = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  }, `data:image/png;base64,${readFileSync(f).toString('base64')}`);
  const [w, h] = dims;
  const mw = Math.round(Math.min(w, h) * 0.3); // mark width
  const mh = Math.round((mw * 268) / 360);
  const fs = Math.round(mw * 0.15);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<html><body style="margin:0;width:${w}px;height:${h}px;background:radial-gradient(circle at 50% 46%,#24170e,#0e0d0c ${Math.round(Math.min(w, h) * 0.45)}px);display:grid;place-items:center">` +
      `<div style="display:flex;flex-direction:column;align-items:center;gap:${Math.round(mw * 0.16)}px">` +
      `<div style="width:${mw}px;height:${mh}px">${mark.replace('<svg ', `<svg width="${mw}" height="${mh}" style="display:block" `)}</div>` +
      `<div style="font:800 ${fs}px ui-monospace,Consolas,monospace;letter-spacing:.16em;padding-left:.16em;white-space:nowrap">` +
      `<span style="color:#f3efe8">FILM</span> <span style="color:#ff8a2b">CAMELA</span></div></div></body></html>`,
  );
  await page.screenshot({ path: f });
}
await browser.close();
console.log(`splash images: ${files.length}`);
