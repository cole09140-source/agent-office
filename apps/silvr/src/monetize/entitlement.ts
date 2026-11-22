/**
 * Pure entitlement logic (no plugin, no storage): which store purchases make the user Pro,
 * and how long a cached answer may be trusted offline. Unit-tested in tests/monetize-billing.test.ts.
 */
import { ENTITLEMENT_OFFLINE_GRACE_MS, PRODUCT_IDS, productDef, type ProductDef, type ProductId } from './config';
import type { NativePlatform } from './platform';

/** The subset of @capgo/native-purchases' Transaction this logic reads. */
export interface PurchaseLike {
  productIdentifier: string;
  purchaseDate?: string;
  /** iOS: subscription expiry (ISO 8601). Android: not provided. */
  expirationDate?: string;
  /** iOS subscriptions: true while not expired / refunded. */
  isActive?: boolean;
  /** iOS: set when Apple refunded / revoked the transaction. */
  revocationDate?: string;
  subscriptionState?: string;
  /**
   * Android: Play's Purchase.PurchaseState as a string — "1" PURCHASED, "2" PENDING (cash, slow
   * card…), "0" UNSPECIFIED. (The plugin's typings say "0" = pending; the native code sends
   * String.valueOf(getPurchaseState()), so pending is really "2".) Only "1" is owned.
   */
  purchaseState?: string;
  isAcknowledged?: boolean;
  purchaseToken?: string;
}

export interface Entitlement {
  pro: boolean;
  source: 'lifetime' | 'subscription' | null;
  productId: ProductId | null;
  /** Subscription expiry (ms) when the store reports it (iOS). */
  expiresAt: number | null;
  /** When this answer last came from the store (ms). */
  verifiedAt: number;
  platform: NativePlatform | null;
}

/** Android Play purchase states (Purchase.PurchaseState), as the plugin stringifies them. */
export const ANDROID_PURCHASED = '1';
export const ANDROID_PENDING = '2';

export const NO_ENTITLEMENT: Entitlement = { pro: false, source: null, productId: null, expiresAt: null, verifiedAt: 0, platform: null };

const ms = (iso?: string): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
};

/** One purchase grants access right now (pending, refunded or expired ones do not). */
export function purchaseGrants(p: PurchaseLike, platform: NativePlatform, now: number): boolean {
  const def = productDef(p.productIdentifier);
  if (!def) return false;
  if (platform === 'android') {
    // Play only returns owned in-app items and subscriptions that are still active (including a
    // cancelled one until its period ends, and grace period). Pending payments are "2".
    return p.purchaseState === ANDROID_PURCHASED;
  }
  // iOS (StoreKit 2 currentEntitlements): verified transactions; refunds carry a revocation date.
  if (p.revocationDate) return false;
  if (!def.subscription) return true;
  if (p.subscriptionState === 'revoked' || p.subscriptionState === 'expired') return false;
  if (p.subscriptionState === 'subscribed' || p.subscriptionState === 'inGracePeriod') return true;
  const exp = ms(p.expirationDate);
  if (exp !== null) return exp > now;
  return p.isActive === true;
}

/** Resolves Pro from the store's purchase list. Lifetime wins; else the latest-expiring subscription. */
export function resolveEntitlement(purchases: readonly PurchaseLike[], platform: NativePlatform, now: number): Entitlement {
  const granting = purchases.filter((p) => purchaseGrants(p, platform, now));
  const lifetime = granting.find((p) => p.productIdentifier === PRODUCT_IDS.lifetime);
  if (lifetime) return { pro: true, source: 'lifetime', productId: PRODUCT_IDS.lifetime, expiresAt: null, verifiedAt: now, platform };
  const subs = granting
    .map((p) => ({ p, exp: ms(p.expirationDate) }))
    .sort((a, b) => (b.exp ?? Number.MAX_SAFE_INTEGER) - (a.exp ?? Number.MAX_SAFE_INTEGER));
  const best = subs[0];
  if (best) return { pro: true, source: 'subscription', productId: best.p.productIdentifier as ProductId, expiresAt: best.exp, verifiedAt: now, platform };
  return { ...NO_ENTITLEMENT, verifiedAt: now, platform };
}

