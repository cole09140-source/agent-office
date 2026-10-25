/**
 * Monetisation seam. Payments are intentionally NOT implemented in v1.0:
 * with PAYMENTS_ENABLED = false every feature is unlocked and no PRO badges are
 * shown. Premium stocks are still flagged with `pro: true` in stocks.ts.
 *
 * To ship paid tiers, replace `hasPro()` with a real entitlement check
 * (e.g. RevenueCat / StoreKit 2 / Play Billing via a Capacitor plugin) and set
 * PAYMENTS_ENABLED = true. Gated features call `canUse()`.
 */
export const PAYMENTS_ENABLED = false;

export type Feature = 'proStocks' | 'rushDevelop' | 'contactSheet' | 'darkroom';

export function hasPro(): boolean {
  return !PAYMENTS_ENABLED;
}

const FREE_FEATURES: Feature[] = ['contactSheet', 'darkroom', 'rushDevelop'];

export function canUse(feature: Feature): boolean {
  return hasPro() || FREE_FEATURES.includes(feature);
}

export function canUseStock(stock: { pro: boolean }): boolean {
  return !stock.pro || canUse('proStocks');
}
