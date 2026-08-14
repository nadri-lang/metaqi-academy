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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

export default function AdminDailyEnergyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [animal, setAnimal] = useState('');
  const [baziRelationships, setBaziRelationships] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [avoid, setAvoid] = useState('');
  const [fengShuiSectors, setFengShuiSectors] = useState('');
  const [qimenDirections, setQimenDirections] = useState('');
  const [favorableHours, setFavorableHours] = useState('');
  const [travelHours, setTravelHours] = useState('');
  const [activations, setActivations] = useState('');
  const [activationsVideoUrl, setActivationsVideoUrl] = useState('');
  const [activationsImageUri, setActivationsImageUri] = useState('');
  const [activationsImageUrl, setActivationsImageUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<any>(null);

  useEffect(() => {
    loadExisting();
  }, [date]);

  const loadExisting = async () => {
    try {
      const response = await api.get('/energy/daily', { params: { date, lang: 'es' } });
      const data = response.data;
      setExisting(data);
      setTitle(data.title || '');
      setContent(data.content || '');
      setAnimal(data.animal || '');
      setBaziRelationships(data.bazi_relationships || '');
      setRecommendations((data.recommendations || []).join('\n'));
      setAvoid((data.avoid || []).join('\n'));
      setFengShuiSectors((data.feng_shui_sectors || []).join('\n'));
      setQimenDirections((data.qimen_directions || []).join('\n'));
      setFavorableHours((data.favorable_hours || []).join('\n'));
      setTravelHours((data.travel_hours || []).join('\n'));
      setActivations(data.activations || '');
      setActivationsVideoUrl(data.activations_video_url || '');
      setActivationsImageUrl(data.activations_image_url || '');
    } catch (error) {
      setExisting(null);
      setTitle('');
      setContent('');
      setAnimal('');
      setBaziRelationships('');
      setRecommendations('');
      setAvoid('');
      setFengShuiSectors('');
      setQimenDirections('');
      setFavorableHours('');
      setTravelHours('');
      setActivations('');
      setActivationsVideoUrl('');
      setActivationsImageUri('');
      setActivationsImageUrl('');
    }
  };

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
    if (!existing) {
      Alert.alert('Error', 'Primero debes guardar la Energía del Día antes de subir imagen/video');
      return;
    }

    if (!activationsImageUri && !activationsVideoUrl) {
      Alert.alert('Info', 'No hay imagen ni URL de video para subir');
      return;
    }

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('date', date);

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

      const response = await api.post('/energy/daily/activations-media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Éxito', 'Imagen y/o video de activaciones guardados correctamente');
      
      // Update state with new URLs
      if (response.data.activations_image_url) {
        setActivationsImageUrl(response.data.activations_image_url);
        setActivationsImageUri(''); // Clear local URI
      }
      if (response.data.activations_video_url) {
        setActivationsVideoUrl(response.data.activations_video_url);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al subir imagen/video');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      Alert.alert('Error', 'Título y contenido son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date,
        title,
        content,
        animal: animal || null,
        bazi_relationships: baziRelationships || null,
        recommendations: recommendations.split('\n').filter(r => r.trim()),
        avoid: avoid.split('\n').filter(r => r.trim()),
        feng_shui_sectors: fengShuiSectors.split('\n').filter(r => r.trim()),
        qimen_directions: qimenDirections.split('\n').filter(r => r.trim()),
        favorable_hours: favorableHours.split('\n').filter(r => r.trim()),
        travel_hours: travelHours.split('\n').filter(r => r.trim()),
        activations: activations.trim() || null,
      };

      await api.post('/energy/daily', payload);
      Alert.alert('Éxito', 'Energía del día guardada correctamente');
      loadExisting();
    } catch (error: any) {
      if (!error.response) {
        Alert.alert('Error de conexión', 'No se pudo contactar al servidor. Verifica tu conexión e intenta de nuevo.');
      } else {
        Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Acceso denegado</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerNav}>
            <TouchableOpacity
              testID="admin-back-btn"
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>Admin</Text>
            <Text style={styles.headerTitle}>Energía del Día</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
            <TextInput
              testID="input-date"
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholderTextColor={Colors.textLight}
            />
            {existing && (
              <Text style={styles.helperTextGreen}>
                ✓ Ya existe contenido para esta fecha
              </Text>
            )}

            <Text style={styles.label}>Título *</Text>
            <TextInput
              testID="input-title"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Energía del Día - Armonía"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Descripción principal *</Text>
            <TextInput
              testID="input-content"
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Descripción del día..."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Animal del Día</Text>
            <TextInput
              testID="input-animal"
              style={styles.input}
              value={animal}
              onChangeText={setAnimal}
              placeholder="Ej: Tigre de Madera Yang"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Relaciones BaZi</Text>
            <TextInput
              testID="input-bazi"
              style={[styles.input, styles.textArea]}
              value={baziRelationships}
              onChangeText={setBaziRelationships}
              placeholder="Descripción de las relaciones entre elementos BaZi del día..."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Actividades Sostenidas (una por línea)</Text>
            <TextInput
              testID="input-recommendations"
              style={[styles.input, styles.textArea]}
              value={recommendations}
              onChangeText={setRecommendations}
              placeholder="Comenzar proyectos creativos&#10;Firmar acuerdos"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Actividades a Evitar (una por línea)</Text>
            <TextInput
              testID="input-avoid"
              style={[styles.input, styles.textArea]}
              value={avoid}
              onChangeText={setAvoid}
              placeholder="Discusiones&#10;Decisiones impulsivas"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Sectores Feng Shui (uno por línea)</Text>
            <TextInput
              testID="input-fengshui"
              style={[styles.input, styles.textArea]}
              value={fengShuiSectors}
              onChangeText={setFengShuiSectors}
              placeholder="Este: Sector activo&#10;Norte: Sabiduría"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Direcciones Qi Men (una por línea)</Text>
            <TextInput
              testID="input-qimen"
              style={[styles.input, styles.textArea]}
              value={qimenDirections}
              onChangeText={setQimenDirections}
              placeholder="Este: Puerta Vida&#10;Sur: Puerta Apertura"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Horas más Favorables (una por línea)</Text>
            <TextInput
              testID="input-hours"
              style={[styles.input, styles.textArea]}
              value={favorableHours}
              onChangeText={setFavorableHours}
              placeholder="05:00-07:00: Hora del Conejo&#10;11:00-13:00: Máxima energía Yang"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>🚗 Horas NO recomendadas para Viajes (una por línea)</Text>
            <TextInput
              testID="input-travel"
              style={[styles.input, styles.textArea]}
              value={travelHours}
              onChangeText={setTravelHours}
              placeholder="07:00-09:00: Evitar salidas hacia el Norte&#10;15:00-17:00: Hora de conflicto"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>✨ Activaciones del Día</Text>
            <TextInput
              testID="input-activations"
              style={[styles.input, styles.textArea]}
              value={activations}
              onChangeText={setActivations}
              placeholder="Describe las activaciones recomendadas para este día..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {/* Activations Media Section */}
            <View style={styles.mediaSection}>
              <Text style={styles.mediaSectionTitle}>📸 Multimedia para Activaciones</Text>
              <Text style={styles.mediaSectionHelper}>
                Añade imagen y/o video para enriquecer el contenido de las activaciones
              </Text>

              {/* Video URL Input */}
              <Text style={styles.label}>🎥 Enlace de Video (YouTube/Vimeo)</Text>
              <TextInput
                testID="input-video-url"
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

              {/* Image Picker */}
              <Text style={styles.label}>🖼️ Imagen (JPEG/PNG)</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
              >
                <MaterialCommunityIcons name="image-plus" size={24} color={Colors.accent} />
                <Text style={styles.imagePickerText}>Seleccionar Imagen</Text>
              </TouchableOpacity>

              {/* Show selected/uploaded image */}
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
                  <Image source={{ uri: activationsImageUrl }} style={styles.imagePreview} />
                  <Text style={styles.helperTextGreen}>✓ Imagen ya subida</Text>
                </View>
              ) : null}

              {/* Upload Media Button */}
              {(activationsImageUri || activationsVideoUrl) && (
                <TouchableOpacity
                  style={[styles.uploadMediaButton, uploadingMedia && styles.saveButtonDisabled]}
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

            <TouchableOpacity
              testID="save-btn"
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="save" size={20} color={Colors.primary} />
                  <Text style={styles.saveButtonText}>
                    {existing ? 'Actualizar' : 'Guardar'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: Spacing['2xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl },
  headerNav: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  headerLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
  },
  content: { padding: Spacing.lg },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
  },
  label: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
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
    minHeight: 90,
  },
  helperTextGreen: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.jade,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing['2xl'],
  },
  mediaSection: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: Colors.accent + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
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
    borderColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
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
});
