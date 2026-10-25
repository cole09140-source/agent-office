// Replaces Capacitor's default splash images with the SILVR brand (keeps each file's size).
import { chromium } from 'playwright';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const svg = readFileSync(`${root}public/icons/icon.svg`, 'utf8');
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
  const icon = Math.round(Math.min(w, h) * 0.28);
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<html><body style="margin:0;width:${w}px;height:${h}px;background:#0e0d0c;display:grid;place-items:center">` +
      `<div style="display:flex;flex-direction:column;align-items:center;gap:${Math.round(icon * 0.18)}px">` +
      `<div style="width:${icon}px;height:${icon}px">${svg.replace('<svg ', `<svg width="${icon}" height="${icon}" `)}</div>` +
      `<div style="font:800 ${Math.round(icon * 0.22)}px ui-monospace,monospace;letter-spacing:.3em;color:#ff8a2b;padding-left:.3em">SILVR</div></div></body></html>`,
  );
  await page.screenshot({ path: f });
}
await browser.close();
console.log(`splash images: ${files.length}`);
