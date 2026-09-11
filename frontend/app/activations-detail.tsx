import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';
import { toAbsoluteMediaUrl } from '@/src/utils/mediaUrl';
import { SUBSCRIPTION_MONTHLY_PRICE } from '@/src/constants/Subscription';

interface DailyEnergyActivations {
  date: string;
  activations?: string;
  activations_en?: string;
  activations_fr?: string;
  activations_de?: string;
  activations_ro?: string;
  activations_image_url?: string;
  activations_video_url?: string;
  activations_locked?: boolean;
}

export default function ActivationsDetailScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [data, setData] = useState<DailyEnergyActivations | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, [language]);

  const load = async () => {
    try {
      const response = await api.get('/energy/daily', { params: { lang: language } });
      setData(response.data);
    } catch (error) {
      console.error('Error loading activations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const getActivationsText = () => {
    if (!data) return '';
    if (language === 'en' && data.activations_en) return data.activations_en;
    if (language === 'fr' && data.activations_fr) return data.activations_fr;
    if (language === 'de' && data.activations_de) return data.activations_de;
    if (language === 'ro' && data.activations_ro) return data.activations_ro;
    return data.activations || '';
  };

  const videoWatchLabel = language === 'es' ? 'Ver Video' : language === 'en' ? 'Watch Video' : language === 'fr' ? 'Voir la Vidéo' : language === 'de' ? 'Video Ansehen' : language === 'pt' ? 'Ver Vídeo' : 'Vizionează Video';

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
            <Text style={styles.headerTitle}>{t('common.activations')}</Text>
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : data ? (
          data.activations_locked ? (
            <View style={styles.lockedContainer}>
              <MaterialCommunityIcons name="lock-outline" size={32} color={Colors.textLight} />
              <Text style={styles.lockedText}>
                {t('ads.activations_locked').replace('{price}', SUBSCRIPTION_MONTHLY_PRICE)}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.freeBanner}>
                <MaterialCommunityIcons name="gift-outline" size={24} color={Colors.accent} />
                <Text style={styles.freeBannerText}>{t('home.included_in_subscription')}</Text>
              </View>

              {getActivationsText() ? (
                <Text style={styles.description}>{getActivationsText()}</Text>
              ) : (
                <Text style={styles.emptyText}>{t('common.no_info_available')}</Text>
              )}

              {data.activations_image_url && (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: toAbsoluteMediaUrl(data.activations_image_url) }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              )}

              {data.activations_video_url && (
                <TouchableOpacity
                  style={styles.videoLinkButton}
                  onPress={() => {
                    if (data.activations_video_url) {
                      Linking.openURL(data.activations_video_url).catch(err =>
                        console.error('Error opening video URL:', err)
                      );
                    }
                  }}
                >
                  <MaterialCommunityIcons name="play-circle" size={24} color={Colors.white} />
                  <Text style={styles.videoLinkText}>{videoWatchLabel}</Text>
                </TouchableOpacity>
              )}
            </>
          )
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="star-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>{t('daily.no_content')}</Text>
            <Text style={styles.emptyText}>{t('daily.come_back_later')}</Text>
          </View>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.white,
  },
  content: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
  },
  freeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '20',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  freeBannerText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.accent,
    flex: 1,
  },
  lockedContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  lockedText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  emptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  imageContainer: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.background,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
  },
  videoLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.error,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  videoLinkText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
});
