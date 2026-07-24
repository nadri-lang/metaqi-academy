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

export default function AdminConceptsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [concepts, setConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullContent, setFullContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadConcepts();
  }, []);

  const loadConcepts = async () => {
    try {
      const response = await api.get('/concepts');
      setConcepts(response.data);
    } catch (error) {
      console.error('Error loading concepts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (concept: any) => {
    setEditingId(concept.id);
    setSlug(concept.slug);
    setTitle(concept.title);
    setShortDescription(concept.short_description || '');
    setFullContent(concept.full_content || '');
  };

  const handleClear = () => {
    setEditingId(null);
    setSlug('');
    setTitle('');
    setShortDescription('');
    setFullContent('');
  };

  const handleSave = async () => {
    if (!slug || !title) {
      Alert.alert('Error', 'Slug y título son obligatorios');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        slug,
        title,
        short_description: shortDescription,
        full_content: fullContent,
      };

      if (editingId) {
        await api.put(`/concepts/${editingId}`, payload);
        Alert.alert('Éxito', 'Concepto actualizado');
      } else {
        await api.post('/concepts', payload);
        Alert.alert('Éxito', 'Concepto creado');
      }

      handleClear();
      loadConcepts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') {
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
            <Text style={styles.headerTitle}>Conceptos Metafísica</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {editingId ? 'Editar Concepto' : 'Nuevo Concepto'}
            </Text>

            <Text style={styles.label}>Slug (ID único) *</Text>
            <TextInput
              style={styles.input}
              value={slug}
              onChangeText={setSlug}
              placeholder="qi-men-dun-jia"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
              editable={!editingId}
            />

            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Qi Men Dun Jia"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Descripción Corta</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={shortDescription}
              onChangeText={setShortDescription}
              placeholder="Breve introducción..."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>Contenido Completo</Text>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              value={fullContent}
              onChangeText={setFullContent}
              placeholder="Contenido detallado del concepto..."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={handleClear}
              >
                <Text style={styles.clearButtonText}>Limpiar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color={Colors.primary} />
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* List of existing concepts */}
          {loading ? (
            <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: Spacing.xl }} />
          ) : (
            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>Conceptos Existentes</Text>
              {concepts.map((concept) => (
                <TouchableOpacity
                  key={concept.id}
                  style={styles.listItem}
                  onPress={() => handleEdit(concept)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listItemTitle}>{concept.title}</Text>
                    <Text style={styles.listItemSubtitle}>{concept.slug}</Text>
                  </View>
                  <Ionicons name="create-outline" size={20} color={Colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
          )}

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
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
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
    minHeight: 80,
  },
  textAreaLarge: {
    minHeight: 150,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  clearButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  clearButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  saveButton: {
    backgroundColor: Colors.accent,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  listContainer: {
    marginTop: Spacing.md,
  },
  listTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listItemTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing['2xl'],
  },
});
