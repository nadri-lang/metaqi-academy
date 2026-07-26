import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';

export default function Agenda2027InfoScreen() {
  const router = useRouter();
  const { language } = useLanguage();

  const handleContact = () => {
    const message = language === 'es'
      ? 'Hola, me interesa la Agenda de Bodas 2027. ¿Podrías darme más información?'
      : 'Hello, I\'m interested in the 2027 Wedding Agenda. Could you give me more information?';
    
    Linking.openURL(`https://wa.me/34640510085?text=${encodeURIComponent(message)}`);
  };

  const handleEmail = () => {
    Linking.openURL('mailto:nnikholk@gmail.com?subject=Agenda de Bodas 2027');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
              <Text style={styles.backButtonText}>
                {language === 'es' ? 'Volver' : 'Back'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.iconRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="heart" size={32} color={Colors.accent} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerLabel}>
                  {language === 'es' ? 'Agenda de Bodas' : 'Wedding Agenda'}
                </Text>
                <Text style={styles.headerYear}>2027</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Próximamente */}
        <View style={styles.comingSoonBanner}>
          <Ionicons name="time-outline" size={32} color={Colors.accent} />
          <Text style={styles.comingSoonTitle}>
            {language === 'es' ? 'Próximamente Disponible' : 'Coming Soon'}
          </Text>
          <Text style={styles.comingSoonText}>
            {language === 'es' 
              ? 'Estamos preparando la Agenda Completa 2027 con todas las fechas y horarios favorables para tu boda.'
              : 'We are preparing the Complete 2027 Agenda with all favorable dates and times for your wedding.'}
          </Text>
        </View>

        {/* Qué incluye */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {language === 'es' ? '¿Qué incluye la Agenda 2027?' : 'What\'s included in the 2027 Agenda?'}
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
                  {language === 'es' ? 'Fechas Específicas' : 'Specific Dates'}
                </Text>
                <Text style={styles.featureDesc}>
                  {language === 'es'
                    ? 'Días y horarios exactos con mayor energía favorable para ceremonias'
                    : 'Exact days and times with the most favorable energy for ceremonies'}
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="compass" size={24} color={Colors.accent} />
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>
                  {language === 'es' ? 'Direcciones Favorables' : 'Favorable Directions'}
                </Text>
                <Text style={styles.featureDesc}>
                  {language === 'es'
                    ? 'Orientaciones ideales para ceremonias y celebraciones según Qi Men'
                    : 'Ideal orientations for ceremonies and celebrations according to Qi Men'}
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
                    ? 'Recomendaciones detalladas para cada mes del año'
                    : 'Detailed recommendations for each month of the year'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Solicitar información */}
        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={32} color={Colors.accent} />
          <Text style={styles.contactTitle}>
            {language === 'es' ? '¿Interesado?' : 'Interested?'}
          </Text>
          <Text style={styles.contactText}>
            {language === 'es' 
              ? 'Contáctanos para recibir más información sobre la Agenda de Bodas 2027 y cómo adquirirla.'
              : 'Contact us to receive more information about the 2027 Wedding Agenda and how to acquire it.'}
          </Text>

          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={handleContact}
            >
              <Ionicons name="logo-whatsapp" size={20} color={Colors.white} />
              <Text style={styles.whatsappButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleEmail}
            >
              <Ionicons name="mail" size={20} color={Colors.primary} />
              <Text style={styles.emailButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
        </View>

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
    fontSize: Typography['2xl'],
    color: Colors.white,
    marginBottom: 4,
  },
  headerYear: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.xl,
    color: Colors.accent,
  },
  content: {
    padding: Spacing.lg,
  },
  comingSoonBanner: {
    backgroundColor: Colors.accent + '15',
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.accent,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  comingSoonTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.accent,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  comingSoonText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
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
    marginBottom: Spacing.lg,
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
  contactCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  contactTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  contactText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  whatsappButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  whatsappButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  emailButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  emailButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
});
