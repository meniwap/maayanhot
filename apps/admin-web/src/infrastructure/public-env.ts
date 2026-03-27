import type { AdminWebEnv } from './env';

const normalizeEnvValue = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
};

export const getServerAdminWebEnvSnapshot = (): AdminWebEnv => ({
  supabasePublicKey: normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  supabaseUrl: normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
});
