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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import * as Linking from 'expo-linking';
import api from '@/src/services/api';

interface CustomService {
  id: string;
  title: string;
  description: string;
  includes: string[];
  price: number;
  original_price?: number;
  is_offer?: boolean;
  form_fields: any[];
  is_active: boolean;
}

export default function ServiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t, language } = useLanguage();
  const [service, setService] = useState<CustomService | null>(null);
  const [loading, setLoading] = useState(true);
  const [appConfig, setAppConfig] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, language]);

  const loadData = async () => {
    try {
      const [serviceRes, appRes] = await Promise.all([
        api.get(`/services/${id}`, { params: { lang: language } }),
        api.get('/app-config')
      ]);
      setService(serviceRes.data);
      setAppConfig(appRes.data);
    } catch (error) {
      console.error('Error loading service:', error);
      Alert.alert('Error', 'No se pudo cargar el servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppContact = () => {
    if (!appConfig?.contact_whatsapp || !service) {
      Alert.alert('Error', 'WhatsApp no configurado');
      return;
    }

    const message = `Hola, estoy interesado en el servicio: ${service.title}. ¿Podrían proporcionarme más información sobre el pago y los pasos a seguir? Gracias.`;
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

  if (!service) {
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
          <Text style={styles.emptyText}>Servicio no encontrado</Text>
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
            <Text style={styles.headerTitle} numberOfLines={1}>{service.title}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Service Icon */}
        <View style={styles.iconContainer}>
          <LinearGradient colors={Gradients.navy} style={styles.iconGradient}>
            <MaterialCommunityIcons name="shimmer" size={48} color={Colors.accent} />
          </LinearGradient>
        </View>

        {/* Title */}
        <Text style={styles.title}>{service.title}</Text>

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          {service.is_offer && service.original_price && (
            <Text style={styles.originalPrice}>€{service.original_price.toFixed(2)}</Text>
          )}
          <Text style={styles.priceValue}>€{service.price.toFixed(2)}</Text>
          {service.is_offer && (
            <View style={styles.offerTag}>
              <Text style={styles.offerText}>OFERTA</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>
            {t('common.description')}
          </Text>
          <Text style={styles.description}>{service.description}</Text>
        </View>

        {/* Includes/Features */}
        {service.includes && service.includes.length > 0 && (
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>
              {t('services.what_includes')}
            </Text>
            {service.includes.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={20} color={Colors.jade} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* WhatsApp Button */}
        <TouchableOpacity 
          style={styles.whatsappButton}
          onPress={handleWhatsAppContact}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="whatsapp" size={24} color="#FFFFFF" />
          <Text style={styles.whatsappButtonText}>
            {t('services.request_service_btn')}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footnote}>
          {t('services.contact_footnote')}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  originalPrice: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.primary,
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  priceValue: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.primary,
  },
  offerTag: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offerText: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    color: '#FFFFFF',
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
  },
  featuresTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
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
