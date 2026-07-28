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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/services/api';

export default function WeddingAgendaAdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Form state
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentEs, setContentEs] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [favorableDays, setFavorableDays] = useState('');

  const handleSubmit = async () => {
    if (!month || !year || !titleEs || !contentEs) {
      Alert.alert('Error', 'Completa: mes, año, título ES, contenido ES');
      return;
    }

    setLoading(true);
    try {
      const data = {
        agenda_id: 'wedding-agenda',
        month,
        year: parseInt(year),
        title: titleEs,
        title_en: titleEn || titleEs,
        content: contentEs,
        content_en: contentEn || contentEs,
        favorable_days: favorableDays.split(',').map(d => d.trim()).filter(d => d),
        is_free: false,
      };

      await api.post('/admin/wedding-agenda', data);
      
      Alert.alert(
        'Éxito',
        'Agenda de bodas guardada',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!month) {
      Alert.alert('Error', 'Selecciona un mes primero');
      return;
    }

    Alert.alert(
      '⚠️ Confirmar Eliminación',
      `¿Estás seguro de que quieres eliminar la Agenda de Bodas (Mes ${month})? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete(`/admin/wedding-agenda/wedding-agenda/${month}`);
              Alert.alert('Éxito', 'Contenido eliminado correctamente');
              // Clear form
              setMonth('');
              setYear('');
              setTitleEs('');
              setTitleEn('');
              setContentEs('');
              setContentEn('');
              setFavorableDays('');
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
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
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

          <View style={styles.field}>
            <Text style={styles.label}>Título ES *</Text>
            <TextInput
              style={styles.input}
              value={titleEs}
              onChangeText={setTitleEs}
              placeholder="Bodas en Enero 2027"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Título EN</Text>
            <TextInput
              style={styles.input}
              value={titleEn}
              onChangeText={setTitleEn}
              placeholder="Weddings in January 2027"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contenido ES *</Text>
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

          <View style={styles.field}>
            <Text style={styles.label}>Contenido EN</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contentEn}
              onChangeText={setContentEn}
              placeholder="Describe the most auspicious days..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={6}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Días Favorables (separados por comas)</Text>
            <TextInput
              style={styles.input}
              value={favorableDays}
              onChangeText={setFavorableDays}
              placeholder="5, 12, 19, 26"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="save" size={20} color={Colors.primary} />
                <Text style={styles.submitButtonText}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={deleting || !month}
          >
            {deleting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="trash" size={20} color={Colors.white} />
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
