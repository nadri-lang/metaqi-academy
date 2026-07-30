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
  titleEs: string;
  titleEn: string;
  monthsEs: string;
  monthsEn: string;
  datesEs: string;
  datesEn: string;
  price: string;
}

const QUARTERS: Quarter[] = [
  {
    id: 1,
    titleEs: 'TRIM. 1 Enero-Marzo 2027',
    titleEn: 'Q1 January-March 2027',
    monthsEs: 'Enero, Febrero y Marzo',
    monthsEn: 'January, February and March',
    datesEs: '1 de enero hasta 31 de marzo',
    datesEn: 'January 1st to March 31st',
    price: '9,90€',
  },
  {
    id: 2,
    titleEs: 'TRIM. 2 Abril-Junio 2027',
    titleEn: 'Q2 April-June 2027',
    monthsEs: 'Abril, Mayo y Junio',
    monthsEn: 'April, May and June',
    datesEs: '1 de abril hasta 30 de junio',
    datesEn: 'April 1st to June 30th',
    price: '9,90€',
  },
  {
    id: 3,
    titleEs: 'TRIM. 3 Julio-Septiembre 2027',
    titleEn: 'Q3 July-September 2027',
    monthsEs: 'Julio, Agosto y Septiembre',
    monthsEn: 'July, August and September',
    datesEs: '1 de julio hasta 30 de septiembre',
    datesEn: 'July 1st to September 30th',
    price: '9,90€',
  },
  {
    id: 4,
    titleEs: 'TRIM. 4 Octubre-Diciembre 2027',
    titleEn: 'Q4 October-December 2027',
    monthsEs: 'Octubre, Noviembre y Diciembre',
    monthsEn: 'October, November and December',
    datesEs: '1 de octubre hasta 31 de diciembre',
    datesEn: 'October 1st to December 31st',
    price: '9,90€',
  },
];

export default function WeddingAgenda2027Screen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter | null>(null);

  const handleWhatsAppPurchase = (quarterId: number) => {
    const message = language === 'es'
      ? `Hola, me interesa comprar la Agenda de Bodas 2027 del trimestre nº ${quarterId}. ¿Podríais facilitarme la información de pago para realizar la compra? Muchas gracias.`
      : `Hello, I'm interested in purchasing the Wedding Agenda 2027 for quarter ${quarterId}. Could you provide me with the payment information to complete the purchase? Thank you very much.`;
    
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
                {language === 'es' ? 'Volver' : 'Back'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.headerMainContent}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="heart" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.headerTitle}>
                {language === 'es' ? 'AGENDA DE BODAS 2027' : 'WEDDING AGENDA 2027'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'es' ? 'Trimestral' : 'Quarterly'}
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
            {language === 'es' ? '¿Qué incluye?' : 'What\'s included?'}
          </Text>
          <Text style={styles.description}>
            {language === 'es'
              ? 'La Agenda de Bodas 2027 TRIMESTRAL es una guía que te ayudará a elegir la fecha perfecta para tu boda según los principios de la metafísica china. Se analizan todos los días del año 2027 evaluados según Feng Shui, BaZi y Qi Men Dun Jia para encontrar las fechas más auspiciosas para bodas, ceremonias, uniones, declaraciones y compromisos.'
              : 'The 2027 QUARTERLY Wedding Agenda is a guide that will help you choose the perfect date for your wedding according to the principles of Chinese metaphysics. All days of 2027 are evaluated according to Feng Shui, BaZi and Qi Men Dun Jia to find the most auspicious dates for weddings, ceremonies, unions, declarations and commitments.'}
          </Text>
        </View>

        {/* Quarter Buttons */}
        <Text style={styles.sectionLabel}>
          {language === 'es' ? 'SELECCIONA TU TRIMESTRE' : 'SELECT YOUR QUARTER'}
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
                  {language === 'es' ? quarter.titleEs : quarter.titleEn}
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
                      {language === 'es' ? selectedQuarter.titleEs : selectedQuarter.titleEn}
                    </Text>
                    <Text style={styles.modalPrice}>{selectedQuarter.price}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.modalDescription}>
                      {language === 'es'
                        ? 'Esta agenda contiene una selección exclusiva de los días más favorables de este trimestre para elegir la fecha de tu boda, una ceremonia de unión, una petición de mano, un compromiso o una declaración de amor. Todas las fechas han sido seleccionadas según los principios de la metafísica china para ayudarte a escoger el momento más propicio.'
                        : 'This agenda contains an exclusive selection of the most favorable days of this quarter to choose the date for your wedding, a union ceremony, a marriage proposal, an engagement or a declaration of love. All dates have been selected according to the principles of Chinese metaphysics to help you choose the most propitious moment.'}
                    </Text>

                    {/* Features */}
                    <View style={styles.featuresCard}>
                      <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.jade} />
                        <Text style={styles.featureText}>
                          {language === 'es' 
                            ? 'Días específicos con horarios favorables'
                            : 'Specific days with favorable times'}
                        </Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.jade} />
                        <Text style={styles.featureText}>
                          {language === 'es' 
                            ? 'Análisis según Feng Shui, BaZi y Qi Men'
                            : 'Analysis according to Feng Shui, BaZi and Qi Men'}
                        </Text>
                      </View>
                      <View style={styles.featureItem}>
                        <MaterialCommunityIcons name="check-circle" size={24} color={Colors.jade} />
                        <Text style={styles.featureText}>
                          {language === 'es' 
                            ? 'Orientaciones auspiciosas para la ceremonia'
                            : 'Auspicious orientations for the ceremony'}
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
                        {language === 'es' 
                          ? 'Comprar por WhatsApp'
                          : 'Buy via WhatsApp'}
                      </Text>
                    </TouchableOpacity>

                    {/* Back Button */}
                    <TouchableOpacity
                      style={styles.modalBackButton}
                      onPress={() => setSelectedQuarter(null)}
                    >
                      <Text style={styles.modalBackButtonText}>
                        {language === 'es' ? 'Volver' : 'Back'}
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
