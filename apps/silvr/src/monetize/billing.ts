/**
 * Store billing (Google Play Billing / StoreKit 2) through @capgo/native-purchases.
 * No backend, no third-party server: Pro is whatever the store on this device reports,
 * cached in IndexedDB for offline use and re-checked on start and resume.
 *
 * Web / PWA build: canBuy stays false, isPro stays false (the UI shows "get the app").
 */
import { computed, signal } from '@preact/signals';
import { get, put } from '../store/db';
import { ENTITLEMENT_RECHECK_MS, PRODUCTS, productDef, type ProductId, type ProductKind } from './config';
import {
  cachedIsPro,
  classifyPurchaseError,
  findStoreProduct,
  isPendingPurchase,
  needsAcknowledge,
  NO_ENTITLEMENT,
  parseCachedEntitlement,
  resolveEntitlement,
  type Entitlement,
  type PurchaseLike,
} from './entitlement';
import { nativePlatform, type NativePlatform } from './platform';

export interface StoreProduct {
  id: ProductId;
  kind: ProductKind;
  subscription: boolean;
  /** Localized price from the store, e.g. "₩6,500" or "$4.99". Show this, never a hard-coded price. */
  price: string;
  /** Numeric price in the store currency (for "per week" maths in the UI). */
  priceAmount: number;
  currency: string;
  title: string;
  description: string;
}

export type PurchaseResult = 'purchased' | 'pending' | 'cancelled' | 'failed' | 'unavailable';
export type RestoreResult = 'restored' | 'none' | 'failed' | 'unavailable';

/** Store billing works in this build and on this device (native app + Play/App Store reachable). */
export const canBuy = signal(false);
/** Products with store prices; empty until loaded (or on web). Ordered week, 3 months, lifetime. */
export const products = signal<StoreProduct[]>([]);
/** The current entitlement (cached or freshly verified). */
export const entitlement = signal<Entitlement>({ ...NO_ENTITLEMENT });
/** Unlimited shots and no ads. */
export const isPro = computed(() => entitlement.value.pro);
/** A purchase / restore sheet is in progress (disable the buy buttons). */
export const billingBusy = signal(false);
/** A purchase is waiting for payment (Android pending / iOS Ask to Buy). */
export const purchasePending = signal(false);

const CACHE_KEY = 'entitlement';

type Plugin = typeof import('@capgo/native-purchases');
let pluginPromise: Promise<Plugin> | null = null;
/** Loaded lazily so the web build never pulls in native plugin code. */
function plugin(): Promise<Plugin> {
  return (pluginPromise ??= import('@capgo/native-purchases'));
}

let platform: NativePlatform | null = null;
let cacheLoaded: Promise<void> | null = null;
let initPromise: Promise<void> | null = null;
let lastCheck = 0;
/** Store checks run one at a time, in order (resume, transactionUpdated and a purchase can overlap). */
let refreshChain: Promise<void> = Promise.resolve();
/**
 * Pro granted from a just-completed purchase transaction while the store's purchase list still
 * lagged behind. A store answer of "not Pro" within RECENT_PURCHASE_MS does not undo it.
 */
let recentPurchase: { e: Entitlement; at: number } | null = null;
const RECENT_PURCHASE_MS = 10 * 60 * 1000;

/** Resolves once the cached entitlement has been read (quota waits for it before charging a shot). */
export function entitlementReady(): Promise<void> {
  return cacheLoaded ?? Promise.resolve();
}

async function loadCache(): Promise<void> {
  try {
    const cached = parseCachedEntitlement(await get('kv', CACHE_KEY));
    if (cached && cached.platform === platform && cachedIsPro(cached, Date.now())) entitlement.value = cached;
  } catch (err) {
    console.warn('[silvr] entitlement cache unavailable', err);
  }
}

async function adopt(e: Entitlement): Promise<void> {
  entitlement.value = e;
  try {
    await put('kv', e, CACHE_KEY);
  } catch (err) {
    console.warn('[silvr] entitlement cache not saved', err);
  }
}

/**
 * Asks the store which Pro products this device's account owns right now and updates isPro.
 * On failure the cached answer stands while it is still within its offline grace.
 */
export function refreshEntitlement(): Promise<void> {
  if (!platform) return Promise.resolve();
  lastCheck = Date.now();
  const run = refreshChain.then(checkStore, checkStore);
  refreshChain = run.catch(() => undefined);
  return run;
}

async function checkStore(): Promise<void> {
  if (!platform) return;
  try {
    const { NativePurchases } = await plugin();
    // iOS: currentEntitlements is scoped to the signed-in Apple ID (no leakage on shared devices).
    const { purchases } = await NativePurchases.getPurchases(platform === 'ios' ? { onlyCurrentEntitlements: true } : {});
    const list = purchases as PurchaseLike[];
    if (platform === 'android') {
      // A purchase that finished while the app was closed (e.g. a pending cash payment) still needs
      // acknowledging, or Play refunds it after 3 days.
      for (const p of needsAcknowledge(list)) {
        await NativePurchases.acknowledgePurchase({ purchaseToken: p.purchaseToken! }).catch((err) => console.warn('[silvr] acknowledge failed', err));
      }
      purchasePending.value = list.some(isPendingPurchase);
    }
    const now = Date.now();
    let next = resolveEntitlement(list, platform, now);
    if (next.pro) recentPurchase = null;
    else if (recentPurchase && now - recentPurchase.at >= 0 && now - recentPurchase.at < RECENT_PURCHASE_MS) next = recentPurchase.e;
    if (next.pro) purchasePending.value = false;
    await adopt(next);
  } catch (err) {
    console.warn('[silvr] could not check purchases; keeping the cached answer', err);
    if (!cachedIsPro(entitlement.value, Date.now())) entitlement.value = { ...NO_ENTITLEMENT, platform };
  }
}

