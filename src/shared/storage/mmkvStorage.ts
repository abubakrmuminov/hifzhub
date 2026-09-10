import type { StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MmkvLike = {
  set: (key: string, value: string | number | boolean) => void;
  getString: (key: string) => string | undefined;
  remove: (key: string) => void;
};

function createMmkvOrNull(): MmkvLike | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mmkvModule = require('react-native-mmkv') as {
      createMMKV?: (options: { id: string }) => MmkvLike;
      MMKV?: new (options: { id: string }) => MmkvLike;
    };
    if (typeof mmkvModule.createMMKV === 'function') {
      return mmkvModule.createMMKV({ id: 'hifzhub' });
    }
    if (typeof mmkvModule.MMKV === 'function') {
      return new mmkvModule.MMKV({ id: 'hifzhub' });
    }
  } catch {
    // Native module may be unavailable (Expo Go / web).
  }
  return null;
}

const mmkv = createMmkvOrNull();

/**
 * Sync MMKV adapter with one-time AsyncStorage migration so existing
 * onboarding / settings / bookmarks are not wiped on first launch.
 */
export const appStorage: StateStorage = {
  setItem: (name, value) => {
    if (mmkv) {
      mmkv.set(name, value);
      return;
    }
    return AsyncStorage.setItem(name, value);
  },
  getItem: (name) => {
    if (mmkv) {
      const cached = mmkv.getString(name);
      if (cached != null) return cached;
      return AsyncStorage.getItem(name).then((legacy) => {
        if (legacy != null) {
          mmkv.set(name, legacy);
        }
        return legacy;
      });
    }
    return AsyncStorage.getItem(name);
  },
  removeItem: (name) => {
    if (mmkv) {
      mmkv.remove(name);
      return;
    }
    return AsyncStorage.removeItem(name);
  },
};
