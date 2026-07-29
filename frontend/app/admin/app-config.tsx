import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

interface AppConfig {
  id: string;
  contact_email: string;
  contact_whatsapp: string;
  agenda_2027_title_es: string;
  agenda_2027_title_en: string;
  agenda_2027_description_es: string;
  agenda_2027_description_en: string;
  updated_at: string;
}

export default function AppConfigAdminScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [contactEmail, setContactEmail] = useState('');
  const [contactWhatsApp, setContactWhatsApp] = useState('');
  const [agendaTitleEs, setAgendaTitleEs] = useState('');
  const [agendaTitleEn, setAgendaTitleEn] = useState('');
  const [agendaDescEs, setAgendaDescEs] = useState('');
  const [agendaDescEn, setAgendaDescEn] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await api.get('/app-config');
      const config: AppConfig = response.data;
      
      setContactEmail(config.contact_email);
      setContactWhatsApp(config.contact_whatsapp);
      setAgendaTitleEs(config.agenda_2027_title_es);
      setAgendaTitleEn(config.agenda_2027_title_en);
      setAgendaDescEs(config.agenda_2027_description_es);
      setAgendaDescEn(config.agenda_2027_description_en);
    } catch (error) {
      console.error('Error loading config:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!contactEmail || !contactWhatsApp) {
      Alert.alert('Error', 'Email y WhatsApp son obligatorios');
      return;
    }

    setSaving(true);
    try {
      await api.put('/admin/app-config', {
        contact_email: contactEmail,
        contact_whatsapp: contactWhatsApp,
        agenda_2027_title_es: agendaTitleEs,
        agenda_2027_title_en: agendaTitleEn,
        agenda_2027_description_es: agendaDescEs,
        agenda_2027_description_en: agendaDescEn,
      });
      
      Alert.alert(
        'Éxito',
        'Configuración guardada correctamente',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

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
            
            <View style={styles.iconRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="settings" size={32} color={Colors.accent} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerLabel}>ADMIN</Text>
                <Text style={styles.headerTitle}>Configuración de la App</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Contact Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de Contacto</Text>
            
            <Text style={styles.label}>Email de Contacto *</Text>
            <TextInput
              style={styles.input}
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>WhatsApp (sin +) *</Text>
            <TextInput
              style={styles.input}
              value={contactWhatsApp}
              onChangeText={setContactWhatsApp}
              placeholder="34640510085"
              keyboardType="phone-pad"
            />
          </View>

          {/* Wedding Agenda 2027 Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agenda de Bodas 2027</Text>
            
            <Text style={styles.label}>Título (Español)</Text>
            <TextInput
              style={styles.input}
              value={agendaTitleEs}
              onChangeText={setAgendaTitleEs}
              placeholder="AGENDA DE BODAS 2027"
            />

            <Text style={styles.label}>Título (English)</Text>
            <TextInput
              style={styles.input}
              value={agendaTitleEn}
              onChangeText={setAgendaTitleEn}
              placeholder="WEDDING AGENDA 2027"
            />

            <Text style={styles.label}>Descripción (Español)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={agendaDescEs}
              onChangeText={setAgendaDescEs}
              placeholder="Descripción en español..."
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Descripción (English)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={agendaDescEn}
              onChangeText={setAgendaDescEn}
              placeholder="Description in English..."
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="save" size={20} color={Colors.primary} />
                <Text style={styles.submitButtonText}>Guardar Cambios</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    lineHeight: 32,
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  label: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 100,
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
    marginTop: Spacing.lg,
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
