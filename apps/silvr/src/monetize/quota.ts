/**
 * Daily shot quota for free users.
 *
 *  - FREE_SHOTS_PER_DAY free shutter presses per local day (reset at local midnight).
 *  - Each completed rewarded ad adds AD_REWARD_SHOTS earned shots (max MAX_ADS_PER_DAY ads per
 *    local day). Earned shots never expire; free shots are used first.
 *  - Pro (or the web-only QA hatch) = unlimited: nothing is counted.
 *  - Imported photos never count (only the camera's shutter calls consumeShot).
 *
 * State lives in IndexedDB kv['quota'] and every change runs in one atomic transaction, so two
 * tabs or a burst of presses can never spend the same shot twice. Other tabs are told through a
 * BroadcastChannel (like settings).
 *
 * Clock tampering: the stored day only moves forward. A clock set back to an earlier day does
 * NOT reset free shots or the ad count (they stay as used until the stored day has passed).
 * A stored day more than MAX_FUTURE_DAYS ahead is treated as a broken clock and re-anchored to
 * today — still without resetting — so a phone that once had a wildly wrong date is not locked out.
 * Re-anchoring is limited to MAX_REANCHORS per install: without a limit, toggling the clock
 * between today and a far-future day reset the free shots and ad count on every round trip.
 */
import { computed, signal } from '@preact/signals';
import { atomic, get, rq } from '../store/db';
import { AD_REWARD_SHOTS, FREE_SHOTS_PER_DAY, MAX_ADS_PER_DAY, UNLIMITED_FLAG } from './config';
import { entitlementReady, isPro } from './billing';
import { testUnlimited } from './platform';

export interface QuotaState {
  v: 1;
  /** Local day (YYYY-MM-DD) the daily counters belong to. Only ever moves forward. */
  dayKey: string;
  freeUsedToday: number;
  /** Shots earned from rewarded ads; carried over across days. */
  earnedBalance: number;
  adsWatchedToday: number;
  /** Far-future re-anchors used so far (see MAX_REANCHORS). Missing in older stored values = 0. */
  reanchors?: number;
}

export interface QuotaView {
  /** Free shots left today. */
  freeLeft: number;
  /** Earned (ad) shots left; they carry over. */
  earned: number;
  /** Rewarded ads that may still be watched today. */
  adsLeftToday: number;
  /** Pro (or QA hatch): no limit, no counting. */
  unlimited: boolean;
  /** When the free shots refill (local midnight, ms epoch). */
  resetsAt: number;
  /** The stored state has been read at least once. */
  ready: boolean;
}

const KEY = 'quota';
/** A stored day this far ahead of the clock means the clock was wrong, not tampered for profit. */
export const MAX_FUTURE_DAYS = 30;
/** Broken-clock re-anchors allowed per install (a genuine wrong date happens once or twice). */
export const MAX_REANCHORS = 3;

const pad = (n: number) => String(n).padStart(2, '0');
/** Local calendar day of `ms` as YYYY-MM-DD (sorts like a date). */
export function dayKeyOf(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function dayStart(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** Local midnight that ends day `key`. */
export function nextMidnight(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d + 1).getTime();
}

export function freshState(now: number): QuotaState {
  return { v: 1, dayKey: dayKeyOf(now), freeUsedToday: 0, earnedBalance: 0, adsWatchedToday: 0 };
}

const int = (x: unknown, max: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(max, Math.max(0, Math.floor(x))) : 0);

/** Repairs whatever was stored (missing, older shape, bad write). */
export function normalize(raw: unknown, now: number): QuotaState {
  if (!raw || typeof raw !== 'object') return freshState(now);
  const r = raw as Partial<QuotaState>;
  const dayKey = typeof r.dayKey === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.dayKey) ? r.dayKey : dayKeyOf(now);
  return {
    v: 1,
    dayKey,
    freeUsedToday: int(r.freeUsedToday, FREE_SHOTS_PER_DAY),
    earnedBalance: int(r.earnedBalance, 1_000_000),
    adsWatchedToday: int(r.adsWatchedToday, MAX_ADS_PER_DAY),
    reanchors: int(r.reanchors, MAX_REANCHORS),
  };
}

