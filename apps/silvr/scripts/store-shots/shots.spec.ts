import { expect, test, type Browser, type Page } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { start } from '../../e2e/helpers';

// The store screenshots of docs/03b_STORE_LISTING_FILM_CAMELA.md / 03c (captions: frame.mjs).
// Scenes: camera (viewfinder), cameras (picker · pins), lab (speed sheet), roll (developed),
// darkroom, contact (sheet), my (MY tab, once it exists), analog (meter / log), privacy (backup).
// store-shots.data.json "frames" / "framesWithMy" decide which scenes are kept and their order;
// files are OUT/<platform>/<locale>/raw/<n>-<scene>.png. MY=1 forces the MY frame, MY=0 skips it.
// The fake camera loops four scene photos (2 s each); shoot() waits for a fresh scene before
// each frame, so the roll cycles through all four photos instead of repeating a few.
const data = JSON.parse(readFileSync(new URL('./store-shots.data.json', import.meta.url), 'utf8')) as { frames: string[]; framesWithMy: string[]; platforms: Record<string, { store: string }> };

test('store screenshots', async ({ page, browser }, info) => {
  const { platform, locale } = info.project.metadata as { platform: string; locale: string };
  const dir = join(process.env.OUT ?? 'store-shots', platform, locale, 'raw');
  mkdirSync(dir, { recursive: true });
  const tid = (id: string) => page.getByTestId(id);
  let frames = data.frames;
  const snap = async (sceneId: string) => {
    const n = frames.indexOf(sceneId);
    if (n < 0) return;
    await settle(page);
    await page.screenshot({ path: join(dir, `${n + 1}-${sceneId}.png`) });
  };
  /** 8×8 colour signature of the live camera frame (which scene photo is showing). */
  // The camera <video> is never in the DOM: remember every element a stream is attached to.
  await page.addInitScript(() => {
    const d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'srcObject')!;
    Object.defineProperty(HTMLMediaElement.prototype, 'srcObject', {
      configurable: true,
      get() {
        return d.get!.call(this);
      },
      set(v) {
        const w = window as unknown as { __vids?: HTMLMediaElement[] };
        (w.__vids ??= []).push(this);
        d.set!.call(this, v);
      },
    });
  });
  const scene = () =>
    page.evaluate(() => {
      const vids = ((window as unknown as { __vids?: HTMLVideoElement[] }).__vids ?? []).filter((x) => x.videoWidth > 0);
      const v = vids[vids.length - 1];
      if (!v || !v.videoWidth) return [] as number[];
      const c = document.createElement('canvas');
      c.width = c.height = 8;
      const g = c.getContext('2d')!;
      g.drawImage(v, 0, 0, 8, 8);
      return Array.from(g.getImageData(0, 0, 8, 8).data);
    });
  const same = (a: number[], b: number[]) => a.length === b.length && a.length > 0 && a.reduce((d, x, i) => d + Math.abs(x - b[i]), 0) / a.length < 12;
  // Before each frame, wait (up to 10 s) for the cut to a scene that is not among the last
  // `fresh` frames and shoot right after the cut, so the capture never straddles the next cut.
  // A roll then cycles through all four scene photos instead of repeating a few.
  const shoot = async (n: number, fresh = 1) => {
    const last: number[][] = [];
    for (let i = 0; i < n; i++) {
      const until = Date.now() + 10_000;
      let prev = await scene();
      let cur = prev;
      while (Date.now() < until) {
        await page.waitForTimeout(100);
        cur = await scene();
        const cut = !same(prev, cur);
        prev = cur;
        if (cut && !last.slice(-fresh).some((p) => same(p, cur))) break;
      }
      await page.waitForTimeout(200);
      last.push(await scene());
      const before = await tid('counter').textContent();
      // A press can be swallowed while the previous frame is still being saved: retry twice.
      for (let attempt = 0; ; attempt++) {
        await tid('shutter').click();
        try {
          await expect(tid('counter')).not.toHaveText(before ?? '', { timeout: 6000 });
          break;
        } catch (e) {
          if (attempt >= 2) throw e;
        }
      }
    }
  };
  /** Waits for the next scene cut, so a screenshot shows one whole scene photo. */
  const afterCut = async () => {
    const until = Date.now() + 3000;
    let prev = await scene();
    while (Date.now() < until) {
      await page.waitForTimeout(80);
      const cur = await scene();
      if (!same(prev, cur)) break;
      prev = cur;
    }
    await page.waitForTimeout(150);
  };
  const closeToasts = async () => {
    for (const c of await tid('toast-close').all()) await c.click().catch(() => undefined);
    await expect(tid('toast')).toHaveCount(0, { timeout: 6000 }).catch(() => undefined);
  };
  const rewind = async () => {
    await tid('roll-btn').click();
    await tid('btn-rewind').click();
    const ok = tid('confirm-ok');
    await expect(ok.or(tid('speed-sheet'))).toBeVisible();
    if (await ok.isVisible()) await ok.click();
    await expect(tid('speed-sheet')).toBeVisible();
  };

  // App Store sets simulate the iOS app (App Store wording in the Pro card), Play sets Android.
  const os = data.platforms[platform].store === 'appstore' ? 'ios' : 'android';
  // ONLY=my re-takes just the MY frame (it needs MY_DEV).
  if (process.env.ONLY === 'my') {
    frames = data.framesWithMy;
    const p = await myContextPage(browser, info.project.use, process.env.MY_DEV ?? '', os);
    await p.getByTestId('tab-settings').click();
    await p.getByTestId('my-section').waitFor();
    await p.waitForTimeout(800);
    await settle(p);
    await p.screenshot({ path: join(dir, `${frames.indexOf('my') + 1}-my.png`) });
    await p.context().close();
    return;
  }
  await start(page);
  const hasMy = process.env.MY ? process.env.MY === '1' : (await tid('tab-my').count()) > 0;
  if (hasMy) frames = data.framesWithMy;
  // Pin two favourites: they jump to the front of the picker.
  await tid('pin-fish180').click();
  await tid('pin-instasq').click();
  await closeToasts();

  // 1. a fun body: Fish 180's round viewfinder, a few frames in.
  await tid('camera-fish180').click();
  await tid('btn-load').click();
  await expect(tid('shutter')).toBeEnabled();
  await shoot(5);
  await closeToasts();
  await page.waitForTimeout(1200);
  await afterCut();
  await snap('camera');
  await shoot(3);

  // 3. lab speed sheet with arrival times
  await rewind();
  await expect(tid('speed-at-3d')).toBeVisible();
  await afterCut();
  await snap('lab');
  await tid('speed-morning').click();
  await expect(tid('lab-item')).toHaveCount(1);

  // 2. camera picker: pinned bodies first, "All cameras (22)"
  await tid('tab-camera').click();
  await expect(tid('load-panel')).toBeVisible();
  await tid('camera-pro35').click();
  await tid('stock-muse400').first().click();
  await page.locator('.camera-strip').evaluate((el) => (el.scrollLeft = 0));
  await closeToasts();
  await snap('cameras');

  // 4. a developed roll (Pro 35 · Muse 400, instant)
  // Tablets show 5–6 thumbnails per row: a longer roll so the album is not mostly empty.
  const tablet = (info.project.use.viewport?.width ?? 0) >= 600;
  const frameCount = tablet ? 24 : 12;
  await tid('load-row').getByRole('radio').nth(tablet ? 0 : 1).click(); // Pro 35: 36 · 24 · 12 (labels are localized)
  await tid('btn-load').click();
  await expect(tid('shutter')).toBeEnabled();
  await shoot(frameCount, 3); // every frame a different scene from the previous three
  await rewind();
  await tid('speed-instant').click();
  await expect(tid('roll-screen')).toBeVisible();
  // At least frameCount (a retried shutter press can add one frame); all thumbnails developed.
  await expect.poll(() => page.locator('[data-testid=thumb] img').count(), { timeout: 120_000 }).toBeGreaterThanOrEqual(frameCount);
  await expect.poll(async () => (await page.locator('[data-testid=thumb] img').count()) === (await tid('thumb').count()), { timeout: 60_000 }).toBe(true);
  await closeToasts();
  await snap('roll');

  // 6. contact sheet
  await tid('btn-contact').click();
  await expect(tid('contact-sheet').locator('img')).toBeVisible({ timeout: 60_000 });
  await snap('contact');
  await page.keyboard.press('Escape');
  await expect(tid('contact-sheet')).toBeHidden();

  // 5. darkroom: same frame re-developed on Expired '98 with a light leak
  await tid('thumb').nth(Number(process.env.DR_FRAME ?? 1)).click();
  await expect(tid('print')).toBeVisible();
  await tid('btn-darkroom').click();
  await expect(tid('dr-canvas')).toBeVisible();
  await tid('darkroom-screen').getByTestId('stock-expired98').click();
  // Light leak on.
  const leak = tid('tg-leak');
  // A DOM click: on small screens the sticky preview sits over the row, which is fine here.
  if (!(await leak.isChecked())) await leak.evaluate((el: HTMLInputElement) => el.click());
  await expect(leak).toBeChecked();
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (el.scrollTop) el.scrollTop = 0;
    });
  });
  await page.waitForTimeout(1500);
  await snap('darkroom');

  // 7. analog: Sunny 16 meter and a film log (leaving the darkroom asks to discard the edit)
  await tid('tab-analog').click();
  await expect(tid('confirm-ok').or(tid('analog-screen'))).toBeVisible();
  if (await tid('confirm-ok').isVisible()) await tid('confirm-ok').click();
  await page.waitForTimeout(500);
  if (!(await tid('analog-screen').isVisible())) await tid('tab-analog').click();
  await tid('btn-new-log').click();
  await tid('log-camera').fill('Nikon FM2');
  await tid('log-film').fill('Portra 400');
  await tid('log-create').click();
  await expect(tid('log-screen')).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await tid('btn-add-frame').click();
    await tid('frame-save').click();
  }
  await tid('tab-analog').click();
  await expect(tid('analog-screen')).toBeVisible();
  await tid('meter-light').selectOption('sunny');
  await tid('iso-200').click();
  await tid('ap-11').click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await snap('analog');

  // MY tab: today's shots card, the "watch an ad" card and the Pro card. Those cards only render in
  // the native apps, so with MY_DEV (the Vite dev server, started by run.mjs) the frame is taken in a
  // fresh context that simulates the Android shell (fake Capacitor global, as the MY-tab agent did)
  // with a realistic quota; App Store sets simulate iOS. Without MY_DEV it is the web build's MY top.
  if (hasMy) {
    const myDev = process.env.MY_DEV;
    const p = myDev ? await myContextPage(browser, info.project.use, myDev, os) : page;
    await p.getByTestId('tab-settings').click();
    await p.getByTestId('my-section').waitFor();
    await p.evaluate(() => {
      window.scrollTo(0, 0);
      document.querySelectorAll<HTMLElement>('*').forEach((el) => {
        if (el.scrollTop) el.scrollTop = 0;
      });
    });
    await p.waitForTimeout(800);
    await settle(p);
    const n = frames.indexOf('my');
    await p.screenshot({ path: join(dir, `${n + 1}-my.png`) });
    if (p !== page) await p.context().close();
  }

  // 8. settings: photos stay on this device (backup card)
  await ((await tid('tab-settings').count()) ? tid('tab-settings') : tid('tab-my')).click();
  await expect(tid('btn-backup')).toBeAttached();
  // Backup card ("photos and records stay on this device") just under the sticky title.
  await tid('btn-backup').evaluate((el) => {
    const card = (el.closest('section') ?? el) as HTMLElement;
    card.scrollIntoView({ block: 'start' });
    const h1 = document.querySelector('h1');
    const head = h1?.parentElement?.getBoundingClientRect().bottom ?? 0;
    const delta = card.getBoundingClientRect().top - (head + 12);
    let box: HTMLElement | null = card.parentElement;
    while (box && !(box.scrollHeight > box.clientHeight && /auto|scroll/.test(getComputedStyle(box).overflowY))) box = box.parentElement;
    if (box) box.scrollTop += delta;
    else window.scrollBy(0, delta);
  });
  await snap('privacy');
});

