export type AdminWebEnv = {
  supabasePublicKey: string | null;
  supabaseUrl: string | null;
};

declare global {
  interface Window {
    __MAAYANHOT_ADMIN_ENV__?: AdminWebEnv;
  }
}

const normalizeEnvValue = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
};

const readServerEnv = (name: string) => normalizeEnvValue(process.env[name]);

const readClientEnv = (): AdminWebEnv | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const snapshot = window.__MAAYANHOT_ADMIN_ENV__;

  return snapshot
    ? {
        supabasePublicKey: normalizeEnvValue(snapshot.supabasePublicKey),
        supabaseUrl: normalizeEnvValue(snapshot.supabaseUrl),
      }
    : null;
};

export const getAdminWebEnv = (): AdminWebEnv => {
  const clientEnv = readClientEnv();

  if (clientEnv) {
    return clientEnv;
  }

  return {
    supabasePublicKey: readServerEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    supabaseUrl: readServerEnv('NEXT_PUBLIC_SUPABASE_URL'),
  };
};

export const hasSupabasePublicConfig = () => {
  const env = getAdminWebEnv();

  return Boolean(env.supabaseUrl && env.supabasePublicKey);
};
