import React, { useState, useEffect } from 'react';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

// Call this at module scope for mobile auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.params.id_token) {
      handleGoogleToken(response.params.id_token);
    } else if (response?.type === 'error') {
      Alert.alert(t('common.error'), t('auth.error_google_signin'));
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      setGoogleLoading(true);
      await loginWithGoogle(idToken);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(
        t('common.error'),
        error.message || t('auth.error_google_signin')
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.fill_all_fields'));
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const result = await promptAsync();
      if (result.type !== 'success') {
        setGoogleLoading(false);
      }
      // On success, the useEffect watching `response` calls handleGoogleToken.
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert(
        t('common.error'),
        t('auth.error_google_signin')
      );
      setGoogleLoading(false);
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
              testID="login-back-btn"
              style={styles.backButton}
              onPress={goBack}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.white} />
              <Text style={styles.backButtonText}>{t('common.back')}</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>MetaQi</Text>
              <Text style={styles.subtitle}>Academy</Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>
              {t('auth.welcome_metaqi')}
            </Text>
            <Text style={styles.description}>
              {t('auth.access_description')}
            </Text>

            {/* Google Sign-In Button - Primary */}
            <TouchableOpacity
              testID="google-login-btn"
              style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
              onPress={handleGoogleLogin}
              disabled={!request || googleLoading || loading}
            >
              {googleLoading ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={24} color={Colors.textPrimary} />
                  <Text style={styles.googleButtonText}>
                    {t('auth.continue_with_google')}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Admin Access Link */}
            {!showAdminLogin ? (
              <TouchableOpacity
                style={styles.adminAccessLink}
                onPress={() => setShowAdminLogin(true)}
              >
                <Text style={styles.adminAccessText}>
                  {t('auth.admin_access')}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>
                    {t('auth.admin_access_btn')}
                  </Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Admin Login Form */}
                <View style={styles.adminFormContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('common.email')}</Text>
                    <TextInput
                      testID="login-email-input"
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="admin@metaqi.com"
                      placeholderTextColor={Colors.textLight}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>{t('common.password')}</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        testID="login-password-input"
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        placeholderTextColor={Colors.textLight}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        testID="password-toggle-btn"
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                      >
                        <MaterialCommunityIcons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={Colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    testID="login-submit-btn"
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={styles.buttonText}>{t('common.enter')}</Text>
                    )}
                  </TouchableOpacity>

                  {/* Forgot Password Link */}
                  <TouchableOpacity 
                    style={styles.forgotPasswordContainer}
                    onPress={() => router.push('/forgot-password')}
                  >
                    <Text style={styles.forgotPasswordText}>
                      {t('auth.forgot_password') || '¿Olvidaste tu contraseña?'}
                    </Text>
                  </TouchableOpacity>

                  {/* Hide Admin Form */}
                  <TouchableOpacity
                    style={styles.hideAdminButton}
                    onPress={() => setShowAdminLogin(false)}
                  >
                    <Text style={styles.hideAdminText}>
                      {t('auth.back_to_google')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
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
    paddingBottom: Spacing['2xl'],
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
    marginTop: Spacing.lg,
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
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
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
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    paddingRight: 48,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
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
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  forgotPasswordText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.accent,
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.cardBorder,
  },
  dividerText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textLight,
    marginHorizontal: Spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    borderWidth: 2,
    borderColor: Colors.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  googleButtonText: {
    fontFamily: Typography.sansBold,
    fontSize: Typography.lg,
    color: Colors.primary,
  },
  adminAccessLink: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  adminAccessText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textLight,
    textDecorationLine: 'underline',
  },
  adminFormContainer: {
    marginTop: Spacing.md,
  },
  hideAdminButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  hideAdminText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.accent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
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