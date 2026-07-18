import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface Concept {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  icon: string;
  color: string;
}

interface YearEnergy {
  id: string;
  year: number;
  title: string;
  content: string;
  video_url?: string;
}

interface DailyEnergy {
  id: string;
  date: string;
  title: string;
  content: string;
  recommendations: string[];
  avoid: string[];
}

interface MoonEnergy {
  id: string;
  month: number;
  year: number;
  title: string;
  content: string;
  recommendations: string[];
  activations: string[];
  rituals: string[];
  is_premium: boolean;
}

interface NewbornVocation {
  id: string;
  date: string;
  title: string;
  content: string;
  talents: string[];
  vocations: string[];
  challenges: string[];
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [yearEnergy, setYearEnergy] = useState<YearEnergy | null>(null);
  const [dailyEnergy, setDailyEnergy] = useState<DailyEnergy | null>(null);
  const [moonEnergy, setMoonEnergy] = useState<MoonEnergy | null>(null);
  const [newbornVocation, setNewbornVocation] = useState<NewbornVocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [conceptsRes, yearRes, dailyRes, moonRes, vocationRes] = await Promise.allSettled([
        api.get('/concepts'),
        api.get('/energy/year/current'),
        api.get('/energy/daily'),
        api.get('/energy/moon/current'),
        api.get('/newborn-vocation/today'),
      ]);
      
      if (conceptsRes.status === 'fulfilled') setConcepts(conceptsRes.value.data);
      if (yearRes.status === 'fulfilled') setYearEnergy(yearRes.value.data);
      if (dailyRes.status === 'fulfilled') setDailyEnergy(dailyRes.value.data);
      if (moonRes.status === 'fulfilled') setMoonEnergy(moonRes.value.data);
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

  const openYouTube = (url?: string) => {
    if (url) Linking.openURL(url);
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
                <Text style={styles.loginButtonText}>Entrar</Text>
              </TouchableOpacity>
            )}
          </View>
          {user && (
            <Text style={styles.greeting}>Bienvenido, {user.name}</Text>
          )}
        </LinearGradient>

        {/* Concepts Section */}
        {concepts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Descubre</Text>
            <Text style={styles.sectionTitle}>Metafísica China</Text>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.conceptsRow}
            >
              {concepts.map((concept) => (
                <TouchableOpacity
                  key={concept.id}
                  testID={`concept-card-${concept.slug}`}
                  style={styles.conceptCard}
                  onPress={() => router.push(`/concept/${concept.slug}`)}
                >
                  <View style={[styles.conceptIcon, { backgroundColor: concept.color + '20' }]}>
                    <Ionicons name={concept.icon as any} size={24} color={concept.color} />
                  </View>
                  <Text style={styles.conceptTitle} numberOfLines={2}>{concept.title}</Text>
                  <Text style={styles.conceptDesc} numberOfLines={3}>
                    {concept.short_description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Year Energy */}
        {yearEnergy && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Energía del Año</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{yearEnergy.title}</Text>
              <Text style={styles.cardContent}>{yearEnergy.content}</Text>
              {yearEnergy.video_url && (
                <TouchableOpacity
                  testID="year-energy-video"
                  style={styles.videoButton}
                  onPress={() => openYouTube(yearEnergy.video_url)}
                >
                  <Ionicons name="logo-youtube" size={20} color={Colors.white} />
                  <Text style={styles.videoButtonText}>Ver en YouTube</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Daily Energy */}
        {dailyEnergy && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sunny" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Energía del Día</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{dailyEnergy.title}</Text>
              <Text style={styles.cardContent}>{dailyEnergy.content}</Text>

              {dailyEnergy.recommendations.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>Recomendaciones</Text>
                  {dailyEnergy.recommendations.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: Colors.jade }]} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {dailyEnergy.avoid.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>Evita</Text>
                  {dailyEnergy.avoid.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: Colors.error }]} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Moon Energy */}
        {moonEnergy && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="moon" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Energía Lunar</Text>
              {moonEnergy.is_premium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>
            <View style={[styles.card, moonEnergy.is_premium && !user?.has_active_subscription && styles.lockedCard]}>
              <Text style={styles.cardTitle}>{moonEnergy.title}</Text>
              <Text
                style={styles.cardContent}
                numberOfLines={moonEnergy.is_premium && !user?.has_active_subscription ? 3 : undefined}
              >
                {moonEnergy.content}
              </Text>

              {moonEnergy.is_premium && !user?.has_active_subscription ? (
                <TouchableOpacity
                  testID="moon-unlock-btn"
                  style={styles.unlockButton}
                  onPress={() => user ? router.push('/(tabs)/services') : router.push('/(auth)/login')}
                >
                  <Ionicons name="lock-closed" size={18} color={Colors.primary} />
                  <Text style={styles.unlockButtonText}>Desbloquear Premium</Text>
                </TouchableOpacity>
              ) : (
                <>
                  {moonEnergy.recommendations.length > 0 && (
                    <View style={styles.listSection}>
                      <Text style={styles.listTitle}>Recomendaciones</Text>
                      {moonEnergy.recommendations.map((item, index) => (
                        <View key={index} style={styles.listItem}>
                          <View style={[styles.bullet, { backgroundColor: Colors.jade }]} />
                          <Text style={styles.listText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {moonEnergy.activations.length > 0 && (
                    <View style={styles.listSection}>
                      <Text style={styles.listTitle}>Activaciones</Text>
                      {moonEnergy.activations.map((item, index) => (
                        <View key={index} style={styles.listItem}>
                          <View style={[styles.bullet, { backgroundColor: Colors.accent }]} />
                          <Text style={styles.listText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {/* Newborn Vocation */}
        {newbornVocation && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Vocación del Bebé Hoy</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{newbornVocation.title}</Text>
              <Text style={styles.cardContent}>{newbornVocation.content}</Text>

              {newbornVocation.talents.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>Talentos naturales</Text>
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
                  <Text style={styles.listTitle}>Vocaciones favorables</Text>
                  {newbornVocation.vocations.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: Colors.jade }]} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {user && (
                <TouchableOpacity
                  testID="vocation-favorite-btn"
                  style={styles.saveButton}
                  onPress={async () => {
                    try {
                      await api.post('/favorites', {
                        item_type: 'newborn_vocation',
                        item_id: newbornVocation.id,
                      });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  <Ionicons name="heart" size={18} color={Colors.accent} />
                  <Text style={styles.saveButtonText}>Guardar en Favoritos</Text>
                </TouchableOpacity>
              )}

              {!user && (
                <TouchableOpacity
                  testID="vocation-login-cta"
                  style={styles.saveButton}
                  onPress={() => router.push('/(auth)/login')}
                >
                  <Ionicons name="heart-outline" size={18} color={Colors.accent} />
                  <Text style={styles.saveButtonText}>Inicia sesión para guardar</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                testID="vocation-personalized-cta"
                style={styles.ctaButton}
                onPress={() => router.push('/(tabs)/services')}
              >
                <Text style={styles.ctaButtonText}>Análisis personalizado de tu bebé</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  conceptsRow: {
    paddingRight: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  conceptCard: {
    width: 200,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    flexShrink: 0,
  },
  conceptIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  conceptTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  conceptDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  premiumBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  premiumText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.primary,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
  },
  lockedCard: {
    opacity: 0.95,
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
  listSection: {
    marginTop: Spacing.lg,
  },
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
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  videoButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  unlockButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
    marginLeft: Spacing.sm,
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
  },
  saveButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.accent,
    marginLeft: Spacing.sm,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  ctaButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
});
