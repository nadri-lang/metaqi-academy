import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/services/api';

interface DailyEnergy {
  id: string;
  date: string;
  title: string;
  content: string;
  animal?: string;
  bazi_relationships?: string;
  recommendations: string[];
  avoid: string[];
  feng_shui_sectors: string[];
  qimen_directions: string[];
  favorable_hours: string[];
}

export default function DailyEnergyDetailScreen() {
  const [data, setData] = useState<DailyEnergy | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const response = await api.get('/energy/daily');
      setData(response.data);
    } catch (error) {
      console.error('Error loading daily energy:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyState}>
          <Ionicons name="sunny-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Sin contenido para hoy</Text>
          <Text style={styles.emptyText}>Vuelve más tarde</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.iconRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="sunny" size={28} color={Colors.accent} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerLabel}>Energía del Día</Text>
                <Text style={styles.headerDate}>{formatDate(data.date)}</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>{data.title}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* Main Description */}
        <View style={styles.card}>
          <Text style={styles.description}>{data.content}</Text>
        </View>

        {/* Animal del Día */}
        {data.animal && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="paw" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Animal del Día</Text>
            </View>
            <Text style={styles.animalText}>{data.animal}</Text>
          </View>
        )}

        {/* Relaciones BaZi */}
        {data.bazi_relationships && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="git-network" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Relaciones BaZi</Text>
            </View>
            <Text style={styles.description}>{data.bazi_relationships}</Text>
          </View>
        )}

        {/* Actividades Sostenidas */}
        {data.recommendations.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.jade} />
              <Text style={styles.sectionTitle}>Actividades Sostenidas</Text>
            </View>
            {data.recommendations.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: Colors.jade }]} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actividades a Evitar */}
        {data.avoid.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="close-circle" size={22} color={Colors.error} />
              <Text style={styles.sectionTitle}>Actividades a Evitar</Text>
            </View>
            {data.avoid.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: Colors.error }]} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Sectores Feng Shui */}
        {data.feng_shui_sectors.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="home" size={22} color={Colors.jade} />
              <Text style={styles.sectionTitle}>Sectores Feng Shui</Text>
            </View>
            {data.feng_shui_sectors.map((item, idx) => (
              <View key={idx} style={styles.detailItem}>
                <Ionicons name="location" size={16} color={Colors.jade} />
                <Text style={styles.detailText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Direcciones Qi Men */}
        {data.qimen_directions.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="compass" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Direcciones Qi Men</Text>
            </View>
            {data.qimen_directions.map((item, idx) => (
              <View key={idx} style={styles.detailItem}>
                <Ionicons name="navigate" size={16} color={Colors.accent} />
                <Text style={styles.detailText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Horas Favorables */}
        {data.favorable_hours.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Horas más Favorables</Text>
            </View>
            {data.favorable_hours.map((item, idx) => (
              <View key={idx} style={styles.hourItem}>
                <View style={styles.hourDot} />
                <Text style={styles.detailText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  header: { paddingBottom: Spacing.xl },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: { flex: 1 },
  headerLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerDate: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    lineHeight: 32,
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    flex: 1,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  animalText: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.accent,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
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
    lineHeight: 22,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  detailText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  hourItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  hourDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
});
