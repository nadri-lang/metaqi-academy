import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

interface ServiceRequest {
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  service_id: string;
  form_data: Record<string, any>;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  admin_notes?: string;
  created_at: string;
}

interface ServiceInfo {
  id: string;
  title: string;
}

type FilterTab = 'pending' | 'in_progress' | 'all';

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function AdminServiceRequestsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [servicesById, setServicesById] = useState<Record<string, ServiceInfo>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<FilterTab>('pending');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [requestsRes, servicesRes] = await Promise.all([
        api.get('/service-requests'),
        api.get('/services'),
      ]);
      setRequests(requestsRes.data || []);
      const map: Record<string, ServiceInfo> = {};
      for (const s of servicesRes.data || []) {
        map[s.id] = { id: s.id, title: s.title };
      }
      setServicesById(map);
    } catch (error) {
      console.error('Error loading service requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'editor')) {
      load();
    }
  }, [user, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const requestTitle = (r: ServiceRequest): string => {
    if (r.form_data?.type === 'guide' && r.form_data?.guide_title) {
      return r.form_data.guide_title;
    }
    return servicesById[r.service_id]?.title || r.service_id;
  };

  const requestKind = (r: ServiceRequest): string => {
    return r.form_data?.type === 'guide' ? 'Guía' : 'Servicio';
  };

  const markInProgress = async (r: ServiceRequest) => {
    setUpdatingId(r.id);
    try {
      const response = await api.patch(`/service-requests/${r.id}`, {
        status: 'in_progress',
        admin_notes: r.admin_notes || null,
      });
      setRequests((prev) => prev.map((item) => (item.id === r.id ? { ...item, ...response.data } : item)));
    } catch (error) {
      console.error('Error updating service request:', error);
      Alert.alert('Error', 'No se pudo actualizar la solicitud');
    } finally {
      setUpdatingId(null);
    }
  };

  const markCompleted = async (r: ServiceRequest) => {
    setUpdatingId(r.id);
    try {
      const response = await api.patch(`/service-requests/${r.id}`, {
        status: 'completed',
        admin_notes: r.admin_notes || null,
      });
      setRequests((prev) => prev.map((item) => (item.id === r.id ? { ...item, ...response.data } : item)));
    } catch (error) {
      console.error('Error updating service request:', error);
      Alert.alert('Error', 'No se pudo actualizar la solicitud');
    } finally {
      setUpdatingId(null);
    }
  };

  const visibleRequests = requests.filter((r) => {
    if (tab === 'all') return true;
    return r.status === tab;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Acceso denegado</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerNav}>
            <TouchableOpacity
              testID="admin-back-btn"
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>Admin</Text>
            <Text style={styles.headerTitle}>Solicitudes Pendientes</Text>
            <Text style={styles.headerSubtitle}>
              Usuarios interesados en comprar un servicio o una guía
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.tabs}>
        {(['pending', 'in_progress', 'all'] as FilterTab[]).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {key === 'pending' ? `Pendientes${pendingCount ? ` (${pendingCount})` : ''}` : key === 'in_progress' ? 'En curso' : 'Todas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        >
          {visibleRequests.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="inbox-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No hay solicitudes en esta vista</Text>
            </View>
          ) : (
            visibleRequests.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.kindBadge}>
                    <Text style={styles.kindBadgeText}>{requestKind(r)}</Text>
                  </View>
                  <Text style={styles.cardWhen}>{formatWhen(r.created_at)}</Text>
                </View>
                <Text style={styles.cardTitle}>{requestTitle(r)}</Text>
                <Text style={styles.cardUser}>
                  {r.user_name || 'Usuario'} {r.user_email ? `· ${r.user_email}` : ''}
                </Text>

                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, styles[`status_${r.status}` as const]]} />
                  <Text style={styles.statusText}>
                    {r.status === 'pending' ? 'Pendiente' : r.status === 'in_progress' ? 'En curso' : r.status === 'completed' ? 'Completada' : 'Cancelada'}
                  </Text>
                </View>

                {r.status !== 'completed' && r.status !== 'cancelled' && (
                  <View style={styles.actionsRow}>
                    {r.status === 'pending' && (
                      <TouchableOpacity
                        style={styles.actionButtonSecondary}
                        onPress={() => markInProgress(r)}
                        disabled={updatingId === r.id}
                      >
                        <Text style={styles.actionButtonSecondaryText}>Marcar en curso</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionButtonPrimary}
                      onPress={() => markCompleted(r)}
                      disabled={updatingId === r.id}
                    >
                      {updatingId === r.id ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : (
                        <Text style={styles.actionButtonPrimaryText}>Marcar como completada</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.lg },
  headerNav: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  headerLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  tabActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tabText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.lg },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textLight,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  kindBadge: {
    backgroundColor: Colors.accent + '20',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  kindBadgeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.accent,
  },
  cardWhen: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
  },
  cardTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardUser: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status_pending: { backgroundColor: Colors.accent },
  status_in_progress: { backgroundColor: Colors.primary },
  status_completed: { backgroundColor: Colors.success },
  status_cancelled: { backgroundColor: Colors.error },
  statusText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  actionButtonPrimaryText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing['2xl'],
  },
});
