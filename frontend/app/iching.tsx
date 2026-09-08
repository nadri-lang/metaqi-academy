import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';
import HexagramBars from '@/src/components/HexagramBars';

interface HexagramReading {
  number: number;
  name_zh: string;
  pinyin: string;
  name_es: string;
  lines: number[];
  moving_lines: number[];
  result: {
    number: number;
    name_zh: string;
    pinyin: string;
    name_es: string;
    lines: number[];
  } | null;
}

export default function IChingScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [question, setQuestion] = useState('');
  const [digitsInput, setDigitsInput] = useState('');
  const [reading, setReading] = useState<HexagramReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [interpreting, setInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState('');

  const handleCast = async () => {
    const parts = digitsInput.trim().split(/\s+/).filter(Boolean);
    const values = parts.map((p) => parseInt(p, 10));

    if (values.length !== 6 || values.some((v) => isNaN(v) || ![6, 7, 8, 9].includes(v))) {
      setError('Escribe exactamente 6 cifras (6, 7, 8 o 9), separadas por espacio.');
      return;
    }

    setError('');
    setInterpretation('');
    setInterpretError('');
    setLoading(true);
    try {
      const response = await api.post('/iching/cast', { lines: values }, { params: { lang: language } });
      setReading(response.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || 'No se pudo calcular el hexagrama. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFullInterpretation = async () => {
    if (!reading) return;
    setInterpretError('');
    setInterpreting(true);
    try {
      const response = await api.post('/iching/interpret', {
        number: reading.number,
        moving_lines: reading.moving_lines,
        result_number: reading.result?.number ?? null,
        question: question.trim() || null,
      });
      setInterpretation(response.data.interpretation);
    } catch (e: any) {
      if (!e.response) {
        setInterpretError('No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.');
      } else {
        setInterpretError(e.response?.data?.detail || 'No se pudo generar la interpretación. Inténtalo de nuevo.');
      }
    } finally {
      setInterpreting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>I Ching</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.introText}>
              Antes de lanzar el oráculo, escribe tu pregunta en un papel. Piénsala bien: que sea
              clara, específica y única — evita mezclar varias dudas en una sola consulta. Cuanto
              más precisa la pregunta, más útil la respuesta.
            </Text>
            <TextInput
              style={styles.questionInput}
              value={question}
              onChangeText={setQuestion}
              placeholder="Escribe tu pregunta aquí..."
              placeholderTextColor={Colors.textLight}
              multiline
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Método de las monedas</Text>
            <Text style={styles.instructionsText}>
              Lanza tres monedas iguales seis veces, de abajo hacia arriba. Suma cara=3, cruz=2 en
              cada lanzamiento; el resultado será 6, 7, 8 o 9. Escribe aquí las seis cifras,
              separadas por espacio.
            </Text>

            <View style={styles.digitsRow}>
              <TextInput
                style={styles.digitsInput}
                value={digitsInput}
                onChangeText={setDigitsInput}
                placeholder="7 9 8 6 7 8"
                placeholderTextColor={Colors.textLight}
                keyboardType="numbers-and-punctuation"
              />
              <TouchableOpacity style={styles.enterButton} onPress={handleCast} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <Text style={styles.enterButtonText}>Enter</Text>
                )}
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {reading && (
            <View style={styles.resultCard}>
              <View style={styles.resultTopRow}>
                <HexagramBars lines={reading.lines} movingLines={reading.moving_lines} size="small" />
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultTitle}>
                    {reading.number} · {reading.pinyin} ({reading.name_zh})
                  </Text>
                  <Text style={styles.resultSubtitle}>{reading.name_es}</Text>
                  {reading.moving_lines.length > 0 && (
                    <Text style={styles.movingLinesText}>
                      Líneas móviles: {reading.moving_lines.join(', ')}
                    </Text>
                  )}
                </View>
              </View>

              {reading.result && (
                <>
                  <View style={styles.resultDivider} />
                  <Text style={styles.resultLabel}>HEXAGRAMA RESULTANTE</Text>
                  <View style={styles.resultTopRow}>
                    <HexagramBars lines={reading.result.lines} size="small" />
                    <View style={styles.resultTextCol}>
                      <Text style={styles.transformText}>
                        →{reading.result.number} · {reading.result.pinyin} ({reading.result.name_zh})
                      </Text>
                      <Text style={styles.resultSubtitle}>{reading.result.name_es}</Text>
                    </View>
                  </View>
                  <Text style={styles.resultExplanation}>
                    Cuando las líneas móviles del hexagrama principal se transforman, la situación
                    tiende hacia la energía de este segundo hexagrama.
                  </Text>
                </>
              )}

              <TouchableOpacity
                style={[styles.fullInterpretationButton, interpreting && styles.fullInterpretationButtonDisabled]}
                onPress={handleFullInterpretation}
                disabled={interpreting}
              >
                {interpreting ? (
                  <ActivityIndicator color={Colors.accent} size="small" />
                ) : (
                  <Text style={styles.fullInterpretationButtonText}>Ver interpretación completa</Text>
                )}
              </TouchableOpacity>

              {interpretError ? <Text style={styles.errorText}>{interpretError}</Text> : null}

              {interpretation ? (
                <View style={styles.interpretationBox}>
                  <View style={styles.interpretationHeader}>
                    <MaterialCommunityIcons name="text-box-outline" size={16} color={Colors.accent} />
                    <Text style={styles.interpretationHeaderText}>Interpretación</Text>
                  </View>
                  <Text style={styles.interpretationText}>{interpretation}</Text>
                </View>
              ) : null}
            </View>
          )}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
    fontSize: Typography.xl,
    color: Colors.white,
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
  introText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  questionInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 60,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    textAlignVertical: 'top',
  },
  sectionTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.accent,
    marginBottom: Spacing.sm,
  },
  instructionsText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 21,
    marginBottom: Spacing.md,
  },
  digitsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  digitsInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  enterButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enterButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  resultTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  resultSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  movingLinesText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  resultLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  resultExplanation: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: Spacing.sm,
  },
  resultDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: Spacing.md,
  },
  transformText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  fullInterpretationButton: {
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  fullInterpretationButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.accent,
  },
  fullInterpretationButtonDisabled: {
    opacity: 0.6,
  },
  interpretationBox: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  interpretationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  interpretationHeaderText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  interpretationText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
});
