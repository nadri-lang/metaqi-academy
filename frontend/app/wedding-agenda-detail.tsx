import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
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
  events?: any[];
}

export default function WeddingAgendaDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [months, setMonths] = useState<AgendaMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAgenda();
  }, []);

  const loadAgenda = async () => {
    try {
      const response = await api.get('/agendas/wedding-agenda/months');
      if (response.data && Array.isArray(response.data)) {
        setMonths(response.data);
      }
    } catch (error) {
      console.error('Error loading wedding agenda:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAgenda();
  };

  const handleContact = () => {
    Linking.openURL('mailto:r.scala1108@gmail.com?subject=Agenda de Bodas 2027 - Consulta');
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
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
            
            <View style={styles.iconRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="heart" size={32} color={Colors.accent} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerLabel}>{t('services.wedding_agenda_2027')}</Text>
                <Text style={styles.headerYear}>2027</Text>
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
              {language === 'es' ? 'Cargando fechas favorables...' : 'Loading favorable dates...'}
            </Text>
          </View>
        ) : (
          <>
            {/* DATOS REALES DE LA BASE DE DATOS - MOSTRAR PRIMERO */}
            {months.length > 0 ? (
              <>
                <View style={styles.realDataBanner}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.accent} />
                  <Text style={styles.realDataText}>
                    {language === 'es' 
                      ? `${months.length} ${months.length === 1 ? 'mes disponible' : 'meses disponibles'}` 
                      : `${months.length} ${months.length === 1 ? 'month available' : 'months available'}`}
                  </Text>
                </View>

                <View style={styles.monthsContainer}>
                  {months.map((month) => (
                    <View key={month.id} style={styles.monthCard}>
                      <View style={styles.monthHeader}>
                        <Ionicons name="calendar" size={20} color={Colors.accent} />
                        <Text style={styles.monthTitle}>{month.title}</Text>
                      </View>
                      <Text style={styles.monthContent}>{month.content}</Text>
                      {month.year && (
                        <Text style={styles.monthYear}>Año: {month.year}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.noDataCard}>
                <Ionicons name="information-circle-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.noDataTitle}>
                  {language === 'es' ? 'Sin fechas cargadas aún' : 'No dates loaded yet'}
                </Text>
                <Text style={styles.noDataDescription}>
                  {language === 'es' 
                    ? 'Las fechas favorables para bodas se actualizarán próximamente.'
                    : 'Favorable wedding dates will be updated soon.'}
                </Text>
              </View>
            )}

            {/* Contenido informativo adicional */}
            <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? '¿Qué incluye?' : 'What\'s included?'}
          </Text>
          <Text style={styles.description}>
            {language === 'es' 
              ? 'La Agenda de Bodas 2027 es una guía completa que te ayudará a elegir la fecha perfecta para tu boda según los principios de la metafísica china.'
              : 'The Wedding Agenda 2027 is a complete guide that will help you choose the perfect date for your wedding according to Chinese metaphysics principles.'}
          </Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="calendar" size={24} color={Colors.accent} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  {language === 'es' ? '365 Días Analizados' : '365 Days Analyzed'}
                </Text>
                <Text style={styles.featureDesc}>
                  {language === 'es'
                    ? 'Todos los días del año 2027 evaluados según Feng Shui, BaZi y Qi Men Dun Jia'
                    : 'All days of 2027 evaluated according to Feng Shui, BaZi and Qi Men Dun Jia'}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="star" size={24} color={Colors.accent} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  {language === 'es' ? 'Fechas Más Auspiciosas' : 'Most Auspicious Dates'}
                </Text>
                <Text style={styles.featureDesc}>
                  {language === 'es'
                    ? 'Las mejores fechas para celebrar bodas, ceremonias y uniones'
                    : 'The best dates to celebrate weddings, ceremonies and unions'}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="book" size={24} color={Colors.accent} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  {language === 'es' ? 'Guía Completa' : 'Complete Guide'}
                </Text>
                <Text style={styles.featureDesc}>
                  {language === 'es'
                    ? 'Explicaciones detalladas de cada fecha y recomendaciones personalizadas'
                    : 'Detailed explanations of each date and personalized recommendations'}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="heart-circle" size={24} color={Colors.accent} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  {language === 'es' ? 'Compatibilidad de Parejas' : 'Couple Compatibility'}
                </Text>
                <Text style={styles.featureDesc}>
                  {language === 'es'
                    ? 'Análisis de compatibilidad según las cartas BaZi de ambos novios'
                    : 'Compatibility analysis based on both partners\' BaZi charts'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>
            {language === 'es' ? 'Inversión' : 'Investment'}
          </Text>
          <Text style={styles.priceAmount}>€197</Text>
          <Text style={styles.priceNote}>
            {language === 'es' 
              ? 'Acceso inmediato y permanente' 
              : 'Immediate and permanent access'}
          </Text>
        </View>

        <TouchableOpacity
          testID="contact-button"
          style={styles.contactButton}
          onPress={handleContact}
        >
          <Ionicons name="mail" size={20} color={Colors.primary} />
          <Text style={styles.contactButtonText}>{t('services.contact_admin')}</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    padding: Spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  realDataBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '20',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  realDataText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.accent,
  },
  noDataCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
  monthsContainer: {
    marginBottom: Spacing.lg,
  },
  monthCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.accent,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  monthTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.accent,
    flex: 1,
  },
  monthContent: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  monthYear: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
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
    fontSize: Typography['2xl'],
    color: Colors.accent,
    marginBottom: 4,
  },
  headerYear: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.xl,
    color: Colors.white,
    opacity: 0.8,
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
    marginBottom: Spacing.xl,
  },
  featuresList: {
    gap: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  featureDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  priceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.accent,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  priceLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  priceAmount: {
    fontFamily: Typography.serifBold,
    fontSize: 48,
    color: Colors.accent,
    marginBottom: 8,
  },
  priceNote: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  contactButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
});
