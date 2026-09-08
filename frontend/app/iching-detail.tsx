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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';
import HexagramBars from '@/src/components/HexagramBars';

interface HexagramFull {
  number: number;
  name_zh: string;
  pinyin: string;
  name_es: string;
  lower_trigram_es: string;
  upper_trigram_es: string;
  lines: number[];
}

export default function IChingDetailScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const params = useLocalSearchParams<{
    number: string;
    lines: string;
    movingLines: string;
    resultNumber: string;
  }>();

  const [primary, setPrimary] = useState<HexagramFull | null>(null);
  const [result, setResult] = useState<HexagramFull | null>(null);
  const [loading, setLoading] = useState(true);

  const movingLines = (params.movingLines || '')
    .split(',')
    .filter(Boolean)
    .map((n) => parseInt(n, 10));

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const loadData = async () => {
    setLoading(true);
    try {
      const primaryRes = await api.get(`/iching/hexagram/${params.number}`, { params: { lang: language } });
      setPrimary(primaryRes.data);

      if (params.resultNumber) {
        const resultRes = await api.get(`/iching/hexagram/${params.resultNumber}`, { params: { lang: language } });
        setResult(resultRes.data);
      }
    } catch (error) {
      console.error('Error loading hexagram detail:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.gold} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Interpretación Completa</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {primary && (
            <View style={styles.card}>
              <View style={styles.topRow}>
                <HexagramBars lines={primary.lines} movingLines={movingLines} size="large" />
                <View style={styles.textCol}>
                  <Text style={styles.hexNumber}>{primary.number}</Text>
                  <Text style={styles.hexPinyin}>{primary.pinyin} ({primary.name_zh})</Text>
                  <Text style={styles.hexName}>{primary.name_es}</Text>
                </View>
              </View>

              <View style={styles.trigramRow}>
                <View style={styles.trigramBadge}>
                  <Text style={styles.trigramLabel}>Trigrama Superior</Text>
                  <Text style={styles.trigramValue}>{primary.upper_trigram_es}</Text>
                </View>
                <View style={styles.trigramBadge}>
                  <Text style={styles.trigramLabel}>Trigrama Inferior</Text>
                  <Text style={styles.trigramValue}>{primary.lower_trigram_es}</Text>
                </View>
              </View>

              {movingLines.length > 0 && (
                <View style={styles.movingLinesBox}>
                  <MaterialCommunityIcons name="sync" size={18} color="#C97B6B" />
                  <Text style={styles.movingLinesText}>
                    Líneas móviles: {movingLines.join(', ')} — estas líneas están en transformación
                    y señalan hacia dónde evoluciona la situación.
                  </Text>
                </View>
              )}
            </View>
          )}

          {result && (
            <View style={styles.card}>
              <Text style={styles.resultLabel}>Hexagrama Resultante</Text>
              <View style={styles.topRow}>
                <HexagramBars lines={result.lines} size="large" />
                <View style={styles.textCol}>
                  <Text style={styles.hexNumber}>{result.number}</Text>
                  <Text style={styles.hexPinyin}>{result.pinyin} ({result.name_zh})</Text>
                  <Text style={styles.hexName}>{result.name_es}</Text>
                </View>
              </View>
              <Text style={styles.resultExplanation}>
                Cuando las líneas móviles del hexagrama principal se transforman, la situación
                tiende hacia la energía de este segundo hexagrama.
              </Text>
            </View>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
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
  },
  header: { paddingBottom: Spacing.md },
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
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  textCol: { flex: 1 },
  hexNumber: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.accent,
  },
  hexPinyin: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  hexName: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  trigramRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  trigramBadge: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  trigramLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: 10,
    color: Colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trigramValue: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  movingLinesBox: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: '#C97B6B' + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  movingLinesText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  resultLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  resultExplanation: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.md,
  },
});