/** Applies the day change (pure). Forward: new day, counters reset. Backward: nothing resets. */
export function rollover(s: QuotaState, now: number): QuotaState {
  const today = dayKeyOf(now);
  if (today > s.dayKey) return { ...s, dayKey: today, freeUsedToday: 0, adsWatchedToday: 0 };
  const used = s.reanchors ?? 0;
  if (today < s.dayKey && used < MAX_REANCHORS && dayStart(s.dayKey) - dayStart(today) > MAX_FUTURE_DAYS * 86_400_000) {
    // Re-anchor a broken far-future date; used shots stay used.
    return { ...s, dayKey: today, reanchors: used + 1 };
  }
  return s;
}

export function viewOf(s: QuotaState, now: number, unlimited: boolean, ready = true): QuotaView {
  const r = rollover(s, now);
  return {
    freeLeft: Math.max(0, FREE_SHOTS_PER_DAY - r.freeUsedToday),
    earned: r.earnedBalance,
    adsLeftToday: Math.max(0, MAX_ADS_PER_DAY - r.adsWatchedToday),
    unlimited,
    resetsAt: nextMidnight(r.dayKey),
    ready,
  };
}

// ---------------------------------------------------------------- reactive state

const stored = signal<QuotaState>(freshState(Date.now()));
const loaded = signal(false);
/** Bumped at midnight / on focus so the view re-applies the day change. */
const tick = signal(Date.now());
const hatch = signal(testUnlimited());

export const quota = computed<QuotaView>(() => viewOf(stored.value, tick.value, isPro.value || hatch.value, loaded.value));

/**
 * Bumped every time a press is refused for lack of shots. The MY-tab / paywall UI subscribes to
 * this (effect on quotaExhausted.value); a 'fc:quota-exhausted' window event fires as well.
 */
export const quotaExhausted = signal(0);

function isUnlimited(): boolean {
  hatch.value = testUnlimited();
  return isPro.value || hatch.value;
}

/** Synchronous check for the UI (disable / badge the shutter). consumeShot() is authoritative. */
export function canShoot(): boolean {
  const q = quota.value;
  return q.unlimited || !q.ready || q.freeLeft > 0 || q.earned > 0;
}

let channel: BroadcastChannel | null = null;
function broadcast(): void {
  try {
    channel?.postMessage('quota');
  } catch {
    /* closed */
  }
}

function adoptState(s: QuotaState): void {
  stored.value = s;
  loaded.value = true;
  tick.value = Date.now();
}

/** Re-reads the stored quota (another tab changed it, or the app came back). */
export async function reloadQuota(): Promise<void> {
  try {
    const now = Date.now();
    adoptState(normalize(await get('kv', KEY), now));
  } catch (err) {
    console.warn('[silvr] quota unavailable', err);
  }
}

/** Runs one read-modify-write of the quota in a single IndexedDB transaction. */
async function mutate<T>(change: (s: QuotaState) => { next: QuotaState; result: T }): Promise<T> {
  const { next, result } = await atomic(['kv'], async (t) => {
    const store = t.objectStore('kv');
    const now = Date.now();
    const cur = rollover(normalize(await rq(store.get(KEY)), now), now);
    const out = change(cur);
    await rq(store.put(out.next, KEY));
    return out;
  });
  adoptState(next);
  broadcast();
  return result;
}

type Charge = { kind: 'free' | 'earned'; dayKey: string } | { kind: 'unlimited' };
/** What each successful consumeShot() took, newest last, so refundShot() gives back the same kind. */
const charges: Charge[] = [];
/** Kept presses never pop their charge (the camera only refunds failures); keep the list short. */
const MAX_CHARGES = 32;
function pushCharge(c: Charge): void {
  charges.push(c);
  if (charges.length > MAX_CHARGES) charges.splice(0, charges.length - MAX_CHARGES);
}

/**
 * Takes one shot for a shutter press: today's free shots first, then earned ones.
 * Resolves false (and signals quotaExhausted) when none are left. Unlimited users are not counted.
 * If storage is unusable the press is allowed (the photo could not be saved either; never block
 * a camera on a broken counter).
 */
