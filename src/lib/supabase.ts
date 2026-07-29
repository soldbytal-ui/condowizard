import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not set. Database features will be unavailable.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'condowizard-auth',
      // PKCE for OAuth; combined with detectSessionInUrl the client
      // exchanges the auth code on landing at /auth/callback and stores
      // the resulting session in localStorage under `condowizard-auth`.
      // Access tokens auto-refresh via the long-lived refresh token so
      // signed-in users stay logged in across visits.
      flowType: 'pkce',
    },
  }
);
