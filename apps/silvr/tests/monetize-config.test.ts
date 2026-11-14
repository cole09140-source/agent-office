import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ADMOB_APP_ID, ADMOB_PUBLISHER_ID, ADMOB_REWARDED_UNIT, ADMOB_TEST_REWARDED_UNIT, isGoogleTestId, rewardedUnit } from '../src/monetize/config';

const read = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), 'utf8');

describe('monetize config stays in sync with the native projects', () => {
  it('Android strings.xml admob_app_id equals ADMOB_APP_ID.android and the manifest uses it', () => {
    const strings = read('android/app/src/main/res/values/strings.xml');
    expect(strings.match(/<string name="admob_app_id"[^>]*>([^<]+)<\/string>/)?.[1]).toBe(ADMOB_APP_ID.android);
    const manifest = read('android/app/src/main/AndroidManifest.xml');
    expect(manifest).toMatch(/com\.google\.android\.gms\.ads\.APPLICATION_ID"\s+android:value="@string\/admob_app_id"/);
  });

  it('iOS Info.plist GADApplicationIdentifier equals ADMOB_APP_ID.ios and ATT text exists', () => {
    const plist = read('ios/App/App/Info.plist');
    expect(plist.match(/<key>GADApplicationIdentifier<\/key>\s*<string>([^<]+)<\/string>/)?.[1]).toBe(ADMOB_APP_ID.ios);
    expect(plist).toContain('<key>NSUserTrackingUsageDescription</key>');
    expect(plist).toContain('cstr6suwn9.skadnetwork');
  });

  it('Korean ATT text is bundled (ko.lproj/InfoPlist.strings registered in the Xcode project)', () => {
    expect(read('ios/App/App/ko.lproj/InfoPlist.strings')).toMatch(/"NSUserTrackingUsageDescription" = ".*Google AdMob.*";/);
    expect(read('ios/App/App.xcodeproj/project.pbxproj')).toContain('path = ko.lproj/InfoPlist.strings;');
  });

  it('store package / bundle id is com.filmcamela.app everywhere', () => {
    const id = 'com.filmcamela.app';
    expect(JSON.parse(read('capacitor.config.json')).appId).toBe(id);
    expect(read('android/app/build.gradle')).toContain(`applicationId "${id}"`);
    const bundleIds = read('ios/App/App.xcodeproj/project.pbxproj').match(/PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);/g) ?? [];
    expect(bundleIds.length).toBeGreaterThan(0);
    for (const line of bundleIds) expect(line).toBe(`PRODUCT_BUNDLE_IDENTIFIER = ${id};`);
  });

  it('ids have the AdMob shapes (app id has "~", ad unit has "/")', () => {
    for (const id of Object.values(ADMOB_APP_ID)) expect(id).toMatch(/^ca-app-pub-\d{16}~\d{10}$/);
    for (const id of [...Object.values(ADMOB_REWARDED_UNIT), ...Object.values(ADMOB_TEST_REWARDED_UNIT)]) expect(id).toMatch(/^ca-app-pub-\d{16}\/\d{10}$/);
  });

  it('release builds use the real units of the same publisher as the app id; test builds use Google test units', () => {
    for (const platform of ['android', 'ios'] as const) {
      const app = ADMOB_APP_ID[platform];
      const real = ADMOB_REWARDED_UNIT[platform];
      // A real unit only works under its own app id (same publisher) — never pair a real unit with a test app id.
      expect(real.split('/')[0], platform).toBe(app.split('~')[0]);
      expect(isGoogleTestId(ADMOB_TEST_REWARDED_UNIT[platform])).toBe(true);
      expect(rewardedUnit(platform, true)).toEqual({ adId: ADMOB_TEST_REWARDED_UNIT[platform], isTesting: true });
      expect(rewardedUnit(platform, false)).toEqual({ adId: real, isTesting: isGoogleTestId(real) });
    }
  });

  it('public/app-ads.txt authorises the AdMob publisher', () => {
    expect(read('public/app-ads.txt').trim()).toBe(`google.com, ${ADMOB_PUBLISHER_ID}, DIRECT, f08c47fec0942fa0`);
    expect(ADMOB_APP_ID.android).toContain(ADMOB_PUBLISHER_ID.replace('pub-', 'ca-app-pub-'));
    expect(readdirSync(new URL('../public', import.meta.url))).toContain('app-ads.txt');
  });
});
