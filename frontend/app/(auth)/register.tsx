import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.fill_all_fields'));
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwords_dont_match'));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.password_too_short'));
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header with gradient */}
          <LinearGradient colors={Gradients.navy} style={styles.header}>
            <TouchableOpacity
              testID="register-back-btn"
              style={styles.backButton}
              onPress={goBack}
            >
              <Ionicons name="chevron-back" size={24} color={Colors.white} />
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>MetaQi</Text>
              <Text style={styles.subtitle}>Academy</Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>{t('auth.register_title')}</Text>
            <Text style={styles.description}>{t('auth.register_description')}</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('common.name')}</Text>
              <TextInput
                testID="register-name-input"
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholderTextColor={Colors.textLight}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('common.email')}</Text>
              <TextInput
                testID="register-email-input"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('common.password')}</Text>
              <TextInput
                testID="register-password-input"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t('common.confirm_password')}</Text>
              <TextInput
                testID="register-confirm-password-input"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textLight}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              testID="register-submit-btn"
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>{t('common.register')}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.have_account')} </Text>
              <TouchableOpacity onPress={goBack}>
                <Text style={styles.linkText}>{t('auth.login_here')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.white,
    marginLeft: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  logo: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['4xl'],
    color: Colors.accent,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.lg,
    color: Colors.white,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    marginTop: -BorderRadius.xl,
  },
  title: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  footerText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  linkText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.accent,
  },
});