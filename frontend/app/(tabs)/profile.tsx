import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      t('common.logout'),
      t('profile.logout_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleContact = () => {
    Linking.openURL('mailto:r.scala1108@gmail.com?subject=Contacto desde MetaQi Academy');
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
            <TouchableOpacity style={styles.infoItem} testID="info-contact-btn" onPress={handleContact}>
              <MaterialCommunityIcons name="email" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>{t('profile.contact')}</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </ScrollView>
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
            <Text style={styles.userName}>{user.name}</Text>
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

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} testID="menu-favorites">
            <MaterialCommunityIcons name="heart" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>{t('profile.my_favorites')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            testID="menu-bazi-report"
            onPress={() => router.push('/my-bazi-report')}
          >
            <MaterialCommunityIcons name="yin-yang" size={22} color={Colors.accent} />
            <Text style={styles.menuText}>{t('bazi.my_report')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} testID="menu-data">
            <MaterialCommunityIcons name="account-outline" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>
              {t('profile.my_data') || (user.language === 'es' ? 'Mis Datos' : 'My Data')}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          {(user.role === 'admin' || user.role === 'editor') && (
            <TouchableOpacity style={styles.menuItem} testID="menu-about">
              <MaterialCommunityIcons name="information" size={22} color={Colors.textSecondary} />
              <Text style={styles.menuText}>{t('profile.about')}</Text>
              <View style={styles.adminOnlyBadge}>
                <Text style={styles.adminOnlyText}>Admin</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.menuItem} 
            testID="menu-contact"
            onPress={handleContact}
          >
            <MaterialCommunityIcons name="email" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>{t('profile.contact')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          testID="logout-btn"
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>{t('common.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
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
});
