import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { useLanguage } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';
import { formatDateInput, isValidISODate, formatTimeInput, isValidTime } from '@/src/utils/dateInput';
import BaziChartResult, { BaziChartData } from '@/src/components/BaziChartResult';

type Sex = 'M' | 'F';

interface CalculatorBirthFormProps {
  calculatorType: 'bazi' | 'qimen';
}

export default function CalculatorBirthForm({ calculatorType }: CalculatorBirthFormProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [sex, setSex] = useState<Sex | null>(null);
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<BaziChartData | null>(null);

  // Prefill from the user's saved profile (if any) so returning users don't
  // have to retype their birth data every visit - see PATCH /auth/me below.
  useEffect(() => {
    if (user?.birth_date && !birthDate) setBirthDate(user.birth_date);
    if (user?.birth_time && !birthTime) setBirthTime(user.birth_time);
    if (user?.sex && !sex) setSex(user.sex as Sex);
  }, [user]);

  const handleCalculate = async () => {
    if (!birthDate) {
      Alert.alert(t('common.error'), t('calculator.error_missing_date'));
      return;
    }
    if (!isValidISODate(birthDate)) {
      Alert.alert(t('common.error'), t('calculator.error_invalid_date'));
      return;
    }
    if (!birthTime) {
      Alert.alert(t('common.error'), t('calculator.error_missing_time'));
      return;
    }
    if (!isValidTime(birthTime)) {
      Alert.alert(t('common.error'), t('calculator.error_invalid_time'));
      return;
    }
    if (!sex) {
      Alert.alert(t('common.error'), t('calculator.error_missing_sex'));
      return;
    }
    let lon: number | undefined;
    if (calculatorType === 'bazi' && longitude.trim()) {
      lon = Number(longitude.trim());
      if (Number.isNaN(lon) || lon < -180 || lon > 180) {
        Alert.alert(t('common.error'), t('calculator.error_invalid_longitude'));
        return;
      }
    }

    if (calculatorType === 'qimen') {
      Alert.alert(t('calculator.coming_soon_title'), t('calculator.coming_soon_message'));
      return;
    }

    setError('');
    setResult(null);
    setLoading(true);
    try {
      const response = await api.post('/calculator/bazi', {
        birth_date: birthDate,
        birth_time: birthTime,
        sex,
        longitude: lon ?? null,
      });
      setResult(response.data);

      // Persist to the profile for next time - best-effort, guests (no
      // session) simply get a 401 here which we ignore.
      if (user) {
        api.patch('/auth/me', { birth_date: birthDate, birth_time: birthTime, sex }).catch(() => {});
      }
    } catch (e: any) {
      if (!e.response) {
        setError(t('calculator.error_no_connection'));
      } else {
        setError(e.response?.data?.detail || t('calculator.error_calculate_failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.fieldLabel}>{t('calculator.birth_date_label')}</Text>
      <TextInput
        testID="calculator-birth-date-input"
        style={styles.input}
        value={birthDate}
        onChangeText={(text) => setBirthDate(formatDateInput(text))}
        placeholder={t('calculator.birth_date_placeholder')}
        placeholderTextColor={Colors.textLight}
        keyboardType="number-pad"
        maxLength={10}
      />

      <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>{t('calculator.birth_time_label')}</Text>
      <TextInput
        testID="calculator-birth-time-input"
        style={styles.input}
        value={birthTime}
        onChangeText={(text) => setBirthTime(formatTimeInput(text))}
        placeholder={t('calculator.birth_time_placeholder')}
        placeholderTextColor={Colors.textLight}
        keyboardType="number-pad"
        maxLength={5}
      />

      <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>{t('calculator.sex_label')}</Text>
      <View style={styles.sexRow}>
        <TouchableOpacity
          testID="calculator-sex-male"
          style={[styles.sexOption, sex === 'M' && styles.sexOptionActive]}
          onPress={() => setSex('M')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sexOptionText, sex === 'M' && styles.sexOptionTextActive]}>
            {t('calculator.sex_male')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="calculator-sex-female"
          style={[styles.sexOption, sex === 'F' && styles.sexOptionActive]}
          onPress={() => setSex('F')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sexOptionText, sex === 'F' && styles.sexOptionTextActive]}>
            {t('calculator.sex_female')}
          </Text>
        </TouchableOpacity>
      </View>

      {calculatorType === 'bazi' && (
        <>
          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>{t('calculator.longitude_label')}</Text>
          <TextInput
            testID="calculator-longitude-input"
            style={styles.input}
            value={longitude}
            onChangeText={setLongitude}
            placeholder={t('calculator.longitude_placeholder')}
            placeholderTextColor={Colors.textLight}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.explanation}>{t('calculator.longitude_explanation')}</Text>
        </>
      )}

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        testID="calculator-submit-button"
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleCalculate}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.primary} size="small" />
        ) : (
          <Text style={styles.submitButtonText}>{t('calculator.calculate_button')}</Text>
        )}
      </TouchableOpacity>

      {result && <BaziChartResult data={result} />}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
  },
  fieldLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  fieldLabelSpaced: {
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },
  explanation: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  sexRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sexOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  sexOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '20',
  },
  sexOptionText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  sexOptionTextActive: {
    color: Colors.accent,
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.error,
    marginTop: Spacing.md,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
});
