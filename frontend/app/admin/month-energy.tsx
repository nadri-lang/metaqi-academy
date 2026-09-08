import React, { useEffect, useState } from 'react';
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

interface MonthEntry {
  id: string;
  month: string; // YYYY-MM
  title: string;
  content: string;
  is_free: boolean;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function nextMonthKey(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  const label = d.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function MonthEnergyAdminScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<MonthEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [extraSlots, setExtraSlots] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFree, setIsFree] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const existing = entries.find((e) => e.month === selectedMonth);
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setIsFree(existing.is_free);
    } else {
      setTitle('');
      setContent('');
      setIsFree(true);
    }
  }, [selectedMonth, entries]);

  const loadEntries = async () => {
    try {
      const response = await api.get('/admin/month-energy/all');
      setEntries(response.data);
    } catch (error) {
      console.error('Error loading month energy list:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const chips = React.useMemo(() => {
    const known = new Set(entries.map((e) => e.month));
    const all = [...entries.map((e) => e.month)];
    for (const slot of extraSlots) {
      if (!known.has(slot)) all.push(slot);
    }
    if (!known.has(currentMonthKey()) && !all.includes(currentMonthKey())) {
      all.push(currentMonthKey());
    }
    return all.sort();
  }, [entries, extraSlots]);

  const addUpcomingSlots = () => {
    const last = chips.length > 0 ? chips[chips.length - 1] : currentMonthKey();
    const toAdd: string[] = [];
    let cursor = last;
    for (let i = 0; i < 3; i++) {
      cursor = nextMonthKey(cursor);
      toAdd.push(cursor);
    }
    setExtraSlots((prev) => [...prev, ...toAdd]);
    setSelectedMonth(toAdd[0]);
  };

  const handleSubmit = async () => {
    if (!selectedMonth || !title.trim() || !content.trim()) {
      Alert.alert('Error', 'Completa el mes, título y contenido');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/month-energy', {
        month: selectedMonth,
        title: title.trim(),
        content: content.trim(),
        is_free: isFree,
      });
      Alert.alert('Éxito', `Energía de ${formatMonthLabel(selectedMonth)} guardada correctamente`);
      setExtraSlots((prev) => prev.filter((s) => s !== selectedMonth));
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    const exists = entries.some((e) => e.month === selectedMonth);
    if (!exists) {
      Alert.alert('Info', 'Este mes todavía no tiene contenido guardado.');
      return;
    }

    Alert.alert(
      '⚠️ Confirmar eliminación',
      `¿Eliminar la Energía del Mes (${formatMonthLabel(selectedMonth)})? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/admin/month-energy/${selectedMonth}`);
              Alert.alert('Éxito', 'Contenido eliminado correctamente');
              loadEntries();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Error al eliminar');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const hasContent = entries.some((e) => e.month === selectedMonth);

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Energía del Mes</Text>
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
          <Text style={styles.pickerLabel}>Selecciona un mes</Text>
          {loadingList ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.md }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {chips.map((m) => {
                const saved = entries.some((e) => e.month === m);
                const active = m === selectedMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    testID={`month-chip-${m}`}
                    style={[styles.chip, active && styles.chipActive, !saved && styles.chipEmpty]}
                    onPress={() => setSelectedMonth(m)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {formatMonthLabel(m)}
                    </Text>
                    {!saved && <Text style={styles.chipEmptyDot}>●</Text>}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity testID="add-month-slots" style={styles.chipAdd} onPress={addUpcomingSlots}>
                <MaterialCommunityIcons name="plus" size={18} color={Colors.accent} />
                <Text style={styles.chipAddText}>+3 meses</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
          <Text style={styles.pickerHint}>
            {hasContent ? '✓ Este mes ya tiene contenido guardado.' : 'Este mes todavía no tiene contenido (●).'}
          </Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Mes seleccionado</Text>
              <View style={styles.monthBadge}>
                <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.accent} />
                <Text style={styles.monthBadgeText}>{formatMonthLabel(selectedMonth)} ({selectedMonth})</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enero 2027: Mes de Nuevos Comienzos"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contenido *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Describe la energía del mes..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={8}
              />
            </View>

            <Text style={styles.translateNote}>
              Solo se escribe en español - los demás idiomas (EN/FR/DE/RO/PT) se traducen automáticamente.
            </Text>

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsFree(!isFree)}>
              <MaterialCommunityIcons
                name={isFree ? 'checkbox' : 'square-outline'}
                size={24}
                color={isFree ? Colors.accent : Colors.textLight}
              />
              <Text style={styles.checkboxLabel}>Contenido gratuito</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save" size={20} color={Colors.primary} />
                  <Text style={styles.submitButtonText}>{hasContent ? 'Actualizar' : 'Guardar'}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
              onPress={handleDelete}
              disabled={deleting || !hasContent}
            >
              {deleting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="trash-can" size={20} color={Colors.white} />
                  <Text style={styles.deleteButtonText}>Eliminar Contenido de Este Mes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

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
  pickerLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  chipRow: {
    flexGrow: 0,
    marginBottom: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
  },
  chipActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '20',
  },
  chipEmpty: {
    borderStyle: 'dashed',
  },
  chipText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.accent,
  },
  chipEmptyDot: {
    color: Colors.textLight,
    fontSize: 8,
  },
  chipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipAddText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.accent,
  },
  pickerHint: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginBottom: Spacing.lg,
  },
  form: {
    gap: Spacing.lg,
  },
  field: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent + '15',
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  monthBadgeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.accent,
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
    height: 160,
    textAlignVertical: 'top',
  },
  translateNote: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  checkboxLabel: {
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
