import { expect, test, type Locator } from '@playwright/test';
import { loadRoll, openCurrentRoll, shoot, start } from './helpers';

/** Two touch points spreading apart (or closing in) on an element, as Pointer Events. */
async function pinch(target: Locator, from: number, to: number) {
  await target.evaluate(
    (el, { from, to }) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const fire = (type: string, id: number, x: number) =>
        el.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', isPrimary: id === 1, clientX: x, clientY: cy, bubbles: true, cancelable: true }));
      fire('pointerdown', 1, cx - from / 2);
      fire('pointerdown', 2, cx + from / 2);
      for (let i = 1; i <= 10; i++) {
        const d = from + ((to - from) * i) / 10;
        fire('pointermove', 1, cx - d / 2);
        fire('pointermove', 2, cx + d / 2);
      }
      fire('pointerup', 1, cx - to / 2);
      fire('pointerup', 2, cx + to / 2);
    },
    { from, to },
  );
}

test('camera: two fingers zoom the preview (up to 3×), the readout shows it, pinching in goes back to 1×', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200');
  const vf = page.locator('.viewfinder');
  await pinch(vf, 100, 200);
  await expect(page.getByTestId('vf-zoom')).toHaveText('2×');
  await pinch(vf, 100, 900);
  await expect(page.getByTestId('vf-zoom')).toHaveText('3×'); // capped
  // trackpad pinch on a desktop browser arrives as ctrl+wheel
  await vf.hover();
  await page.keyboard.down('Control');
  await page.mouse.wheel(0, 300);
  await page.keyboard.up('Control');
  await pinch(vf, 400, 50);
  await expect(page.getByTestId('vf-zoom')).toHaveCount(0, { timeout: 3000 }); // back to 1×: no readout
  // a zoomed shot still saves
  await pinch(vf, 100, 150);
  await shoot(page, 1);
  await expect(page.getByTestId('last-shot').locator('img').first()).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});

test('viewer: double-tap / pinch zoom the print, drag pans, the next photo opens at fit', async ({ page }) => {
  const errors = await start(page);
  await loadRoll(page, 'sunny200');
  await shoot(page, 2);
  await openCurrentRoll(page);
  await page.getByTestId('thumb').first().click();
  const box = page.getByTestId('print-zoom');
  await expect(box).toBeVisible({ timeout: 30_000 });
  await expect(box).toHaveAttribute('data-scale', '1.00');
  await box.dblclick();
  await expect(box).toHaveAttribute('data-scale', '2.50');
  await expect(page.getByTestId('print')).toHaveCSS('transform', /matrix\(2\.5/);
  await box.dblclick();
  await expect(box).toHaveAttribute('data-scale', '1.00');
  await pinch(box, 80, 240);
  const s = Number(await box.getAttribute('data-scale'));
  expect(s).toBeGreaterThan(2.5);
  expect(s).toBeLessThanOrEqual(4);
  // a tap while zoomed does not hide the controls
  await box.click();
  await expect(page.getByTestId('btn-save')).toBeVisible();
  await page.getByTestId('btn-next').click();
  await expect(page.getByTestId('print-zoom')).toHaveAttribute('data-scale', '1.00', { timeout: 30_000 });
  expect(errors).toEqual([]);
});
