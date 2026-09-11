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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/services/api';
import * as ImagePicker from 'expo-image-picker';
import { toAbsoluteMediaUrl } from '@/src/utils/mediaUrl';
import { confirmAsync } from '@/src/utils/confirmDialog';
import { ZODIAC_ANIMALS, ELEMENTS, ZodiacAnimalKey, ElementKey } from '@/src/constants/Zodiac';

interface MonthEntry {
  id: string;
  month: string; // YYYY-MM
  title: string;
  content: string;
  animal_type?: ZodiacAnimalKey;
  element?: ElementKey;
  bazi_influences?: string;
  qimen_strategies?: string;
  feng_shui?: string;
  activations?: string;
  activations_image_url?: string;
  activations_video_url?: string;
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
  const [showPast, setShowPast] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [animalType, setAnimalType] = useState<ZodiacAnimalKey | ''>('');
  const [element, setElement] = useState<ElementKey | ''>('');
  const [baziInfluences, setBaziInfluences] = useState('');
  const [qimenStrategies, setQimenStrategies] = useState('');
  const [fengShui, setFengShui] = useState('');
  const [activations, setActivations] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [activationsVideoUrl, setActivationsVideoUrl] = useState('');
  const [activationsImageUri, setActivationsImageUri] = useState('');
  const [activationsImageUrl, setActivationsImageUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const existing = entries.find((e) => e.month === selectedMonth);
    if (existing) {
      setTitle(existing.title);
      setContent(existing.content);
      setAnimalType(existing.animal_type || '');
      setElement(existing.element || '');
      setBaziInfluences(existing.bazi_influences || '');
      setQimenStrategies(existing.qimen_strategies || '');
      setFengShui(existing.feng_shui || '');
      setActivations(existing.activations || '');
      setIsFree(existing.is_free);
      setActivationsVideoUrl(existing.activations_video_url || '');
      setActivationsImageUrl(existing.activations_image_url || '');
      setActivationsImageUri('');
    } else {
      setTitle('');
      setContent('');
      setAnimalType('');
      setElement('');
      setBaziInfluences('');
      setQimenStrategies('');
      setFengShui('');
      setActivations('');
      setIsFree(true);
      setActivationsVideoUrl('');
      setActivationsImageUri('');
      setActivationsImageUrl('');
    }
  }, [selectedMonth, entries]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos permiso para acceder a tu galería');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setActivationsImageUri(result.assets[0].uri);
    }
  };

  const uploadActivationsMedia = async () => {
    if (!hasContent) {
      Alert.alert('Error', 'Primero debes guardar la Energía del Mes antes de subir imagen/video');
      return;
    }

    if (!activationsImageUri && !activationsVideoUrl) {
      Alert.alert('Info', 'No hay imagen ni URL de video para subir');
      return;
    }

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('month', selectedMonth);

      if (activationsVideoUrl.trim()) {
        formData.append('activations_video_url', activationsVideoUrl.trim());
      }

      if (activationsImageUri) {
        const filename = activationsImageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('activations_image', {
          uri: activationsImageUri,
          name: filename,
          type,
        } as any);
      }

      // No manual Content-Type - axios must generate the multipart boundary
      // itself from the FormData body, or the backend can't parse it.
      const response = await api.post('/energy/monthly/activations-media', formData);

      Alert.alert('Éxito', 'Imagen y/o video de activaciones guardados correctamente');

      if (response.data.activations_image_url) {
        setActivationsImageUrl(response.data.activations_image_url);
        setActivationsImageUri('');
      }
      if (response.data.activations_video_url) {
        setActivationsVideoUrl(response.data.activations_video_url);
      }
      loadEntries();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al subir imagen/video');
    } finally {
      setUploadingMedia(false);
    }
  };

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
    // Past months clutter the picker by default - only the current month and
    // anything staged for the future show up here. A past month is still
    // reachable (it just won't have a chip) and can be deleted with the
    // button below once selected via its saved link/URL if ever needed.
    const currentKey = currentMonthKey();
    const relevant = showPast ? entries : entries.filter((e) => e.month >= currentKey);
    const known = new Set(relevant.map((e) => e.month));
    const all = [...known];
    for (const slot of extraSlots) {
      if (!known.has(slot)) all.push(slot);
    }
    if (!all.includes(currentKey)) {
      all.push(currentKey);
    }
    return all.sort();
  }, [entries, extraSlots, showPast]);

  const hasPastEntries = React.useMemo(() => {
    const currentKey = currentMonthKey();
    return entries.some((e) => e.month < currentKey);
  }, [entries]);

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
        animal_type: animalType || undefined,
        element: element || undefined,
        bazi_influences: baziInfluences.trim() || undefined,
        qimen_strategies: qimenStrategies.trim() || undefined,
        feng_shui: fengShui.trim() || undefined,
        activations: activations.trim() || undefined,
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

  const handleDelete = async () => {
    const exists = entries.some((e) => e.month === selectedMonth);
    if (!exists) {
      Alert.alert('Info', 'Este mes todavía no tiene contenido guardado.');
      return;
    }

    const confirmed = await confirmAsync(
      'Confirmar eliminación',
      `¿Eliminar la Energía del Mes (${formatMonthLabel(selectedMonth)})? Esta acción no se puede deshacer.`,
      'Eliminar',
    );
    if (!confirmed) return;

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
          {hasPastEntries && (
            <TouchableOpacity testID="toggle-past-months" onPress={() => setShowPast((v) => !v)} style={styles.showPastToggle}>
              <MaterialCommunityIcons
                name={showPast ? 'eye-off-outline' : 'history'}
                size={16}
                color={Colors.accent}
              />
              <Text style={styles.showPastToggleText}>
                {showPast ? 'Ocultar meses pasados' : 'Ver meses pasados (para borrarlos)'}
              </Text>
            </TouchableOpacity>
          )}

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
              <Text style={styles.label}>Contenido general *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={content}
                onChangeText={setContent}
                placeholder="Describe la energía general del mes..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={8}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Animal del Mes</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {ZODIAC_ANIMALS.map((a) => (
                    <TouchableOpacity
                      key={a.key}
                      style={[styles.chip, animalType === a.key && styles.chipActive]}
                      onPress={() => setAnimalType((prev) => (prev === a.key ? '' : a.key))}
                    >
                      <Text style={[styles.chipText, animalType === a.key && styles.chipTextActive]}>
                        {a.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Elemento del Mes</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                {ELEMENTS.map((e) => (
                  <TouchableOpacity
                    key={e.key}
                    style={[styles.chip, element === e.key && styles.chipActive]}
                    onPress={() => setElement((prev) => (prev === e.key ? '' : e.key))}
                  >
                    <Text style={[styles.chipText, element === e.key && styles.chipTextActive]}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.sectionDivider}>Secciones detalladas (opcionales)</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Influencias BaZi</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={baziInfluences}
                onChangeText={setBaziInfluences}
                placeholder="Tendencias energéticas del mes y cómo afectan a las personas..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Estrategias Qimen</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={qimenStrategies}
                onChangeText={setQimenStrategies}
                placeholder="Estrategias y momentos favorables para actuar..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Feng Shui del mes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={fengShui}
                onChangeText={setFengShui}
                placeholder="Sectores favorables, desfavorables y recomendaciones para el entorno..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Activaciones del mes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={activations}
                onChangeText={setActivations}
                placeholder="Fechas, sectores y acciones recomendadas para aprovechar la energía del mes..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={6}
              />
            </View>

            {/* Activations Media Section */}
            <View style={styles.mediaSection}>
              <Text style={styles.mediaSectionTitle}>📸 Multimedia para Activaciones</Text>
              <Text style={styles.mediaSectionHelper}>
                Añade imagen y/o video para enriquecer el contenido de las activaciones del mes
              </Text>

              <Text style={styles.label}>🎥 Enlace de Video (YouTube/Vimeo)</Text>
              <TextInput
                style={styles.input}
                value={activationsVideoUrl}
                onChangeText={setActivationsVideoUrl}
                placeholder="https://youtube.com/watch?v=..."
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
              />
              {activationsVideoUrl ? (
                <Text style={styles.helperTextGreen}>✓ URL de video ingresada</Text>
              ) : null}

              <Text style={styles.label}>🖼️ Imagen (JPEG/PNG)</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <MaterialCommunityIcons name="image-plus" size={24} color={Colors.accent} />
                <Text style={styles.imagePickerText}>Seleccionar Imagen</Text>
              </TouchableOpacity>

              {activationsImageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: activationsImageUri }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setActivationsImageUri('')}
                  >
                    <MaterialCommunityIcons name="close-circle" size={24} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : activationsImageUrl ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: toAbsoluteMediaUrl(activationsImageUrl) }} style={styles.imagePreview} />
                  <Text style={styles.helperTextGreen}>✓ Imagen ya subida</Text>
                </View>
              ) : null}

              {(activationsImageUri || activationsVideoUrl) && (
                <TouchableOpacity
                  style={[styles.uploadMediaButton, uploadingMedia && styles.submitButtonDisabled]}
                  onPress={uploadActivationsMedia}
                  disabled={uploadingMedia}
                >
                  {uploadingMedia ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cloud-upload" size={20} color={Colors.white} />
                      <Text style={styles.uploadMediaButtonText}>Subir Imagen/Video</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
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
  showPastToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -Spacing.md,
    marginBottom: Spacing.lg,
  },
  showPastToggleText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.accent,
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
  sectionDivider: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
  },
  translateNote: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  helperTextGreen: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.jade,
    marginTop: 4,
  },
  mediaSection: {
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.accent + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    gap: Spacing.xs,
  },
  mediaSectionTitle: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  mediaSectionHelper: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  imagePickerText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.accent,
  },
  imagePreviewContainer: {
    marginTop: Spacing.md,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
  },
  removeImageButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
  uploadMediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.jade,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  uploadMediaButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
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
