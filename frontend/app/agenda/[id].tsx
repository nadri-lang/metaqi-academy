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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';
import FavoriteButton from '@/src/components/FavoriteButton';

interface PremiumAgenda {
  id: string;
  title: string;
  description: string;
  price: number;
  materials: string[];
  type: string;
}

interface AgendaMonth {
  id: string;
  agenda_id: string;
  month: number;
  year: number;
  title: string;
  content: string;
  events: Array<{
    date: string;
    day: string;
    auspicious: boolean;
    notes: string;
  }>;
  order: number;
}

export default function AgendaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [agenda, setAgenda] = useState<PremiumAgenda | null>(null);
  const [months, setMonths] = useState<AgendaMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);

  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentYear = new Date().getFullYear();

  const isMonthFree = (m: AgendaMonth) => {
    return m.month === currentMonth && m.year === currentYear;
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [agendasRes, monthsRes] = await Promise.allSettled([
        api.get('/agendas'),
        api.get(`/agendas/${id}/months`),
      ]);
      if (agendasRes.status === 'fulfilled') {
        const found = agendasRes.value.data.find((a: PremiumAgenda) => a.id === id);
        if (found) setAgenda(found);
      }
      if (monthsRes.status === 'fulfilled') setMonths(monthsRes.value.data);
    } catch (error) {
      console.error('Error loading agenda:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    router.push(`/checkout/agenda/${id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!agenda) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Agenda no encontrada</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerNav}>
            <TouchableOpacity
              testID="back-btn"
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.white} />
            </TouchableOpacity>
            
            <FavoriteButton 
              itemType="agenda" 
              itemId={id as string} 
              size={24} 
              color={Colors.white}
            />
          </View>

          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="calendar" size={36} color={Colors.accent} />
            </View>
            <Text style={styles.title}>{agenda.title}</Text>
            <Text style={styles.description}>{agenda.description}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Precio</Text>
              <Text style={styles.price}>€{agenda.price.toFixed(0)}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Materials */}
        {agenda.materials.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Qué incluye</Text>
            {agenda.materials.map((item, i) => (
              <View key={i} style={styles.materialRow}>
                <MaterialCommunityIcons name="check-circle" size={20} color={Colors.jade} />
                <Text style={styles.materialText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Preview of Months */}
        {months.length > 0 && (
          <View style={styles.previewSection}>
            <Text style={styles.previewLabel}>Vista Previa del Contenido</Text>
            <Text style={styles.previewTitle}>{months.length} meses de contenido detallado</Text>

            {months.map((month, index) => {
              const isFree = isMonthFree(month) || purchased;
              return (
              <View key={month.id} style={styles.monthCard}>
                <View style={styles.monthHeader}>
                  <View style={styles.monthNumberCircle}>
                    <Text style={styles.monthNumber}>{month.month}</Text>
                  </View>
                  <View style={styles.monthTitleContainer}>
                    <Text style={styles.monthTitle}>{month.title}</Text>
                    <Text style={styles.monthSubtitle}>{month.events.length} eventos</Text>
                  </View>
                  {!isFree && (
                    <MaterialCommunityIcons name="lock" size={20} color={Colors.textLight} />
                  )}
                  {isMonthFree(month) && (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>Gratis</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.monthContent} numberOfLines={isFree ? undefined : 2}>
                  {month.content}
                </Text>

                {isFree && month.events.map((event, i) => (
                  <View key={i} style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <MaterialCommunityIcons 
                        name={event.auspicious ? "checkmark-circle" : "warning"} 
                        size={16} 
                        color={event.auspicious ? Colors.jade : Colors.warning} 
                      />
                      <Text style={styles.eventDate}>{event.date} · {event.day}</Text>
                    </View>
                    <Text style={styles.eventNotes}>
                      {event.notes}
                    </Text>
                  </View>
                ))}

                {!isFree && (
                  <View style={styles.lockedOverlay}>
                    <MaterialCommunityIcons name="lock" size={24} color={Colors.accent} />
                    <Text style={styles.lockedText}>
                      Desbloquea todo el año para acceder
                    </Text>
                  </View>
                )}
              </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Purchase Button - Sticky */}
      {!purchased && (
        <View style={styles.stickyBottom}>
          <TouchableOpacity
            testID="purchase-agenda-btn"
            style={styles.purchaseButton}
            onPress={handlePurchase}
          >
            <MaterialCommunityIcons name="lock-open-variant" size={20} color={Colors.primary} />
            <Text style={styles.purchaseText}>
              Comprar por €{agenda.price.toFixed(0)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl },
  headerNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  priceLabel: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.7,
  },
  price: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.accent,
  },
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  materialText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  previewSection: {
    marginBottom: Spacing.lg,
  },
  previewLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.textLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  previewTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  monthCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  monthNumberCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthNumber: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.accent,
  },
  monthTitleContainer: { flex: 1 },
  monthTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  monthSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  monthContent: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  eventCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: Spacing.xs,
  },
  eventDate: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  eventNotes: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent + '20',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  previewBadgeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.accent,
  },
  freeBadge: {
    backgroundColor: Colors.jade,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  freeBadgeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.white,
  },
  lockedOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '10',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderStyle: 'dashed',
  },
  lockedText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  purchaseText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
