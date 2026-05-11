// Persistent storage helper for saving the best score locally
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'phase_bird_best';

export async function loadBestScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export async function saveBestScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String(score));
  } catch {
    // silently ignore — offline game, not critical
  }
}
