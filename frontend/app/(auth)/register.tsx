import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { t } = useLanguage();
  const router = useRouter();

  const goToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <View style={styles.headerNav}>
          <TouchableOpacity
            testID="register-back-btn"
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {t('auth.signup')}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="google" size={80} color={Colors.accent} />
        </View>

        <Text style={styles.title}>
          {t('auth.continue_with_google')}
        </Text>

        <Text style={styles.description}>
          {t('auth.access_description')}
        </Text>

        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="shield-check" size={24} color={Colors.jade} />
            <Text style={styles.benefitText}>
              {t('auth.safe_secure')}
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="lightning-bolt" size={24} color={Colors.accent} />
            <Text style={styles.benefitText}>
              {t('auth.instant_access')}
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <MaterialCommunityIcons name="account-check" size={24} color={Colors.jade} />
            <Text style={styles.benefitText}>
              {t('auth.no_password_needed')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={goToLogin}
        >
          <MaterialCommunityIcons name="google" size={24} color={Colors.primary} />
          <Text style={styles.googleButtonText}>
            {t('auth.continue_with_google')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={goToLogin}
        >
          <Text style={styles.loginLinkText}>
            {t('auth.already_have_account')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: Spacing.xl,
  },
  headerNav: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  benefitText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  googleButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.lg,
    color: Colors.primary,
  },
  loginLink: {
    paddingVertical: Spacing.sm,
  },
  loginLinkText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.accent,
    textAlign: 'center',
  },
});
