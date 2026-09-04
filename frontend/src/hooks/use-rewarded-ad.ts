import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { REWARDED_AD_UNIT_ID } from '@/src/constants/Ads';
import api from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';

/**
 * Loads a rewarded ad and, once the viewer earns the reward, calls the
 * backend to grant 24h of temporary premium access (POST /ads/grant-reward)
 * and refreshes the logged-in user so gated screens unlock immediately.
 *
 * NOT wired into any screen yet - see chat notes on where/whether to gate
 * "activations" behind it before adding a <RewardedAccessButton /> there.
 */
export function useRewardedAd() {
  const { user, refreshUser } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adRef = useRef<RewardedAd | null>(null);

  const loadAd = useCallback(() => {
    setIsReady(false);
    setError(null);
    setIsLoading(true);

    const ad = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: false,
    });
    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsLoading(false);
      setIsReady(true);
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, (err) => {
      setIsLoading(false);
      setIsReady(false);
      setError(err?.message || 'ad_load_failed');
    });

    const unsubEarned = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        try {
          setIsGranting(true);
          await api.post('/ads/grant-reward');
          await refreshUser();
        } catch (e) {
          setError('grant_failed');
        } finally {
          setIsGranting(false);
        }
      }
    );

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setIsReady(false);
      // Preload the next one so the button is ready again without a visible wait.
      loadAd();
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubError();
      unsubEarned();
      unsubClosed();
    };
  }, [refreshUser]);

  useEffect(() => {
    const cleanup = loadAd();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const show = useCallback(async () => {
    if (!adRef.current || !isReady) return;
    try {
      await adRef.current.show();
    } catch (e) {
      setError('ad_show_failed');
    }
  }, [isReady]);

  return {
    show,
    isReady,
    isLoading,
    isGranting,
    error,
    hasPremiumAccess: hasPremiumAccessFromUser(user),
  };
}

function hasPremiumAccessFromUser(user: { has_active_subscription?: boolean; temp_access_until?: string | null } | null): boolean {
  if (!user) return false;
  if (user.has_active_subscription) return true;
  if (!user.temp_access_until) return false;
  return new Date(user.temp_access_until).getTime() > Date.now();
}
