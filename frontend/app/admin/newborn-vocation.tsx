import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';

interface VocationData {
  id: string;
  date: string;
  title: string;
  content: string;
  talents: string[];
  vocations: string[];
  challenges: string[];
  created_at?: string;
}

export default function AdminNewbornVocationScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
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
  const [scheduledVocations, setScheduledVocations] = useState<VocationData[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadAllScheduled();
  }, []);

  const loadAllScheduled = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/admin/newborn-vocation/all');
      setScheduledVocations(response.data);
    } catch (error) {
      console.error('Error loading scheduled vocations:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const validateDateFormat = (dateStr: string): boolean => {
    // YYYY-MM-DD format with mandatory leading zeros
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    return regex.test(dateStr);
  };

  const handleDateChange = (text: string) => {
    // Auto-format: allow only digits and hyphens
    let formatted = text.replace(/[^\d-]/g, '');
    
    // Auto-add hyphens
    if (formatted.length === 4 && !formatted.includes('-')) {
      formatted = formatted + '-';
    } else if (formatted.length === 7 && formatted.split('-').length === 2) {
      formatted = formatted + '-';
    }
    
    // Limit length to YYYY-MM-DD (10 chars)
    if (formatted.length <= 10) {
      setDate(formatted);
    }
  };

  const handleEditVocation = (vocation: VocationData) => {
    setEditingDate(vocation.date);
    setDate(vocation.date);
    setTitle(vocation.title);
    setContent(vocation.content);
    setTalents(vocation.talents?.join('\n') || '');
    setVocations(vocation.vocations?.join('\n') || '');
    setChallenges(vocation.challenges?.join('\n') || '');
    setShowEditor(true);
  };

  const handleNewVocation = () => {
    setEditingDate(null);
    setDate(getClientDate());
    setTitle('');
    setContent('');
    setTalents('');
    setVocations('');
    setChallenges('');
    setShowEditor(true);
  };

  const handleCancelEdit = () => {
    setShowEditor(false);
    setEditingDate(null);
    setDate(getClientDate());
    setTitle('');
    setContent('');
    setTalents('');
    setVocations('');
    setChallenges('');
  };

  const handleDeleteVocation = (vocation: VocationData) => {
    const doDelete = async () => {
      try {
        await api.delete(`/admin/newborn-vocation/${vocation.date}`);
        Alert.alert('Éxito', 'Vocación eliminada');
        loadAllScheduled();
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.detail || 'Error al eliminar');
      }
    };

    // Alert.alert's multi-button form has no web implementation (RN Web only supports
    // a single-button alert), so the confirm dialog never appears and Eliminar's
    // onPress never fires on web — use window.confirm there instead.
    if (Platform.OS === 'web') {
      if (window.confirm(`¿Eliminar la vocación del ${vocation.date}?`)) {
        doDelete();
      }
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Eliminar la vocación del ${vocation.date}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: doDelete },
      ]
    );
  };

  const handleSave = async () => {
    if (!validateDateFormat(date)) {
      Alert.alert(
        'Formato de fecha inválido',
        'Usa el formato YYYY-MM-DD con ceros delante.\nEjemplo: 2026-08-05'
      );
      return;
    }

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
      Alert.alert('Éxito', 'Vocación guardada correctamente');
      handleCancelEdit();
      loadAllScheduled();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const renderVocationItem = ({ item }: { item: VocationData }) => (
    <View style={styles.vocationItem}>
      <View style={styles.vocationHeader}>
        <View style={styles.vocationInfo}>
          <Text style={styles.vocationDate}>{formatDate(item.date)}</Text>
          <Text style={styles.vocationTitle} numberOfLines={1}>{item.title}</Text>
        </View>
        <View style={styles.vocationActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditVocation(item)}
          >
            <MaterialCommunityIcons name="pencil" size={18} color={Colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteVocation(item)}
          >
            <MaterialCommunityIcons name="delete-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.vocationPreview} numberOfLines={2}>
        {item.content}
      </Text>
    </View>
  );

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
            <Text style={styles.headerTitle}>Vocación del Bebé</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {/* Scheduled Vocations List */}
              {!showEditor && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                      Fechas Programadas ({scheduledVocations.length})
                    </Text>
                    <TouchableOpacity
                      style={styles.newButton}
                      onPress={handleNewVocation}
                    >
                      <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                      <Text style={styles.newButtonText}>Nueva</Text>
                    </TouchableOpacity>
                  </View>

                  {loadingList ? (
                    <ActivityIndicator color={Colors.accent} style={{ marginVertical: Spacing.xl }} />
                  ) : scheduledVocations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <MaterialCommunityIcons name="calendar-blank" size={48} color={Colors.textLight} />
                      <Text style={styles.emptyText}>No hay vocaciones programadas</Text>
                      <Text style={styles.emptySubtext}>Crea una nueva para empezar</Text>
                    </View>
                  ) : (
                    <FlatList
                      data={scheduledVocations}
                      renderItem={renderVocationItem}
                      keyExtractor={(item) => item.id}
                      scrollEnabled={false}
                      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                    />
                  )}
                </View>
              )}

              {/* Editor Form */}
              {showEditor && (
                <View style={styles.form}>
                  <View style={styles.formHeader}>
                    <Text style={styles.formTitle}>
                      {editingDate ? `Editando ${editingDate}` : 'Nueva Vocación'}
                    </Text>
                    <TouchableOpacity onPress={handleCancelEdit}>
                      <MaterialCommunityIcons name="close" size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Fecha</Text>
                  <Text style={styles.helperText}>
                    Formato: YYYY-MM-DD (con ceros delante). Ej: 2026-08-05
                  </Text>
                  <TextInput
                    testID="input-date"
                    style={[
                      styles.input,
                      !validateDateFormat(date) && date.length === 10 && styles.inputError
                    ]}
                    value={date}
                    onChangeText={handleDateChange}
                    placeholder="2026-08-05"
                    placeholderTextColor={Colors.textLight}
                    maxLength={10}
                    keyboardType="numbers-and-punctuation"
                  />
                  {!validateDateFormat(date) && date.length === 10 && (
                    <Text style={styles.errorLabel}>
                      ⚠️ Formato inválido. Usa YYYY-MM-DD con ceros.
                    </Text>
                  )}

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
                    Texto completo explicando la vocación del bebé nacido hoy.
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
                        <MaterialCommunityIcons name="save" size={20} color={Colors.primary} />
                        <Text style={styles.saveButtonText}>Guardar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: Spacing.xl * 2 }} />
            </>
          }
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
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
  section: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  newButton: {
    backgroundColor: Colors.jade,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  newButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  vocationItem: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
  },
  vocationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  vocationInfo: {
    flex: 1,
  },
  vocationDate: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.accent,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  vocationTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  vocationActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vocationPreview: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.4,
  },
  form: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  formTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
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
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
  },
  errorLabel: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
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
