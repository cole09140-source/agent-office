import { describe, expect, it } from 'vitest';
import { ENTITLEMENT_OFFLINE_GRACE_MS, PRODUCT_IDS, PRODUCTS } from '../src/monetize/config';
import {
  cachedIsPro,
  classifyPurchaseError,
  findStoreProduct,
  isPendingPurchase,
  needsAcknowledge,
  parseCachedEntitlement,
  purchaseGrants,
  resolveEntitlement,
  type Entitlement,
  type PurchaseLike,
} from '../src/monetize/entitlement';

const NOW = Date.parse('2026-11-02T12:00:00Z');
const iso = (ms: number) => new Date(ms).toISOString();
const DAY = 86_400_000;

describe('entitlement resolution', () => {
  it('Android: purchased (state "1") Pro products grant, pending ("2"), unspecified ("0") and unknown products do not', () => {
    const list: PurchaseLike[] = [
      { productIdentifier: PRODUCT_IDS.week, purchaseState: '2' },
      { productIdentifier: PRODUCT_IDS.lifetime, purchaseState: '0' },
      { productIdentifier: 'some_other_app_item', purchaseState: '1' },
    ];
    expect(resolveEntitlement(list, 'android', NOW).pro).toBe(false);
    const sub = resolveEntitlement([...list, { productIdentifier: PRODUCT_IDS.threeMonth, purchaseState: '1' }], 'android', NOW);
    expect(sub).toMatchObject({ pro: true, source: 'subscription', productId: PRODUCT_IDS.threeMonth, expiresAt: null, verifiedAt: NOW, platform: 'android' });
  });

  it('lifetime wins over a subscription', () => {
    const e = resolveEntitlement(
      [
        { productIdentifier: PRODUCT_IDS.week, purchaseState: '1' },
        { productIdentifier: PRODUCT_IDS.lifetime, purchaseState: '1' },
      ],
      'android',
      NOW,
    );
    expect(e).toMatchObject({ pro: true, source: 'lifetime', productId: PRODUCT_IDS.lifetime });
  });

  it('iOS: active subscription by expiry / state; expired, revoked and refunded ones do not grant', () => {
    expect(purchaseGrants({ productIdentifier: PRODUCT_IDS.week, expirationDate: iso(NOW + DAY), isActive: true }, 'ios', NOW)).toBe(true);
    expect(purchaseGrants({ productIdentifier: PRODUCT_IDS.week, expirationDate: iso(NOW - 1000) }, 'ios', NOW)).toBe(false);
    expect(purchaseGrants({ productIdentifier: PRODUCT_IDS.week, subscriptionState: 'inGracePeriod', expirationDate: iso(NOW - 1000) }, 'ios', NOW)).toBe(true);
    expect(purchaseGrants({ productIdentifier: PRODUCT_IDS.week, subscriptionState: 'expired', isActive: true }, 'ios', NOW)).toBe(false);
    expect(purchaseGrants({ productIdentifier: PRODUCT_IDS.week, isActive: true }, 'ios', NOW)).toBe(true);
    expect(purchaseGrants({ productIdentifier: PRODUCT_IDS.lifetime }, 'ios', NOW)).toBe(true);
    expect(purchaseGrants({ productIdentifier: PRODUCT_IDS.lifetime, revocationDate: iso(NOW - DAY) }, 'ios', NOW)).toBe(false);
  });

  it('iOS: picks the latest-expiring subscription and records its expiry', () => {
    const e = resolveEntitlement(
      [
        { productIdentifier: PRODUCT_IDS.week, expirationDate: iso(NOW + 2 * DAY) },
        { productIdentifier: PRODUCT_IDS.threeMonth, expirationDate: iso(NOW + 60 * DAY) },
      ],
      'ios',
      NOW,
    );
    expect(e).toMatchObject({ pro: true, productId: PRODUCT_IDS.threeMonth, expiresAt: NOW + 60 * DAY });
  });

  it('an empty purchase list means not Pro (refund / expiry revokes the cache)', () => {
    expect(resolveEntitlement([], 'ios', NOW)).toMatchObject({ pro: false, source: null, verifiedAt: NOW });
  });
});

