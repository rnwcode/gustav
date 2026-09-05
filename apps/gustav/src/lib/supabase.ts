import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from './env';

// expo-router's static web output renders this module on Node during
// dev/build (no `window`), and AsyncStorage's web implementation touches
// `window.localStorage` unconditionally — fall back to an in-memory no-op
// there so that pass doesn't crash; the browser gets the real AsyncStorage.
const storage =
  typeof window === 'undefined'
    ? {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      }
    : AsyncStorage;

// Talks to Edge Functions and reads/writes state rows that RLS already
// scopes to the signed-in user — never holds business logic itself
// (CLAUDE.md, Architektur).
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
