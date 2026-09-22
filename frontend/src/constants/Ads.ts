import { Platform } from 'react-native';

// Google's official rewarded-ad test unit IDs - always work, never earn real
// money, and are safe to ship while the real AdMob account/app is pending
// review. Swap in real ad unit IDs (from AdMob > Ad units) via these env vars
// once the AdMob account is approved, following the same EXPO_PUBLIC_ pattern
// as EXPO_PUBLIC_BACKEND_URL in src/services/api.ts.
const TEST_REWARDED_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/1712485313',
  android: 'ca-app-pub-3940256099942544/5224354917',
  default: 'ca-app-pub-3940256099942544/5224354917',
});

export const REWARDED_AD_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_REWARDED_UNIT_ID || TEST_REWARDED_UNIT_ID;

// Hours of temporary premium access granted per completed rewarded ad.
// Keep in sync with backend/server.py's grant_ad_reward endpoint.
export const REWARD_ACCESS_HOURS = 24;

// Google's official rewarded-interstitial test unit IDs - same swap-in
// pattern as REWARDED_AD_UNIT_ID above. A rewarded interstitial (not a
// plain interstitial) is shown right when a free user starts a
// consultation (calculator/oracle submit, or opening a free Energía
// screen) - full-screen and auto-shown like a plain interstitial, but
// pays better per view since it's the "watch it to get your reward"
// format. Premium users never see it, see useInterstitialAd.
const TEST_REWARDED_INTERSTITIAL_UNIT_ID = Platform.select({
  ios: 'ca-app-pub-3940256099942544/6978759866',
  android: 'ca-app-pub-3940256099942544/5354046379',
  default: 'ca-app-pub-3940256099942544/5354046379',
});

export const INTERSTITIAL_AD_UNIT_ID =
  process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_UNIT_ID || TEST_REWARDED_INTERSTITIAL_UNIT_ID;
