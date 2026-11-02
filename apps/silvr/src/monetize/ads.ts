/**
 * Rewarded ads (AdMob via @capacitor-community/admob). Native apps only, never for Pro users.
 *
 * Privacy: NOTHING ad-related runs until the user first taps "watch an ad" (MY tab). A user who
 * never watches an ad never contacts Google's ad / consent servers (Google's app-measurement
 * auto-start is also delayed: DELAY_APP_MEASUREMENT_INIT / GADDelayAppMeasurementInit).
 *
 * On a "watch an ad" tap (Google / Apple order):
 *   1. UMP consent info is requested; the consent form shows if the user's region needs it
 *      (EEA / UK / Switzerland …) and they have not answered yet,
 *   2. THEN the iOS App Tracking Transparency prompt if not yet answered,
 *   3. THEN the Mobile Ads SDK starts and the ad is requested.
 * After that first time (remembered in localStorage ADS_USED_KEY), later launches refresh the
 * consent info silently at start-up — Google asks for that once ads are in use — so
 * privacyOptionsRequired is known for the MY tab's "privacy choices" row.
 *
 * A reward is granted ONLY from the SDK's reward callback (quota.addAdReward), never on close.
 */
import { computed, signal } from '@preact/signals';
import { ADMOB_TEST_DEVICE_IDS, ADS_TEST_BUILD_FLAG, rewardedUnit } from './config';
import { isPro } from './billing';
import { addAdReward, quota } from './quota';
import { nativePlatform } from './platform';

export type RewardedResult = 'rewarded' | 'dismissed' | 'failed' | 'unavailable';

/** This build can show rewarded ads at all (native app, not Pro). False on web: show "get the app". */
export const canWatchAds = computed(() => nativePlatform() !== null && !isPro.value);
/** Consent refused / SDK failed: no ads this session. */
const blocked = signal(false);
/** An ad may be offered right now: canWatchAds, not blocked, and ads left today. */
export const adsAvailable = computed(() => canWatchAds.value && !blocked.value && quota.value.adsLeftToday > 0);
/** EEA/UK users must be able to reopen the consent form (put a "Privacy choices" row in MY / Settings). */
export const privacyOptionsRequired = signal(false);
/** A rewarded ad is loading or on screen. */
export const adShowing = signal(false);

type AdMobModule = typeof import('@capacitor-community/admob');
let modPromise: Promise<AdMobModule> | null = null;
const admob = () => (modPromise ??= import('@capacitor-community/admob'));

/** Set once the user has started ads (first "watch an ad" tap). */
const ADS_USED_KEY = 'fc-ads-used';
function adsUsedBefore(): boolean {
  try {
    return localStorage.getItem(ADS_USED_KEY) === '1';
  } catch {
    return false;
  }
}
function markAdsUsed(): void {
  try {
    localStorage.setItem(ADS_USED_KEY, '1');
  } catch {
    /* storage blocked: start-up refresh just won't happen */
  }
}

let consentChecked: Promise<void> | null = null;
let sdkStarted: Promise<boolean> | null = null;
/** When the waiting (prepared, not yet shown) ad finished loading; 0 = none. */
let preloadedAt = 0;
/** A prepare in flight, so a warm-up and a tap never load two ads over each other. */
let preparing: Promise<void> | null = null;
/** AdMob ads expire an hour after loading; reload a prepared ad older than this before showing. */
const PRELOAD_MAX_AGE_MS = 50 * 60_000;

async function readConsent(): Promise<{ canRequestAds: boolean; formNeeded: boolean }> {
  const { AdMob, AdmobConsentStatus } = await admob();
  const info = await AdMob.requestConsentInfo({ testDeviceIdentifiers: ADMOB_TEST_DEVICE_IDS });
  privacyOptionsRequired.value = String(info.privacyOptionsRequirementStatus) === 'REQUIRED';
  return { canRequestAds: info.canRequestAds, formNeeded: info.status === AdmobConsentStatus.REQUIRED && info.isConsentFormAvailable === true };
}

/**
 * Start-up step. Does nothing (no network, no SDK) unless this user already watched an ad before;
 * then it silently refreshes UMP consent info and starts the SDK if no prompt is needed.
 */
export function initAds(): Promise<void> {
  if (!nativePlatform() || isPro.value || !adsUsedBefore()) return Promise.resolve();
  consentChecked ??= (async () => {
    try {
      const c = await readConsent();
      // Only pre-start when nothing has to be asked (ATT still unanswered on iOS = ask first).
      if (c.canRequestAds && !c.formNeeded && !(await attUndetermined())) await startSdk();
    } catch (err) {
      console.warn('[silvr] ad consent check failed', err);
    }
  })();
  return consentChecked;
}

async function attUndetermined(): Promise<boolean> {
  if (nativePlatform() !== 'ios') return false;
  const { AdMob } = await admob();
  return (await AdMob.trackingAuthorizationStatus()).status === 'notDetermined';
}

let testBuild: Promise<boolean> | null = null;
/**
 * Debug / QA / dev build → Google's TEST rewarded unit, so real ads are never clicked while testing.
 * Vite dev server or VITE_ADS_TEST=1 at build time, or an Android debuggable build (assembleDebug,
 * asked from the app-local SilvrGallery plugin). If that check fails, stay on test ads (safe side).
 */
