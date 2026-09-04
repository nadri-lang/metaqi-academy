import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { useLanguage } from '@/src/context/LanguageContext';
import { useRewardedAd } from '@/src/hooks/use-rewarded-ad';

interface RewardedAccessButtonProps {
  /** Called once after the reward is granted and the user's access has refreshed. */
  onUnlocked?: () => void;
}

/**
 * Optional "watch an ad for extra access" button. Renders nothing once the
 * user already has premium access (subscription or an active reward), so
 * it's safe to drop at the top of any gated section.
 */
export function RewardedAccessButton({ onUnlocked }: RewardedAccessButtonProps) {
  const { t } = useLanguage();
  const { show, isReady, isLoading, isGranting, hasPremiumAccess } = useRewardedAd();
  const wasGranting = useRef(false);

  useEffect(() => {
    if (wasGranting.current && !isGranting && hasPremiumAccess) {
      onUnlocked?.();
    }
    wasGranting.current = isGranting;
  }, [isGranting, hasPremiumAccess, onUnlocked]);

  if (hasPremiumAccess) return null;

  const busy = isLoading || isGranting;

  return (
    <TouchableOpacity
      style={[styles.button, !isReady && styles.buttonDisabled]}
      onPress={show}
      disabled={!isReady || busy}
      testID="rewarded-access-btn"
    >
      {busy ? (
        <ActivityIndicator size="small" color={Colors.primary} />
      ) : (
        <MaterialCommunityIcons name="play-circle-outline" size={20} color={Colors.primary} />
      )}
      <Text style={styles.text}>
        {isGranting ? t('ads.granting') : t('ads.watch_button')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  text: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
