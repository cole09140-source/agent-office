import { defineConfig } from '@playwright/test';

// Store screenshots. Env: SCENE (portrait .y4m from make-scene.mjs), OUT (output folder).
// npx playwright test -c scripts/store-shots/store-shots.config.ts
const scene = process.env.SCENE;
if (!scene) throw new Error('SCENE=<path to portrait .y4m> is required');

const cam = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${scene}`, '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const phone = { browserName: 'chromium' as const, isMobile: true, hasTouch: true, deviceScaleFactor: 3, permissions: ['camera'], launchOptions: { args: cam } };

export default defineConfig({
  testDir: '.',
  testMatch: /shots\.spec\.ts/,
  timeout: 300_000,
  workers: 1,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173/' },
  projects: [
    // App Store 6.7" (1290×2796) and Google Play phone (1080×1920, ≤ 2:1)
    { name: 'ios67-ko', use: { ...phone, viewport: { width: 430, height: 932 }, locale: 'ko-KR' } },
    { name: 'ios67-en', use: { ...phone, viewport: { width: 430, height: 932 }, locale: 'en-US' } },
    { name: 'android-ko', use: { ...phone, viewport: { width: 360, height: 640 }, locale: 'ko-KR' } },
    { name: 'android-en', use: { ...phone, viewport: { width: 360, height: 640 }, locale: 'en-US' } },
  ],
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173/', reuseExistingServer: true, timeout: 30_000, cwd: '../..' },
});
