import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import * as Linking from 'expo-linking';
import api from '@/src/services/api';

interface BaziServiceConfig {
  id: string;
  title: string;
  description: string;
  price: number;
  is_active: boolean;
}

export default function BaziServiceScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [config, setConfig] = useState<BaziServiceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [language]);

  const loadData = async () => {
    try {
      const [serviceRes, appRes] = await Promise.all([
        api.get('/bazi-service/config'),
        api.get('/app-config')
      ]);
      setConfig(serviceRes.data);
      setAppConfig(appRes.data);
    } catch (error) {
      console.error('Error loading BaZi service:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (!appConfig?.contact_whatsapp) {
      Alert.alert('Error', 'WhatsApp no configurado');
      return;
    }

    const message = t('bazi.whatsapp_message');
    const phone = appConfig.contact_whatsapp.replace(/\D/g, '');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp');
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!config) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={Gradients.gold} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('common.back')}</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyText}>Servicio no disponible</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <LinearGradient colors={Gradients.gold} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('bazi.service_title')}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient colors={Gradients.navy} style={styles.iconGradient}>
            <MaterialCommunityIcons name="yin-yang" size={48} color={Colors.accent} />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>{config.title}</Text>

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <Text style={styles.priceLabel}>{t('bazi.price_label')}</Text>
          <Text style={styles.priceValue}>€{config.price}</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>
            {language === 'es' ? '¿Qué incluye?' : 'What\'s included?'}
          </Text>
          <Text style={styles.description}>{config.description}</Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresCard}>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.jade} />
            <Text style={styles.featureText}>
              {language === 'es' ? 'Análisis de los 4 Pilares del Destino' : 'Analysis of the 4 Pillars of Destiny'}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.jade} />
            <Text style={styles.featureText}>
              {language === 'es' ? 'Ciclos de Suerte de 10 años' : '10-year Luck Cycles'}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.jade} />
            <Text style={styles.featureText}>
              {language === 'es' ? 'Elementos favorables y desfavorables' : 'Favorable and unfavorable elements'}
            </Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialCommunityIcons name="check-circle" size={20} color={Colors.jade} />
            <Text style={styles.featureText}>
              {language === 'es' ? 'Recomendaciones personalizadas' : 'Personalized recommendations'}
            </Text>
          </View>
        </View>

        {/* WhatsApp Button */}
        <TouchableOpacity 
          style={styles.whatsappButton}
          onPress={handleWhatsAppContact}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="whatsapp" size={24} color="#FFFFFF" />
          <Text style={styles.whatsappButtonText}>{t('bazi.contact_whatsapp')}</Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          {language === 'es' 
            ? 'Te contactaremos para confirmar los detalles del pago y solicitar tu fecha y hora de nacimiento.'
            : 'We will contact you to confirm payment details and request your date and time of birth.'}
        </Text>

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
  emptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textLight,
    marginTop: Spacing.md,
  },
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
    fontSize: Typography.lg,
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  priceBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  priceLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  priceValue: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.primary,
  },
  descriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.md,
  },
  descriptionTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  featuresCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    width: '100%',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    flex: 1,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    width: '100%',
    marginBottom: Spacing.md,
  },
  whatsappButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: '#FFFFFF',
  },
  footnote: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
});
