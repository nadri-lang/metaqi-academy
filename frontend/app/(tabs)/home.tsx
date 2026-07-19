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
  content: string;
  content_en?: string;
  animal?: string;
}

interface Concept {
  id: string;
  slug: string;
  title: string;
  title_en?: string;
  short_description: string;
  icon: string;
  color: string;
}

interface NewbornVocation {
  id: string;
  date: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  talents: string[];
  vocations: string[];
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { t, localizeContent, language } = useLanguage();
  const router = useRouter();
  const [dailyEnergy, setDailyEnergy] = useState<DailyEnergy | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [newbornVocation, setNewbornVocation] = useState<NewbornVocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dailyRes, conceptsRes, vocationRes] = await Promise.allSettled([
        api.get('/energy/daily'),
        api.get('/concepts'),
        api.get('/newborn-vocation/today'),
      ]);

      if (dailyRes.status === 'fulfilled') setDailyEnergy(dailyRes.value.data);
      if (conceptsRes.status === 'fulfilled') setConcepts(conceptsRes.value.data);
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

  const handleSaveFavorite = async (itemType: string, itemId: string) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    try {
      await api.post('/favorites', { item_type: itemType, item_id: itemId });
    } catch (e) {
      console.error(e);
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
        {/* Header */}
        <LinearGradient colors={Gradients.navy} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.logo}>MetaQi</Text>
              <Text style={styles.subtitle}>Academy</Text>
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
        </LinearGradient>

        {/* Daily Energy Summary Card - Button to detail */}
        {dailyEnergy && (
          <View style={styles.section}>
            <TouchableOpacity
              testID="daily-energy-card"
              style={styles.dailyEnergyCard}
              onPress={() => router.push('/(tabs)/articles')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={Gradients.gold}
                style={styles.dailyEnergyGradient}
              >
                <View style={styles.dailyIconContainer}>
                  <Ionicons name="sunny" size={32} color={Colors.primary} />
                </View>
                <View style={styles.dailyEnergyContent}>
                  <Text style={styles.dailyEnergyLabel}>{t('home.daily_energy')}</Text>
                  <Text style={styles.dailyEnergyTitle} numberOfLines={2}>
                    {localizeContent(dailyEnergy.title, dailyEnergy.title_en)}
                  </Text>
                  {dailyEnergy.animal && (
                    <View style={styles.animalBadge}>
                      <Ionicons name="paw" size={12} color={Colors.primary} />
                      <Text style={styles.animalText}>{dailyEnergy.animal}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={24} color={Colors.primary} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Concepts Section - MAIN CONTENT */}
        {concepts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('home.discover')}</Text>
            <Text style={styles.sectionTitleLarge}>{t('home.metaphysics')}</Text>

            {concepts.map((concept, index) => (
              <TouchableOpacity
                key={concept.id}
                testID={`home-concept-${concept.slug}`}
                style={styles.conceptCard}
                onPress={() => router.push(`/concept/${concept.slug}`)}
                activeOpacity={0.85}
              >
                <View style={[styles.conceptIcon, { backgroundColor: concept.color + '20' }]}>
                  <Ionicons name={concept.icon as any} size={22} color={concept.color} />
                </View>
                <View style={styles.conceptTextContainer}>
                  <Text style={styles.conceptTitle}>
                    {localizeContent(concept.title, concept.title_en)}
                  </Text>
                  <Text style={styles.conceptDesc} numberOfLines={2}>
                    {concept.short_description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Newborn Vocation */}
        {newbornVocation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>{t('home.newborn_vocation')}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {localizeContent(newbornVocation.title, newbornVocation.title_en)}
              </Text>
              <Text style={styles.cardContent}>
                {localizeContent(newbornVocation.content, newbornVocation.content_en)}
              </Text>

              {newbornVocation.talents.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>{t('home.natural_talents')}</Text>
                  {newbornVocation.talents.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: Colors.accent }]} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {newbornVocation.vocations.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>{t('home.favorable_vocations')}</Text>
                  {newbornVocation.vocations.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: Colors.jade }]} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                testID="vocation-favorite-btn"
                style={styles.saveButton}
                onPress={() => handleSaveFavorite('newborn_vocation', newbornVocation.id)}
              >
                <Ionicons name={user ? "heart" : "heart-outline"} size={18} color={Colors.accent} />
                <Text style={styles.saveButtonText}>
                  {user ? t('home.save_favorite') : t('home.login_to_save')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="vocation-personalized-cta"
                style={styles.ctaButton}
                onPress={() => router.push('/(tabs)/services')}
              >
                <Text style={styles.ctaButtonText}>{t('home.personalized_analysis')}</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Descubre Metafísica China - Button at the END */}
        <View style={styles.section}>
          <TouchableOpacity
            testID="discover-metaphysics-btn"
            style={styles.discoverButton}
            onPress={() => router.push('/concepts')}
          >
            <LinearGradient colors={Gradients.navy} style={styles.discoverGradient}>
              <View style={styles.discoverIconContainer}>
                <Ionicons name="book" size={28} color={Colors.accent} />
              </View>
              <View style={styles.discoverTextContainer}>
                <Text style={styles.discoverLabel}>{t('home.discover')}</Text>
                <Text style={styles.discoverTitle}>{t('home.metaphysics')}</Text>
                <Text style={styles.discoverSubtitle}>{t('home.metaphysics_subtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={Colors.accent} />
            </LinearGradient>
          </TouchableOpacity>
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
    paddingVertical: Spacing.xl,
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
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.textLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  sectionTitleLarge: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  // Daily Energy Card (button style)
  dailyEnergyCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  dailyEnergyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  dailyIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyEnergyContent: {
    flex: 1,
  },
  dailyEnergyLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.primary,
    opacity: 0.7,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dailyEnergyTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.base,
    color: Colors.primary,
    lineHeight: 22,
  },
  animalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  animalText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.primary,
    opacity: 0.9,
  },
  // Concept Cards (list style)
  conceptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  conceptIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conceptTextContainer: {
    flex: 1,
  },
  conceptTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  conceptDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  // Card generic
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
  },
  cardTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  cardContent: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  listSection: { marginTop: Spacing.lg },
  listTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: Spacing.sm,
  },
  listText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  saveButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.accent,
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
  discoverButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  discoverGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  discoverIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discoverTextContainer: { flex: 1 },
  discoverLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  discoverTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.white,
    marginBottom: 2,
  },
  discoverSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.white,
    opacity: 0.7,
  },
});
