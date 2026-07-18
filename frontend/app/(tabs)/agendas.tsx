import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/services/api';
import { useRouter } from 'expo-router';

interface PremiumAgenda {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  materials: string[];
}

export default function AgendasScreen() {
  const router = useRouter();
  const [agendas, setAgendas] = useState<PremiumAgenda[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get('/agendas');
      setAgendas(response.data);
    } catch (error) {
      console.error('Error loading agendas:', error);
    } finally {
      setLoading(false);
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
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <Text style={styles.headerLabel}>Planifica</Text>
        <Text style={styles.headerTitle}>Agendas</Text>
        <Text style={styles.headerDesc}>
          Fechas auspiciosas seleccionadas por expertos
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {agendas.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>Próximamente</Text>
            <Text style={styles.emptyText}>Estamos preparando agendas exclusivas</Text>
          </View>
        ) : (
          <>
            <View style={styles.freeMonthBanner}>
              <Ionicons name="gift" size={20} color={Colors.jade} />
              <Text style={styles.freeMonthText}>
                Mes actual gratuito · Compra el año completo con descuento
              </Text>
            </View>

            {agendas.map((agenda) => (
              <TouchableOpacity
                key={agenda.id}
                style={styles.card}
                testID={`agenda-card-${agenda.id}`}
                onPress={() => router.push(`/agenda/${agenda.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrap}>
                    <Ionicons name="calendar" size={22} color={Colors.accent} />
                  </View>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {agenda.type === 'annual' ? 'Anual' : 'Mensual'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>{agenda.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={3}>{agenda.description}</Text>

                {agenda.materials.length > 0 && (
                  <View style={styles.materialsSection}>
                    {agenda.materials.slice(0, 3).map((item, i) => (
                      <View key={i} style={styles.materialItem}>
                        <Ionicons name="checkmark-circle" size={14} color={Colors.jade} />
                        <Text style={styles.materialText}>{item}</Text>
                      </View>
                    ))}
                    {agenda.materials.length > 3 && (
                      <Text style={styles.moreText}>+{agenda.materials.length - 3} más</Text>
                    )}
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.priceLabel}>Precio anual</Text>
                    <Text style={styles.cardPrice}>€{agenda.price.toFixed(0)}</Text>
                  </View>
                  <View style={styles.viewButton}>
                    <Text style={styles.viewButtonText}>Ver detalles</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
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
    marginBottom: Spacing.sm,
  },
  headerDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
  },
  content: { padding: Spacing.lg },
  freeMonthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.jade + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.jade + '30',
  },
  freeMonthText: {
    flex: 1,
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.jade,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.primary,
  },
  cardTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cardDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  materialsSection: {
    marginBottom: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  materialText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  moreText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  priceLabel: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  cardPrice: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.accent,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  viewButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
});
