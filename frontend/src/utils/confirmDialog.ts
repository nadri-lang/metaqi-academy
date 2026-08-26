import { Alert, Platform } from 'react-native';

/**
 * Promise-based confirm that also works in the browser.
 *
 * Alert.alert's multi-button form has no web implementation — RN Web only
 * renders a single-button alert, so the destructive button's onPress never
 * fires and the caller waits forever. This admin panel is used from the web
 * preview, so every confirmation has to go through window.confirm there.
 */
export function confirmAsync(
  title: string,
  message: string,
  confirmLabel = 'Aceptar',
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }

  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
