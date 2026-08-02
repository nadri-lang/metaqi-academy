import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';

interface Purchase {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_type: string; // 'course', 'service', 'agenda_trimester'
  price: number;
  video_url?: string;
  status: string;
  purchased_at: string;
  activated_at?: string;
}

interface BaziReport {
  id: string;
  user_id: string;
  report_content: string;
  is_published: boolean;
  published_at?: string;
}

export default function MyPurchasesScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [baziReport, setBaziReport] = useState<BaziReport | null>(null);
  const [hasBaziReport, setHasBaziReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load purchases
      const purchasesResponse = await api.get('/purchases/my-purchases');
      setPurchases(purchasesResponse.data);

      // Load BaZi report
      const reportResponse = await api.get('/my-bazi-report');
      setHasBaziReport(reportResponse.data.has_report);
      setBaziReport(reportResponse.data.report);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const localeMap: { [key: string]: string } = {
      es: 'es-ES',
      en: 'en-US',
      fr: 'fr-FR',
      de: 'de-DE',
      ro: 'ro-RO',
    };
    return date.toLocaleDateString(localeMap[language] || 'es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleOpenVideo = (videoUrl: string) => {
    Linking.openURL(videoUrl).catch(() => {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'No se pudo abrir el video' : 'Could not open video'
      );
    });
  };

  const handleViewBaziReport = () => {
    router.push('/my-bazi-report');
  };

  const getProductIcon = (type: string) => {
    switch (type) {
      case 'course':
        return 'book-open-variant';
      case 'service':
        return 'star';
      case 'agenda_trimester':
        return 'calendar';
      default:
        return 'shopping';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  const hasContent = purchases.length > 0 || hasBaziReport;

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.gold} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {language === 'es' ? 'Mis Compras' : 'My Purchases'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {!hasContent ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="shopping-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>
              {language === 'es' ? 'No tienes compras aún' : 'No purchases yet'}
            </Text>
            <Text style={styles.emptyText}>
              {language === 'es' 
                ? 'Explora nuestros cursos y servicios para comenzar' 
                : 'Explore our courses and services to get started'}
            </Text>
          </View>
        ) : (
          <>
            {/* BaZi Report Section */}
            {hasBaziReport && baziReport && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {language === 'es' ? 'Tu Reporte BaZi' : 'Your BaZi Report'}
                </Text>
                <TouchableOpacity
                  style={styles.baziCard}
                  onPress={handleViewBaziReport}
                >
                  <View style={styles.baziIcon}>
                    <MaterialCommunityIcons name="yin-yang" size={32} color={Colors.accent} />
                  </View>
                  <View style={styles.baziInfo}>
                    <Text style={styles.baziTitle}>
                      {language === 'es' ? 'Reporte Personalizado BaZi' : 'Personalized BaZi Report'}
                    </Text>
                    {baziReport.published_at && (
                      <Text style={styles.baziDate}>
                        {language === 'es' ? 'Publicado: ' : 'Published: '}
                        {formatDate(baziReport.published_at)}
                      </Text>
                    )}
                    <View style={styles.publishedBadge}>
                      <MaterialCommunityIcons name="check-circle" size={14} color={Colors.jade} />
                      <Text style={styles.publishedText}>
                        {language === 'es' ? 'Disponible' : 'Available'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
            )}

            {/* Courses Section */}
            {purchases.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {language === 'es' ? 'Cursos y Servicios' : 'Courses & Services'}
                </Text>
                {purchases.map((purchase) => (
                  <View key={purchase.id} style={styles.purchaseCard}>
                    <View style={styles.purchaseIcon}>
                      <MaterialCommunityIcons 
                        name={getProductIcon(purchase.product_type)} 
                        size={24} 
                        color={Colors.accent} 
                      />
                    </View>
                    <View style={styles.purchaseInfo}>
                      <Text style={styles.purchaseName}>{purchase.product_name}</Text>
                      <Text style={styles.purchaseDate}>
                        {language === 'es' ? 'Comprado: ' : 'Purchased: '}
                        {formatDate(purchase.purchased_at)}
                      </Text>
                      {purchase.activated_at && (
                        <Text style={styles.purchaseActivated}>
                          {language === 'es' ? 'Activado: ' : 'Activated: '}
                          {formatDate(purchase.activated_at)}
                        </Text>
                      )}
                    </View>
                    <View style={styles.purchaseActions}>
                      {purchase.video_url ? (
                        <TouchableOpacity
                          style={styles.videoButton}
                          onPress={() => handleOpenVideo(purchase.video_url!)}
                        >
                          <MaterialCommunityIcons name="play-circle" size={20} color={Colors.white} />
                          <Text style={styles.videoButtonText}>
                            {language === 'es' ? 'Ver' : 'Watch'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.pendingBadge}>
                          <Text style={styles.pendingText}>
                            {language === 'es' ? 'Pendiente' : 'Pending'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
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
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  baziCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    padding: Spacing.lg,
  },
  baziIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  baziInfo: {
    flex: 1,
  },
  baziTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  baziDate: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  publishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.jade + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  publishedText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.jade,
    marginLeft: 4,
  },
  purchaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  purchaseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseName: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  purchaseDate: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  purchaseActivated: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.jade,
    marginTop: 2,
  },
  purchaseActions: {
    marginLeft: Spacing.sm,
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  videoButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.white,
  },
  pendingBadge: {
    backgroundColor: Colors.textLight + '30',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  pendingText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
});
