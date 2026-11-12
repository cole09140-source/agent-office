import { expect, test } from '@playwright/test';
import { loadCamera, start } from './helpers';

// One tap must be one frame, even when it lands while the camera is still starting
// (the press is queued until the preview is live, and must not also fire on its own).
for (const id of ['ccd03', 'pixel', 'kidcam', 'instasq']) {
  test(`one shutter press makes exactly one frame: ${id}`, async ({ page }) => {
    await start(page);
    await loadCamera(page, id);
    await page.getByTestId('shutter').click();
    await expect(page.getByTestId('shutter')).toHaveAttribute('data-state', 'ready', { timeout: 15_000 });
    await page.waitForTimeout(2500);
    await expect(page.getByTestId('counter')).toContainText(/(^|\D)0?1(\D|$)/);
  });
}
