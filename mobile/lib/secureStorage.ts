/**
 * Platform-aware secure storage.
 * Uses expo-secure-store on native; localStorage on web (SecureStore doesn't support web).
 */
import { Platform } from 'react-native';

async function getItemAsync(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

async function setItemAsync(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

async function deleteItemAsync(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  getItemAsync,
  setItemAsync,
  deleteItemAsync,
};
