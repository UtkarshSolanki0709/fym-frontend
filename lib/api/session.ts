import { storageGet, storageRemove, storageSet } from '@/lib/storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEYS = {
  access: 'fym.access_token',
  refresh: 'fym.refresh_token',
  userId: 'fym.user_id',
} as const;

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS !== 'web') {
    try {
      const val = await SecureStore.getItemAsync(key);
      if (val) return val;
    } catch {
      // SecureStore not available / failed, fall back
    }
  }
  return storageGet(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.setItemAsync(key, value);
      // Clean up plaintext storage if migrating
      await storageRemove(key).catch(() => undefined);
      return;
    } catch {
      // SecureStore not available, fall back
    }
  }
  await storageSet(key, value);
}

async function secureRemove(key: string): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // continue to remove from storage
    }
  }
  await storageRemove(key);
}

export async function getAccessToken(): Promise<string | null> {
  return secureGet(KEYS.access);
}

export async function getRefreshToken(): Promise<string | null> {
  return secureGet(KEYS.refresh);
}

export async function saveSession(session: {
  access_token: string;
  refresh_token: string;
  user?: { id?: string } | null;
}): Promise<void> {
  await secureSet(KEYS.access, session.access_token);
  await secureSet(KEYS.refresh, session.refresh_token);
  await secureSet(KEYS.userId, session.user?.id ?? '');
}

export async function clearSession(): Promise<void> {
  await secureRemove(KEYS.access);
  await secureRemove(KEYS.refresh);
  await secureRemove(KEYS.userId);
}

export async function hasSession(): Promise<boolean> {
  const t = await getAccessToken();
  return Boolean(t);
}

export async function getUserId(): Promise<string | null> {
  return secureGet(KEYS.userId);
}
