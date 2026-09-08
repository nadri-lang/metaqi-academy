import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
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
import api from '@/src/services/api';

interface Quarter {
  id?: string;
  year: number;
  quarter: number;
  title: string;
  months_label: string;
  dates_text: string;
  price: number;
}

const YEAR = 2027;
const EMPTY_QUARTER = (q: number): Quarter => ({
  year: YEAR,
  quarter: q,
  title: '',
  months_label: '',
  dates_text: '',
  price: 9.9,
});

export default function WeddingAgenda2027AdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingIntro, setSavingIntro] = useState(false);
  const [savingQuarter, setSavingQuarter] = useState<number | null>(null);

  const [mainDescription, setMainDescription] = useState('');
  const [quarters, setQuarters] = useState<Quarter[]>([1, 2, 3, 4].map(EMPTY_QUARTER));

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/wedding-agenda-2027/all');
      setMainDescription(response.data.main_description || '');
      const saved: Quarter[] = response.data.quarters || [];
      setQuarters(
        [1, 2, 3, 4].map((q) => saved.find((s) => s.year === YEAR && s.quarter === q) || EMPTY_QUARTER(q))
      );
    } catch (error) {
      console.error('Error loading wedding agenda 2027:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuarter = (index: number, patch: Partial<Quarter>) => {
    setQuarters((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const saveIntro = async () => {
    if (!mainDescription.trim()) {
      Alert.alert('Error', 'Escribe la descripción principal');
      return;
    }
    setSavingIntro(true);
    try {
      await api.post('/admin/wedding-agenda-2027/intro', { main_description: mainDescription.trim() });
      Alert.alert('Éxito', 'Descripción principal guardada');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setSavingIntro(false);
    }
  };

  const saveQuarter = async (index: number) => {
    const q = quarters[index];
    if (!q.title.trim() || !q.months_label.trim() || !q.dates_text.trim()) {
      Alert.alert('Error', 'Completa título, meses y fechas para este trimestre');
      return;
    }
    setSavingQuarter(q.quarter);
    try {
      await api.post('/admin/wedding-agenda-2027/quarter', {
        year: YEAR,
        quarter: q.quarter,
        title: q.title.trim(),
        months_label: q.months_label.trim(),
        dates_text: q.dates_text.trim(),
        price: q.price,
      });
      Alert.alert('Éxito', `Trimestre ${q.quarter} guardado`);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setSavingQuarter(null);
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
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Agenda de Bodas 2027 (Trimestral)</Text>
            <Text style={styles.headerSubtitle}>
              El producto de pago mostrado en Servicios - no confundir con la Agenda de Bodas mensual (suscripción).
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Descripción Principal</Text>
            <Text style={styles.sectionHint}>Se muestra antes de la lista de trimestres.</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={mainDescription}
              onChangeText={setMainDescription}
              placeholder="La Agenda de Bodas 2027 TRIMESTRAL es una guía que..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={5}
            />
            <TouchableOpacity
              style={[styles.saveButton, savingIntro && styles.saveButtonDisabled]}
              onPress={saveIntro}
              disabled={savingIntro}
            >
              {savingIntro ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={18} color={Colors.primary} />
                  <Text style={styles.saveButtonText}>Guardar Descripción</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.translateNote}>
            Solo se escribe en español - los demás idiomas (EN/FR/DE/RO/PT) se traducen automáticamente.
          </Text>

          {quarters.map((q, index) => (
            <View key={q.quarter} style={styles.form}>
              <Text style={styles.sectionTitle}>Trimestre {q.quarter}</Text>

              <Text style={styles.label}>Título</Text>
              <TextInput
                style={styles.input}
                value={q.title}
                onChangeText={(v) => updateQuarter(index, { title: v })}
                placeholder={`TRIM. ${q.quarter} Enero-Marzo 2027`}
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.label}>Meses</Text>
              <TextInput
                style={styles.input}
                value={q.months_label}
                onChangeText={(v) => updateQuarter(index, { months_label: v })}
                placeholder="Enero, Febrero y Marzo"
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.label}>Rango de fechas</Text>
              <TextInput
                style={styles.input}
                value={q.dates_text}
                onChangeText={(v) => updateQuarter(index, { dates_text: v })}
                placeholder="1 de enero hasta 31 de marzo"
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.label}>Precio (€)</Text>
              <TextInput
                style={styles.input}
                value={String(q.price)}
                onChangeText={(v) => updateQuarter(index, { price: parseFloat(v.replace(',', '.')) || 0 })}
                placeholder="9.90"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
              />

              <TouchableOpacity
                style={[styles.saveButton, savingQuarter === q.quarter && styles.saveButtonDisabled]}
                onPress={() => saveQuarter(index)}
                disabled={savingQuarter === q.quarter}
              >
                {savingQuarter === q.quarter ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={18} color={Colors.primary} />
                    <Text style={styles.saveButtonText}>Guardar Trimestre {q.quarter}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))}

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: { paddingBottom: Spacing.lg },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  backButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.white,
  },
  headerSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.white,
    opacity: 0.7,
    marginTop: Spacing.xs,
  },
  content: { padding: Spacing.lg },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  sectionHint: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  label: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  input: {
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
  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  translateNote: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: Spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
});
