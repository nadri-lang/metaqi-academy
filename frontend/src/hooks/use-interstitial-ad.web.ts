import { useCallback } from 'react';

/**
 * Web build: react-native-google-mobile-ads is a native-only module (it
 * pulls in codegenNativeComponent, which breaks the Metro web bundle if
 * imported at all). AdMob isn't wired up for web, so this stub just runs
 * the consultation immediately, with no ad step.
 */
export function useInterstitialAd() {
  const showBeforeConsultation = useCallback((runConsultation: () => void) => {
    runConsultation();
  }, []);

  return { showBeforeConsultation, isReady: false, hasPremiumAccess: false };
}
