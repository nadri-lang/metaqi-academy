import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const { language } = useLanguage();
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setValidating(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await api.get(`/auth/validate-reset-token/${token}`);
      setTokenValid(response.data.valid);
      setUserEmail(response.data.email);
    } catch (error: any) {
      console.error('Token validation error:', error);
      setTokenValid(false);
      Alert.alert(
        language === 'es' ? 'Token inválido' : 'Invalid Token',
        error.response?.data?.detail || 
        (language === 'es' ? 'Este enlace es inválido o ha expirado.' : 'This link is invalid or has expired.')
      );
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'Por favor completa ambos campos' : 'Please fill both fields'
      );
      return;
    }

    if (newPassword.trim().length < 6) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' 
          ? 'La contraseña debe tener al menos 6 caracteres' 
          : 'Password must be at least 6 characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match'
      );
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        new_password: newPassword.trim()
      });
      setSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error);
      Alert.alert(
        language === 'es' ? 'Error' : 'Error',
        error.response?.data?.detail || 
        (language === 'es' 
          ? 'No se pudo restablecer la contraseña. Por favor intenta nuevamente.' 
          : 'Could not reset password. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>
          {language === 'es' ? 'Validando enlace...' : 'Validating link...'}
        </Text>
      </View>
    );
  }

  if (!token || !tokenValid) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={Gradients.navy} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push('/(auth)/login')}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {language === 'es' ? 'Error' : 'Error'}
              </Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorTitle}>
            {language === 'es' ? 'Enlace inválido' : 'Invalid Link'}
          </Text>
          <Text style={styles.errorDescription}>
            {language === 'es'
              ? 'Este enlace es inválido o ha expirado. Por favor solicita un nuevo enlace.'
              : 'This link is invalid or has expired. Please request a new link.'}
          </Text>
          <TouchableOpacity
            style={styles.requestNewButton}
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={styles.requestNewButtonText}>
              {language === 'es' ? 'Solicitar nuevo enlace' : 'Request new link'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={Gradients.navy} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <View style={{ width: 40 }} />
              <Text style={styles.headerTitle}>
                {language === 'es' ? '¡Éxito!' : 'Success!'}
              </Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <MaterialCommunityIcons name="check-circle" size={64} color={Colors.jade} />
          </View>
          <Text style={styles.successTitle}>
            {language === 'es' ? '¡Contraseña actualizada!' : 'Password Updated!'}
          </Text>
          <Text style={styles.successDescription}>
            {language === 'es'
              ? 'Tu contraseña ha sido actualizada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.'
              : 'Your password has been updated successfully. You can now login with your new password.'}
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <MaterialCommunityIcons name="login" size={20} color={Colors.primary} />
            <Text style={styles.loginButtonText}>
              {language === 'es' ? 'Iniciar sesión' : 'Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {language === 'es' ? 'Nueva Contraseña' : 'New Password'}
            </Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="lock-reset" size={64} color={Colors.accent} />
        </View>

        <Text style={styles.title}>
          {language === 'es' ? 'Establece tu nueva contraseña' : 'Set your new password'}
        </Text>

        <Text style={styles.emailText}>
          {userEmail}
        </Text>

        {/* New Password */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.input}
            placeholder={language === 'es' ? 'Nueva contraseña' : 'New password'}
            placeholderTextColor={Colors.textLight}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={Colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock-check-outline" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.input}
            placeholder={language === 'es' ? 'Confirmar contraseña' : 'Confirm password'}
            placeholderTextColor={Colors.textLight}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        <View style={styles.hintBox}>
          <MaterialCommunityIcons name="information" size={18} color={Colors.textSecondary} />
          <Text style={styles.hintText}>
            {language === 'es'
              ? 'La contraseña debe tener al menos 6 caracteres'
              : 'Password must be at least 6 characters'}
          </Text>
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
              <MaterialCommunityIcons name="check" size={20} color={Colors.primary} />
              <Text style={styles.submitButtonText}>
                {language === 'es' ? 'Actualizar contraseña' : 'Update password'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  loadingText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  header: {
    paddingBottom: Spacing.md,
  },
  headerContent: {
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
    fontSize: Typography.lg,
    color: Colors.white,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emailText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.accent,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    width: '100%',
  },
  input: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    paddingVertical: Spacing.md,
    marginLeft: Spacing.sm,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.textLight + '10',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    width: '100%',
  },
  hintText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    width: '100%',
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  requestNewButton: {
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  requestNewButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.jade + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  successDescription: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  loginButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
});