export function adsTestBuild(): Promise<boolean> {
  testBuild ??= (async () => {
    if (ADS_TEST_BUILD_FLAG) return true;
    if (nativePlatform() !== 'android') return false;
    try {
      const { registerPlugin } = await import('@capacitor/core');
      const native = registerPlugin<{ buildInfo(): Promise<{ debuggable: boolean }> }>('SilvrGallery');
      return (await native.buildInfo()).debuggable;
    } catch (err) {
      console.warn('[silvr] build type unknown; using test ads', err);
      return true;
    }
  })();
  return testBuild;
}

function startSdk(): Promise<boolean> {
  sdkStarted ??= (async () => {
    try {
      const { AdMob } = await admob();
      // The plugin registers testingDevices only when initializeForTesting is true, so pass true
      // whenever there are test devices — a release build then still serves them test ads
      // (real ad unit for everyone else; the flag does nothing besides registering the devices).
      const testing = (await adsTestBuild()) || ADMOB_TEST_DEVICE_IDS.length > 0;
      await AdMob.initialize({ testingDevices: ADMOB_TEST_DEVICE_IDS, initializeForTesting: testing });
      return true;
    } catch (err) {
      console.warn('[silvr] ads SDK failed to start', err);
      sdkStarted = null;
      return false;
    }
  })();
  return sdkStarted;
}

/** Runs the consent form + ATT prompt if still needed, then starts the SDK. False = no ads allowed. */
async function ensureReady(): Promise<boolean> {
  try {
    markAdsUsed();
    const { AdMob } = await admob();
    let c = await readConsent();
    if (c.formNeeded) {
      await AdMob.showConsentForm();
      c = await readConsent();
    }
    if (!c.canRequestAds) {
      blocked.value = true; // the user declined; respect it for this session
      return false;
    }
    if (await attUndetermined()) await AdMob.requestTrackingAuthorization().catch(() => undefined);
    return await startSdk();
  } catch (err) {
    console.warn('[silvr] ads not ready', err);
    return false;
  }
}

function prepare(): Promise<void> {
  preparing ??= (async () => {
    try {
      const { AdMob } = await admob(); // first: the finally below must run after `preparing` is set
      const platform = nativePlatform();
      if (!platform) throw new Error('no native platform');
      await AdMob.prepareRewardVideoAd(rewardedUnit(platform, await adsTestBuild()));
      preloadedAt = Date.now();
    } finally {
      preparing = null;
    }
  })();
  return preparing;
}

const preloadFresh = () => preloadedAt > 0 && Date.now() - preloadedAt >= 0 && Date.now() - preloadedAt < PRELOAD_MAX_AGE_MS;

/**
 * Shows one rewarded ad. Resolves:
 *  'rewarded'    – the SDK's reward callback fired and +10 shots were credited
 *  'dismissed'   – closed before earning the reward (nothing credited)
 *  'failed'      – no fill / network / show error
 *  'unavailable' – web build, Pro user, today's 10 ads used, or consent declined
 */
export async function showRewarded(): Promise<RewardedResult> {
  if (!canWatchAds.value || blocked.value || quota.value.adsLeftToday <= 0 || adShowing.value) return 'unavailable';
  adShowing.value = true;
  try {
    if (!(await ensureReady())) return 'unavailable';
    const { AdMob, RewardAdPluginEvents } = await admob();
    if (preparing) await preparing.catch(() => undefined); // a warm-up still loading: use it
    if (!preloadFresh()) {
      preloadedAt = 0;
      try {
        await prepare();
      } catch (err) {
        console.warn('[silvr] rewarded ad did not load', err);
        return 'failed';
      }
    }
    preloadedAt = 0;
    let rewarded = false;
    const handles: { remove: () => Promise<void> }[] = [];
    const outcome = await new Promise<'closed' | 'failed'>((resolve) => {
      let done = false;
      const finish = (v: 'closed' | 'failed') => {
        if (done) return;
        done = true;
        resolve(v);
      };
      // A very long ad or a stuck SDK must not hold the UI forever.
      const timeout = setTimeout(() => finish('closed'), 5 * 60_000);
      void Promise.all([
        AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
          rewarded = true;
        }),
        // The reward callback can land just after the close callback: give it a moment.
        AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
          clearTimeout(timeout);
          setTimeout(() => finish('closed'), 400);
        }),
        AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => {
          clearTimeout(timeout);
          finish('failed');
        }),
      ]).then((hs) => {
        handles.push(...hs);
        // showRewardVideoAd resolves with the reward item (only when earned) — a second reward signal.
        AdMob.showRewardVideoAd().then(
          () => {
            rewarded = true;
          },
          (err) => {
            console.warn('[silvr] rewarded ad could not be shown', err);
            clearTimeout(timeout);
            finish('failed');
          },
        );
      });
    });
    await Promise.all(handles.map((h) => h.remove().catch(() => undefined)));
    if (rewarded) {
      const credited = await addAdReward().catch((err) => {
        console.warn('[silvr] ad reward not saved', err);
        return false;
      });
      return credited ? 'rewarded' : 'failed';
    }
    return outcome === 'failed' ? 'failed' : 'dismissed';
  } finally {
    adShowing.value = false;
    // Warm the next one so the following tap is instant (only while more ads are allowed today).
    if (canWatchAds.value && !blocked.value && quota.value.adsLeftToday > 0 && sdkStarted && !preloadFresh()) void prepare().catch(() => undefined);
  }
}

/** Reopens the UMP privacy options form (required entry point for EEA/UK users). */
export async function showPrivacyOptions(): Promise<void> {
  if (!nativePlatform()) return;
  const { AdMob } = await admob();
  await AdMob.showPrivacyOptionsForm();
  const c = await readConsent();
  blocked.value = !c.canRequestAds;
}
