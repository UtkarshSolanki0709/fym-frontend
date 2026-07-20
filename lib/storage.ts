/**
 * Thin storage wrapper.
 * Prefer AsyncStorage (Expo Go ships v2). Fall back to memory if native module null.
 * ponytail: no extra deps — in-memory is enough for one session when native dies.
 */
import { Platform } from 'react-native';

type Store = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const memory = new Map<string, string>();

const memoryStore: Store = {
  async getItem(key) {
    return memory.has(key) ? (memory.get(key) as string) : null;
  },
  async setItem(key, value) {
    memory.set(key, value);
  },
  async removeItem(key) {
    memory.delete(key);
  },
};

function webLocalStore(): Store | null {
  if (Platform.OS !== 'web') return null;
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    return {
      async getItem(key) {
        return ls.getItem(key);
      },
      async setItem(key, value) {
        ls.setItem(key, value);
      },
      async removeItem(key) {
        ls.removeItem(key);
      },
    };
  } catch {
    return null;
  }
}

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (store) return store;

  // 1) AsyncStorage (Expo-compatible 2.x)
  try {
    const mod = await import('@react-native-async-storage/async-storage');
    const AS = mod.default;
    // probe — throws if native module null (async-storage v3 message)
    await AS.getItem('__fym_probe__');
    store = {
      getItem: (k) => AS.getItem(k),
      setItem: (k, v) => AS.setItem(k, v),
      removeItem: (k) => AS.removeItem(k),
    };
    return store;
  } catch {
    // fall through
  }

  // 2) web localStorage
  const web = webLocalStore();
  if (web) {
    store = web;
    return store;
  }

  // 3) memory (session only)
  store = memoryStore;
  return store;
}

export async function storageGet(key: string): Promise<string | null> {
  try {
    return await (await getStore()).getItem(key);
  } catch {
    return memoryStore.getItem(key);
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  try {
    await (await getStore()).setItem(key, value);
  } catch {
    await memoryStore.setItem(key, value);
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await (await getStore()).removeItem(key);
  } catch {
    await memoryStore.removeItem(key);
  }
}
