import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';
import FavoriteButton from '@/src/components/FavoriteButton';

interface NewbornVocation {
  id: string;
  date: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  talents: string[];
  vocations: string[];
}

interface AvailableDates {
  available_dates: string[];
  today: string;
  range_start: string;
  range_end: string;
}

// Helper to get client's local date in YYYY-MM-DD format
const getClientDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to add/subtract days from a date string
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function NewbornVocationDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [data, setData] = useState<NewbornVocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(getClientDate());
  const [clientToday] = useState<string>(getClientDate());

  // Calculate date range (today - 2 days)
  const rangeStart = addDays(clientToday, -2);
  const rangeEnd = clientToday;

  // Check if we can navigate to previous/next day
  const canGoPrevious = currentDate > rangeStart && availableDates.some(d => d < currentDate && d >= rangeStart);
  const canGoNext = currentDate < rangeEnd && availableDates.some(d => d > currentDate && d <= rangeEnd);

  useEffect(() => {
    loadAvailableDates();
  }, []);

  useEffect(() => {
    if (currentDate) {
      loadDataForDate(currentDate);
    }
  }, [currentDate, language]);

  const loadAvailableDates = async () => {
    try {
      const response = await api.get('/newborn-vocation/available-dates', {
        params: { client_date: clientToday }
      });
      const dates = response.data.available_dates || [];
      setAvailableDates(dates);
      
      // If today has data, show it. Otherwise, show the most recent available date
      if (dates.includes(clientToday)) {
        setCurrentDate(clientToday);
      } else if (dates.length > 0) {
        // dates are sorted descending, so first one is most recent
        setCurrentDate(dates[0]);
      }
    } catch (error) {
      console.error('Error loading available dates:', error);
      // Fallback to loading today's data
      loadDataForDate(clientToday);
    }
  };

  const loadDataForDate = async (date: string) => {
    setLoading(true);
    try {
      const response = await api.get('/newborn-vocation/by-date', {
        params: { 
          date: date,
          client_date: clientToday
        }
      });
      setData(response.data);
    } catch (error: any) {
      console.error('Error loading newborn vocation:', error);
      // If specific date fails, try to get any available data
      if (error.response?.status === 404 || error.response?.status === 403) {
        try {
          const fallbackResponse = await api.get('/newborn-vocation/today', {
            params: { client_date: clientToday }
          });
          setData(fallbackResponse.data);
          if (fallbackResponse.data?.date) {
            setCurrentDate(fallbackResponse.data.date);
          }
        } catch (fallbackError) {
          setData(null);
        }
      } else {
        setData(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAvailableDates();
  }, []);

  const goToPreviousDay = () => {
    // Find the previous available date
    const sortedDates = [...availableDates].sort().reverse();
    const previousDate = sortedDates.find(d => d < currentDate && d >= rangeStart);
    if (previousDate) {
      setCurrentDate(previousDate);
    }
  };

  const goToNextDay = () => {
    // Find the next available date
    const sortedDates = [...availableDates].sort();
    const nextDate = sortedDates.find(d => d > currentDate && d <= rangeEnd);
    if (nextDate) {
      setCurrentDate(nextDate);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    // Use language-appropriate locale
    const localeMap: { [key: string]: string } = {
      es: 'es-ES',
      en: 'en-US',
      fr: 'fr-FR',
      de: 'de-DE',
      ro: 'ro-RO',
    };
    
    return date.toLocaleDateString(localeMap[language] || 'es-ES', options);
  };

  const isToday = currentDate === clientToday;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!data) {
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
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
                <Text style={styles.backButtonTextWhite}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="star-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>
            {language === 'es' ? 'Sin información disponible' : 'No information available'}
          </Text>
          <Text style={styles.emptyText}>
            {language === 'es' ? 'Vuelve más tarde' : 'Come back later'}
          </Text>
          <Text style={styles.debugText}>
            {language === 'es' ? `Fecha actual: ${clientToday}` : `Current date: ${clientToday}`}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            {/* Botón Volver */}
            <TouchableOpacity
              testID="back-button"
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
              <Text style={styles.backButtonTextWhite}>{t('common.back')}</Text>
            </TouchableOpacity>
            
            {/* SIMPLIFIED HEADER - Single title with date */}
            <View style={styles.simplifiedHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.simplifiedTitle}>
                  {language === 'es' 
                    ? `VOCACIÓN DEL BEBÉ NACIDO HOY - ${data.date.split('-').reverse().join('/')}`
                    : `VOCATION OF BABY BORN TODAY - ${data.date.split('-').reverse().join('/')}`
                  }
                </Text>
                {isToday && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>
                      {language === 'es' ? 'HOY' : 'TODAY'}
                    </Text>
                  </View>
                )}
              </View>
              <FavoriteButton 
                itemType="newborn_vocation" 
                itemId={data.date} 
                size={24} 
                color={Colors.white}
              />
            </View>

            {/* Navigation Arrows */}
            {availableDates.length > 1 && (
              <View style={styles.navigationRow}>
                <TouchableOpacity
                  testID="prev-day-button"
                  style={[styles.navButton, !canGoPrevious && styles.navButtonDisabled]}
                  onPress={goToPreviousDay}
                  disabled={!canGoPrevious}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name="chevron-left" 
                    size={24} 
                    color={canGoPrevious ? Colors.white : Colors.white + '40'} 
                  />
                  <Text style={[styles.navButtonText, !canGoPrevious && styles.navButtonTextDisabled]}>
                    {language === 'es' ? 'Día Anterior' : 'Previous Day'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  testID="next-day-button"
                  style={[styles.navButton, !canGoNext && styles.navButtonDisabled]}
                  onPress={goToNextDay}
                  disabled={!canGoNext}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.navButtonText, !canGoNext && styles.navButtonTextDisabled]}>
                    {language === 'es' ? 'Día Siguiente' : 'Next Day'}
                  </Text>
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={24} 
                    color={canGoNext ? Colors.white : Colors.white + '40'} 
                  />
                </TouchableOpacity>
              </View>
            )}
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
          <Text style={styles.description}>
            {data.content}
          </Text>
        </View>

        {/* Talentos Naturales */}
        {data.talents && data.talents.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="shimmer" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>{t('home.natural_talents')}</Text>
            </View>
            {data.talents.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: Colors.accent }]} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Vocaciones Favorables */}
        {data.vocations && data.vocations.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="briefcase" size={22} color={Colors.jade} />
              <Text style={styles.sectionTitle}>{t('home.favorable_vocations')}</Text>
            </View>
            {data.vocations.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: Colors.jade }]} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Available dates indicator */}
        {availableDates.length > 0 && (
          <View style={styles.datesIndicator}>
            <Text style={styles.datesIndicatorText}>
              {language === 'es' 
                ? `${availableDates.length} día${availableDates.length > 1 ? 's' : ''} disponible${availableDates.length > 1 ? 's' : ''}`
                : `${availableDates.length} day${availableDates.length > 1 ? 's' : ''} available`
              }
            </Text>
            <View style={styles.dotsContainer}>
              {availableDates.sort().map((date, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.dot,
                    date === currentDate && styles.dotActive
                  ]} 
                />
              ))}
            </View>
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
  debugText: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginTop: Spacing.md,
  },
  header: { paddingBottom: Spacing.lg },
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
  backButtonTextWhite: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  // Simplified Header for Baby Vocation
  simplifiedHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  simplifiedTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: Spacing.sm,
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
    backgroundColor: Colors.jade + '30',
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerDate: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  todayBadge: {
    backgroundColor: Colors.jade,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  todayBadgeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.white,
    letterSpacing: 1,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    lineHeight: 32,
  },
  // Navigation arrows
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.white + '20',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.white,
  },
  navButtonTextDisabled: {
    color: Colors.white + '60',
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
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    flex: 1,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
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
  // Available dates indicator
  datesIndicator: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    padding: Spacing.md,
  },
  datesIndicatorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textLight + '40',
  },
  dotActive: {
    backgroundColor: Colors.accent,
  },
});