describe('entitlement cache expiry (offline)', () => {
  const base: Entitlement = { pro: true, source: 'subscription', productId: PRODUCT_IDS.week, expiresAt: null, verifiedAt: NOW, platform: 'android' };

  it('lifetime is trusted indefinitely', () => {
    expect(cachedIsPro({ ...base, source: 'lifetime', productId: PRODUCT_IDS.lifetime }, NOW + 900 * DAY)).toBe(true);
  });
  it('a subscription with a known expiry is trusted until expiry + grace', () => {
    const e = { ...base, expiresAt: NOW + 7 * DAY };
    expect(cachedIsPro(e, NOW + 7 * DAY + ENTITLEMENT_OFFLINE_GRACE_MS - 1)).toBe(true);
    expect(cachedIsPro(e, NOW + 7 * DAY + ENTITLEMENT_OFFLINE_GRACE_MS + 1)).toBe(false);
  });
  it('an Android subscription (no expiry on device) is trusted for the grace after the last check', () => {
    expect(cachedIsPro(base, NOW + ENTITLEMENT_OFFLINE_GRACE_MS - 1)).toBe(true);
    expect(cachedIsPro(base, NOW + ENTITLEMENT_OFFLINE_GRACE_MS + 1)).toBe(false);
  });
  it('not Pro / nothing cached is never Pro', () => {
    expect(cachedIsPro(null, NOW)).toBe(false);
    expect(cachedIsPro({ ...base, pro: false }, NOW)).toBe(false);
  });
  it('parses stored values defensively', () => {
    expect(parseCachedEntitlement(undefined)).toBeNull();
    expect(parseCachedEntitlement({ pro: 'yes' })).toBeNull();
    expect(parseCachedEntitlement({ ...base, productId: 'hacked_item' })?.pro).toBe(false);
    expect(parseCachedEntitlement(base)).toEqual(base);
  });
});

describe('purchase helpers', () => {
  it('finds unacknowledged Android purchases', () => {
    const list: PurchaseLike[] = [
      { productIdentifier: PRODUCT_IDS.lifetime, purchaseState: '1', isAcknowledged: false, purchaseToken: 't1' },
      { productIdentifier: PRODUCT_IDS.week, purchaseState: '1', isAcknowledged: true, purchaseToken: 't2' },
      { productIdentifier: PRODUCT_IDS.week, purchaseState: '2', isAcknowledged: false, purchaseToken: 't3' },
    ];
    expect(needsAcknowledge(list).map((p) => p.purchaseToken)).toEqual(['t1']);
  });
  it('classifies plugin errors', () => {
    expect(classifyPurchaseError(new Error('User cancelled the purchase'))).toBe('cancelled');
    expect(classifyPurchaseError({ code: 'USER_CANCELED', message: 'x' })).toBe('cancelled');
    expect(classifyPurchaseError(new Error('Purchase is pending'))).toBe('pending');
    expect(classifyPurchaseError(new Error('ITEM_ALREADY_OWNED'))).toBe('owned');
    expect(classifyPurchaseError(new Error('network down'))).toBe('failed');
    expect(classifyPurchaseError({ code: 'PURCHASE_STATE_0', message: 'Purchase is not purchased' })).toBe('failed');
  });
  it('Android pending purchases are state "2" (Play PurchaseState.PENDING), not "0"', () => {
    expect(isPendingPurchase({ productIdentifier: PRODUCT_IDS.lifetime, purchaseState: '2' })).toBe(true);
    expect(isPendingPurchase({ productIdentifier: PRODUCT_IDS.lifetime, purchaseState: '0' })).toBe(false);
    expect(isPendingPurchase({ productIdentifier: 'other_app_item', purchaseState: '2' })).toBe(false);
  });
  it('matches store products: Android subscriptions are keyed by base plan (identifier) + product id (planIdentifier)', () => {
    const [week, threeMonth, lifetime] = PRODUCTS;
    // What the Android plugin returns: one entry per subscription offer, identifier = base plan id.
    const android = [
      { identifier: 'p1w', planIdentifier: PRODUCT_IDS.week, offerId: 'trial-3d', priceString: 'trial' },
      { identifier: 'p1w', planIdentifier: PRODUCT_IDS.week, offerId: null, priceString: '$4.99' },
      { identifier: 'p3m', planIdentifier: PRODUCT_IDS.threeMonth, offerId: null, priceString: '$9.99' },
      { identifier: PRODUCT_IDS.lifetime, priceString: '$19.99' },
    ];
    expect(findStoreProduct(android, week)?.priceString).toBe('$4.99'); // base offer, not the trial
    expect(findStoreProduct(android, threeMonth)?.priceString).toBe('$9.99');
    expect(findStoreProduct(android, lifetime)?.priceString).toBe('$19.99');
    // iOS: identifier is the product id for every type.
    const ios = PRODUCTS.map((p) => ({ identifier: p.id, priceString: p.id }));
    for (const def of PRODUCTS) expect(findStoreProduct(ios, def)?.priceString).toBe(def.id);
    expect(findStoreProduct([], week)).toBeUndefined();
  });
  it('product table matches the owner\'s plans', () => {
    expect(PRODUCTS.map((p) => [p.id, p.subscription, p.playBasePlanId ?? null, p.period ?? null, p.usd])).toEqual([
      ['filmcamela_pro_week', true, 'p1w', 'P1W', 4.99],
      ['filmcamela_pro_3month', true, 'p3m', 'P3M', 9.99],
      ['filmcamela_pro_lifetime', false, null, null, 19.99],
    ]);
  });
});
