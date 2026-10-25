import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'node:url';
// @ts-expect-error plain ESM helper
import { makeScene } from './e2e/make-scene.mjs';

const scene = makeScene(fileURLToPath(new URL('./e2e/.cache/scene.y4m', import.meta.url)));
const portraitScene = makeScene(fileURLToPath(new URL('./e2e/.cache/scene-portrait.y4m', import.meta.url)), 720, 1280);
const fakeCam = (file: string) => [
  '--use-fake-ui-for-media-stream',
  '--use-fake-device-for-media-stream',
  `--use-file-for-fake-video-capture=${file}`,
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

export default defineConfig({
  testDir: './e2e',
  timeout: 150_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    permissions: ['camera'],
  },
  projects: [
    { name: 'mobile', testIgnore: /portrait/, use: { ...devices['Pixel 7'], browserName: 'chromium', launchOptions: { args: fakeCam(scene) } } },
    { name: 'portrait-phone', testMatch: /portrait/, use: { ...devices['Pixel 7'], browserName: 'chromium', launchOptions: { args: fakeCam(portraitScene) } } },
  ],
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
