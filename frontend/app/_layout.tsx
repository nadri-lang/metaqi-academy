import React, { useEffect, useCallback, useState } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { storage } from '@/src/utils/storage';
import OnboardingModal from '@/src/components/OnboardingModal';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { 
  CormorantGaramond_400Regular, 
  CormorantGaramond_700Bold 
} from '@expo-google-fonts/cormorant-garamond';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Colors } from '@/src/constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useIconFonts } from '@/src/hooks/use-icon-fonts';
// TEMP: AdMob disabled for Expo Go testing (needs a dev build) - see RewardedAccessButton.
// import mobileAds from 'react-native-google-mobile-ads';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

// One-time AdMob SDK init for the rewarded-ad flow (see RewardedAccessButton).
// mobileAds().initialize().catch(() => {});

const HAS_SEEN_ONBOARDING_KEY = 'has_seen_onboarding';

// First-launch onboarding (push notifications + optional phone + privacy
// policy acceptance) - shown once per device, only after login, since it
// needs a user to attach the optional fields to. See INCIDENTA 6.
function OnboardingGate() {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    storage.getItem(HAS_SEEN_ONBOARDING_KEY, false).then((seen) => {
      if (!cancelled && !seen) setShowOnboarding(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleDismiss = useCallback(async () => {
    await storage.setItem(HAS_SEEN_ONBOARDING_KEY, true);
    setShowOnboarding(false);
  }, []);

  if (!user) return null;
  return <OnboardingModal visible={showOnboarding} onDismiss={handleDismiss} />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Icon glyph fonts (@expo/vector-icons) come back as 0-byte files from
  // Metro's asset resolver under Expo Go, so they load from a CDN instead.
  const [iconFontsLoaded, iconFontError] = useIconFonts();

  const [appReady, setAppReady] = React.useState(false);

  // Handle font loading completion
  const onLayoutRootView = useCallback(async () => {
    if ((fontsLoaded && iconFontsLoaded) || fontError || iconFontError) {
      await SplashScreen.hideAsync().catch(() => {});
      setAppReady(true);
    }
  }, [fontsLoaded, iconFontsLoaded, fontError, iconFontError]);

  useEffect(() => {
    // If fonts loaded successfully or there's an error, proceed
    if ((fontsLoaded && iconFontsLoaded) || fontError || iconFontError) {
      onLayoutRootView();
    }
    
    // Fallback timeout - proceed after 3 seconds even if fonts fail
    const timeout = setTimeout(() => {
      if (!appReady) {
        console.warn('Font loading timeout - proceeding with fallback');
        SplashScreen.hideAsync().catch(() => {});
        setAppReady(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [fontsLoaded, iconFontsLoaded, fontError, iconFontError, onLayoutRootView, appReady]);

  // Show loading indicator while fonts are loading
  if (!appReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  // Log font error if any
  if (fontError) {
    console.warn('Font loading error:', fontError);
  }
  if (iconFontError) {
    console.warn('Icon font loading error:', iconFontError);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <AuthProvider>
          <Stack screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background },
          }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/register" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="concepts" />
            <Stack.Screen name="concept/[slug]" />
            <Stack.Screen name="agenda/[id]" />
            <Stack.Screen name="admin/index" />
            <Stack.Screen name="admin/daily-energy" />
            <Stack.Screen name="admin/newborn-vocation" />
            <Stack.Screen name="faq" />
            <Stack.Screen name="daily-energy-detail" />
          </Stack>
          <OnboardingGate />
        </AuthProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
