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
import api from '@/src/services/api';
import { Ionicons } from '@expo/vector-icons';

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

export default function HomeScreen() {
  const { user } = useAuth();
  const [dailyEnergy, setDailyEnergy] = useState<DailyEnergy | null>(null);
  const [moonEnergy, setMoonEnergy] = useState<MoonEnergy | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [dailyRes, moonRes] = await Promise.all([
        api.get('/energy/daily'),
        api.get('/energy/moon/current'),
      ]);
      setDailyEnergy(dailyRes.data);
      setMoonEnergy(moonRes.data);
    } catch (error) {
      console.error('Error loading energy data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Header */}
        <LinearGradient colors={Gradients.navy} style={styles.header}>
          <Text style={styles.greeting}>Bienvenido,</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </LinearGradient>

        {/* Daily Energy Section */}
        {dailyEnergy && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sunny" size={24} color={Colors.accent} />
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

        {/* Moon Energy Section */}
        {moonEnergy && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="moon" size={24} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Energía Lunar</Text>
              {moonEnergy.is_premium && (
                <View style={styles.premiumBadge}>
                  <Text style={styles.premiumText}>Premium</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.card, moonEnergy.is_premium && !user?.has_active_subscription && styles.lockedCard]}
            >
              <Text style={styles.cardTitle}>{moonEnergy.title}</Text>
              <Text
                style={styles.cardContent}
                numberOfLines={moonEnergy.is_premium && !user?.has_active_subscription ? 3 : undefined}
              >
                {moonEnergy.content}
              </Text>

              {moonEnergy.is_premium && !user?.has_active_subscription ? (
                <View style={styles.unlockSection}>
                  <Ionicons name="lock-closed" size={20} color={Colors.accent} />
                  <Text style={styles.unlockText}>Hazte Premium para ver todo el contenido</Text>
                </View>
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
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  greeting: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.white,
    opacity: 0.8,
  },
  userName: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.accent,
    marginTop: Spacing.xs,
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
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  premiumBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
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
    marginBottom: Spacing.lg,
  },
  lockedCard: {
    opacity: 0.8,
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
  unlockSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  unlockText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.accent,
    marginLeft: Spacing.sm,
  },
});