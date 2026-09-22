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
  Modal,
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
import ZodiacEmblem from '@/src/components/ZodiacEmblem';
import HexagramBars from '@/src/components/HexagramBars';
import { ZodiacAnimalKey, ElementKey, animalPolarity } from '@/src/constants/Zodiac';
import { formatWeekdayDate } from '@/src/utils/dateInput';

interface DailyEnergy {
  id: string;
  date: string;
  title: string;
  title_en?: string;
  animal?: string;
  animal_type?: ZodiacAnimalKey;
  element?: ElementKey;
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
  const [calculatorMenuVisible, setCalculatorMenuVisible] = useState(false);
  const [socialLinks, setSocialLinks] = useState<{
    social_facebook_url?: string;
    social_instagram_url?: string;
    social_tiktok_url?: string;
    social_youtube_url?: string;
  }>({});

  useEffect(() => {
    api.get('/app-config')
      .then((res) => setSocialLinks(res.data || {}))
      .catch((error) => console.error('Error loading app config:', error));
  }, []);

  const openSocial = (url?: string, title?: string) => {
    if (!url) return;
    router.push({ pathname: '/webview', params: { url, title: title || '' } });
  };

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
              <Text style={styles.greeting} numberOfLines={1}>{t('home.welcome')}, {user.display_name || user.name}</Text>
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
            <Text style={styles.logo}>ᴹᵉᵗᵃQⁱ ᴬᶜᵃᵈᵉᵐʸ</Text>
            {(socialLinks.social_facebook_url || socialLinks.social_instagram_url || socialLinks.social_tiktok_url || socialLinks.social_youtube_url) && (
              <View style={styles.socialRow}>
                {socialLinks.social_facebook_url && (
                  <TouchableOpacity testID="home-social-facebook" style={styles.socialIcon} onPress={() => openSocial(socialLinks.social_facebook_url, 'Facebook')}>
                    <MaterialCommunityIcons name="facebook" size={18} color={Colors.white} />
                  </TouchableOpacity>
                )}
                {socialLinks.social_instagram_url && (
                  <TouchableOpacity testID="home-social-instagram" style={styles.socialIcon} onPress={() => openSocial(socialLinks.social_instagram_url, 'Instagram')}>
                    <MaterialCommunityIcons name="instagram" size={18} color={Colors.white} />
                  </TouchableOpacity>
                )}
                {socialLinks.social_tiktok_url && (
                  <TouchableOpacity testID="home-social-tiktok" style={styles.socialIcon} onPress={() => openSocial(socialLinks.social_tiktok_url, 'TikTok')}>
                    <MaterialCommunityIcons name="music-note" size={18} color={Colors.white} />
                  </TouchableOpacity>
                )}
                {socialLinks.social_youtube_url && (
                  <TouchableOpacity testID="home-social-youtube" style={styles.socialIcon} onPress={() => openSocial(socialLinks.social_youtube_url, 'YouTube')}>
                    <MaterialCommunityIcons name="youtube" size={18} color={Colors.white} />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={styles.brandDivider} />
          </View>

          <TouchableOpacity
            testID="calculator-button"
            style={styles.calculatorCard}
            onPress={() => setCalculatorMenuVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.calculatorIconContainer}>
              <MaterialCommunityIcons name="calculator-variant" size={20} color={Colors.accent} />
            </View>
            <Text style={styles.calculatorCardText}>{t('home.calculator')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.accent} />
          </TouchableOpacity>

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

        <Modal
          visible={calculatorMenuVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCalculatorMenuVisible(false)}
        >
          <View style={styles.calculatorModalOverlay}>
            <View style={styles.calculatorModalContainer}>
              <View style={styles.calculatorModalHeader}>
                <Text style={styles.calculatorModalTitle}>{t('calculator.menu_title')}</Text>
                <TouchableOpacity testID="calculator-menu-close" onPress={() => setCalculatorMenuVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={Colors.accent} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                testID="calculator-menu-bazi"
                style={styles.calculatorModalOption}
                onPress={() => {
                  setCalculatorMenuVisible(false);
                  router.push('/calculator/bazi');
                }}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="yin-yang" size={22} color={Colors.accent} />
                <View style={styles.calculatorModalOptionTextCol}>
                  <Text style={styles.calculatorModalOptionLabel}>{t('calculator.bazi_option')}</Text>
                  <Text style={styles.calculatorModalOptionSubtitle}>{t('calculator.bazi_option_subtitle')}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.calculatorModalDivider} />

              <TouchableOpacity
                testID="calculator-menu-qimen"
                style={styles.calculatorModalOption}
                onPress={() => {
                  setCalculatorMenuVisible(false);
                  router.push('/calculator/qimen');
                }}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="compass-outline" size={22} color={Colors.accent} />
                <View style={styles.calculatorModalOptionTextCol}>
                  <Text style={styles.calculatorModalOptionLabel}>{t('calculator.qimen_option')}</Text>
                  <Text style={styles.calculatorModalOptionSubtitle}>{t('calculator.qimen_option_subtitle')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Hero - Energía del Día */}
        <View style={styles.section}>
          <TouchableOpacity
            testID="daily-energy-button"
            style={styles.heroCard}
            onPress={() => router.push('/energy-detail')}
            activeOpacity={0.9}
          >
            <LinearGradient colors={Gradients.navy} style={styles.heroGradient}>
              <View style={styles.heroTopSection}>
                <View style={styles.heroTopTextCol}>
                  <View style={styles.heroLabelRow}>
                    <Text style={styles.heroLabelText}>{t('home.daily_energy')}</Text>
                    <Text style={[styles.twinBadge, styles.twinBadgeFree]}>{t('courses.free')}</Text>
                  </View>
                  <View style={styles.heroTopRow}>
                    <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.heroDate}>
                      {dailyEnergy ? formatWeekdayDate(dailyEnergy.date) : ''}
                    </Text>
                  </View>
                </View>
                {dailyEnergy?.animal_type ? (
                  <ZodiacEmblem
                    animal={dailyEnergy.animal_type}
                    element={dailyEnergy.element}
                    size={56}
                    ringColor={Colors.accent}
                    backgroundColor={Colors.primary}
                  />
                ) : (
                  <View style={styles.heroIconRing}>
                    <MaterialCommunityIcons name="white-balance-sunny" size={22} color={Colors.accent} />
                  </View>
                )}
              </View>
              {dailyEnergy ? (
                <Text style={styles.heroTitle} numberOfLines={2}>{dailyEnergy.title}</Text>
              ) : (
                <Text style={styles.heroTitle} numberOfLines={2}>{t('home.daily_energy_subtitle')}</Text>
              )}
              {dailyEnergy?.animal_type && dailyEnergy?.element ? (
                <Text style={[styles.heroAnimalText, styles.heroElementText]}>
                  {t('home.element_of_day')}: <Text style={styles.heroAnimalName}>
                    {t(`zodiac.elements.${dailyEnergy.element}`)} {t(`zodiac.${animalPolarity(dailyEnergy.animal_type)}`)}
                  </Text>
                  {dailyEnergy?.animal ? (
                    <>
                      {'  ·  '}{t('home.animal_of_day')}: <Text style={styles.heroAnimalName}>
                        {dailyEnergy.animal_type ? t(`zodiac.animals.${dailyEnergy.animal_type}`) : dailyEnergy.animal}
                      </Text>
                    </>
                  ) : null}
                </Text>
              ) : null}
              {dailyEnergy?.animal ? (
                <Text style={styles.heroAnimalNote}>{t('home.animal_element_note')}</Text>
              ) : null}
              <View style={styles.heroButton}>
                <Text style={styles.heroButtonText}>{t('home.view_details')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* IChing / Energía del Mes / Energía del Año - stack vertical */}
        <View style={styles.section}>
          <View style={styles.twinStack}>
            <TouchableOpacity
              testID="iching-button"
              style={styles.twinRowCard}
              onPress={() => router.push('/iching')}
              activeOpacity={0.85}
            >
              <View style={styles.twinIconContainer}>
                <HexagramBars lines={[1, 0, 1, 0, 1, 1]} size="small" />
              </View>
              <View style={styles.twinRowTextCol}>
                <Text style={styles.twinLabel}>{t('home.iching')}</Text>
                <Text style={styles.twinBadgeMuted}>{t('home.iching_subtitle')}</Text>
                <Text style={styles.twinExplainer}>{t('home.iching_explainer')}</Text>
              </View>
              <Text style={[styles.twinBadge, styles.twinBadgeFree]}>{t('courses.free')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="month-energy-button"
              style={styles.twinRowCard}
              onPress={() => router.push('/month-energy-detail')}
              activeOpacity={0.85}
            >
              <View style={styles.twinIconContainer}>
                <MaterialCommunityIcons name="calendar-outline" size={24} color={Colors.accent} />
              </View>
              <View style={styles.twinRowTextCol}>
                <Text style={styles.twinLabel}>{t('home.month_energy')}</Text>
              </View>
              <Text style={[styles.twinBadge, styles.twinBadgeFree]}>{t('courses.free')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              testID="year-energy-button"
              style={styles.twinRowCard}
              onPress={() => router.push('/year-energy-detail')}
              activeOpacity={0.85}
            >
              <View style={styles.twinIconContainer}>
                <MaterialCommunityIcons name="shimmer" size={24} color={Colors.accent} />
              </View>
              <View style={styles.twinRowTextCol}>
                <Text style={styles.twinLabel}>{t('home.year_energy')}</Text>
              </View>
              <Text style={[styles.twinBadge, styles.twinBadgeFree]}>{t('courses.free')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Banner de suscripción - accesos premium agrupados, stack vertical */}
        <View style={styles.section}>
          <View style={styles.subscriptionBanner}>
            <View style={styles.subscriptionHeader}>
              <MaterialCommunityIcons name="crown-outline" size={16} color={Colors.accent} />
              <Text style={styles.subscriptionTitle}>{t('home.subscription_title')}</Text>
            </View>
            <View style={styles.subscriptionStack}>
              <TouchableOpacity
                testID="subscription-activations"
                style={styles.subscriptionItem}
                onPress={() => router.push('/activations-detail')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="white-balance-sunny" size={22} color={Colors.accent} />
                <Text style={styles.subscriptionItemText}>{t('home.daily_activations')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.accent} />
              </TouchableOpacity>
              <View style={styles.subscriptionDivider} />
              <TouchableOpacity
                testID="baby-talent-button"
                style={styles.subscriptionItem}
                onPress={() => router.push('/newborn-vocation-detail')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="star-outline" size={22} color={Colors.accent} />
                <Text style={styles.subscriptionItemText}>{t('home.baby_talent')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.accent} />
              </TouchableOpacity>
              <View style={styles.subscriptionDivider} />
              <TouchableOpacity
                testID="wedding-agenda-button"
                style={styles.subscriptionItem}
                onPress={() => router.push('/agenda-monthly-free')}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="ring" size={22} color={Colors.accent} />
                <Text style={styles.subscriptionItemText}>{t('home.wedding_agenda')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.accent} />
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
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandDivider: {
    width: 40,
    height: 1,
    backgroundColor: Colors.accent + '60',
    marginTop: Spacing.md,
  },
  // Calculator button + menu (BaZi / Qimen)
  calculatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.calculatorBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  calculatorIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatorCardText: {
    flex: 1,
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.accent,
  },
  calculatorModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  calculatorModalContainer: {
    backgroundColor: Colors.calculatorBg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  calculatorModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  calculatorModalTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.accent,
  },
  calculatorModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  calculatorModalOptionTextCol: {
    flex: 1,
  },
  calculatorModalOptionLabel: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.base,
    color: Colors.accent,
  },
  calculatorModalOptionSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.accent,
    opacity: 0.7,
    marginTop: 2,
  },
  calculatorModalDivider: {
    height: 1,
    backgroundColor: Colors.accent + '25',
  },
  // Language pills - all 6 flags fit on a single non-wrapping row, even on
  // narrow phones (~320px), by keeping each pill compact.
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    gap: 3,
    marginTop: Spacing.lg,
  },
  languagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  languagePillActive: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent,
  },
  languagePillFlag: {
    fontSize: 12,
  },
  languagePillText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 9,
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
  heroTopSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  heroTopTextCol: {
    flex: 1,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroLabelText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  heroDate: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
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
  heroTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    lineHeight: 30,
  },
  heroElementText: {
    marginTop: Spacing.sm,
  },
  heroAnimalText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  heroAnimalName: {
    fontFamily: Typography.sansSemiBold,
    color: Colors.accent,
  },
  heroAnimalNote: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 15,
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
    marginTop: Spacing.md,
  },
  heroButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  // IChing / Energía del Mes / Energía del Año - stack vertical, una fila por botón
  twinStack: {
    gap: Spacing.sm,
  },
  twinRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  twinIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  twinRowTextCol: {
    flex: 1,
    gap: 2,
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
    color: Colors.white,
    backgroundColor: Colors.freeGreen,
  },
  twinBadgeMuted: {
    fontFamily: Typography.sansSemiBold,
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  twinExplainer: {
    fontFamily: Typography.sans,
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 14,
    marginTop: 2,
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
  subscriptionStack: {
    gap: 2,
  },
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  subscriptionItemText: {
    flex: 1,
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.white,
    lineHeight: 18,
  },
  subscriptionDivider: {
    height: 1,
    backgroundColor: Colors.accent + '25',
  },
});
