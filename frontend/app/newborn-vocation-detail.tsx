import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';

interface NewbornVocation {
  id: string;
  date: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  talents: string[];
  vocations: string[];
}

export default function NewbornVocationDetailScreen() {
  const router = useRouter();
  const { t, localizeContent } = useLanguage();
  const [data, setData] = useState<NewbornVocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const response = await api.get('/newborn-vocation/today');
      setData(response.data);
    } catch (error) {
      console.error('Error loading newborn vocation:', error);
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
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            <View style={styles.headerContent}>
              <TouchableOpacity
                testID="back-button"
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={Colors.white} />
                <Text style={styles.backButtonTextWhite}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>Sin información disponible</Text>
          <Text style={styles.emptyText}>Vuelve más tarde</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            {/* Botón Volver */}
            <TouchableOpacity
              testID="back-button"
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
              <Text style={styles.backButtonTextWhite}>{t('common.back')}</Text>
            </TouchableOpacity>
            
            <View style={styles.iconRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="star" size={28} color={Colors.jade} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerLabel}>{t('home.newborn_vocation')}</Text>
                <Text style={styles.headerDate}>{formatDate(data.date)}</Text>
              </View>
            </View>
            <Text style={styles.headerTitle}>
              {data.title}
            </Text>
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
        {/* Main Description */}
        <View style={styles.card}>
          <Text style={styles.description}>
            {data.content}
          </Text>
        </View>

        {/* Talentos Naturales */}
        {data.talents && data.talents.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="sparkles" size={22} color={Colors.accent} />
              <Text style={styles.sectionTitle}>{t('home.natural_talents')}</Text>
            </View>
            {data.talents.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: Colors.accent }]} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Vocaciones Favorables */}
        {data.vocations && data.vocations.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="briefcase" size={22} color={Colors.jade} />
              <Text style={styles.sectionTitle}>{t('home.favorable_vocations')}</Text>
            </View>
            {data.vocations.map((item, idx) => (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.bullet, { backgroundColor: Colors.jade }]} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

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
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonTextWhite: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.jade + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: { flex: 1 },
  headerLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerDate: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
    textTransform: 'capitalize',
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    lineHeight: 32,
  },
  content: {
    padding: Spacing.lg,
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
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    flex: 1,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: Spacing.sm,
  },
  listText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
