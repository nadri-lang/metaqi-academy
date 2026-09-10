import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import api from '@/src/services/api';
import { useAuth } from '@/src/context/AuthContext';

/**
 * Requests notification permission, registers this device for an Expo push
 * token, and saves it via PATCH /auth/me. Android only - see INCIDENTA 6 (no
 * iOS/APNs work yet). Exposed as an explicit `register()` call (not run
 * automatically on mount) so it only ever fires from a real user action, e.g.
 * tapping "Activar notificaciones" in <OnboardingModal />.
 *
 * NOTE: remote push on Android was removed from Expo Go starting SDK 53 -
 * `getExpoPushTokenAsync` will fail there. A development or production build
 * (via EAS) is required to actually test delivery.
 */
export function usePushRegistration() {
  const { user, refreshUser } = useAuth();

  const register = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !user) return false;

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return false;

      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const tokenResponse = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );

      await api.patch('/auth/me', {
        push_token: tokenResponse.data,
        notifications_enabled: true,
      });
      await refreshUser();
      return true;
    } catch (error) {
      console.warn('[usePushRegistration] could not register for push notifications:', error);
      return false;
    }
  }, [user?.id, refreshUser]);

  return { register };
}
