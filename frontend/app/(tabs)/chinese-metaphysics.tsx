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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';

interface Concept {
  id: string;
  slug: string;
  title: string;
  title_en?: string;
  short_description: string;
  short_description_en?: string;
  full_description: string;
  icon: string;
  color: string;
}

// Component renders a single concept; title/short_description/full_description
// arrive already translated by the backend based on the `lang` query param.
function ConceptCard({ concept }: { concept: Concept }) {
  return (
    <View style={styles.conceptCard}>
      <View style={styles.conceptHeader}>
        <View style={[styles.conceptIcon, { backgroundColor: concept.color + '20' }]}>
          <MaterialCommunityIcons name={concept.icon as any} size={28} color={concept.color} />
        </View>
        <Text style={styles.conceptTitle}>{concept.title}</Text>
      </View>
      
      <Text style={styles.conceptDescription}>{concept.short_description}</Text>

      {concept.full_description && (
        <Text style={styles.conceptContent}>{concept.full_description}</Text>
      )}
    </View>
  );
}

export default function ChineseMetaphysicsScreen() {
  const router = useRouter();
  const { t, language, localizeContent } = useLanguage();
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConcepts();
  }, [language]);

  const loadConcepts = async () => {
    try {
      const response = await api.get('/concepts', { params: { lang: language } });
      setConcepts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading concepts:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconRow}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="book-open-variant" size={28} color={Colors.accent} />
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerLabel}>{t('metaphysics.subtitle')}</Text>
              <Text style={styles.headerTitle}>{t('metaphysics.title')}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Concepts Content */}
        {concepts.map((concept) => (
          <ConceptCard key={concept.id} concept={concept} />
        ))}

        {/* FAQ Button at the end */}
        <TouchableOpacity
          testID="faq-button"
          style={styles.faqButton}
          onPress={() => router.push('/faq')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={Gradients.gold} style={styles.faqGradient}>
            <View style={styles.faqIconContainer}>
              <MaterialCommunityIcons name="help-circle" size={32} color={Colors.primary} />
            </View>
            <View style={styles.faqContent}>
              <Text style={styles.faqLabel}>{t('metaphysics.faq_button')}</Text>
              <Text style={styles.faqSubtitle}>
                {t('profile.faq')}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
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
  header: {
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.accent + '30',
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
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    lineHeight: 32,
  },
  content: {
    padding: Spacing.lg,
  },
  conceptCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  conceptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  conceptIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conceptTitle: {
    flex: 1,
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  conceptDescription: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  conceptContent: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  faqButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.md,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  faqGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  faqIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqContent: {
    flex: 1,
  },
  faqLabel: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.primary,
    lineHeight: 24,
    marginBottom: 2,
  },
  faqSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.primary,
    opacity: 0.8,
  },
});
