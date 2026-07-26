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

export default function MonthEnergyAdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [month, setMonth] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [contentEs, setContentEs] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [isFree, setIsFree] = useState(true);

  const handleSubmit = async () => {
    if (!month || !titleEs || !contentEs) {
      Alert.alert('Error', 'Por favor completa los campos obligatorios (mes, título ES, contenido ES)');
      return;
    }

    setLoading(true);
    try {
      const data = {
        month,
        title: titleEs,
        title_en: titleEn || titleEs,
        content: contentEs,
        content_en: contentEn || contentEs,
        is_free: isFree,
      };

      await api.post('/admin/month-energy', data);
      
      Alert.alert(
        'Éxito',
        'Energía del mes guardada correctamente',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setLoading(false);
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
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
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
        <View style={styles.form}>
          {/* Mes */}
          <View style={styles.field}>
            <Text style={styles.label}>Mes (YYYY-MM) *</Text>
            <TextInput
              style={styles.input}
              value={month}
              onChangeText={setMonth}
              placeholder="2027-01"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          {/* Título ES */}
          <View style={styles.field}>
            <Text style={styles.label}>Título (Español) *</Text>
            <TextInput
              style={styles.input}
              value={titleEs}
              onChangeText={setTitleEs}
              placeholder="Enero 2027: Mes de Nuevos Comienzos"
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
              placeholder="January 2027: Month of New Beginnings"
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
              placeholder="Describe la energía del mes..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={8}
            />
          </View>

          {/* Contenido EN */}
          <View style={styles.field}>
            <Text style={styles.label}>Contenido (English)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={contentEn}
              onChangeText={setContentEn}
              placeholder="Describe the month's energy..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={8}
            />
          </View>

          {/* Contenido Gratis */}
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setIsFree(!isFree)}
          >
            <Ionicons
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
                <Ionicons name="save" size={20} color={Colors.primary} />
                <Text style={styles.submitButtonText}>Guardar</Text>
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
    height: 120,
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
});
