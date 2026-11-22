import { defineConfig } from '@playwright/test';

// Real screen recordings for the promo video (scripts/promo-video/README.md).
// SCENE=<portrait .y4m> OUT=<folder> [PORT=4791] npx playwright test -c scripts/promo-video/promo.config.ts
const scene = process.env.SCENE;
if (!scene) throw new Error('SCENE=<path to portrait .y4m> is required');
const port = Number(process.env.PORT ?? 4791);
const cam = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${scene}`, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export default defineConfig({
  testDir: '.',
  testMatch: /record\.spec\.ts/,
  timeout: 600_000,
  workers: 2,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${port}/` },
  projects: [
    ['ko', 'ko-KR'],
    ['en', 'en-US'],
  ].map(([name, locale]) => ({
    name,
    use: {
      browserName: 'chromium' as const,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
      viewport: { width: 390, height: 760 },
      locale,
      permissions: ['camera'],
      launchOptions: { args: cam },
    },
  })),
  webServer: { command: `npx vite preview --port ${port} --strictPort`, url: `http://localhost:${port}/`, reuseExistingServer: true, timeout: 30_000, cwd: '../..' },
});