export async function consumeShot(): Promise<boolean> {
  await entitlementReady();
  if (isUnlimited()) {
    pushCharge({ kind: 'unlimited' });
    return true;
  }
  let charge: Charge | null;
  try {
    charge = await mutate<Charge | null>((s) => {
      if (s.freeUsedToday < FREE_SHOTS_PER_DAY) return { next: { ...s, freeUsedToday: s.freeUsedToday + 1 }, result: { kind: 'free', dayKey: s.dayKey } };
      if (s.earnedBalance > 0) return { next: { ...s, earnedBalance: s.earnedBalance - 1 }, result: { kind: 'earned', dayKey: s.dayKey } };
      return { next: s, result: null };
    });
  } catch (err) {
    console.warn('[silvr] quota not counted (storage unavailable)', err);
    pushCharge({ kind: 'unlimited' });
    return true;
  }
  if (!charge) {
    quotaExhausted.value++;
    try {
      globalThis.dispatchEvent?.(new Event('fc:quota-exhausted'));
    } catch {
      /* no window (tests) */
    }
    return false;
  }
  pushCharge(charge);
  return true;
}

/**
 * Gives back the most recent shot taken by consumeShot() when that capture did not produce a
 * photo (cancelled timer, app backgrounded, save failed). A free shot from a day that has since
 * ended is not refunded (the counter already reset).
 */
export async function refundShot(): Promise<void> {
  const c = charges.pop();
  if (!c || c.kind === 'unlimited') return;
  try {
    await mutate((s) => {
      if (c.kind === 'earned') return { next: { ...s, earnedBalance: s.earnedBalance + 1 }, result: undefined };
      if (s.dayKey !== c.dayKey) return { next: s, result: undefined };
      return { next: { ...s, freeUsedToday: Math.max(0, s.freeUsedToday - 1) }, result: undefined };
    });
  } catch (err) {
    console.warn('[silvr] shot refund not saved', err);
  }
}

/**
 * Credits one completed rewarded ad: +AD_REWARD_SHOTS earned shots. Enforces MAX_ADS_PER_DAY
 * per local day; resolves false (nothing added) when today's ads are used up.
 * Only ads.ts calls this, and only from the SDK's reward callback.
 */
export async function addAdReward(): Promise<boolean> {
  return mutate((s) => {
    if (s.adsWatchedToday >= MAX_ADS_PER_DAY) return { next: s, result: false };
    return { next: { ...s, adsWatchedToday: s.adsWatchedToday + 1, earnedBalance: s.earnedBalance + AD_REWARD_SHOTS }, result: true };
  });
}

let midnightTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleMidnight(): void {
  if (midnightTimer) clearTimeout(midnightTimer);
  // Re-armed at most hourly: timers drift or pause while the phone sleeps.
  const wait = Math.min(Math.max(1000, quota.value.resetsAt - Date.now() + 500), 3_600_000);
  midnightTimer = setTimeout(() => {
    tick.value = Date.now();
    scheduleMidnight();
  }, wait);
  (midnightTimer as { unref?: () => void }).unref?.();
}

let initPromise: Promise<void> | null = null;
/** Loads the quota and keeps it live (midnight, other tabs, coming back to the app). Idempotent. */
export function initQuota(): Promise<void> {
  if (initPromise) return initPromise;
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('silvr-quota');
    channel.onmessage = () => void reloadQuota();
    (channel as { unref?: () => void }).unref?.();
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      tick.value = Date.now();
      scheduleMidnight();
      void reloadQuota();
    });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === null || e.key === UNLIMITED_FLAG) hatch.value = testUnlimited();
    });
  }
  initPromise = reloadQuota().then(scheduleMidnight);
  return initPromise;
}

/** Test-only: forget in-memory state between unit tests. */
export function __resetQuotaForTests(): void {
  charges.length = 0;
  stored.value = freshState(Date.now());
  loaded.value = false;
  tick.value = Date.now();
  hatch.value = testUnlimited();
}
