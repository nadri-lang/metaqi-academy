import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/src/context/AuthContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
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
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Explicitly load MaterialCommunityIcons font
    ...MaterialCommunityIcons.font,
  });

  const [appReady, setAppReady] = React.useState(false);

  // Handle font loading completion
  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
      setAppReady(true);
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // If fonts loaded successfully or there's an error, proceed
    if (fontsLoaded || fontError) {
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
  }, [fontsLoaded, fontError, onLayoutRootView, appReady]);

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
