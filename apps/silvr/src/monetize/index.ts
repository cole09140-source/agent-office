/**
 * Film Camela monetisation engine — the one import for UI code (MY tab, paywall, camera).
 *
 *   quota          signal {freeLeft, earned, adsLeftToday, unlimited, resetsAt, ready}
 *   quotaExhausted signal bumped when a press is refused (also window event 'fc:quota-exhausted')
 *   canShoot / consumeShot / refundShot / addAdReward
 *   canBuy, products, isPro, entitlement, billingBusy, purchasePending
 *   purchase(id) / restore() / manageSubscriptions() / refreshEntitlement()
 *   canWatchAds, adsAvailable, adShowing, privacyOptionsRequired
 *   showRewarded() / showPrivacyOptions()
 *
 * Web / PWA: canBuy = false, canWatchAds = false → 10 free shots a day, show "get the app".
 */
import { initAds } from './ads';
import { initBilling } from './billing';
import { initQuota } from './quota';

export * from './ads';
export * from './billing';
export * from './quota';
export { FREE_SHOTS_PER_DAY, AD_REWARD_SHOTS, MAX_ADS_PER_DAY, PRODUCT_IDS, PRODUCTS, type ProductId, type ProductKind } from './config';
export { nativePlatform } from './platform';

let started: Promise<void> | null = null;
/**
 * Call once at boot (main.tsx). Never throws and never blocks the camera: quota loads at once,
 * billing and ads continue in the background on native.
 */
export function initMonetization(): Promise<void> {
  started ??= (async () => {
    const billing = initBilling(); // reads the cached entitlement first (quota waits for it)
    await initQuota();
    await billing;
    await initAds(); // silent: no prompt at launch, skipped for Pro
  })().catch((err) => console.warn('[silvr] monetization init failed', err));
  return started;
}
