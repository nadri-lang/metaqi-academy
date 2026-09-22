import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RewardedInterstitialAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { INTERSTITIAL_AD_UNIT_ID } from '@/src/constants/Ads';
import { useAuth } from '@/src/context/AuthContext';

/**
 * Full-screen rewarded-interstitial ad shown right when a free
 * (non-subscriber) user starts a consultation - calculator/oracle submit,
 * or opening a free Energía screen. Auto-shown like a plain interstitial
 * (no separate "watch ad" opt-in button), but pays better per view.
 * Premium users (subscription, staff, or a valid rewarded-ad temp-access
 * window) never see it.
 *
 * Usage: call `showBeforeConsultation(runConsultation)` where
 * `runConsultation` is the function that actually performs the
 * calculation/navigation - it runs immediately if the viewer has premium
 * access or no ad is ready, otherwise it runs once the ad closes (never
 * blocked waiting on an ad that failed to load).
 */
export function useInterstitialAd() {
  const { user } = useAuth();
  const adRef = useRef<RewardedInterstitialAd | null>(null);
  const [isReady, setIsReady] = useState(false);
  const hasPremiumAccess = hasPremiumAccessFromUser(user);

  const loadAd = useCallback(() => {
    if (hasPremiumAccess) return () => {};

    setIsReady(false);
    const ad = RewardedInterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsReady(true);
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      setIsReady(false);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsReady(false);
      // Preload the next one for the following consultation.
      loadAd();
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubError();
      unsubClosed();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPremiumAccess]);

  useEffect(() => {
    const cleanup = loadAd();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPremiumAccess]);

  const showBeforeConsultation = useCallback(
    (runConsultation: () => void) => {
      if (hasPremiumAccess || !adRef.current || !isReady) {
        runConsultation();
        return;
      }
      const ad = adRef.current;
      const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
        unsubClosed();
        runConsultation();
      });
      const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
        unsubError();
        unsubClosed();
        runConsultation();
      });
      ad.show().catch(() => runConsultation());
    },
    [hasPremiumAccess, isReady]
  );

  return { showBeforeConsultation, isReady, hasPremiumAccess };
}

function hasPremiumAccessFromUser(user: { role?: string; has_active_subscription?: boolean; temp_access_until?: string | null } | null): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'editor') return true;
  if (user.has_active_subscription) return true;
  if (!user.temp_access_until) return false;
  return new Date(user.temp_access_until).getTime() > Date.now();
}
