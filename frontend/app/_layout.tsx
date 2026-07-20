import React, { useEffect } from 'react';
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
import { Asset } from 'expo-asset';
import { Image } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Prewarm icon assets for Android
function cacheImages(images: string[]) {
  return images.map((image) => {
    if (typeof image === 'string') {
      return Image.prefetch(image);
    } else {
      return Asset.fromModule(image).downloadAsync();
    }
  });
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const [appReady, setAppReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Prewarm icon assets
        await Promise.all([
          ...cacheImages([]),
        ]);
      } catch (e) {
        console.warn('Error prewarming assets:', e);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    // Timeout de 5 segundos para cargar fuentes
    const fontTimeout = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn('Font loading timeout - proceeding with system fonts');
        setAppReady(true);
        SplashScreen.hideAsync();
      }
    }, 5000);

    // Si las fuentes se cargan antes del timeout, limpiar el timeout
    if (fontsLoaded) {
      clearTimeout(fontTimeout);
      setAppReady(true);
      SplashScreen.hideAsync();
    }

    // Cleanup
    return () => clearTimeout(fontTimeout);
  }, [fontsLoaded]);

  if (!appReady) {
    return null;
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
