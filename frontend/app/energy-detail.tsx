import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';

interface DailyEnergy {
  id: string;
  date: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  animal?: string;
  bazi_relationships?: string;
  recommendations: string[];
  avoid: string[];
  feng_shui_sectors: string[];
  qimen_directions: string[];
  favorable_hours: string[];
}

type ModalType = 'hours' | 'activities' | 'avoid' | 'bazi' | 'fengshui' | 'qimen' | null;

export default function EnergyDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [data, setData] = useState<DailyEnergy | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    load();
  }, [language]);

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
    const date = new Date(dateStr + 'T12:00:00');
    const localeMap: { [key: string]: string } = {
      es: 'es-ES',
      en: 'en-US',
      fr: 'fr-FR',
      de: 'de-DE',
      ro: 'ro-RO',
    };
    const locale = localeMap[language] || 'es-ES';
    
    const weekday = date.toLocaleDateString(locale, { weekday: 'long' });
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    // Format: Martes, 28/07/2026
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day}/${month}/${year}`;
  };

  const buttons = [
    { id: 'hours', label: t('daily.favorable_hours'), icon: 'time', color: Colors.accent },
    { id: 'activities', label: t('daily.activities'), icon: 'checkmark-circle', color: Colors.jade },
    { id: 'avoid', label: t('daily.to_avoid'), icon: 'close-circle', color: Colors.error },
    { id: 'bazi', label: t('daily.bazi'), icon: 'git-network', color: Colors.accent },
    { id: 'fengshui', label: t('daily.feng_shui'), icon: 'home', color: Colors.jade },
    { id: 'qimen', label: t('daily.qimen'), icon: 'compass', color: Colors.accent },
  ];

  const renderModalContent = () => {
    if (!data) return null;

    switch (activeModal) {
      case 'hours':
        return (
          <View>
            <View style={styles.modalHeader}>
              <Ionicons name="time" size={28} color={Colors.accent} />
              <Text style={styles.modalTitle}>{t('daily.favorable_hours')}</Text>
            </View>
            {data.favorable_hours && data.favorable_hours.length > 0 ? (
              data.favorable_hours.map((hour, idx) => (
                <View key={idx} style={styles.modalListItem}>
                  <View style={[styles.modalBullet, { backgroundColor: Colors.accent }]} />
                  <Text style={styles.modalText}>{hour}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.modalEmptyText}>
                {language === 'es' ? 'Sin información disponible' : 'No information available'}
              </Text>
            )}
          </View>
        );

      case 'activities':
        return (
          <View>
            <View style={styles.modalHeader}>
              <Ionicons name="checkmark-circle" size={28} color={Colors.jade} />
              <Text style={styles.modalTitle}>{t('daily.sustained_activities')}</Text>
            </View>
            {data.recommendations && data.recommendations.length > 0 ? (
              data.recommendations.map((item, idx) => (
                <View key={idx} style={styles.modalListItem}>
                  <View style={[styles.modalBullet, { backgroundColor: Colors.jade }]} />
                  <Text style={styles.modalText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.modalEmptyText}>
                {language === 'es' ? 'Sin información disponible' : 'No information available'}
              </Text>
            )}
          </View>
        );

      case 'avoid':
        return (
          <View>
            <View style={styles.modalHeader}>
              <Ionicons name="close-circle" size={28} color={Colors.error} />
              <Text style={styles.modalTitle}>{t('daily.avoid_activities')}</Text>
            </View>
            {data.avoid && data.avoid.length > 0 ? (
              data.avoid.map((item, idx) => (
                <View key={idx} style={styles.modalListItem}>
                  <View style={[styles.modalBullet, { backgroundColor: Colors.error }]} />
                  <Text style={styles.modalText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.modalEmptyText}>
                {language === 'es' ? 'Sin información disponible' : 'No information available'}
              </Text>
            )}
          </View>
        );

      case 'bazi':
        return (
          <View>
            <View style={styles.modalHeader}>
              <Ionicons name="git-network" size={28} color={Colors.accent} />
              <Text style={styles.modalTitle}>{t('daily.bazi')}</Text>
            </View>
            <Text style={styles.modalSubtitle}>{t('daily.bazi_relationships')}</Text>
            {data.bazi_relationships ? (
              <Text style={styles.modalDescription}>{data.bazi_relationships}</Text>
            ) : (
              <Text style={styles.modalEmptyText}>
                {language === 'es' ? 'Sin información disponible' : 'No information available'}
              </Text>
            )}
          </View>
        );

      case 'fengshui':
        return (
          <View>
            <View style={styles.modalHeader}>
              <Ionicons name="home" size={28} color={Colors.jade} />
              <Text style={styles.modalTitle}>{t('daily.feng_shui')}</Text>
            </View>
            <Text style={styles.modalSubtitle}>{t('daily.feng_shui_sectors')}</Text>
            {data.feng_shui_sectors && data.feng_shui_sectors.length > 0 ? (
              data.feng_shui_sectors.map((item, idx) => (
                <View key={idx} style={styles.modalListItem}>
                  <Ionicons name="location" size={18} color={Colors.jade} />
                  <Text style={styles.modalText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.modalEmptyText}>
                {language === 'es' ? 'Sin información disponible' : 'No information available'}
              </Text>
            )}
          </View>
        );

      case 'qimen':
        return (
          <View>
            <View style={styles.modalHeader}>
              <Ionicons name="compass" size={28} color={Colors.accent} />
              <Text style={styles.modalTitle}>{t('daily.qimen')}</Text>
            </View>
            <Text style={styles.modalSubtitle}>{t('daily.qimen_directions')}</Text>
            {data.qimen_directions && data.qimen_directions.length > 0 ? (
              data.qimen_directions.map((item, idx) => (
                <View key={idx} style={styles.modalListItem}>
                  <Ionicons name="navigate" size={18} color={Colors.accent} />
                  <Text style={styles.modalText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.modalEmptyText}>
                {language === 'es' ? 'Sin información disponible' : 'No information available'}
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
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
      <View style={styles.container}>
        <LinearGradient colors={Gradients.gold} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                testID="back-button"
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                <Text style={styles.backButtonText}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.emptyState}>
          <Ionicons name="sunny-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>{t('daily.no_content')}</Text>
          <Text style={styles.emptyText}>{t('daily.come_back_later')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <LinearGradient colors={Gradients.gold} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            {/* Back Button */}
            <TouchableOpacity
              testID="back-button"
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.primary} />
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
            
            {/* Date and Title - NO "ENERGÍA DEL DÍA" label */}
            <View style={styles.headerMainContent}>
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <Text style={styles.headerDate}>{formatDate(data.date)}</Text>
              </View>
              <Text style={styles.headerTitle}>{data.title}</Text>
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
        {/* Animal del Día - At the top, below banner */}
        {data.animal && (
          <View style={styles.animalCard}>
            <View style={styles.animalHeader}>
              <Ionicons name="paw" size={24} color={Colors.accent} />
              <Text style={styles.animalLabel}>{t('daily.animal')}</Text>
            </View>
            <Text style={styles.animalText}>{data.animal}</Text>
          </View>
        )}

        {/* Main Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.description}>{data.content}</Text>
        </View>

        {/* Vertical Buttons List */}
        <Text style={styles.sectionLabel}>
          {language === 'es' ? 'Información del Día' : 'Day Information'}
        </Text>
        <View style={styles.buttonsContainer}>
          {buttons.map((btn) => (
            <TouchableOpacity
              key={btn.id}
              style={styles.infoButton}
              onPress={() => setActiveModal(btn.id as ModalType)}
              activeOpacity={0.7}
            >
              <View style={[styles.buttonIconContainer, { backgroundColor: btn.color + '20' }]}>
                <Ionicons name={btn.icon as any} size={24} color={btn.color} />
              </View>
              <Text style={styles.buttonLabel}>{btn.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Modal */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <SafeAreaView edges={['bottom']}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                {renderModalContent()}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setActiveModal(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeButtonText}>{t('daily.close')}</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  headerMainContent: {
    alignItems: 'flex-start',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headerDate: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.primary,
    lineHeight: 34,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  // Animal Card - Top position
  animalCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  animalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  animalLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  animalText: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.accent,
    textAlign: 'center',
  },
  // Description Card
  descriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  // Vertical Buttons
  sectionLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonsContainer: {
    gap: Spacing.md,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  buttonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  buttonLabel: {
    flex: 1,
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
    minHeight: 300,
  },
  modalScrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    flex: 1,
  },
  modalSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  modalDescription: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  modalBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  modalText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  modalEmptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  closeButton: {
    backgroundColor: Colors.accent,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
});
