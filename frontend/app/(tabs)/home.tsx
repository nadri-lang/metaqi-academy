import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage, Language } from '@/src/context/LanguageContext';
import api from '@/src/services/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DailyEnergy {
  id: string;
  date: string;
  title: string;
  title_en?: string;
}

interface NewbornVocation {
  id: string;
  date: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, localizeContent, language, setLanguage } = useLanguage();
  const router = useRouter();
  const [dailyEnergy, setDailyEnergy] = useState<DailyEnergy | null>(null);
  const [newbornVocation, setNewbornVocation] = useState<NewbornVocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const languages = [
    { code: 'es' as Language, flag: '🇪🇸', label: 'ES' },
    { code: 'en' as Language, flag: '🇬🇧', label: 'EN' },
    { code: 'fr' as Language, flag: '🇫🇷', label: 'FR' },
    { code: 'de' as Language, flag: '🇩🇪', label: 'DE' },
    { code: 'ro' as Language, flag: '🇷🇴', label: 'RO' },
    { code: 'pt' as Language, flag: '🇵🇹', label: 'PT' },
  ];

  useEffect(() => {
    loadData();
  }, [language]);

  const loadData = async () => {
    try {
      const [dailyRes, vocationRes] = await Promise.allSettled([
        api.get('/energy/daily', { params: { lang: language } }),
        api.get('/newborn-vocation/today', { params: { lang: language } }),
      ]);

      if (dailyRes.status === 'fulfilled') setDailyEnergy(dailyRes.value.data);
      if (vocationRes.status === 'fulfilled') setNewbornVocation(vocationRes.value.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLanguageSelect = async (langCode: Language) => {
    await setLanguage(langCode);
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: 'Descubre MetaQi Academy - Tu guía de metafísica china | Discover MetaQi Academy - Your Chinese metaphysics guide',
        title: 'MetaQi Academy',
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header - brand mark, language pills, share/login */}
        <LinearGradient colors={Gradients.navy} style={styles.header}>
          <View style={styles.headerTopRow}>
            {user ? (
              <Text style={styles.greeting} numberOfLines={1}>{t('home.welcome')}, {user.name}</Text>
            ) : (
              <View />
            )}
            <View style={styles.headerActions}>
              <TouchableOpacity
                testID="share-button"
                style={styles.iconButton}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={18} color={Colors.white} />
              </TouchableOpacity>
              {!user && (
                <TouchableOpacity
                  testID="header-login-btn"
                  style={styles.loginButton}
                  onPress={() => router.push('/(auth)/login')}
                >
                  <Text style={styles.loginButtonText}>{t('common.enter')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.brandBlock}>
            <Text style={styles.logo}>MetaQi</Text>
            <Text style={styles.subtitle}>{t('home.academy')}</Text>
            <View style={styles.brandDivider} />
          </View>

          <View style={styles.languageRow} testID="language-selector">
            {languages.map((lang) => {
              const active = lang.code === language;
              return (
                <TouchableOpacity
                  key={lang.code}
                  testID={`language-option-${lang.code}`}
                  style={[styles.languagePill, active && styles.languagePillActive]}
                  onPress={() => handleLanguageSelect(lang.code)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.languagePillFlag}>{lang.flag}</Text>
                  <Text style={[styles.languagePillText, active && styles.languagePillTextActive]}>
                    {lang.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>

        {/* Hero - Energía del Día */}
        <View style={styles.section}>
          <TouchableOpacity
            testID="daily-energy-button"
            style={styles.heroCard}
            onPress={() => router.push('/energy-detail')}
            activeOpacity={0.9}
          >
            <LinearGradient colors={Gradients.navy} style={styles.heroGradient}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroIconRing}>
                  <MaterialCommunityIcons name="white-balance-sunny" size={26} color={Colors.accent} />
                </View>
                <Text style={styles.heroEyebrow}>{t('home.daily_energy')}</Text>
              </View>
              {dailyEnergy ? (
                <Text style={styles.heroTitle} numberOfLines={2}>{dailyEnergy.title}</Text>
              ) : (
                <Text style={styles.heroTitle} numberOfLines={2}>{t('home.daily_energy_subtitle')}</Text>
              )}
              <View style={styles.heroButton}>
                <Text style={styles.heroButtonText}>{t('home.view_details')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Energía del Mes / Energía del Año - fila de 2 */}
        <View style={styles.section}>
          <View style={styles.twinRow}>
            <TouchableOpacity
              testID="month-energy-button"
              style={styles.twinCard}
              onPress={() => router.push('/month-energy-detail')}
              activeOpacity={0.85}
            >
              <View style={styles.twinIconContainer}>
                <MaterialCommunityIcons name="calendar-outline" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.twinLabel}>{t('home.month_energy')}</Text>
              <Text style={[styles.twinBadge, styles.twinBadgeFree]}>{t('courses.free')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="year-energy-button"
              style={styles.twinCard}
              onPress={() => router.push('/year-energy-detail')}
              activeOpacity={0.85}
            >
              <View style={styles.twinIconContainer}>
                <MaterialCommunityIcons name="shimmer" size={24} color={Colors.accent} />
              </View>
              <Text style={styles.twinLabel}>{t('home.year_energy')}</Text>
              <Text style={[styles.twinBadge, styles.twinBadgeFree]}>{t('courses.free')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner de suscripción - accesos premium agrupados */}
        <View style={styles.section}>
          <View style={styles.subscriptionBanner}>
            <View style={styles.subscriptionHeader}>
              <MaterialCommunityIcons name="crown-outline" size={16} color={Colors.accent} />
              <Text style={styles.subscriptionTitle}>{t('home.subscription_title')}</Text>
            </View>
            <View style={styles.subscriptionRow}>
              <TouchableOpacity
                testID="subscription-activations"
                style={styles.subscriptionItem}
                onPress={() => router.push('/energy-detail')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="white-balance-sunny" size={22} color={Colors.accent} />
                <Text style={styles.subscriptionItemText} numberOfLines={2}>{t('home.daily_activations')}</Text>
              </TouchableOpacity>
              <View style={styles.subscriptionDivider} />
              <TouchableOpacity
                testID="baby-talent-button"
                style={styles.subscriptionItem}
                onPress={() => router.push('/newborn-vocation-detail')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="star-outline" size={22} color={Colors.accent} />
                <Text style={styles.subscriptionItemText} numberOfLines={2}>{t('home.baby_talent')}</Text>
              </TouchableOpacity>
              <View style={styles.subscriptionDivider} />
              <TouchableOpacity
                testID="wedding-agenda-button"
                style={styles.subscriptionItem}
                onPress={() => router.push('/agenda-monthly-free')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="ring" size={22} color={Colors.accent} />
                <Text style={styles.subscriptionItemText} numberOfLines={2}>{t('home.wedding_agenda')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: { flexGrow: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 32,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
  },
  loginButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  loginButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  logo: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.accent,
  },
  subtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.white,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  brandDivider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.accent + '60',
    marginTop: Spacing.md,
  },
  // Language pills
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languagePillActive: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent,
  },
  languagePillFlag: {
    fontSize: 14,
  },
  languagePillText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 11,
    color: Colors.white,
    opacity: 0.7,
  },
  languagePillTextActive: {
    color: Colors.accent,
    opacity: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  // Hero - Energía del Día
  heroCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  heroGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    borderRadius: BorderRadius.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  heroIconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '18',
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEyebrow: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    lineHeight: 30,
    marginBottom: Spacing.lg,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  heroButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  // Energía del Mes / Año - fila de 2
  twinRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  twinCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  twinIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  twinLabel: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  twinBadge: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 11,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  twinBadgeFree: {
    color: Colors.freeGreen,
    backgroundColor: Colors.freeGreen + '18',
  },
  // Subscription banner
  subscriptionBanner: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  subscriptionTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  subscriptionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  subscriptionItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 4,
  },
  subscriptionItemText: {
    fontFamily: Typography.sansMedium,
    fontSize: 11,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 14,
  },
  subscriptionDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: Colors.accent + '25',
    marginTop: 6,
  },
  // Card
});
