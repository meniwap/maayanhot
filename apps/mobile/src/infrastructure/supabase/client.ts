import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { hasSupabasePublicConfig, mobileAppEnv } from '../env';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (!hasSupabasePublicConfig()) {
    throw new Error('Supabase public environment variables are not configured.');
  }

  if (!supabaseClient) {
    supabaseClient = createClient(mobileAppEnv.supabaseUrl!, mobileAppEnv.supabaseAnonKey!, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
};

export const isSupabaseClientConfigured = () => hasSupabasePublicConfig();
