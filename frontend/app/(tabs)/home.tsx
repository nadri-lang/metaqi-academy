import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dailyRes, vocationRes] = await Promise.allSettled([
        api.get('/energy/daily'),
        api.get('/newborn-vocation/today'),
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

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
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
        {/* Header with Logo and Language Selector */}
        <LinearGradient colors={Gradients.navy} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.logo}>MetaQi</Text>
              <Text style={styles.subtitle}>{t('home.academy')}</Text>
            </View>
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
          {user && (
            <Text style={styles.greeting}>{t('home.welcome')}, {user.name}</Text>
          )}
          
          {/* Language Selector - Very Visible */}
          <View style={styles.languageSelectorContainer}>
            <TouchableOpacity
              testID="language-selector"
              style={styles.languageSelector}
              onPress={toggleLanguage}
              activeOpacity={0.8}
            >
              <Text style={styles.languageFlag}>{language === 'es' ? '🇪🇸' : '🇬🇧'}</Text>
              <Text style={styles.languageText}>
                {language === 'es' ? 'ES' : 'EN'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* 1. Botón Dorado - Energía del Día */}
        {dailyEnergy && (
          <View style={styles.section}>
            <TouchableOpacity
              testID="daily-energy-button"
              style={styles.goldenButton}
              onPress={() => router.push('/energy-detail')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={Gradients.gold} style={styles.goldenGradient}>
                <View style={styles.goldenIconContainer}>
                  <Ionicons name="sunny" size={32} color={Colors.primary} />
                </View>
                <View style={styles.goldenContent}>
                  <Text style={styles.goldenLabel}>{t('home.daily_energy')}</Text>
                  <Text style={styles.goldenTitle} numberOfLines={2}>
                    {localizeContent(dailyEnergy.title, dailyEnergy.title_en)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. Botón - Energía del Mes */}
        <View style={styles.section}>
          <TouchableOpacity
            testID="month-energy-button"
            style={styles.energyButton}
            onPress={() => router.push('/month-energy-detail')}
            activeOpacity={0.85}
          >
            <View style={styles.energyIconContainer}>
              <Ionicons name="calendar" size={28} color={Colors.accent} />
            </View>
            <View style={styles.energyContent}>
              <Text style={styles.energyLabel}>{t('home.month_energy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* 3. Botón - Energía del Año */}
        <View style={styles.section}>
          <TouchableOpacity
            testID="year-energy-button"
            style={styles.energyButton}
            onPress={() => router.push('/year-energy-detail')}
            activeOpacity={0.85}
          >
            <View style={styles.energyIconContainer}>
              <Ionicons name="sparkles" size={28} color={Colors.jade} />
            </View>
            <View style={styles.energyContent}>
              <Text style={styles.energyLabel}>{t('home.year_energy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* 4. Sección - Agenda de Bodas del Mes (Gratis) */}
        <View style={styles.section}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={24} color={Colors.accent} />
              <Text style={styles.cardTitle}>{t('home.wedding_agenda')}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{t('home.wedding_agenda_subtitle')}</Text>
            <Text style={styles.cardContent}>
              {language === 'es' 
                ? 'Descubre los días más auspiciosos de este mes para celebrar bodas según la metafísica china.' 
                : 'Discover the most auspicious days of this month to celebrate weddings according to Chinese metaphysics.'}
            </Text>
            
            <TouchableOpacity
              testID="wedding-agenda-cta"
              style={styles.ctaButton}
              onPress={() => router.push('/(tabs)/services')}
            >
              <Text style={styles.ctaButtonText}>{t('home.wedding_agenda_full')}</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 5. Sección - Vocación del Bebé Nacido Hoy (Gratis) */}
        {newbornVocation && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="star" size={24} color={Colors.jade} />
                <Text style={styles.cardTitle}>{t('home.newborn_vocation')}</Text>
              </View>
              <Text style={styles.cardSubtitle}>{t('home.newborn_vocation_subtitle')}</Text>
              <Text style={styles.cardContent} numberOfLines={3}>
                {localizeContent(newbornVocation.content, newbornVocation.content_en)}
              </Text>

              <TouchableOpacity
                testID="vocation-personalized-cta"
                style={styles.ctaButton}
                onPress={() => router.push('/(tabs)/services')}
              >
                <Text style={styles.ctaButtonText}>{t('home.personalized_reading')}</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

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
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.accent,
  },
  subtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: Spacing.xs,
  },
  greeting: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.white,
    opacity: 0.8,
    marginTop: Spacing.md,
  },
  loginButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  loginButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  // Language Selector - Very Visible
  languageSelectorContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '30',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  languageFlag: {
    fontSize: 24,
  },
  languageText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  // Golden Button - Energía del Día
  goldenButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  goldenGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  goldenIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldenContent: {
    flex: 1,
  },
  goldenLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.primary,
    opacity: 0.8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  goldenTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.primary,
    lineHeight: 24,
  },
  // Energy Buttons (Month, Year)
  energyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  energyIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  energyContent: {
    flex: 1,
  },
  energyLabel: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  // Card
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    flex: 1,
  },
  cardSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  cardContent: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  ctaButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
});