/**
 * Whether a cached entitlement may still be honoured without reaching the store.
 * A clock set backwards before the last check is treated like "just checked".
 */
export function cachedIsPro(e: Entitlement | null | undefined, now: number, grace = ENTITLEMENT_OFFLINE_GRACE_MS): boolean {
  if (!e?.pro) return false;
  if (e.source === 'lifetime') return true;
  if (e.expiresAt !== null && Number.isFinite(e.expiresAt)) return now < e.expiresAt + grace;
  return now < Math.max(e.verifiedAt, 0) + grace;
}

/** Parses whatever was stored (older build, bad write) into a safe Entitlement or null. */
export function parseCachedEntitlement(raw: unknown): Entitlement | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<Entitlement>;
  if (typeof r.pro !== 'boolean' || typeof r.verifiedAt !== 'number') return null;
  const productId = typeof r.productId === 'string' && productDef(r.productId) ? (r.productId as ProductId) : null;
  return {
    pro: r.pro && productId !== null,
    source: r.source === 'lifetime' || r.source === 'subscription' ? r.source : null,
    productId,
    expiresAt: typeof r.expiresAt === 'number' ? r.expiresAt : null,
    verifiedAt: r.verifiedAt,
    platform: r.platform === 'android' || r.platform === 'ios' ? r.platform : null,
  };
}

/** A Pro purchase that is waiting for payment (Android pending state). */
export function isPendingPurchase(p: PurchaseLike): boolean {
  return !!productDef(p.productIdentifier) && p.purchaseState === ANDROID_PENDING;
}

/** The subset of @capgo/native-purchases' Product this logic reads. */
export interface StoreProductLike {
  identifier: string;
  planIdentifier?: string;
  offerId?: string | null;
}

/**
 * Finds the store's entry for one of our products.
 *  - iOS (all) and Android one-time products: `identifier` is the product id.
 *  - Android subscriptions: `identifier` is the BASE PLAN id ("p1w") and `planIdentifier` is the
 *    product id, with one entry per offer (base offer + any trial / intro offers). Prefer our base
 *    plan's base offer (offerId null) so the price shown is the plain recurring price.
 */
export function findStoreProduct<T extends StoreProductLike>(list: readonly T[], def: ProductDef): T | undefined {
  const direct = list.filter((p) => p.identifier === def.id);
  const plans = def.subscription ? list.filter((p) => p.planIdentifier === def.id && p.identifier !== def.id) : [];
  const ours = def.playBasePlanId ? plans.filter((p) => p.identifier === def.playBasePlanId) : [];
  for (const group of [direct, ours, plans]) {
    const hit = group.find((p) => !p.offerId) ?? group[0];
    if (hit) return hit;
  }
  return undefined;
}

/** Android purchases that are owned but not yet acknowledged (Play refunds them after 3 days). */
export function needsAcknowledge(purchases: readonly PurchaseLike[]): PurchaseLike[] {
  return purchases.filter((p) => productDef(p.productIdentifier) && p.purchaseState === ANDROID_PURCHASED && p.isAcknowledged === false && !!p.purchaseToken);
}

export type PurchaseErrorKind = 'cancelled' | 'pending' | 'owned' | 'failed';

/** Maps a plugin rejection to what the UI should say. */
export function classifyPurchaseError(err: unknown): PurchaseErrorKind {
  const e = err as { message?: string; code?: string | number } | undefined;
  const text = `${e?.code ?? ''} ${e?.message ?? String(err)}`;
  if (/cancel|USER_CANCELED|userCancelled/i.test(text)) return 'cancelled';
  if (/pending|deferred|askToBuy|PURCHASE_STATE_2/i.test(text)) return 'pending';
  if (/already.?owned|ITEM_ALREADY_OWNED/i.test(text)) return 'owned';
  return 'failed';
}
