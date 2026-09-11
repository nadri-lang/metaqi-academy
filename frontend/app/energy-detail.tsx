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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';
import FavoriteButton from '@/src/components/FavoriteButton';
import ZodiacEmblem from '@/src/components/ZodiacEmblem';
import ZodiacGlyph from '@/src/components/ZodiacGlyph';
import { ZodiacAnimalKey, ElementKey, animalPolarity } from '@/src/constants/Zodiac';
import { toAbsoluteMediaUrl } from '@/src/utils/mediaUrl';

interface DailyEnergy {
  id: string;
  date: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  animal?: string;
  animal_type?: ZodiacAnimalKey;
  element?: ElementKey;
  bazi_relationships?: string;
  recommendations: string[];
  avoid: string[];
  feng_shui_sectors: string[];
  qimen_directions: string[];
  favorable_hours: string[];
  travel_hours: string[];
  mudra_text?: string;
  mudra_image_url?: string;
}

type ModalType = 'hours' | 'travel' | 'activities' | 'avoid' | 'bazi' | 'fengshui' | 'qimen' | 'mudra' | null;

export default function EnergyDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  // Admin preview only: /energy-detail?date=YYYY-MM-DD shows that date's
  // content instead of today's. Regular in-app navigation never sets this
  // param, so users only ever land on today - see admin/daily-energy.tsx's
  // "Vista previa" button.
  const { date: previewDate } = useLocalSearchParams<{ date?: string }>();
  const [data, setData] = useState<DailyEnergy | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  useEffect(() => {
    load();
  }, [language, previewDate]);

  const load = async () => {
    try {
      const params: Record<string, string> = { lang: language };
      if (previewDate) params.date = previewDate;
      const response = await api.get('/energy/daily', { params });
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
      pt: 'pt-PT',
    };
    const locale = localeMap[language] || 'es-ES';
    
    const weekday = date.toLocaleDateString(locale, { weekday: 'long' });
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day}/${month}/${year}`;
  };

  // 8 buttons for 2-column grid using MaterialCommunityIcons
  const buttons = [
    { id: 'hours', label: t('daily.favorable_hours'), icon: 'clock-outline', color: Colors.accent },
    { id: 'travel', label: t('daily.travel'), icon: 'airplane', color: Colors.primary },
    { id: 'mudra', label: t('daily.mudra'), icon: 'hand-back-right-outline', color: Colors.accent },
    { id: 'activities', label: t('daily.activities'), icon: 'check-circle-outline', color: Colors.jade },
    { id: 'avoid', label: t('daily.to_avoid'), icon: 'close-circle-outline', color: Colors.error },
    { id: 'bazi', label: t('daily.bazi'), icon: 'yin-yang', color: Colors.accent },
    { id: 'fengshui', label: t('daily.feng_shui'), icon: 'home-outline', color: Colors.jade },
    { id: 'qimen', label: t('daily.qimen'), icon: 'compass-outline', color: Colors.accent },
  ];

  const renderModalContent = () => {
    if (!data) return null;

    switch (activeModal) {
      case 'hours':
        return (
          <View>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="clock-outline" size={28} color={Colors.accent} />
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
                {t('common.no_info_available')}
              </Text>
            )}
          </View>
        );

      case 'travel':
        return (
          <View>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="airplane" size={28} color={Colors.primary} />
              <Text style={styles.modalTitle}>{t('daily.travel_hours')}</Text>
            </View>
            {data.travel_hours && data.travel_hours.length > 0 ? (
              data.travel_hours.map((hour, idx) => (
                <View key={idx} style={styles.modalListItem}>
                  <View style={[styles.modalBullet, { backgroundColor: Colors.error }]} />
                  <Text style={styles.modalText}>{hour}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.modalEmptyText}>
                {t('common.no_info_available')}
              </Text>
            )}
          </View>
        );

      case 'mudra':
        return (
          <View>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="hand-back-right-outline" size={28} color={Colors.accent} />
              <Text style={styles.modalTitle}>
                {t('daily.mudra')}
              </Text>
            </View>

            {data.mudra_text ? (
              <Text style={styles.modalParagraphText}>{data.mudra_text}</Text>
            ) : (
              <Text style={styles.modalEmptyText}>
                {t('common.no_info_available')}
              </Text>
            )}

            {data.mudra_image_url && (
              <View style={styles.activationsImageContainer}>
                <Image
                  source={{ uri: toAbsoluteMediaUrl(data.mudra_image_url) }}
                  style={styles.activationsImage}
                  resizeMode="cover"
                />
              </View>
            )}
          </View>
        );

      case 'activities':
        return (
          <View>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="check-circle-outline" size={28} color={Colors.jade} />
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
                {t('common.no_info_available')}
              </Text>
            )}
          </View>
        );

      case 'avoid':
        return (
          <View>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="close-circle-outline" size={28} color={Colors.error} />
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
                {t('common.no_info_available')}
              </Text>
            )}
          </View>
        );

      case 'bazi':
        return (
          <View>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="yin-yang" size={28} color={Colors.accent} />
              <Text style={styles.modalTitle}>{t('daily.bazi')}</Text>
            </View>
            <Text style={styles.modalSubtitle}>{t('daily.bazi_relationships')}</Text>
            <Text style={styles.modalTikTokNote}>{t('daily.bazi_tiktok_note')}</Text>
            {data.bazi_relationships ? (
              <Text style={styles.modalDescription}>{data.bazi_relationships}</Text>
            ) : (
              <Text style={styles.modalEmptyText}>
                {t('common.no_info_available')}
              </Text>
            )}
          </View>
        );

      case 'fengshui':
        return (
          <View>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="home-outline" size={28} color={Colors.jade} />
              <Text style={styles.modalTitle}>{t('daily.feng_shui')}</Text>
            </View>
            <Text style={styles.modalSubtitle}>{t('daily.feng_shui_sectors')}</Text>
            {data.feng_shui_sectors && data.feng_shui_sectors.length > 0 ? (
              data.feng_shui_sectors.map((item, idx) => (
                <View key={idx} style={styles.modalListItem}>
                  <MaterialCommunityIcons name="map-marker" size={18} color={Colors.jade} />
                  <Text style={styles.modalText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.modalEmptyText}>
                {t('common.no_info_available')}
              </Text>
            )}
          </View>
        );

      case 'qimen':
        return (
          <View>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="compass-outline" size={28} color={Colors.accent} />
              <Text style={styles.modalTitle}>{t('daily.qimen')}</Text>
            </View>
            <Text style={styles.modalSubtitle}>{t('daily.qimen_directions')}</Text>
            {data.qimen_directions && data.qimen_directions.length > 0 ? (
              data.qimen_directions.map((item, idx) => (
                <View key={idx} style={styles.modalListItem}>
                  <MaterialCommunityIcons name="navigation" size={18} color={Colors.accent} />
                  <Text style={styles.modalText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.modalEmptyText}>
                {t('common.no_info_available')}
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
        <LinearGradient colors={Gradients.navy} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                testID="back-button"
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('daily.title')}</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="weather-sunny" size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>{t('daily.no_content')}</Text>
          <Text style={styles.emptyText}>{t('daily.come_back_later')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              testID="back-button"
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('daily.title')}</Text>
            <View style={{ width: 40 }} />
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
        {/* Date / Animal / Emblem card */}
        <View style={styles.dateCard}>
          <View style={styles.dateCardTopRow}>
            <View style={styles.dateCardTextCol}>
              <View style={styles.dateRow}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.dateText}>
                  {formatDate(data.date)}{previewDate ? ` · ${t('daily.preview_badge')}` : ''}
                </Text>
              </View>
              <Text style={styles.dayTitle} numberOfLines={3}>{data.title}</Text>
              {data.animal_type && data.element ? (
                <Text style={[styles.animalRowText, styles.elementRowText]}>
                  {t('home.element_of_day')}: <Text style={styles.animalRowName}>
                    {t(`zodiac.elements.${data.element}`)} {t(`zodiac.${animalPolarity(data.animal_type)}`)}
                  </Text>
                </Text>
              ) : null}
              {data.animal ? (
                <View style={styles.animalRow}>
                  {data.animal_type ? (
                    <ZodiacGlyph animal={data.animal_type} size={16} color={Colors.accent} />
                  ) : (
                    <MaterialCommunityIcons name="paw" size={16} color={Colors.accent} />
                  )}
                  <Text style={styles.animalRowText}>
                    {t('home.animal_of_day')}: <Text style={styles.animalRowName}>
                      {data.animal_type ? t(`zodiac.animals.${data.animal_type}`) : data.animal}
                    </Text>
                  </Text>
                </View>
              ) : null}
            </View>
            {data.animal_type ? (
              <ZodiacEmblem
                animal={data.animal_type}
                element={data.element}
                size={80}
                ringColor={Colors.accent}
                backgroundColor={Colors.primary}
              />
            ) : (
              <View style={styles.dateCardIconRing}>
                <MaterialCommunityIcons name="white-balance-sunny" size={26} color={Colors.accent} />
              </View>
            )}
          </View>
          <View style={styles.onlyTodayRow}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.textLight} />
            <Text style={styles.onlyTodayText}>{t('daily.only_today_note')}</Text>
          </View>
        </View>

        {/* Main Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.description}>{data.content}</Text>
        </View>

        {/* 2-Column Grid of Buttons */}
        <Text style={styles.sectionLabel}>
          {t('common.day_information')}
        </Text>
        <View style={styles.buttonsGrid}>
          {buttons.map((btn) => {
            const active = activeModal === btn.id;
            return (
              <TouchableOpacity
                key={btn.id}
                style={[styles.gridButton, active && styles.gridButtonActive]}
                onPress={() => setActiveModal(btn.id as ModalType)}
                activeOpacity={0.7}
              >
                <View style={[styles.gridButtonIconContainer, { backgroundColor: btn.color + '20' }]}>
                  <MaterialCommunityIcons name={btn.icon as any} size={26} color={btn.color} />
                </View>
                <Text style={styles.gridButtonLabel}>{btn.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Footer: save to favorites + "content only today" */}
        <View style={styles.footerRow}>
          <View style={styles.favoriteRow}>
            <FavoriteButton itemType="daily_energy" itemId={data.date} size={20} color={Colors.accent} />
            <Text style={styles.favoriteRowText}>{t('home.save_favorite')}</Text>
          </View>
          <View style={styles.onlyTodayPill}>
            <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
            <Text style={styles.onlyTodayPillText}>{t('daily.content_only_today')}</Text>
          </View>
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
              <View style={styles.modalTopBar}>
                <TouchableOpacity
                  testID="modal-back-button"
                  style={styles.modalBackArrow}
                  onPress={() => setActiveModal(null)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
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
  // Header
  header: {
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.white,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  // Date / Animal / Emblem Card
  dateCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  dateCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dateCardTextCol: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  dateText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  dayTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  elementRowText: {
    marginBottom: Spacing.xs,
  },
  animalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  animalRowText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  animalRowName: {
    fontFamily: Typography.sansSemiBold,
    color: Colors.accent,
  },
  dateCardIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlyTodayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  onlyTodayText: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    flex: 1,
  },
  // Description Card
  descriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  // Section Label
  sectionLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // 2-Column Grid
  buttonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridButton: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    padding: Spacing.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    // Gold shadow effect
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  gridButtonActive: {
    borderColor: Colors.accent,
    borderWidth: 2,
    shadowOpacity: 0.4,
  },
  gridButtonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  gridButtonLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  // Footer row: save to favorites + "content only today" pill
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteRowText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.accent,
  },
  onlyTodayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success + '20',
    borderWidth: 1,
    borderColor: Colors.success + '60',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  onlyTodayPillText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.success,
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
  modalTopBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalBackArrow: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalTikTokNote: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    fontStyle: 'italic',
    color: Colors.textLight,
    marginBottom: Spacing.md,
    lineHeight: 16,
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
  modalParagraphText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 24,
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
  activationsImageContainer: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  activationsImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
  },
});
