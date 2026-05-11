// Haptic feedback helpers — safe on web (no-op) and native
import { Platform } from 'react-native';

// Lazy require so the module isn't loaded on web
const getHaptics = () => {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-haptics') as typeof import('expo-haptics');
  } catch {
    return null;
  }
};

export function useHaptics() {
  const light = () => {
    getHaptics()?.impactAsync('light' as any).catch(() => {});
  };
  const medium = () => {
    getHaptics()?.impactAsync('medium' as any).catch(() => {});
  };
  const heavy = () => {
    getHaptics()?.impactAsync('heavy' as any).catch(() => {});
  };
  const success = () => {
    getHaptics()?.notificationAsync('success' as any).catch(() => {});
  };
  const error = () => {
    getHaptics()?.notificationAsync('error' as any).catch(() => {});
  };

  return { light, medium, heavy, success, error };
}
