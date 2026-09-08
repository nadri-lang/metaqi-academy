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
import { confirmAsync } from '@/src/utils/confirmDialog';

interface YearEntry {
  id: string;
  year: number;
  title: string;
  content: string;
  video_url?: string;
}

function currentYear(): number {
  return new Date().getFullYear();
}

export default function YearEnergyAdminScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<YearEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [extraSlots, setExtraSlots] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear());
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const existing = entries.find((e) => e.year === selectedYear);
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setVideoUrl(existing.video_url || '');
    } else {
      setTitle('');
      setContent('');
      setVideoUrl('');
    }
  }, [selectedYear, entries]);

  const loadEntries = async () => {
    try {
      const response = await api.get('/admin/year-energy/all');
      setEntries(response.data);
    } catch (error) {
      console.error('Error loading year energy list:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const chips = React.useMemo(() => {
    const known = new Set(entries.map((e) => e.year));
    const all = [...entries.map((e) => e.year)];
    for (const slot of extraSlots) {
      if (!known.has(slot)) all.push(slot);
    }
    if (!known.has(currentYear()) && !all.includes(currentYear())) {
      all.push(currentYear());
    }
    return all.sort((a, b) => a - b);
  }, [entries, extraSlots]);

  const addUpcomingSlots = () => {
    const last = chips.length > 0 ? chips[chips.length - 1] : currentYear();
    const toAdd = [last + 1, last + 2];
    setExtraSlots((prev) => [...prev, ...toAdd]);
    setSelectedYear(toAdd[0]);
  };

  const handleSubmit = async () => {
    if (!selectedYear || !title.trim() || !content.trim()) {
      Alert.alert('Error', 'Completa el año, título y contenido');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/year-energy', {
        year: selectedYear,
        title: title.trim(),
        content: content.trim(),
        video_url: videoUrl.trim() || undefined,
      });
      Alert.alert('Éxito', `Energía del año ${selectedYear} guardada correctamente`);
      setExtraSlots((prev) => prev.filter((s) => s !== selectedYear));
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const exists = entries.some((e) => e.year === selectedYear);
    if (!exists) {
      Alert.alert('Info', 'Este año todavía no tiene contenido guardado.');
      return;
    }

    const confirmed = await confirmAsync(
      'Confirmar eliminación',
      `¿Eliminar la Energía del Año ${selectedYear}? Esta acción no se puede deshacer.`,
      'Eliminar',
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.delete(`/admin/year-energy/${selectedYear}`);
      Alert.alert('Éxito', 'Contenido eliminado correctamente');
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al eliminar');
    } finally {
      setDeleting(false);
    }
  };

  const hasContent = entries.some((e) => e.year === selectedYear);

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
              <Text style={styles.backButtonText}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Energía del Año</Text>
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
          <Text style={styles.pickerLabel}>Selecciona un año</Text>
          {loadingList ? (
            <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.md }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {chips.map((y) => {
                const saved = entries.some((e) => e.year === y);
                const active = y === selectedYear;
                return (
                  <TouchableOpacity
                    key={y}
                    testID={`year-chip-${y}`}
                    style={[styles.chip, active && styles.chipActive, !saved && styles.chipEmpty]}
                    onPress={() => setSelectedYear(y)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{y}</Text>
                    {!saved && <Text style={styles.chipEmptyDot}>●</Text>}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity testID="add-year-slots" style={styles.chipAdd} onPress={addUpcomingSlots}>
                <MaterialCommunityIcons name="plus" size={18} color={Colors.accent} />
                <Text style={styles.chipAddText}>+2 años</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
          <Text style={styles.pickerHint}>
            {hasContent ? '✓ Este año ya tiene contenido guardado.' : 'Este año todavía no tiene contenido (●).'}
          </Text>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Año seleccionado</Text>
              <View style={styles.yearBadge}>
                <MaterialCommunityIcons name="calendar-star" size={18} color={Colors.accent} />
                <Text style={styles.yearBadgeText}>{selectedYear}</Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="2027: Año del Cabra de Fuego"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contenido *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Describe las tendencias del año..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={8}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Enlace de vídeo (opcional)</Text>
              <TextInput
                style={styles.input}
                value={videoUrl}
                onChangeText={setVideoUrl}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
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
                  <Text style={styles.deleteButtonText}>Eliminar Contenido de Este Año</Text>
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
  yearBadge: {
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
  yearBadgeText: {
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
