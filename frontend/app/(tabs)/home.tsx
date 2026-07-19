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
  remedies: string[];
  avoid: string[];
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
      const [yearRes, dailyRes, moonRes, vocationRes] = await Promise.allSettled([
        api.get('/energy/year/current'),
        api.get('/energy/daily'),
        api.get('/energy/moon/current'),
        api.get('/newborn-vocation/today'),
      ]);
      
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
                <Text style={styles.loginButtonText}>Entrar</Text>
              </TouchableOpacity>
            )}
          </View>
          {user && (
            <Text style={styles.greeting}>Bienvenido, {user.name}</Text>
          )}
        </LinearGradient>

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

        {/* Moon Energy - FREE - Fully accessible */}
        {moonEnergy && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="moon" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Energía del Mes</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{moonEnergy.title}</Text>
              <Text style={styles.cardContent}>{moonEnergy.content}</Text>

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

              {moonEnergy.rituals.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>Rituales</Text>
                  {moonEnergy.rituals.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: Colors.accent }]} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {moonEnergy.remedies.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>Remedios</Text>
                  {moonEnergy.remedies.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                      <View style={[styles.bullet, { backgroundColor: Colors.jade }]} />
                      <Text style={styles.listText}>{item}</Text>
                    </View>
                  ))}
                </View>
              )}

              {moonEnergy.avoid.length > 0 && (
                <View style={styles.listSection}>
                  <Text style={styles.listTitle}>Evita</Text>
                  {moonEnergy.avoid.map((item, index) => (
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

              <TouchableOpacity
                testID="vocation-favorite-btn"
                style={styles.saveButton}
                onPress={() => handleSaveFavorite('newborn_vocation', newbornVocation.id)}
              >
                <Ionicons name={user ? "heart" : "heart-outline"} size={18} color={Colors.accent} />
                <Text style={styles.saveButtonText}>
                  {user ? 'Guardar en Favoritos' : 'Inicia sesión para guardar'}
                </Text>
              </TouchableOpacity>

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

        {/* Descubre Metafísica China - Button at the END */}
        <View style={styles.section}>
          <TouchableOpacity
            testID="discover-metaphysics-btn"
            style={styles.discoverButton}
            onPress={() => router.push('/concepts')}
          >
            <LinearGradient
              colors={Gradients.navy}
              style={styles.discoverGradient}
            >
              <View style={styles.discoverIconContainer}>
                <Ionicons name="book" size={32} color={Colors.accent} />
              </View>
              <View style={styles.discoverTextContainer}>
                <Text style={styles.discoverLabel}>Descubre</Text>
                <Text style={styles.discoverTitle}>Metafísica China</Text>
                <Text style={styles.discoverSubtitle}>
                  BaZi, Qi Men, Feng Shui, Tongshu y más
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.accent} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

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
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discoverTextContainer: {
    flex: 1,
  },
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