/** A page on the dev server that looks like the Android / iOS app on day one: 7 of 10 free shots left. */
async function myContextPage(browser: Browser, use: Record<string, unknown>, url: string, os: 'android' | 'ios') {
  const { viewport, deviceScaleFactor, isMobile, hasTouch, locale } = use as { viewport: { width: number; height: number }; deviceScaleFactor: number; isMobile: boolean; hasTouch: boolean; locale: string };
  const ctx = await browser.newContext({ viewport, deviceScaleFactor, isMobile, hasTouch, locale, serviceWorkers: 'block' });
  await ctx.addInitScript((os) => {
    const w = window as unknown as Record<string, unknown>;
    if (os === 'ios') w.webkit = { messageHandlers: { bridge: { postMessage: () => undefined } } };
    else w.androidBridge = { postMessage: () => undefined };
    w.Capacitor = { isNativePlatform: () => true, getPlatform: () => os };
  }, os);
  const p = await ctx.newPage();
  await p.goto(url, { timeout: 120_000 });
  await p.getByTestId('onb-skip').click({ timeout: 60_000 });
  await p.evaluate(async () => {
    // Store reachable and the three products loaded, as in the store builds: no "can't reach the
    // store" note and an enabled "Get Pro". The rows show the app's own US$ list prices
    // (src/monetize/config.ts); the product price strings below are not displayed.
    const b = await import(/* @vite-ignore */ '/src/monetize/billing.ts');
    b.canBuy.value = true;
    const plan = (id: string, kind: string, subscription: boolean, usd: number) => ({ id, kind, subscription, price: `US$${usd}`, priceAmount: usd, currency: 'USD', title: '', description: '' });
    b.products.value = [plan('filmcamela_pro_week', 'week', true, 4.99), plan('filmcamela_pro_3month', '3month', true, 9.99), plan('filmcamela_pro_lifetime', 'lifetime', false, 19.99)];
    await new Promise<void>((resolve, reject) => {
      const open = indexedDB.open('silvr');
      open.onerror = () => reject(open.error);
      open.onsuccess = () => {
        const d = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const dayKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        const tx = open.result.transaction('kv', 'readwrite');
        tx.objectStore('kv').put({ v: 1, dayKey, freeUsedToday: 3, earnedBalance: 10, adsWatchedToday: 1 }, 'quota');
        tx.oncomplete = () => {
          open.result.close();
          new BroadcastChannel('silvr-quota').postMessage('quota');
          resolve();
        };
      };
    });
  });
  await p.waitForTimeout(500);
  return p;
}

/** Waits for animations, fonts and pending images so nothing is caught mid-transition. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getComputedTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined)));
    await Promise.all(Array.from(document.images).filter((i) => !i.complete).map((i) => new Promise((r) => (i.onload = i.onerror = r))));
  });
  await page.waitForTimeout(400);
}
