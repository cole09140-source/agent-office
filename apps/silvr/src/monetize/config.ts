/**
 * Film Camela monetisation — every store / ad identifier and every business number lives HERE.
 * Nothing else in the app hard-codes a product id, ad unit id or quota.
 *
 * Accounts (owner decision, 2026-11): everything runs under the ONE Google account
 *   atiumcompany@gmail.com
 *   - Google Play Console: organisation "Muzig AI", developer id 5890194990164154086
 *   - Google Payments profile (merchant) for Play billing: the same account
 *   - AdMob: create the AdMob account while signed in as atiumcompany@gmail.com,
 *     then link the AdMob app to the Play app inside that same account.
 * See docs/11_MONETIZATION.md for the click-by-click steps.
 *
 * AdMob (2026-11-02): REAL app ids + rewarded units for Android and iOS (publisher
 * pub-6568578451894077). Debug / QA / dev builds always request Google's TEST rewarded unit,
 * so nobody clicks real ads while testing (see ADS_TEST_BUILD_FLAG and ads.ts adsTestBuild).
 * The AdMob APP id also lives in two native files (the SDK reads it before any JS runs):
 *   - android/app/src/main/res/values/strings.xml  → <string name="admob_app_id">
 *   - ios/App/App/Info.plist                       → GADApplicationIdentifier
 * tests/monetize-config.test.ts fails if the native copies drift from ADMOB_APP_ID below.
 */

// ---------------------------------------------------------------- business rules

/** Free shutter presses per local calendar day (reset at local midnight). */
export const FREE_SHOTS_PER_DAY = 10;
/** Shots added by one completed rewarded ad. Earned shots never expire. */
export const AD_REWARD_SHOTS = 10;
/** Rewarded ads a user may complete per local calendar day. */
export const MAX_ADS_PER_DAY = 10;

// ---------------------------------------------------------------- store products

/**
 * Product ids — identical in Google Play Console and App Store Connect.
 * Prices are set in the stores (USD 4.99 / 9.99 / 19.99 base); the app only ever shows the
 * localized price string the store returns, never a hard-coded price.
 */
export const PRODUCT_IDS = {
  week: 'filmcamela_pro_week',
  threeMonth: 'filmcamela_pro_3month',
  lifetime: 'filmcamela_pro_lifetime',
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];
export type ProductKind = 'week' | '3month' | 'lifetime';

export interface ProductDef {
  id: ProductId;
  kind: ProductKind;
  /** Auto-renewing subscription (Play "subscription" / App Store "auto-renewable subscription"). */
  subscription: boolean;
  /**
   * Google Play base plan id (required by Play Billing for subscriptions). Base plan ids must be
   * lowercase letters / digits / hyphens; create them exactly like this in Play Console.
   */
  playBasePlanId?: string;
  /** ISO-8601 billing period of the base plan / App Store subscription duration. */
  period?: 'P1W' | 'P3M';
  /** Reference price in USD (what to enter in the stores; the UI uses the store's string). */
  usd: number;
}

export const PRODUCTS: readonly ProductDef[] = [
  { id: PRODUCT_IDS.week, kind: 'week', subscription: true, playBasePlanId: 'p1w', period: 'P1W', usd: 4.99 },
  { id: PRODUCT_IDS.threeMonth, kind: '3month', subscription: true, playBasePlanId: 'p3m', period: 'P3M', usd: 9.99 },
  { id: PRODUCT_IDS.lifetime, kind: 'lifetime', subscription: false, usd: 19.99 },
];

export const PRO_PRODUCT_IDS: readonly string[] = PRODUCTS.map((p) => p.id);

export function productDef(id: string): ProductDef | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** App Store subscription group that holds both subscriptions (App Store Connect). */
export const IOS_SUBSCRIPTION_GROUP = 'Film Camela Pro';

// ---------------------------------------------------------------- entitlement cache

/**
 * How long a cached "Pro" answer is trusted while the store cannot be reached (offline,
 * Play services down). Lifetime purchases are trusted until the store says otherwise.
 * Subscriptions: until the known expiry + this grace, or (Android, where the device gets no
 * expiry date) until the last successful store check + this grace.
 */
export const ENTITLEMENT_OFFLINE_GRACE_MS = 3 * 24 * 60 * 60 * 1000;
/** Minimum gap between automatic store re-checks on app resume. */
export const ENTITLEMENT_RECHECK_MS = 60 * 1000;

// ---------------------------------------------------------------- AdMob

/** Google's sample AdMob publisher: ids under it are test ids (never paid, never policy strikes). */
export const GOOGLE_TEST_PUBLISHER = 'ca-app-pub-3940256099942544';
/** Film Camela's AdMob publisher (account atiumcompany@gmail.com). public/app-ads.txt lists it. */
export const ADMOB_PUBLISHER_ID = 'pub-6568578451894077';

/**
 * AdMob APP ids (format ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY), account atiumcompany@gmail.com.
 * The native SDK reads the app id from the manifest / Info.plist at launch, so it CANNOT be
 * switched at runtime: debug and release builds both carry the REAL app id (Google's
 * recommended setup — debug builds then use the TEST ad unit below, never real ads).
 * Keep these equal to strings.xml (Android) and Info.plist (iOS); tests/monetize-config.test.ts checks.
 */
export const ADMOB_APP_ID = {
  android: 'ca-app-pub-6568578451894077~3582572576',
  ios: 'ca-app-pub-6568578451894077~3646151750',
} as const;

/** REAL rewarded ad units (reward 10 × "shots") — used only by RELEASE builds. */
export const ADMOB_REWARDED_UNIT = {
  android: 'ca-app-pub-6568578451894077/6676086887',
  ios: 'ca-app-pub-6568578451894077/6933613890',
} as const;

/** Google's official TEST rewarded units — used by debug / QA / dev builds (see adsTestBuild in ads.ts). */
export const ADMOB_TEST_REWARDED_UNIT = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  ios: 'ca-app-pub-3940256099942544/1712485313',
} as const;

/**
 * Test device ids (hashed ids the Mobile Ads SDK prints to logcat / Xcode console on the first
 * ad request). Even a RELEASE build serves test ads to these devices — add the owner's and QA
 * phones so a real-ad click during testing can never count as invalid traffic.
 */
export const ADMOB_TEST_DEVICE_IDS: string[] = [];

/**
 * Build-time switch for QA builds: `VITE_ADS_TEST=1 npm run build` forces Google's test unit even
 * in a release-signed build (TestFlight / internal-testing QA). The Vite dev server is always test.
 * Android debug builds (assembleDebug, debuggable) are detected natively and are always test.
 */
export const ADS_TEST_BUILD_FLAG: boolean = import.meta.env.DEV || import.meta.env.VITE_ADS_TEST === '1';

export const isGoogleTestId = (id: string): boolean => id.startsWith(GOOGLE_TEST_PUBLISHER);

/** The rewarded unit for a platform: the test unit in test builds, else the real one. */
export function rewardedUnit(platform: 'android' | 'ios', testBuild: boolean): { adId: string; isTesting: boolean } {
  const adId = testBuild ? ADMOB_TEST_REWARDED_UNIT[platform] : ADMOB_REWARDED_UNIT[platform];
  return { adId, isTesting: testBuild || isGoogleTestId(adId) };
}

// ---------------------------------------------------------------- test escape hatch

/**
 * E2E / QA only: localStorage[UNLIMITED_FLAG] = '1' lifts the daily limit in the WEB build
 * (Playwright sets it in e2e/helpers.ts start()). Ignored in the native apps, so a store user
 * can never use it.
 */
export const UNLIMITED_FLAG = 'fc-unlimited';
