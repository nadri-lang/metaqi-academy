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

export default function AdminNewbornVocationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  // Get today's date in client's timezone
  const getClientDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState(getClientDate());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [talents, setTalents] = useState('');
  const [vocations, setVocations] = useState('');
  const [challenges, setChallenges] = useState('');
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<any>(null);

  useEffect(() => {
    loadExisting();
  }, []);

  const loadExisting = async () => {
    try {
      const clientDate = getClientDate();
      const response = await api.get('/newborn-vocation/today', {
        params: { client_date: clientDate }
      });
      const data = response.data;
      setExisting(data);
      // Only auto-fill if the existing data is for today's date
      if (data.date === clientDate) {
        setTitle(data.title || '');
        setContent(data.content || '');
        setTalents(data.talents?.join('\n') || '');
        setVocations(data.vocations?.join('\n') || '');
        setChallenges(data.challenges?.join('\n') || '');
      }
    } catch (error) {
      setExisting(null);
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      Alert.alert('Error', 'Título y descripción son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        date,
        title,
        content,
        talents: talents.split('\n').filter(t => t.trim()),
        vocations: vocations.split('\n').filter(v => v.trim()),
        challenges: challenges.split('\n').filter(c => c.trim()),
      };

      await api.post('/admin/newborn-vocation', payload);
      Alert.alert('Éxito', 'Vocación del bebé guardada correctamente');
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
            <Text style={styles.headerTitle}>Vocación del Bebé</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.form}>
            <Text style={styles.label}>Fecha</Text>
            <TextInput
              testID="input-date"
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="2026-07-18"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Título</Text>
            <TextInput
              testID="input-title"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Vocación del Bebé Nacido Hoy"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Presentación Detallada</Text>
            <Text style={styles.helperText}>
              Texto completo explicando la vocación del bebé nacido hoy. Sé lo más detallado posible.
            </Text>
            <TextInput
              testID="input-content"
              style={[styles.input, styles.textArea, { minHeight: 200 }]}
              value={content}
              onChangeText={setContent}
              placeholder="Los bebés nacidos hoy traen una energía especial..."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Talentos Naturales (uno por línea)</Text>
            <TextInput
              testID="input-talents"
              style={[styles.input, styles.textArea]}
              value={talents}
              onChangeText={setTalents}
              placeholder="Comunicación excepcional&#10;Sensibilidad artística"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Vocaciones Favorables (una por línea)</Text>
            <TextInput
              testID="input-vocations"
              style={[styles.input, styles.textArea]}
              value={vocations}
              onChangeText={setVocations}
              placeholder="Escritor o periodista&#10;Terapeuta"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Desafíos (uno por línea)</Text>
            <TextInput
              testID="input-challenges"
              style={[styles.input, styles.textArea]}
              value={challenges}
              onChangeText={setChallenges}
              placeholder="Timidez inicial&#10;Hipersensibilidad"
              placeholderTextColor={Colors.textLight}
              multiline
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
                  <Text style={styles.saveButtonText}>Guardar</Text>
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
    minHeight: 100,
  },
  helperText: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: -Spacing.xs,
    fontStyle: 'italic',
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
});
