/**
 * Monetisation seam (v1.1). The engine lives in src/monetize/ (see docs/11_MONETIZATION.md).
 *
 * Owner's decision: ONLY shots are limited for free users (10 a day + rewarded ads; Pro =
 * unlimited, no ads). Film stocks, cameras and lab features stay free for everyone — nothing
 * here paywalls them. Premium stocks keep their `pro: true` flag in stocks.ts for later.
 */
import { isPro } from './monetize/billing';
import { nativePlatform } from './monetize/platform';

/** Store purchases exist in this build (the native apps). The web / PWA build has none. */
export const PAYMENTS_ENABLED = nativePlatform() !== null;

/** PRO badges on stocks / cameras: off while those stay free (a badge on a free item misleads). */
export const SHOW_PRO_BADGES = false;

export type Feature = 'proStocks' | 'rushDevelop' | 'contactSheet' | 'darkroom';

/** Pro entitlement from the store (lifetime or an active subscription). */
export function hasPro(): boolean {
  return isPro.value;
}

/** Features that need Pro. Empty: the owner limits only shots for now. */
const PRO_ONLY: Feature[] = [];

export function canUse(feature: Feature): boolean {
  return hasPro() || !PRO_ONLY.includes(feature);
}

/** Every stock is usable by everyone (no stock paywall). */
export function canUseStock(_stock: { pro: boolean }): boolean {
  return true;
}
