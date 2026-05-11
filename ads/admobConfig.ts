/**
 * AdMob config handoff scaffold.
 *
 * This file is NOT wired into the runtime yet.
 * It exists to give you one obvious place to paste your real AdMob IDs later.
 *
 * Recommended usage when you replace the mock adapter:
 * - Use the official Google test rewarded IDs in development.
 * - Use your real rewarded unit IDs in production builds.
 * - Keep App IDs in the Expo config plugin inside `app.json`.
 *
 * Important distinction:
 * - App IDs live in native/config-plugin setup.
 * - Ad unit IDs are used by the JS ad-loading code.
 */

export const ADMOB_NOTES = {
  /**
   * Paste your real AdMob App IDs into the Expo plugin config in `app.json`.
   * Do NOT paste rewarded ad unit IDs there.
   */
  appIdsGoIn: 'app.json -> expo.plugins -> react-native-google-mobile-ads',

  /**
   * Paste your real rewarded ad unit IDs in the placeholders below when you are
   * ready to swap from mock ads to real rewarded ads.
   */
  rewardedUnitsGoIn: 'ads/admobConfig.ts or your environment/config layer',
};

/**
 * Google's official demo rewarded ad unit IDs for safe development.
 * Safe to click during testing.
 */
export const ADMOB_TEST_REWARDED_IDS = {
  android: 'ca-app-pub-3940256099942544/5224354917',
  // Official iOS test rewarded ad unit ID from Google's test ads docs.
  ios: 'ca-app-pub-3940256099942544/1712485313',
} as const;

/**
 * Replace these with your real rewarded ad unit IDs later.
 * Keep them empty until you are ready to use production ads.
 */
export const ADMOB_PRODUCTION_REWARDED_IDS = {
  android: '', // ex: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx'
  ios: '', // ex: 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx'
} as const;

/**
 * Example helper you can use later when wiring the real SDK.
 *
 * Right now this file is only documentation/scaffolding. Nothing imports it.
 */
export function getRewardedAdUnitId(platform: 'android' | 'ios', useTestIds: boolean) {
  if (useTestIds) {
    return ADMOB_TEST_REWARDED_IDS[platform];
  }

  return ADMOB_PRODUCTION_REWARDED_IDS[platform];
}
