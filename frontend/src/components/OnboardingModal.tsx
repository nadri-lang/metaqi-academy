import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { useLanguage } from '@/src/context/LanguageContext';
import { usePushRegistration } from '@/src/hooks/use-push-registration';
import { PRIVACY_POLICY_URL } from '@/src/constants/Legal';
import api from '@/src/services/api';

/**
 * First-launch onboarding: combines the push-notification opt-in (+ optional
 * phone number) and privacy-policy acceptance in one skippable screen - see
 * INCIDENTA 6. Shown once per device; the parent decides when (after
 * authentication) and persists the "seen" flag.
 */
export default function OnboardingModal({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  const { t } = useLanguage();
  const { register } = usePushRegistration();
  const [notifStatus, setNotifStatus] = useState<'idle' | 'enabling' | 'enabled'>('idle');
  const [phone, setPhone] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleEnableNotifications = async () => {
    setNotifStatus('enabling');
    const ok = await register();
    setNotifStatus(ok ? 'enabled' : 'idle');
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const update: Record<string, any> = {};
      if (phone.trim()) update.phone = phone.trim();
      if (privacyAccepted) update.privacy_policy_accepted_at = new Date().toISOString();
      if (Object.keys(update).length > 0) {
        await api.patch('/auth/me', update).catch((error) => {
          console.warn('[OnboardingModal] could not save profile:', error);
        });
      }
    } finally {
      setSaving(false);
      onDismiss();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <Text style={styles.title}>{t('onboarding.title')}</Text>

              {/* Notifications */}
              <View style={styles.card}>
                <MaterialCommunityIcons name="bell-ring-outline" size={28} color={Colors.accent} />
                <Text style={styles.cardHeading}>{t('onboarding.notifications_heading')}</Text>
                <Text style={styles.cardDesc}>{t('onboarding.notifications_desc')}</Text>

                {notifStatus === 'enabled' ? (
                  <View style={styles.confirmRow}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
                    <Text style={styles.confirmText}>{t('onboarding.notifications_enabled_confirm')}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    testID="onboarding-enable-notifications"
                    style={styles.primaryButton}
                    onPress={handleEnableNotifications}
                    disabled={notifStatus === 'enabling'}
                    activeOpacity={0.8}
                  >
                    {notifStatus === 'enabling' ? (
                      <ActivityIndicator color={Colors.primary} />
                    ) : (
                      <Text style={styles.primaryButtonText}>{t('onboarding.enable_notifications_btn')}</Text>
                    )}
                  </TouchableOpacity>
                )}

                <Text style={styles.fieldLabel}>{t('onboarding.phone_label')}</Text>
                <TextInput
                  testID="onboarding-phone-input"
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('onboarding.phone_placeholder')}
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                />
                <Text style={styles.explanation}>{t('onboarding.phone_explanation')}</Text>
              </View>

              {/* Privacy policy */}
              <View style={styles.card}>
                <TouchableOpacity
                  testID="onboarding-privacy-checkbox"
                  style={styles.checkboxRow}
                  onPress={() => setPrivacyAccepted(!privacyAccepted)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={privacyAccepted ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={privacyAccepted ? Colors.accent : Colors.textLight}
                  />
                  <Text style={styles.checkboxLabel}>{t('onboarding.privacy_checkbox_label')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
                  <Text style={styles.linkText}>{t('onboarding.privacy_link_text')}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                testID="onboarding-continue"
                style={[styles.primaryButton, styles.continueButton]}
                onPress={handleFinish}
                disabled={saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('onboarding.continue_btn')}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity testID="onboarding-skip" style={styles.skipButton} onPress={onDismiss}>
                <Text style={styles.skipButtonText}>{t('onboarding.skip_btn')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeading: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  confirmText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.success,
  },
  fieldLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
  },
  explanation: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  linkText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.accent,
    marginLeft: Spacing['2xl'],
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  continueButton: {
    marginTop: Spacing.sm,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  skipButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
});
