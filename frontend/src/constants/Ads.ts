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