async function loadProducts(): Promise<void> {
  const { NativePurchases, PURCHASE_TYPE } = await plugin();
  const subIds = PRODUCTS.filter((p) => p.subscription).map((p) => p.id);
  const inappIds = PRODUCTS.filter((p) => !p.subscription).map((p) => p.id);
  const [subs, inapp] = await Promise.all([
    NativePurchases.getProducts({ productIdentifiers: subIds, productType: PURCHASE_TYPE.SUBS }).catch((err) => {
      console.warn('[silvr] subscriptions not available', err);
      return { products: [] };
    }),
    NativePurchases.getProducts({ productIdentifiers: inappIds, productType: PURCHASE_TYPE.INAPP }).catch((err) => {
      console.warn('[silvr] lifetime product not available', err);
      return { products: [] };
    }),
  ]);
  const found = [...subs.products, ...inapp.products];
  products.value = PRODUCTS.flatMap((def) => {
    const p = findStoreProduct(found, def);
    if (!p) return [];
    return [{ id: def.id, kind: def.kind, subscription: def.subscription, price: p.priceString, priceAmount: p.price, currency: p.currencyCode, title: p.title, description: p.description }];
  });
}

/**
 * Starts billing (native only; a no-op on the web): reads the cached entitlement, connects to the
 * store, loads prices, re-checks purchases, and re-checks again whenever the app resumes.
 * Safe to call more than once.
 */
export function initBilling(): Promise<void> {
  if (initPromise) return initPromise;
  platform = nativePlatform();
  if (!platform) {
    cacheLoaded = Promise.resolve();
    return (initPromise = Promise.resolve());
  }
  cacheLoaded = loadCache();
  initPromise = (async () => {
    await cacheLoaded;
    try {
      const { NativePurchases } = await plugin();
      const { isBillingSupported } = await NativePurchases.isBillingSupported();
      if (!isBillingSupported) {
        console.warn('[silvr] store billing not supported on this device');
        return;
      }
      canBuy.value = true;
      // iOS: renewals, refunds and Ask-to-Buy approvals arrive here while the app runs.
      await NativePurchases.addListener('transactionUpdated', () => void refreshEntitlement());
      await Promise.all([loadProducts(), refreshEntitlement()]);
    } catch (err) {
      console.warn('[silvr] billing unavailable', err);
    }
    try {
      const { App } = await import('@capacitor/app');
      await App.addListener('resume', () => {
        if (Date.now() - lastCheck < ENTITLEMENT_RECHECK_MS) return;
        void refreshEntitlement();
        if (canBuy.value && products.value.length === 0) void loadProducts().catch(() => undefined);
      });
    } catch {
      /* no App plugin: start-up check only */
    }
  })();
  return initPromise;
}

/** Buys a Pro product through the store sheet. Resolves after the store answers. */
export async function purchase(id: ProductId): Promise<PurchaseResult> {
  const def = productDef(id);
  if (!platform || !canBuy.value || !def) return 'unavailable';
  if (billingBusy.value) return 'failed';
  billingBusy.value = true;
  try {
    const { NativePurchases, PURCHASE_TYPE } = await plugin();
    const tx = await NativePurchases.purchaseProduct({
      productIdentifier: id,
      productType: def.subscription ? PURCHASE_TYPE.SUBS : PURCHASE_TYPE.INAPP,
      planIdentifier: def.subscription ? def.playBasePlanId : undefined,
      quantity: 1,
      // Android acknowledges and iOS finishes the transaction inside the plugin (the default);
      // refreshEntitlement() acknowledges anything that slipped through.
    });
    if (platform === 'android' && isPendingPurchase(tx as PurchaseLike)) {
      purchasePending.value = true;
      return 'pending';
    }
    await refreshEntitlement();
    if (!entitlement.value.pro) {
      // The store said "bought" but the purchase list lags behind: trust the transaction itself.
      const fromTx = resolveEntitlement([tx as PurchaseLike], platform, Date.now());
      if (fromTx.pro) {
        recentPurchase = { e: fromTx, at: Date.now() };
        purchasePending.value = false;
        await adopt(fromTx);
      }
    }
    return entitlement.value.pro ? 'purchased' : 'failed';
  } catch (err) {
    const kind = classifyPurchaseError(err);
    if (kind === 'owned') {
      await refreshEntitlement();
      return entitlement.value.pro ? 'purchased' : 'failed';
    }
    if (kind === 'pending') {
      purchasePending.value = true;
      return 'pending';
    }
    if (kind === 'failed') console.warn('[silvr] purchase failed', err);
    return kind === 'cancelled' ? 'cancelled' : 'failed';
  } finally {
    billingBusy.value = false;
  }
}

/** "Restore purchases": syncs with the store account (may ask the user to sign in on iOS). */
export async function restore(): Promise<RestoreResult> {
  if (!platform || !canBuy.value) return 'unavailable';
  if (billingBusy.value) return 'failed';
  billingBusy.value = true;
  try {
    const { NativePurchases } = await plugin();
    await NativePurchases.restorePurchases();
    await refreshEntitlement();
    return entitlement.value.pro ? 'restored' : 'none';
  } catch (err) {
    console.warn('[silvr] restore failed', err);
    return 'failed';
  } finally {
    billingBusy.value = false;
  }
}

/** Opens the store's subscription management page (cancel / change plan). */
export async function manageSubscriptions(): Promise<void> {
  if (!platform) return;
  const { NativePurchases } = await plugin();
  await NativePurchases.manageSubscriptions();
}
