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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';

interface AgendaMonth {
  id: string;
  agenda_id: string;
  month: number;
  year: number;
  title: string;
  content: string;
}

export default function AgendaMonthlyFreeScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [data, setData] = useState<AgendaMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Obtener solo contenido GRATUITO (is_free=true)
      const response = await api.get('/agendas/wedding-agenda/months', {
        params: { is_free: true }
      });
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Tomar el primer mes disponible como contenido gratuito
        setData(response.data[0]);
      }
    } catch (error) {
      console.error('Error loading monthly agenda:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleGoToFullAgenda = () => {
    router.push('/agenda-2027-info');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              testID="back-button"
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
            
            <View style={styles.iconRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar-outline" size={32} color={Colors.accent} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerLabel}>
                  {t('home.wedding_agenda')}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {t('home.free_content')}
                </Text>
              </View>
            </View>
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>
              {t('common.loading')}
            </Text>
          </View>
        ) : data ? (
          <>
            <View style={styles.freeBanner}>
              <Ionicons name="gift-outline" size={24} color={Colors.accent} />
              <Text style={styles.freeBannerText}>
                {t('home.free_monthly_content')}
              </Text>
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.contentTitle}>{data.title}</Text>
              <Text style={styles.contentText}>{data.content}</Text>
            </View>

            {/* CTA para Agenda Completa 2027 */}
            <View style={styles.ctaCard}>
              <Ionicons name="sparkles" size={32} color={Colors.accent} />
              <Text style={styles.ctaTitle}>
                {language === 'es' ? '¿Quieres la Agenda Completa 2027?' : 'Want the Complete 2027 Agenda?'}
              </Text>
              <Text style={styles.ctaDescription}>
                {language === 'es' 
                  ? 'Accede a todos los meses del año con fechas y horarios específicos para tu boda perfecta.'
                  : 'Access all months of the year with specific dates and times for your perfect wedding.'}
              </Text>
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleGoToFullAgenda}
              >
                <Text style={styles.ctaButtonText}>
                  {language === 'es' ? 'Ver Agenda 2027' : 'View 2027 Agenda'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.noDataCard}>
            <Ionicons name="information-circle-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.noDataTitle}>
              {language === 'es' ? 'Sin contenido disponible' : 'No content available'}
            </Text>
            <Text style={styles.noDataDescription}>
              {language === 'es' 
                ? 'El contenido gratuito se actualizará próximamente.'
                : 'Free content will be updated soon.'}
            </Text>
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: { flex: 1 },
  headerLabel: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.accent,
  },
  content: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    padding: Spacing['2xl'],
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '20',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  freeBannerText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.accent,
  },
  contentCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  contentTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  contentText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  ctaCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.accent,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  ctaTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  ctaDescription: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  ctaButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  noDataCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  noDataTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  noDataDescription: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
