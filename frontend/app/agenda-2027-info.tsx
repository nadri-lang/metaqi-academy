import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';

interface Quarter {
  id: number;
  titleKey: string;
  monthsKey: string;
  datesKey: string;
  price: string;
}

const QUARTERS: Quarter[] = [
  {
    id: 1,
    titleKey: 'wedding_agenda_2027.quarter_1_title',
    monthsKey: 'wedding_agenda_2027.quarter_1_months',
    datesKey: 'wedding_agenda_2027.quarter_1_dates',
    price: '9,90€',
  },
  {
    id: 2,
    titleKey: 'wedding_agenda_2027.quarter_2_title',
    monthsKey: 'wedding_agenda_2027.quarter_2_months',
    datesKey: 'wedding_agenda_2027.quarter_2_dates',
    price: '9,90€',
  },
  {
    id: 3,
    titleKey: 'wedding_agenda_2027.quarter_3_title',
    monthsKey: 'wedding_agenda_2027.quarter_3_months',
    datesKey: 'wedding_agenda_2027.quarter_3_dates',
    price: '9,90€',
  },
  {
    id: 4,
    titleKey: 'wedding_agenda_2027.quarter_4_title',
    monthsKey: 'wedding_agenda_2027.quarter_4_months',
    datesKey: 'wedding_agenda_2027.quarter_4_dates',
    price: '9,90€',
  },
];

export default function WeddingAgenda2027Screen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);

  const handleWhatsAppPurchase = (quarterId: number) => {
    const message = t('wedding_agenda_2027.whatsapp_message').replace('{quarter}', String(quarterId));
    const whatsapp = '34640510085';
    Linking.openURL(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`);
  };

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
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
              <Text style={styles.backButtonText}>
                {t('wedding_agenda_2027.back')}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.headerMainContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="heart" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.headerTitle}>
                {t('wedding_agenda_2027.header_title')}
              </Text>
              <Text style={styles.headerSubtitle}>
                {t('wedding_agenda_2027.header_subtitle')}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>
            {t('wedding_agenda_2027.what_includes')}
          </Text>
          <Text style={styles.description}>
            {t('wedding_agenda_2027.main_description')}
          </Text>
        </View>

        {/* Quarter Buttons */}
        <Text style={styles.sectionLabel}>
          {t('wedding_agenda_2027.select_quarter')}
        </Text>

        {QUARTERS.map((quarter) => (
          <TouchableOpacity
            key={quarter.id}
            style={styles.quarterButton}
            onPress={() => setSelectedQuarter(quarter)}
            activeOpacity={0.85}
          >
            <View style={styles.quarterButtonContent}>
              <View style={styles.quarterIconContainer}>
                <MaterialCommunityIcons name="calendar" size={28} color={Colors.accent} />
              </View>
              <View style={styles.quarterTextContainer}>
                <Text style={styles.quarterTitle}>
                  {t(quarter.titleKey)}
                </Text>
                <Text style={styles.quarterPrice}>{quarter.price}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Quarter Detail Modal */}
      <Modal
        visible={selectedQuarter !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedQuarter(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <SafeAreaView edges={['bottom']}>
              {selectedQuarter && (
                <>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIconContainer}>
                      <MaterialCommunityIcons name="heart" size={32} color={Colors.accent} />
                    </View>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setSelectedQuarter(null)}
                    >
                      <MaterialCommunityIcons name="close" size={28} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalContent}
                  >
                    <Text style={styles.modalTitle}>
                      {t(selectedQuarter.titleKey)}
                    </Text>
                    <Text style={styles.modalPrice}>{selectedQuarter.price}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.modalDescription}>
                      {t('wedding_agenda_2027.modal_description')}
                    </Text>

                    {/* Features */}
                    <View style={styles.featuresCard}>
                      <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.jade} />
                        <Text style={styles.featureText}>
                          {t('wedding_agenda_2027.feature_specific_days')}
                        </Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.jade} />
                        <Text style={styles.featureText}>
                          {t('wedding_agenda_2027.feature_analysis')}
                        </Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.jade} />
                        <Text style={styles.featureText}>
                          {t('wedding_agenda_2027.feature_orientations')}
                        </Text>
                      </View>
                    </View>

                    {/* WhatsApp Purchase Button */}
                    <TouchableOpacity
                      style={styles.whatsappButton}
                      onPress={() => {
                        handleWhatsAppPurchase(selectedQuarter.id);
                        setSelectedQuarter(null);
                      }}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="whatsapp" size={24} color={Colors.white} />
                      <Text style={styles.whatsappButtonText}>
                        {t('wedding_agenda_2027.buy_whatsapp')}
                      </Text>
                    </TouchableOpacity>

                    {/* Back Button */}
                    <TouchableOpacity
                      style={styles.modalBackButton}
                      onPress={() => setSelectedQuarter(null)}
                    >
                      <Text style={styles.modalBackButtonText}>
                        {t('wedding_agenda_2027.back')}
                      </Text>
                    </TouchableOpacity>

                    <View style={{ height: Spacing.xl }} />
                  </ScrollView>
                </>
              )}
            </SafeAreaView>
          </View>
        </View>
      </Modal>
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
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  headerMainContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.primary,
    opacity: 0.8,
  },
  content: {
    padding: Spacing.lg,
  },
  descriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  descriptionTitle: {
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
  },
  sectionLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textLight,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Quarter Buttons (Vertical List with Blue Border & Shadow)
  quarterButton: {
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: Spacing.md,
  },
  quarterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  quarterIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quarterTextContainer: {
    flex: 1,
  },
  quarterTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  quarterPrice: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.accent,
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
    maxHeight: '85%',
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modalTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: Spacing.sm,
  },
  modalPrice: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.accent,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: Spacing.lg,
  },
  modalDescription: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },
  featuresCard: {
    backgroundColor: Colors.jade + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.jade + '30',
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  whatsappButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  modalBackButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalBackButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
});
