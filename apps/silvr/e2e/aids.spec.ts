import { expect, test } from '@playwright/test';
import { closeSheet, loadRoll, openSetting, openTab, start } from './helpers';

test('volume keys take a photo on the camera screen', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200');
  const before = await page.getByTestId('counter').textContent();
  await page.keyboard.press('AudioVolumeDown');
  await expect(page.getByTestId('counter')).not.toHaveText(before ?? '', { timeout: 15_000 });
  const mid = await page.getByTestId('counter').textContent();
  await page.waitForTimeout(2500);
  await page.keyboard.press('AudioVolumeUp');
  await expect(page.getByTestId('counter')).not.toHaveText(mid ?? '', { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('optional aids are off by default; the level and tap-to-focus work once switched on', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200');
  const vf = page.locator('.viewfinder');
  await vf.click({ position: { x: 80, y: 60 } });
  await expect(page.getByTestId('focus-ring')).toHaveCount(0);
  await expect(page.getByTestId('horizon')).toHaveCount(0);

  await openSetting(page, 'shoot');
  await page.getByTestId('set-level').check({ force: true });
  await page.getByTestId('set-tap-focus').check({ force: true });
  await closeSheet(page);
  await openTab(page, 'camera');

  // gravity for a level phone on this screen, then 8° off
  // the camera restarts after the settings sheet: keep the sensor "ticking" like a real phone does
  const motion = (deg: number) =>
    page.evaluate((deg) => {
      clearInterval((window as unknown as { __m?: number }).__m);
      const a = ((screen.orientation?.angle ?? 0) * Math.PI) / 180;
      const t = (deg * Math.PI) / 180;
      // up in screen axes (sin t, cos t) back to device axes
      const sx = Math.sin(t) * 9.8;
      const sy = Math.cos(t) * 9.8;
      const x = sx * Math.cos(a) + sy * Math.sin(a);
      const y = -sx * Math.sin(a) + sy * Math.cos(a);
      const fire = () => window.dispatchEvent(new DeviceMotionEvent('devicemotion', { accelerationIncludingGravity: { x, y, z: 0 } }));
      fire();
      (window as unknown as { __m?: number }).__m = window.setInterval(fire, 100);
    }, deg);
  await motion(0);
  const level = page.getByTestId('horizon');
  await expect(level).toBeVisible();
  await expect(level).toHaveClass(/ok/);
  await motion(8);
  await expect(level).toHaveAttribute('data-tilt', /^8\./);
  await expect(level).not.toHaveClass(/ok/);

  await vf.click({ position: { x: 80, y: 60 } });
  await expect(page.getByTestId('focus-ring')).toBeVisible();
  await expect(page.getByTestId('focus-ring')).toContainText('EV');
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT });
  expect(errors).toEqual([]);
});
