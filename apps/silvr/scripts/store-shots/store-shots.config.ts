import { defineConfig } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Store screenshots for every platform × locale in store-shots.data.json.
// One command for everything (build, capture, frames, feature graphics): node scripts/store-shots/run.mjs
// Direct use: SCENE=<portrait .y4m> OUT=<folder> [DIST=<build>] [PORT=4173] [PLATFORMS=a,b] [LOCALES=x,y]
//   npx playwright test -c scripts/store-shots/store-shots.config.ts
// Raw shots land in OUT/<platform>/<locale>/raw/<n>-<scene>.png.
const scene = process.env.SCENE;
if (!scene) throw new Error('SCENE=<path to portrait .y4m> is required');
const port = Number(process.env.PORT ?? 4173);
const dist = process.env.DIST;
const data = JSON.parse(readFileSync(new URL('./store-shots.data.json', import.meta.url), 'utf8')) as {
  platforms: Record<string, { viewport: [number, number]; scale: number }>;
  locales: Record<string, { browser: string }>;
};
const pick = (all: string[], env?: string) => (env ? env.split(',').map((s) => s.trim()).filter((s) => all.includes(s)) : all);
const platforms = pick(Object.keys(data.platforms), process.env.PLATFORMS);
const locales = pick(Object.keys(data.locales), process.env.LOCALES);

const cam = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${scene}`, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export default defineConfig({
  testDir: '.',
  testMatch: /shots\.spec\.ts/,
  timeout: 600_000,
  workers: Number(process.env.WORKERS ?? 1),
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${port}/` },
  projects: platforms.flatMap((p) =>
    locales.map((l) => {
      const { viewport, scale } = data.platforms[p];
      return {
        name: `${p}--${l}`,
        metadata: { platform: p, locale: l },
        use: {
          browserName: 'chromium' as const,
          isMobile: true,
          hasTouch: true,
          deviceScaleFactor: scale,
          viewport: { width: viewport[0], height: viewport[1] },
          locale: data.locales[l].browser,
          permissions: ['camera'],
          launchOptions: { args: cam },
        },
      };
    }),
  ),
  webServer: { command: `npx vite preview --port ${port} --strictPort${dist ? ` --outDir "${dist}"` : ''}`, url: `http://localhost:${port}/`, reuseExistingServer: true, timeout: 30_000, cwd: '../..' },
});
