// Build-time configuration, read from EXPO_PUBLIC_* env vars (see
// .env.example) — never hardcoded secrets. The anon key is meant to ship in
// the client; the service-role key never does and has no place here.
export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
} as const;
