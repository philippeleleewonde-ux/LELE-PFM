import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { SUPABASE_CONFIG } from './config';

let storageAdapter: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

if (Platform.OS !== 'web') {
  // Native: use SecureStore
  const SecureStore = require('expo-secure-store');
  storageAdapter = {
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  };
} else {
  // Web: use localStorage
  storageAdapter = {
    getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string) => {
      localStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
}

export const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
