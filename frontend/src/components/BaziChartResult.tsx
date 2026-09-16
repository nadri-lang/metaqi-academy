import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { useLanguage } from '@/src/context/LanguageContext';
import { ElementKey, ZodiacAnimalKey, elementColor, elementIcon } from '@/src/constants/Zodiac';

interface StemInfo {
  char: string;
  pinyin: string;
  element: ElementKey;
  yin_yang: 'yang' | 'yin';
}

interface BranchInfo extends StemInfo {
  animal: ZodiacAnimalKey;
}

interface Pillar {
  stem: StemInfo;
  branch: BranchInfo;
}

interface DaYunPeriod {
  start_age: number;
  end_age: number;
  pillar: Pillar;
}

export interface BaziChartData {
  day_master: StemInfo;
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar };
  five_elements: Record<ElementKey, number>;
  da_yun: {
    direction: 'forward' | 'backward';
    start_age_years: number;
    start_age_months: number;
    periods: DaYunPeriod[];
  };
  solar_time_adjusted: boolean;
  adjusted_birth_datetime: string | null;
}

const ELEMENT_ORDER: ElementKey[] = ['wood', 'fire', 'earth', 'metal', 'water'];

function PillarCard({ label, pillar }: { label: string; pillar: Pillar }) {
  const { t } = useLanguage();
  return (
    <View style={styles.pillarCard}>
      <Text style={styles.pillarLabel}>{label}</Text>
      <View style={styles.pillarTagsRow}>
        <View style={[styles.elementDot, { backgroundColor: elementColor(pillar.stem.element) }]} />
        <Text style={styles.pillarTagText}>{t(`zodiac.elements.${pillar.stem.element}`)}</Text>
      </View>
      <View style={styles.pillarTagsRow}>
        <View style={[styles.elementDot, { backgroundColor: elementColor(pillar.branch.element) }]} />
        <Text style={styles.pillarTagText}>{t(`zodiac.animals.${pillar.branch.animal}`)}</Text>
      </View>
    </View>
  );
}

export default function BaziChartResult({ data }: { data: BaziChartData }) {
  const { t } = useLanguage();
  const { day_master, pillars, five_elements, da_yun, solar_time_adjusted, adjusted_birth_datetime } = data;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('calculator.result_title')}</Text>

      <View style={styles.dayMasterCard}>
        <View style={[styles.elementDot, { width: 16, height: 16, borderRadius: 8, backgroundColor: elementColor(day_master.element) }]} />
        <View>
          <Text style={styles.dayMasterLabel}>{t('calculator.day_master_label')}</Text>
          <Text style={styles.dayMasterSub}>
            {t(`zodiac.elements.${day_master.element}`)} · {t(`zodiac.${day_master.yin_yang}`)}
          </Text>
        </View>
      </View>

      {solar_time_adjusted && adjusted_birth_datetime && (
        <Text style={styles.solarNote}>
          {t('calculator.solar_time_note').replace('{time}', adjusted_birth_datetime.slice(11, 16))}
        </Text>
      )}

      <View style={styles.pillarsRow}>
        <PillarCard label={t('calculator.pillar_year')} pillar={pillars.year} />
        <PillarCard label={t('calculator.pillar_month')} pillar={pillars.month} />
        <PillarCard label={t('calculator.pillar_day')} pillar={pillars.day} />
        <PillarCard label={t('calculator.pillar_hour')} pillar={pillars.hour} />
      </View>

      <Text style={styles.sectionTitle}>{t('calculator.five_elements_title')}</Text>
      <View style={styles.elementsRow}>
        {ELEMENT_ORDER.map((key) => (
          <View key={key} style={styles.elementChip}>
            <MaterialCommunityIcons name={elementIcon(key) as any} size={16} color={elementColor(key)} />
            <Text style={styles.elementChipLabel}>{t(`zodiac.elements.${key}`)}</Text>
            <Text style={[styles.elementChipCount, { color: elementColor(key) }]}>{five_elements[key]}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>{t('calculator.da_yun_title')}</Text>
      <Text style={styles.daYunIntro}>{t('calculator.da_yun_intro')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daYunScroll}>
        {da_yun.periods.map((period, idx) => (
          <View key={idx} style={styles.daYunCard}>
            <Text style={styles.daYunAge}>{period.start_age}–{period.end_age}</Text>
            <View style={styles.pillarTagsRow}>
              <View style={[styles.elementDot, { backgroundColor: elementColor(period.pillar.stem.element) }]} />
              <Text style={styles.daYunTagText}>{t(`zodiac.elements.${period.pillar.stem.element}`)}</Text>
            </View>
            <Text style={styles.daYunTagText}>{t(`zodiac.animals.${period.pillar.branch.animal}`)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
  },
  title: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.accent,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  dayMasterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dayMasterLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  dayMasterSub: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  solarNote: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  pillarsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  pillarCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
  },
  pillarLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginBottom: 4,
  },
  pillarTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  pillarTagText: {
    fontFamily: Typography.sans,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  elementDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  elementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  elementChip: {
    alignItems: 'center',
    gap: 2,
  },
  elementChipLabel: {
    fontFamily: Typography.sans,
    fontSize: 10,
    color: Colors.textSecondary,
  },
  elementChipCount: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
  },
  daYunIntro: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  daYunScroll: {
    gap: Spacing.sm,
    paddingBottom: 4,
  },
  daYunCard: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  daYunAge: {
    fontFamily: Typography.sansMedium,
    fontSize: 10,
    color: Colors.textLight,
  },
  daYunTagText: {
    fontFamily: Typography.sans,
    fontSize: 10,
    color: Colors.textSecondary,
  },
});
