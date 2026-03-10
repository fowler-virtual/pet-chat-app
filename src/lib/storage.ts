import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PersistedAppState } from '../types';

const STORAGE_KEY = 'pet-chat-app-state';

export async function loadPersistedAppState(): Promise<PersistedAppState | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PersistedAppState;
  } catch {
    return null;
  }
}

export async function savePersistedAppState(state: PersistedAppState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
