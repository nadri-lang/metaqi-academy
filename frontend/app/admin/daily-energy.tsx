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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';

export default function AdminDailyEnergyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [avoid, setAvoid] = useState('');
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<any>(null);

  useEffect(() => {
    loadExisting();
  }, [date]);

  const loadExisting = async () => {
    try {
      const response = await api.get(`/energy/daily?date=${date}`);
      const data = response.data;
      setExisting(data);
      setTitle(data.title);
      setContent(data.content);
      setRecommendations(data.recommendations.join('\n'));
      setAvoid(data.avoid.join('\n'));
    } catch (error) {
      setExisting(null);
      setTitle('');
      setContent('');
      setRecommendations('');
      setAvoid('');
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
        recommendations: recommendations.split('\n').filter(r => r.trim()),
        avoid: avoid.split('\n').filter(r => r.trim()),
      };

      await api.post('/energy/daily', payload);
      Alert.alert('Éxito', 'Energía del día guardada correctamente');
      loadExisting();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
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
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
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
              placeholder="2026-07-18"
              placeholderTextColor={Colors.textLight}
            />
            {existing && (
              <Text style={styles.helperText}>
                ✓ Ya existe contenido para esta fecha - se actualizará
              </Text>
            )}

            <Text style={styles.label}>Título</Text>
            <TextInput
              testID="input-title"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Energía del Día - Armonía"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Contenido principal</Text>
            <TextInput
              testID="input-content"
              style={[styles.input, styles.textArea]}
              value={content}
              onChangeText={setContent}
              placeholder="Descripción del día..."
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Recomendaciones (una por línea)</Text>
            <TextInput
              testID="input-recommendations"
              style={[styles.input, styles.textArea]}
              value={recommendations}
              onChangeText={setRecommendations}
              placeholder="Viste de dorado&#10;Medita al amanecer&#10;Bebe té verde"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <Text style={styles.label}>Evitar (una por línea)</Text>
            <TextInput
              testID="input-avoid"
              style={[styles.input, styles.textArea]}
              value={avoid}
              onChangeText={setAvoid}
              placeholder="Discusiones&#10;Decisiones financieras"
              placeholderTextColor={Colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

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
                  <Ionicons name="save" size={20} color={Colors.primary} />
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
  content: {
    padding: Spacing.lg,
  },
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
    minHeight: 100,
  },
  helperText: {
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
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
});
