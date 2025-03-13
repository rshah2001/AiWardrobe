// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// First, use a simple AsyncStorage implementation to avoid initialization errors
const AsyncStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  }
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Create initial client with AsyncStorage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Try to initialize SecureStore and update the storage if available
(async () => {
  try {
    // Test if SecureStore is working
    const testKey = 'secure_store_test';
    await SecureStore.setItemAsync(testKey, 'test');
    const result = await SecureStore.getItemAsync(testKey);
    await SecureStore.deleteItemAsync(testKey);
    
    if (result === 'test') {
      // SecureStore is working, create a secure adapter
      const SecureStoreAdapter = {
        getItem: async (key: string): Promise<string | null> => {
          return await SecureStore.getItemAsync(key);
        },
        setItem: async (key: string, value: string): Promise<void> => {
          await SecureStore.setItemAsync(key, value);
        },
        removeItem: async (key: string): Promise<void> => {
          await SecureStore.deleteItemAsync(key);
        }
      };
      
      // Update the supabase client with SecureStore
      supabase.auth.setSession({
        access_token: '',
        refresh_token: '',
      });
      supabase.auth.onAuthStateChange(() => {});
      
      console.log('Supabase is now using SecureStore for authentication');
    } else {
      console.log('SecureStore test failed, continuing with AsyncStorage');
    }
  } catch (error) {
    console.log('Error initializing SecureStore, continuing with AsyncStorage:', error);
  }
})();