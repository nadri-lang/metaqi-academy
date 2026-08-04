import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Colors } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/src/services/api';

interface AnalyticsData {
  total_visitors: number;
  total_registered: number;
  active_today: number;
  registered_today: number;
  active_this_month: number;
  last_updated: string;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalytics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.accent} />
      </View>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      label: 'Total Visitantes',
      value: analytics.total_visitors,
      icon: 'eye' as const,
      color: Colors.accent,
    },
    {
      label: 'Total Registrados',
      value: analytics.total_registered,
      icon: 'account-group' as const,
      color: Colors.jade,
    },
    {
      label: 'Activos Hoy',
      value: analytics.active_today,
      icon: 'calendar-today' as const,
      color: Colors.primary,
    },
    {
      label: 'Registrados Hoy',
      value: analytics.registered_today,
      icon: 'account-plus' as const,
      color: Colors.accent,
    },
    {
      label: 'Activos este Mes',
      value: analytics.active_this_month,
      icon: 'calendar-month' as const,
      color: Colors.jade,
    },
  ];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
      }
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="chart-line" size={20} color={Colors.accent} />
          <Text style={styles.headerTitle}>Estadísticas de Usuarios</Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.iconContainer, { backgroundColor: stat.color + '15' }]}>
                <MaterialCommunityIcons name={stat.icon} size={20} color={stat.color} />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.lastUpdated}>
          Última actualización: {new Date(analytics.last_updated).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  statsGrid: {
    gap: Spacing.md,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontFamily: Typography.sansBold,
    fontSize: Typography['2xl'],
    letterSpacing: -0.5,
  },
  lastUpdated: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
});
