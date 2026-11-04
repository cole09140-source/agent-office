import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAll, get, put } from '../src/store/db';
import { AD_REWARD_SHOTS, FREE_SHOTS_PER_DAY, MAX_ADS_PER_DAY } from '../src/monetize/config';
import {
  __resetQuotaForTests,
  addAdReward,
  canShoot,
  consumeShot,
  dayKeyOf,
  nextMidnight,
  quota,
  quotaExhausted,
  refundShot,
  reloadQuota,
  rollover,
  MAX_REANCHORS,
  type QuotaState,
} from '../src/monetize/quota';

/** Local wall-clock time (the quota follows the device's local midnight). */
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min).getTime();
const setNow = (ms: number) => vi.setSystemTime(ms);
const stored = () => get<QuotaState>('kv', 'quota');
const useN = async (n: number) => {
  const out: boolean[] = [];
  for (let i = 0; i < n; i++) out.push(await consumeShot());
  return out;
};

describe('daily shot quota', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] }); // only the clock: fake-indexeddb needs real timers
    setNow(at(2026, 11, 2, 12));
    await clearAll();
    __resetQuotaForTests();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('gives 10 free shots, then refuses and signals quotaExhausted', async () => {
    const before = quotaExhausted.value;
    expect(await useN(FREE_SHOTS_PER_DAY)).toEqual(Array(FREE_SHOTS_PER_DAY).fill(true));
    expect(quota.value.freeLeft).toBe(0);
    expect(canShoot()).toBe(false);
    expect(await consumeShot()).toBe(false);
    expect(quotaExhausted.value).toBe(before + 1);
    expect((await stored())?.freeUsedToday).toBe(FREE_SHOTS_PER_DAY);
  });

  it('resets free shots at local midnight', async () => {
    setNow(at(2026, 11, 2, 23, 59));
    await useN(FREE_SHOTS_PER_DAY);
    expect(await consumeShot()).toBe(false);
    expect(quota.value.resetsAt).toBe(at(2026, 11, 3, 0, 0));
    setNow(at(2026, 11, 3, 0, 1));
    expect(await consumeShot()).toBe(true);
    expect(quota.value.freeLeft).toBe(FREE_SHOTS_PER_DAY - 1);
    expect((await stored())?.dayKey).toBe('2026-11-03');
  });

  it('earned shots carry over midnight and are spent only after the free ones', async () => {
    expect(await addAdReward()).toBe(true);
    expect(quota.value.earned).toBe(AD_REWARD_SHOTS);
    await useN(FREE_SHOTS_PER_DAY + 3); // 10 free, then 3 earned
    expect(quota.value).toMatchObject({ freeLeft: 0, earned: AD_REWARD_SHOTS - 3 });
    setNow(at(2026, 11, 3, 9));
    await reloadQuota();
    expect(quota.value).toMatchObject({ freeLeft: FREE_SHOTS_PER_DAY, earned: AD_REWARD_SHOTS - 3, adsLeftToday: MAX_ADS_PER_DAY });
    await consumeShot();
    expect(quota.value).toMatchObject({ freeLeft: FREE_SHOTS_PER_DAY - 1, earned: AD_REWARD_SHOTS - 3 }); // free first
  });

  it('caps rewarded ads at 10 per local day', async () => {
    for (let i = 0; i < MAX_ADS_PER_DAY; i++) expect(await addAdReward()).toBe(true);
    expect(await addAdReward()).toBe(false);
    expect(quota.value).toMatchObject({ adsLeftToday: 0, earned: MAX_ADS_PER_DAY * AD_REWARD_SHOTS });
    setNow(at(2026, 11, 3, 8));
    expect(await addAdReward()).toBe(true);
    expect(quota.value).toMatchObject({ adsLeftToday: MAX_ADS_PER_DAY - 1, earned: (MAX_ADS_PER_DAY + 1) * AD_REWARD_SHOTS });
  });

  it('a clock set back to an earlier day does not reset free shots or the ad count', async () => {
    setNow(at(2026, 11, 3, 10));
    await useN(FREE_SHOTS_PER_DAY);
    for (let i = 0; i < MAX_ADS_PER_DAY; i++) await addAdReward();
    await useN(MAX_ADS_PER_DAY * AD_REWARD_SHOTS); // spend every earned shot too
    setNow(at(2026, 11, 2, 10)); // back one day
    expect(await consumeShot()).toBe(false);
    expect(await addAdReward()).toBe(false);
    await reloadQuota();
    expect(quota.value).toMatchObject({ freeLeft: 0, adsLeftToday: 0, resetsAt: at(2026, 11, 4, 0, 0) });
    setNow(at(2026, 11, 3, 18)); // forward again to the stored day: still used up
    expect(await consumeShot()).toBe(false);
    setNow(at(2026, 11, 4, 0, 5)); // the real next day refills
    expect(await consumeShot()).toBe(true);
  });

  it('re-anchors a far-future stored day without resetting used shots', async () => {
    await put('kv', { v: 1, dayKey: '2027-06-01', freeUsedToday: FREE_SHOTS_PER_DAY, earnedBalance: 0, adsWatchedToday: 3 }, 'quota');
    expect(await consumeShot()).toBe(false);
    expect((await stored())?.dayKey).toBe(dayKeyOf(at(2026, 11, 2))); // anchored to today
    setNow(at(2026, 11, 3, 7));
    expect(await consumeShot()).toBe(true); // next real midnight resets as usual
  });

  it('toggling the clock between today and a far-future day cannot refill shots forever', async () => {
    const today = at(2026, 11, 2, 12);
    const farFuture = at(2026, 12, 20, 12); // > MAX_FUTURE_DAYS ahead
    let free = 0;
    for (let round = 0; round < 10; round++) {
      setNow(farFuture);
      while (await consumeShot()) free++;
      setNow(today);
      while (await consumeShot()) free++;
    }
    // Today's 10 + a few broken-clock re-anchors' worth — not 10 per round trip.
    expect(free).toBeLessThanOrEqual(FREE_SHOTS_PER_DAY * (2 + MAX_REANCHORS));
    expect(free).toBeLessThan(FREE_SHOTS_PER_DAY * 10);
  });

  it('concurrent presses (rapid taps / two tabs) never spend more than exists', async () => {
    await addAdReward(); // 10 free + 10 earned = 20
    const results = await Promise.all(Array.from({ length: 30 }, () => consumeShot()));
    expect(results.filter(Boolean)).toHaveLength(FREE_SHOTS_PER_DAY + AD_REWARD_SHOTS);
    expect(await stored()).toMatchObject({ freeUsedToday: FREE_SHOTS_PER_DAY, earnedBalance: 0 });
  });

  it('refundShot gives back the same kind of shot', async () => {
    await consumeShot();
    expect(quota.value.freeLeft).toBe(FREE_SHOTS_PER_DAY - 1);
    await refundShot();
    expect(quota.value.freeLeft).toBe(FREE_SHOTS_PER_DAY);
    await addAdReward();
    await useN(FREE_SHOTS_PER_DAY + 1); // last one is earned
    expect(quota.value.earned).toBe(AD_REWARD_SHOTS - 1);
    await refundShot();
    expect(quota.value).toMatchObject({ freeLeft: 0, earned: AD_REWARD_SHOTS });
    await refundShot(); // a free shot: back to 1 free left
    expect(quota.value.freeLeft).toBe(1);
  });

  it('does not refund a free shot from a day that has already ended', async () => {
    setNow(at(2026, 11, 2, 23, 59));
    await consumeShot();
    setNow(at(2026, 11, 3, 0, 1));
    await refundShot();
    expect(quota.value.freeLeft).toBe(FREE_SHOTS_PER_DAY); // new day: fresh 10, not 11
  });

  it('pure helpers: day keys, midnight, rollover', () => {
    expect(dayKeyOf(at(2026, 1, 5, 0, 0))).toBe('2026-01-05');
    expect(nextMidnight('2026-12-31')).toBe(at(2027, 1, 1, 0, 0));
    const s: QuotaState = { v: 1, dayKey: '2026-11-02', freeUsedToday: 7, earnedBalance: 4, adsWatchedToday: 2 };
    expect(rollover(s, at(2026, 11, 2, 23, 59))).toBe(s);
    expect(rollover(s, at(2026, 11, 3, 0, 0))).toEqual({ ...s, dayKey: '2026-11-03', freeUsedToday: 0, adsWatchedToday: 0 });
    expect(rollover(s, at(2026, 11, 1, 12))).toBe(s);
  });
});
