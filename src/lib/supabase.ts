import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const secureSessionStorage: SupportedStorage = {
  async getItem(key) {
    const countValue = await SecureStore.getItemAsync(`${key}.chunks`);
    if (!countValue) return SecureStore.getItemAsync(key);
    const count = Number(countValue);
    if (!Number.isInteger(count) || count < 1 || count > 128) {
      await this.removeItem(key);
      return null;
    }
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(`${key}.${index}`)),
    );
    if (chunks.some(chunk => chunk === null)) {
      await this.removeItem(key);
      return null;
    }
    return chunks.join('');
  },
  async setItem(key, value) {
    const chunkSize = 1500;
    const count = Math.max(1, Math.ceil(value.length / chunkSize));
    if (count > 128) throw new Error('Authentication session is too large to store securely.');
    const previousCount = Number(await SecureStore.getItemAsync(`${key}.chunks`) ?? '0');
    await Promise.all(
      Array.from({ length: count }, (_, index) =>
        SecureStore.setItemAsync(`${key}.${index}`, value.slice(index * chunkSize, (index + 1) * chunkSize)),
      ),
    );
    await SecureStore.setItemAsync(`${key}.chunks`, String(count));
    await SecureStore.deleteItemAsync(key);
    if (Number.isInteger(previousCount) && previousCount > count && previousCount <= 128) {
      await Promise.all(Array.from({ length: previousCount - count }, (_, index) =>
        SecureStore.deleteItemAsync(`${key}.${count + index}`),
      ));
    }
  },
  async removeItem(key) {
    const count = Number(await SecureStore.getItemAsync(`${key}.chunks`) ?? '0');
    await SecureStore.deleteItemAsync(key);
    await SecureStore.deleteItemAsync(`${key}.chunks`);
    if (Number.isInteger(count) && count > 0 && count <= 128) {
      await Promise.all(Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(`${key}.${index}`)));
    }
  },
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? window.localStorage : secureSessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
        flowType: 'pkce',
      },
    })
  : null;
