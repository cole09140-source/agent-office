// Film Camela icons now come from the owner's logo (design/brand/logo-source.webp) via scripts/gen-brand-icons.py
// (Pillow + numpy). This wrapper keeps `npm run icons` working: it regenerates the masters in design/brand/,
// PWA/web icons, iOS AppIcon, Android launcher icons (legacy, round, adaptive fg/bg, monochrome) and store icons.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./gen-brand-icons.py', import.meta.url));
const mode = process.argv[2] ?? 'icons';
for (const py of process.platform === 'win32' ? ['python', 'py'] : ['python3', 'python']) {
  const r = spawnSync(py, [script, mode], { stdio: 'inherit' });
  if (!r.error) process.exit(r.status ?? 1);
}
console.error('gen-icons: Python 3 with Pillow + numpy is required (pip install pillow numpy).');
process.exit(1);
