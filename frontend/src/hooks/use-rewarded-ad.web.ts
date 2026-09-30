import { useCallback } from 'react';

/**
 * Web build: react-native-google-mobile-ads is a native-only module (it
 * pulls in codegenNativeComponent, which breaks the Metro web bundle if
 * imported at all). AdMob isn't wired up for web, so "watch an ad" is
 * simply never available here - RewardedAccessButton hides itself on web.
 */
export function useRewardedAd() {
  const show = useCallback(async () => {}, []);

  return {
    show,
    isReady: false,
    isLoading: false,
    isGranting: false,
    error: null as string | null,
    hasPremiumAccess: false,
  };
}
