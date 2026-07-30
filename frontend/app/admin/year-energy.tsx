import React, { useState } from 'react';
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

export default function YearEnergyAdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [year, setYear] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentEs, setContentEs] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [isFree, setIsFree] = useState(true);

  const handleSubmit = async () => {
    if (!year || !titleEs || !contentEs) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios (año, título ES, contenido ES)');
      return;
    }

    setLoading(true);
    try {
      const data = {
        year: parseInt(year),
        title: titleEs,
        title_en: titleEn || titleEs,
        content: contentEs,
        content_en: contentEn || contentEs,
        is_free: isFree,
      };

      await api.post('/admin/year-energy', data);
      
      Alert.alert(
        'Éxito',
        'Energía del año guardada correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!year) {
      Alert.alert('Error', 'Selecciona un año primero');
      return;
    }

    Alert.alert(
      '⚠️ Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar la Energía del Año (${year})? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/admin/year-energy/${year}`);
              Alert.alert('Éxito', 'Contenido eliminado correctamente');
              // Clear form
              setYear('');
              setTitleEs('');
              setTitleEn('');
              setContentEs('');
              setContentEn('');
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
        <View style={styles.form}>
          {/* Año */}
          <View style={styles.field}>
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

          {/* Título ES */}
          <View style={styles.field}>
            <Text style={styles.label}>Título (Español) *</Text>
            <TextInput
              style={styles.input}
              value={titleEs}
              onChangeText={setTitleEs}
              placeholder="2027: Año del Conejo de Agua"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Título EN */}
          <View style={styles.field}>
            <Text style={styles.label}>Título (English)</Text>
            <TextInput
              style={styles.input}
              value={titleEn}
              onChangeText={setTitleEn}
              placeholder="2027: Year of the Water Rabbit"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Contenido ES */}
          <View style={styles.field}>
            <Text style={styles.label}>Contenido (Español) *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contentEs}
              onChangeText={setContentEs}
              placeholder="Describe la energía del año..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={10}
            />
          </View>

          {/* Contenido EN */}
          <View style={styles.field}>
            <Text style={styles.label}>Contenido (English)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contentEn}
              onChangeText={setContentEn}
              placeholder="Describe the year's energy..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={10}
            />
          </View>

          {/* Contenido Gratis */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsFree(!isFree)}
          >
            <MaterialCommunityIcons
              name={isFree ? 'checkbox' : 'square-outline'}
              size={24}
              color={isFree ? Colors.accent : Colors.textLight}
            />
            <Text style={styles.checkboxLabel}>Contenido gratuito</Text>
          </TouchableOpacity>

          {/* Submit Button */}
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
            disabled={deleting || !year}
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
    height: 150,
    textAlignVertical: 'top',
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
