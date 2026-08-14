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

interface BaziReport {
  id: string;
  user_id: string;
  report_content: string;
  is_published: boolean;
  published_at?: string;
}

export default function MyBaziReportScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [report, setReport] = useState<BaziReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasReport, setHasReport] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const response = await api.get('/my-bazi-report');
      setHasReport(response.data.has_report);
      setReport(response.data.report);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Elegant Header */}
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.accent} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <MaterialCommunityIcons name="yin-yang" size={32} color={Colors.accent} />
              <Text style={styles.headerTitle}>{t('bazi.my_report')}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {hasReport && report ? (
        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          {/* Published Date */}
          {report.published_at && (
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-check" size={16} color={Colors.accent} />
              <Text style={styles.dateText}>
                {t('bazi.published_on')} {formatDate(report.published_at)}
              </Text>
            </View>
          )}

          {/* Elegant Report Card */}
          <View style={styles.reportCard}>
            {/* Decorative Top Border */}
            <LinearGradient 
              colors={[Colors.accent, Colors.accent + '60']} 
              style={styles.decorativeBorder}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            
            {/* Report Content */}
            <View style={styles.reportContent}>
              <Text style={styles.reportText}>{report.report_content}</Text>
            </View>

            {/* Decorative Bottom */}
            <View style={styles.decorativeBottom}>
              <View style={styles.decorativeLine} />
              <MaterialCommunityIcons name="star-four-points" size={20} color={Colors.accent} />
              <View style={styles.decorativeLine} />
            </View>
          </View>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <MaterialCommunityIcons name="information-outline" size={18} color={Colors.textLight} />
            <Text style={styles.footerText}>
              {t('bazi.personalized_note')}
            </Text>
          </View>

          <View style={{ height: Spacing.xl * 2 }} />
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={64} color={Colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>{t('bazi.no_report')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('bazi.report_pending_hint')}
          </Text>
          
          <TouchableOpacity 
            style={styles.requestButton}
            onPress={() => router.push('/service/bazi')}
          >
            <MaterialCommunityIcons name="plus-circle" size={20} color={Colors.primary} />
            <Text style={styles.requestButtonText}>{t('bazi.request_analysis')}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  header: {
    paddingBottom: Spacing.lg,
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
  headerCenter: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.ivory,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.lg,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  dateText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  reportCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  decorativeBorder: {
    height: 4,
  },
  reportContent: {
    padding: Spacing.xl,
  },
  reportText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  decorativeBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  decorativeLine: {
    width: 60,
    height: 1,
    backgroundColor: Colors.accent + '40',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  footerText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  requestButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  requestButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
});
