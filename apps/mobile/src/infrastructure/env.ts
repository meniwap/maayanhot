const readPublicEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
};

export type MobileAppEnv = {
  devAdminEmail: string | null;
  devAdminPassword: string | null;
  devSessionEnabled: boolean;
  devUserEmail: string | null;
  devUserPassword: string | null;
  supabasePublicKey: string | null;
  supabaseUrl: string | null;
};

export const mobileAppEnv: MobileAppEnv = {
  devAdminEmail: readPublicEnv('EXPO_PUBLIC_DEV_ADMIN_EMAIL'),
  devAdminPassword: readPublicEnv('EXPO_PUBLIC_DEV_ADMIN_PASSWORD'),
  devSessionEnabled: readPublicEnv('EXPO_PUBLIC_DEV_SESSION_ENABLED') === 'true',
  devUserEmail: readPublicEnv('EXPO_PUBLIC_DEV_USER_EMAIL'),
  devUserPassword: readPublicEnv('EXPO_PUBLIC_DEV_USER_PASSWORD'),
  supabasePublicKey:
    readPublicEnv('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
    readPublicEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseUrl: readPublicEnv('EXPO_PUBLIC_SUPABASE_URL'),
};

export const hasSupabasePublicConfig = () =>
  Boolean(mobileAppEnv.supabaseUrl && mobileAppEnv.supabasePublicKey);
