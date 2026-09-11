import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';
import { SUBSCRIPTION_MONTHLY_PRICE } from '@/src/constants/Subscription';

interface JournalData {
  bazi_notes: string;
  qimen_notes: string;
  bazi_calculator_url: string | null;
  qimen_calculator_url: string | null;
}

function hasPremiumAccess(user: { role?: string; has_active_subscription?: boolean; temp_access_until?: string | null } | null): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'editor') return true;
  if (user.has_active_subscription) return true;
  if (!user.temp_access_until) return false;
  return new Date(user.temp_access_until).getTime() > Date.now();
}

export default function MyJournalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const isPremium = hasPremiumAccess(user);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JournalData | null>(null);
  const [baziNotes, setBaziNotes] = useState('');
  const [qimenNotes, setQimenNotes] = useState('');
  const [savingBazi, setSavingBazi] = useState(false);
  const [savingQimen, setSavingQimen] = useState(false);

  useEffect(() => {
    if (isPremium) {
      loadJournal();
    } else {
      setLoading(false);
    }
  }, [isPremium]);

  const loadJournal = async () => {
    try {
      const response = await api.get('/journal/me');
      setData(response.data);
      setBaziNotes(response.data.bazi_notes || '');
      setQimenNotes(response.data.qimen_notes || '');
    } catch (error) {
      console.error('Error loading journal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = () => {
    Alert.alert(t('journal.title'), t('profile.subscription_coming_soon'));
  };

  const openCalculator = (url: string | null) => {
    if (!url) {
      Alert.alert(t('journal.calculator_not_configured_title'), t('journal.calculator_not_configured'));
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el enlace');
    });
  };

  const saveNotes = async (field: 'bazi_notes' | 'qimen_notes') => {
    const setSaving = field === 'bazi_notes' ? setSavingBazi : setSavingQimen;
    const value = field === 'bazi_notes' ? baziNotes : qimenNotes;
    setSaving(true);
    try {
      await api.put('/journal/me', { [field]: value });
      Alert.alert(t('journal.save_success'));
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar');
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
      <LinearGradient colors={Gradients.gold} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('journal.title')}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {!isPremium ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.lockedCard}>
            <MaterialCommunityIcons name="lock-outline" size={48} color={Colors.textLight} />
            <Text style={styles.lockedTitle}>{t('journal.locked_title')}</Text>
            <Text style={styles.lockedDesc}>{t('journal.locked_desc')}</Text>
            <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
              <MaterialCommunityIcons name="star" size={20} color={Colors.white} />
              <Text style={styles.subscribeButtonText}>
                {t('profile.subscription_cta_price').replace('{price}', SUBSCRIPTION_MONTHLY_PRICE)}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.screenDescription}>{t('journal.description')}</Text>

            {/* BaZi Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="yin-yang" size={24} color={Colors.accent} />
                <Text style={styles.cardTitle}>{t('journal.bazi_title')}</Text>
              </View>
              <TouchableOpacity
                style={[styles.calculatorButton, !data?.bazi_calculator_url && styles.calculatorButtonDisabled]}
                onPress={() => openCalculator(data?.bazi_calculator_url || null)}
              >
                <MaterialCommunityIcons name="open-in-new" size={18} color={Colors.primary} />
                <Text style={styles.calculatorButtonText}>{t('journal.bazi_calculator_button')}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.notesInput}
                value={baziNotes}
                onChangeText={setBaziNotes}
                placeholder={t('journal.bazi_notes_placeholder')}
                placeholderTextColor={Colors.textLight}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.saveButton, savingBazi && styles.saveButtonDisabled]}
                onPress={() => saveNotes('bazi_notes')}
                disabled={savingBazi}
              >
                {savingBazi ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={18} color={Colors.primary} />
                    <Text style={styles.saveButtonText}>{t('journal.save_button')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Qimen Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="compass-outline" size={24} color={Colors.accent} />
                <Text style={styles.cardTitle}>{t('journal.qimen_title')}</Text>
              </View>
              <TouchableOpacity
                style={[styles.calculatorButton, !data?.qimen_calculator_url && styles.calculatorButtonDisabled]}
                onPress={() => openCalculator(data?.qimen_calculator_url || null)}
              >
                <MaterialCommunityIcons name="open-in-new" size={18} color={Colors.primary} />
                <Text style={styles.calculatorButtonText}>{t('journal.qimen_calculator_button')}</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.notesInput}
                value={qimenNotes}
                onChangeText={setQimenNotes}
                placeholder={t('journal.qimen_notes_placeholder')}
                placeholderTextColor={Colors.textLight}
                multiline
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.saveButton, savingQimen && styles.saveButtonDisabled]}
                onPress={() => saveNotes('qimen_notes')}
                disabled={savingQimen}
              >
                {savingQimen ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={18} color={Colors.primary} />
                    <Text style={styles.saveButtonText}>{t('journal.save_button')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: { paddingBottom: Spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  content: { padding: Spacing.lg },
  screenDescription: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  lockedCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  lockedTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  lockedDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  subscribeButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  calculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  calculatorButtonDisabled: {
    opacity: 0.5,
  },
  calculatorButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  notesInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 120,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.accent,
  },
});
