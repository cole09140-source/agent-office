import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { PRODUCT_IDS } from '../src/monetize/config';

/** A fake Android Play store behind @capgo/native-purchases (what the native plugin really returns). */
const store = vi.hoisted(() => ({
  owned: [] as Record<string, unknown>[],
  /** getPurchases calls wait on this (lets a test hold a "stale" query open). */
  gate: null as Promise<void> | null,
}));

vi.mock('@capgo/native-purchases', () => ({
  PURCHASE_TYPE: { INAPP: 'inapp', SUBS: 'subs' },
  NativePurchases: {
    isBillingSupported: async () => ({ isBillingSupported: true }),
    addListener: async () => ({ remove: async () => undefined }),
    getProducts: async ({ productType }: { productType: string }) => ({
      products:
        productType === 'subs'
          ? [
              { identifier: 'p1w', planIdentifier: PRODUCT_IDS.week, offerId: null, priceString: '$4.99', price: 4.99, currencyCode: 'USD', title: 'Week', description: '' },
              { identifier: 'p3m', planIdentifier: PRODUCT_IDS.threeMonth, offerId: null, priceString: '$9.99', price: 9.99, currencyCode: 'USD', title: '3M', description: '' },
            ]
          : [{ identifier: PRODUCT_IDS.lifetime, priceString: '$19.99', price: 19.99, currencyCode: 'USD', title: 'Life', description: '' }],
    }),
    getPurchases: async () => {
      const snapshot = [...store.owned];
      if (store.gate) await store.gate;
      return { purchases: snapshot };
    },
    acknowledgePurchase: async () => undefined,
    purchaseProduct: async ({ productIdentifier, planIdentifier, productType }: Record<string, string>) => {
      if (productType === 'subs' && !planIdentifier) throw new Error('planIdentifier cannot be empty if productType is subs');
      return { productIdentifier, purchaseState: '1', isAcknowledged: false, purchaseToken: 'tok' };
    },
  },
}));
vi.mock('@capacitor/app', () => ({ App: { addListener: async () => ({ remove: async () => undefined }) } }));

describe('Android billing flow (mocked plugin)', () => {
  beforeAll(() => {
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android' };
  });

  it('lists subscriptions (base-plan keyed) and keeps Pro when a stale store query lands after the purchase', async () => {
    const billing = await import('../src/monetize/billing');
    await billing.initBilling();
    expect(billing.products.value.map((p) => [p.id, p.price])).toEqual([
      [PRODUCT_IDS.week, '$4.99'],
      [PRODUCT_IDS.threeMonth, '$9.99'],
      [PRODUCT_IDS.lifetime, '$19.99'],
    ]);
    expect(billing.isPro.value).toBe(false);

    // A resume-triggered check starts BEFORE Play knows about the purchase and is slow to answer.
    let open!: () => void;
    store.gate = new Promise<void>((r) => (open = r));
    const stale = billing.refreshEntitlement();
    store.gate = null;
    // The purchase completes, but Play's purchase list still lags (owned stays empty).
    const result = billing.purchase(PRODUCT_IDS.week);
    open();
    await stale;
    expect(await result).toBe('purchased');
    expect(billing.isPro.value).toBe(true);
    // Another check with the still-lagging list must not take Pro away right after paying.
    await billing.refreshEntitlement();
    expect(billing.isPro.value).toBe(true);
  });
});
