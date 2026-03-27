'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getAdminWebEnv, hasSupabasePublicConfig } from '../env';

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (!hasSupabasePublicConfig()) {
    throw new Error('Supabase public URL/key environment variables are not configured.');
  }

  if (!supabaseClient) {
    const env = getAdminWebEnv();

    supabaseClient = createClient(env.supabaseUrl!, env.supabasePublicKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
      },
    });
  }

  return supabaseClient;
};

export const isSupabaseClientConfigured = () => hasSupabasePublicConfig();
