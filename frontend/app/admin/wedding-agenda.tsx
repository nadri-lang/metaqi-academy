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
import { confirmAsync } from '@/src/utils/confirmDialog';

interface AgendaEntry {
  id: string;
  month: number;
  year: number;
  title: string;
  content: string;
  is_free: boolean;
}

const MONTH_NAMES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

export default function WeddingAgendaAdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [entries, setEntries] = useState<AgendaEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Form state
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [contentEs, setContentEs] = useState('');
  const [isFree, setIsFree] = useState(true);  // TRUE = Gratis (HOME), FALSE = Pago (SERVICIOS)

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/admin/wedding-agenda/wedding-agenda/all');
      setEntries(response.data || []);
    } catch (error) {
      console.error('Error loading wedding agenda list:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const existingEntry = entries.find(
    (e) => e.month === parseInt(month, 10) && e.year === parseInt(year, 10)
  );

  useEffect(() => {
    if (existingEntry) {
      setTitleEs(existingEntry.title);
      setContentEs(existingEntry.content);
      setIsFree(existingEntry.is_free);
    } else if (month && year) {
      setTitleEs('');
      setContentEs('');
      setIsFree(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, entries]);

  const selectEntry = (entry: AgendaEntry) => {
    setMonth(String(entry.month).padStart(2, '0'));
    setYear(String(entry.year));
  };

  const handleSubmit = async () => {
    if (!month || !year || !titleEs || !contentEs) {
      Alert.alert('Error', 'Completa: mes, año, título, contenido');
      return;
    }

    setLoading(true);
    try {
      const data = {
        agenda_id: 'wedding-agenda',
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        title: titleEs,
        content: contentEs,
        is_free: isFree,
      };

      await api.post('/admin/wedding-agenda', data);

      Alert.alert('Éxito', 'Agenda de bodas guardada');
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingEntry) {
      Alert.alert('Error', 'Selecciona un mes con contenido guardado primero');
      return;
    }

    const confirmed = await confirmAsync(
      'Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar la Agenda de Bodas (${MONTH_NAMES[existingEntry.month - 1]} ${existingEntry.year})? Esta acción no se puede deshacer.`,
      'Eliminar',
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/admin/wedding-agenda/wedding-agenda/${month}`, {
        params: { year: parseInt(year, 10) },
      });
      Alert.alert('Éxito', 'Contenido eliminado correctamente');
      // Clear form
      setMonth('');
      setYear('');
      setTitleEs('');
      setContentEs('');
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Agenda de Bodas</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.form}>
          {loadingList ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.md }} />
          ) : entries.length > 0 ? (
            <View style={styles.field}>
              <Text style={styles.label}>Meses ya guardados</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  {entries.map((e) => {
                    const active = e.month === parseInt(month, 10) && e.year === parseInt(year, 10);
                    return (
                      <TouchableOpacity
                        key={e.id}
                        style={[styles.monthChip, active && styles.monthChipActive]}
                        onPress={() => selectEntry(e)}
                      >
                        <Text style={[styles.monthChipText, active && styles.monthChipTextActive]}>
                          {MONTH_NAMES[e.month - 1]} {e.year}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Mes *</Text>
              <TextInput
                style={styles.input}
                value={month}
                onChangeText={setMonth}
                placeholder="01-12"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Año *</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="2027"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />
            </View>
          </View>
          {existingEntry && (
            <Text style={styles.helperTextGreen}>✓ Ya existe contenido para este mes.</Text>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={titleEs}
              onChangeText={setTitleEs}
              placeholder="Bodas en Enero 2027"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Selector de tipo: Gratis o Pago */}
          <View style={styles.field}>
            <Text style={styles.label}>Tipo de Contenido *</Text>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setIsFree(true)}
                activeOpacity={0.7}
              >
                <View style={styles.radio}>
                  {isFree && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioLabel}>Gratis (aparece en HOME)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.radioOption}
                onPress={() => setIsFree(false)}
                activeOpacity={0.7}
              >
                <View style={styles.radio}>
                  {!isFree && <View style={styles.radioSelected} />}
                </View>
                <Text style={styles.radioLabel}>Pago (aparece en SERVICIOS)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contenido *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contentEs}
              onChangeText={setContentEs}
              placeholder="Describe los días más auspiciosos..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={6}
            />
          </View>

          <Text style={styles.translateNote}>
            Solo se escribe en español - los demás idiomas (EN/FR/DE/RO/PT) se traducen automáticamente.
          </Text>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <MaterialCommunityIcons name="save" size={20} color={Colors.primary} />
                <Text style={styles.submitButtonText}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={deleting || !existingEntry}
          >
            {deleting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="trash-can" size={20} color={Colors.white} />
                <Text style={styles.deleteButtonText}>Eliminar Contenido Actual</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Extra space at bottom for button visibility */}
        <View style={{ height: 80 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
    fontSize: Typography['2xl'],
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  form: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  monthChip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  monthChipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '20',
  },
  monthChipText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  monthChipTextActive: {
    color: Colors.accent,
  },
  helperTextGreen: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.jade,
  },
  translateNote: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  radioGroup: {
    gap: Spacing.md,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
  radioLabel: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
});
