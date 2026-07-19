import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

interface CustomService {
  id: string;
  title: string;
  description: string;
  includes: string[];
  price: number;
  original_price?: number;
  is_offer?: boolean;
  form_fields: any[];
}

export default function ServicesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestService = (service: CustomService) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    router.push(`/service/${service.id}`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <Text style={styles.headerLabel}>Servicios</Text>
        <Text style={styles.headerTitle}>Consultas Personalizadas</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Servicios exclusivos realizados por expertos en metafísica china
        </Text>

        {services.map((service) => (
          <View key={service.id} style={styles.card} testID={`service-card-${service.id}`}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <Ionicons name="sparkles" size={20} color={Colors.accent} />
              </View>
              <View style={styles.priceContainer}>
                {service.is_offer && service.original_price && (
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>OFERTA</Text>
                  </View>
                )}
                <View style={styles.priceTag}>
                  {service.is_offer && service.original_price && (
                    <Text style={styles.originalPrice}>€{service.original_price.toFixed(2)}</Text>
                  )}
                  <Text style={styles.priceText}>€{service.price.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.serviceTitle}>{service.title}</Text>
            <Text style={styles.serviceDesc}>{service.description}</Text>

            {service.includes.length > 0 && (
              <View style={styles.includesSection}>
                <Text style={styles.includesTitle}>Incluye:</Text>
                {service.includes.map((item, index) => (
                  <View key={index} style={styles.includeItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.jade} />
                    <Text style={styles.includeText}>{item}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              testID={`request-service-${service.id}`}
              style={styles.requestButton}
              onPress={() => handleRequestService(service)}
            >
              <Text style={styles.requestButtonText}>
                {user ? `Solicitar por €${service.price.toFixed(2)}` : 'Inicia sesión para solicitar'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  headerLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
  },
  content: {
    padding: Spacing.lg,
  },
  introText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  offerBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
  },
  offerBadgeText: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    color: Colors.white,
    letterSpacing: 1,
  },
  priceTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  originalPrice: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
  },
  priceText: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.base,
    color: Colors.accent,
  },
  serviceTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  serviceDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  includesSection: {
    marginBottom: Spacing.md,
  },
  includesTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  includeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  includeText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  requestButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
    marginRight: Spacing.sm,
  },
});
