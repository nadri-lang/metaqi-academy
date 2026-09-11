import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PRIVACY_POLICY_URL } from '@/src/constants/Legal';
import { CONTACT_EMAIL } from '@/src/constants/Contact';
import { SUBSCRIPTION_MONTHLY_PRICE } from '@/src/constants/Subscription';
import { confirmAsync } from '@/src/utils/confirmDialog';
import api from '@/src/services/api';

interface SocialLinks {
  social_facebook_url?: string;
  social_instagram_url?: string;
  social_tiktok_url?: string;
  social_youtube_url?: string;
}

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  useEffect(() => {
    if (user) {
      api.get('/app-config')
        .then((res) => setSocialLinks(res.data || {}))
        .catch((error) => console.error('Error loading app config:', error));
    }
  }, [user?.id]);

  const handleLogout = async () => {
    const confirmed = await confirmAsync(t('common.logout'), t('profile.logout_confirm'), t('common.logout'));
    if (!confirmed) return;
    await logout();
  };

  const openInApp = (url?: string, title?: string) => {
    if (!url) return;
    setContactModalVisible(false);
    router.push({ pathname: '/webview', params: { url, title: title || '' } });
  };

  const handlePrivacyPolicy = () => {
    router.push({ pathname: '/webview', params: { url: PRIVACY_POLICY_URL, title: t('profile.privacy_policy') } });
  };

  const handleSubscribe = () => {
    Alert.alert(t('profile.subscription_title'), t('profile.subscription_coming_soon'));
  };

  const contactModal = (
    <Modal
      visible={contactModalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setContactModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('profile.contact')}</Text>
            <TouchableOpacity testID="contact-modal-close" onPress={() => setContactModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.contactRow}>
            <MaterialCommunityIcons name="email-outline" size={22} color={Colors.accent} />
            <Text style={styles.contactRowText}>{CONTACT_EMAIL}</Text>
          </View>

          {socialLinks.social_facebook_url ? (
            <TouchableOpacity testID="contact-facebook" style={styles.contactRow} onPress={() => openInApp(socialLinks.social_facebook_url, 'Facebook')}>
              <MaterialCommunityIcons name="facebook" size={22} color={Colors.accent} />
              <Text style={styles.contactRowText}>Facebook</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}

          {socialLinks.social_instagram_url ? (
            <TouchableOpacity testID="contact-instagram" style={styles.contactRow} onPress={() => openInApp(socialLinks.social_instagram_url, 'Instagram')}>
              <MaterialCommunityIcons name="instagram" size={22} color={Colors.accent} />
              <Text style={styles.contactRowText}>Instagram</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}

          {socialLinks.social_tiktok_url ? (
            <TouchableOpacity testID="contact-tiktok" style={styles.contactRow} onPress={() => openInApp(socialLinks.social_tiktok_url, 'TikTok')}>
              <MaterialCommunityIcons name="music-note" size={22} color={Colors.accent} />
              <Text style={styles.contactRowText}>TikTok</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}

          {socialLinks.social_youtube_url ? (
            <TouchableOpacity testID="contact-youtube" style={styles.contactRow} onPress={() => openInApp(socialLinks.social_youtube_url, 'YouTube')}>
              <MaterialCommunityIcons name="youtube" size={22} color={Colors.accent} />
              <Text style={styles.contactRowText}>YouTube</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );

  const handleCancelSubscription = async () => {
    const confirmed = await confirmAsync(
      t('profile.subscription_cancel_confirm_title'),
      t('profile.subscription_cancel_confirm_message'),
      t('profile.subscription_cancel_button'),
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      await api.post('/auth/request-cancellation');
      await refreshUser();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo enviar la solicitud');
    } finally {
      setCancelling(false);
    }
  };

  // Not logged in view
  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={Gradients.navy} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>{t('profile.welcome_to')}</Text>
              <Text style={styles.headerTitle}>{t('profile.academy')}</Text>
              <Text style={styles.headerSubtitle}>{t('profile.subtitle_guest')}</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            testID="profile-login-btn"
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <MaterialCommunityIcons name="login" size={20} color={Colors.primary} />
            <Text style={styles.primaryButtonText}>{t('common.login')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="profile-register-btn"
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.secondaryButtonText}>{t('profile.create_account')}</Text>
          </TouchableOpacity>

          {/* Benefits Section */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>{t('profile.benefits')}</Text>
            
            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="heart" size={20} color={Colors.accent} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitLabel}>{t('profile.benefit_favorites')}</Text>
                <Text style={styles.benefitDesc}>{t('profile.benefit_favorites_desc')}</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="book-open-variant" size={20} color={Colors.accent} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitLabel}>{t('profile.benefit_progress')}</Text>
                <Text style={styles.benefitDesc}>{t('profile.benefit_progress_desc')}</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="shimmer" size={20} color={Colors.accent} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitLabel}>{t('profile.benefit_services')}</Text>
                <Text style={styles.benefitDesc}>{t('profile.benefit_services_desc')}</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <MaterialCommunityIcons name="star" size={20} color={Colors.accent} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitLabel}>{t('profile.benefit_premium')}</Text>
                <Text style={styles.benefitDesc}>{t('profile.benefit_premium_desc')}</Text>
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <TouchableOpacity style={styles.infoItem} testID="info-contact-btn" onPress={() => setContactModalVisible(true)}>
              <MaterialCommunityIcons name="email" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{t('profile.contact')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoItem} testID="info-privacy-btn" onPress={handlePrivacyPolicy}>
              <MaterialCommunityIcons name="shield-lock-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{t('profile.privacy_policy')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        {contactModal}
      </View>
    );
  }

  // Logged in view
  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.userHeader}>
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="account" size={40} color={Colors.accent} />
            </View>
            <Text style={styles.userName}>{user.display_name || user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            {user.has_active_subscription ? (
              <View style={styles.premiumBadge}>
                <MaterialCommunityIcons name="star" size={14} color={Colors.primary} />
                <Text style={styles.premiumBadgeText}>{t('profile.premium_member')}</Text>
              </View>
            ) : (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>{t('profile.free_member')}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Admin Panel Link - Only for admins */}
        {(user.role === 'admin' || user.role === 'editor') && (
          <TouchableOpacity
            testID="admin-panel-btn"
            style={styles.adminButton}
            onPress={() => router.push('/admin')}
          >
            <LinearGradient
              colors={Gradients.gold}
              style={styles.adminGradient}
            >
              <MaterialCommunityIcons name="cog" size={22} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.adminButtonText}>{t('profile.admin_panel')}</Text>
                <Text style={styles.adminButtonDesc}>{t('profile.admin_panel_desc')}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.primary} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Tu Suscripción - Only for non-admin users */}
        {user.role !== 'admin' && user.role !== 'editor' && (
          <View style={styles.subscriptionCard}>
            <Text style={styles.subscriptionCardTitle}>{t('profile.subscription_title')}</Text>

            {user.has_active_subscription ? (
              <>
                <View style={styles.subscriptionActiveRow}>
                  <MaterialCommunityIcons name="star-circle" size={20} color={Colors.jade} />
                  <Text style={styles.subscriptionActiveText}>
                    {t('profile.subscription_active_label').replace(
                      '{plan}',
                      user.subscription === 'yearly'
                        ? t('profile.subscription_plan_yearly')
                        : t('profile.subscription_plan_monthly')
                    )}
                  </Text>
                </View>

                <Text style={styles.subscriptionIncludesTitle}>{t('profile.subscription_includes_title')}</Text>
                {[
                  'profile.subscription_benefit_daily',
                  'profile.subscription_benefit_monthly',
                  'profile.subscription_benefit_vocation',
                  'profile.subscription_benefit_journal',
                ].map((key) => (
                  <View key={key} style={styles.subscriptionBenefitRow}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={Colors.jade} />
                    <Text style={styles.subscriptionBenefitText}>{t(key)}</Text>
                  </View>
                ))}

                {user.cancellation_requested_at ? (
                  <View style={styles.subscriptionCancelledNotice}>
                    <MaterialCommunityIcons name="information" size={18} color={Colors.textSecondary} />
                    <Text style={styles.subscriptionCancelledText}>
                      {t('profile.subscription_cancel_requested')}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    testID="cancel-subscription-btn"
                    style={[styles.subscriptionCancelButton, cancelling && styles.saveButtonDisabled]}
                    onPress={handleCancelSubscription}
                    disabled={cancelling}
                  >
                    <Text style={styles.subscriptionCancelButtonText}>
                      {t('profile.subscription_cancel_button')}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                <Text style={styles.subscriptionNoneTitle}>{t('profile.subscription_none_title')}</Text>
                <Text style={styles.subscriptionIncludesTitle}>{t('profile.subscription_none_desc')}</Text>
                {[
                  'profile.subscription_benefit_daily',
                  'profile.subscription_benefit_monthly',
                  'profile.subscription_benefit_vocation',
                  'profile.subscription_benefit_journal',
                ].map((key) => (
                  <View key={key} style={styles.subscriptionBenefitRow}>
                    <MaterialCommunityIcons name="check-circle-outline" size={16} color={Colors.accent} />
                    <Text style={styles.subscriptionBenefitText}>{t(key)}</Text>
                  </View>
                ))}

                <TouchableOpacity
                  testID="subscribe-cta-btn"
                  style={styles.subscribeButton}
                  onPress={handleSubscribe}
                >
                  <MaterialCommunityIcons name="star" size={20} color={Colors.white} />
                  <Text style={styles.subscribeButtonText}>
                    {t('profile.subscription_cta_price').replace('{price}', SUBSCRIPTION_MONTHLY_PRICE)}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* User Menu - Only for non-admin users */}
        {user.role !== 'admin' && user.role !== 'editor' && (
          <View style={styles.menuSection}>
            <TouchableOpacity
              style={styles.menuItem}
              testID="menu-favorites"
              onPress={() => router.push('/my-favorites')}
            >
              <MaterialCommunityIcons name="heart" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuText}>{t('profile.my_favorites')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              testID="menu-edit-profile"
              onPress={() => router.push('/edit-profile')}
            >
              <MaterialCommunityIcons name="account-edit-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuText}>{t('profile.edit_profile')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              testID="menu-journal"
              onPress={() => router.push('/my-journal')}
            >
              <MaterialCommunityIcons name="notebook-outline" size={22} color={Colors.accent} />
              <Text style={styles.menuText}>{t('profile.my_journal')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              testID="menu-purchases"
              onPress={() => router.push('/my-purchases')}
            >
              <MaterialCommunityIcons name="shopping" size={22} color={Colors.accent} />
              <Text style={styles.menuText}>
                {t('profile.my_purchases')}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              testID="menu-contact"
              onPress={() => setContactModalVisible(true)}
            >
              <MaterialCommunityIcons name="email" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuText}>{t('profile.contact')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              testID="menu-privacy"
              onPress={handlePrivacyPolicy}
            >
              <MaterialCommunityIcons name="shield-lock-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuText}>{t('profile.privacy_policy')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          testID="logout-btn"
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
      {contactModal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  headerLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
  },
  userHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.7,
    marginBottom: Spacing.md,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  premiumBadgeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  freeBadge: {
    backgroundColor: Colors.white + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  freeBadgeText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.white,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  secondaryButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.accent,
  },
  benefitsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  benefitsTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  benefitTextContainer: { flex: 1 },
  benefitLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  benefitDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  subscriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  subscriptionCardTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  subscriptionActiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  subscriptionActiveText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  subscriptionNoneTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subscriptionIncludesTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  subscriptionBenefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  subscriptionBenefitText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  subscriptionCancelButton: {
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  subscriptionCancelButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.error,
  },
  subscriptionCancelledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  subscriptionCancelledText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  subscribeButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  menuSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  menuText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  logoutText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.error,
  },
  adminButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  adminGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  adminButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  adminButtonDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.primary,
    opacity: 0.7,
    marginTop: 2,
  },
  adminOnlyBadge: {
    backgroundColor: Colors.accent + '30',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.xs,
  },
  adminOnlyText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 10,
    color: Colors.accent,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  contactRowText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
});
