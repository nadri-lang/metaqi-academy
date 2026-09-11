import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

// react-native-webview has no web implementation (it renders a "not supported
// on this platform" stub there) - only require/use it on native, where the
// actual in-app browsing happens. This keeps `expo start --web` from crashing
// and from showing a WebView that can never finish loading.
const WebView = Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

// Generic in-app browser screen - opens an external URL (privacy policy, social
// media links, etc.) inside the app instead of switching to another app.
export default function WebViewScreen() {
  const router = useRouter();
  const { url, title } = useLocalSearchParams<{ url?: string; title?: string }>();
  const [loading, setLoading] = useState(Platform.OS !== 'web');

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              testID="webview-back-button"
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>{title || ''}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {Platform.OS === 'web' ? (
        <View style={styles.webFallback}>
          <MaterialCommunityIcons name="open-in-new" size={40} color={Colors.textLight} />
          <Text style={styles.webFallbackText}>
            La vista integrada solo está disponible en la app móvil. En la versión web, ábrelo en una pestaña nueva.
          </Text>
          {url ? (
            <TouchableOpacity
              testID="webview-open-external"
              style={styles.webFallbackButton}
              onPress={() => Linking.openURL(url)}
            >
              <Text style={styles.webFallbackButtonText}>Abrir enlace</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : url && WebView ? (
        <WebView
          source={{ uri: url }}
          onLoadEnd={() => setLoading(false)}
          startInLoadingState
        />
      ) : null}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
    marginHorizontal: Spacing.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    top: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  webFallbackText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  webFallbackButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 10,
  },
  webFallbackButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
});
