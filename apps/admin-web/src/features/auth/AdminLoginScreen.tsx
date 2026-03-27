'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAdminSession } from '../../infrastructure/session/AdminSessionProvider';
import {
  AdminCard,
  AdminButton,
  AdminField,
  AdminPage,
  AdminStack,
} from '../../components/AdminPrimitives';
import { hasSupabasePublicConfig } from '../../infrastructure/env';

export function AdminLoginScreen() {
  const router = useRouter();
  const { signIn, snapshot } = useAdminSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const hasPublicConfig = !isHydrated || hasSupabasePublicConfig();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signIn(email.trim(), password);
      router.replace('/admin');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'ההתחברות נכשלה.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ margin: '0 auto', maxWidth: 560, padding: 32 }}>
      <AdminPage
        subtitle="כניסה זו משתמשת בסשן Supabase אמיתי, ולא בנתיב dev-session של המובייל."
        title="כניסה לניהול"
      >
        <AdminCard testId="admin-login-screen">
          <AdminStack>
            {!hasPublicConfig ? (
              <div data-testid="admin-login-config-missing">
                חסרים NEXT_PUBLIC_SUPABASE_URL או NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
              </div>
            ) : null}
            <div data-testid="admin-login-session-state">
              מצב נוכחי: {snapshot.status} {snapshot.email ? `· ${snapshot.email}` : ''}
            </div>
            <AdminField
              label="אימייל"
              onChange={setEmail}
              testId="admin-login-email"
              value={email}
            />
            <AdminField
              label="סיסמה"
              onChange={setPassword}
              testId="admin-login-password"
              type="password"
              value={password}
            />
            {errorMessage ? <div data-testid="admin-login-error">{errorMessage}</div> : null}
            <AdminButton
              disabled={!hasPublicConfig || isSubmitting}
              label="כניסה"
              onClick={() => void handleSubmit()}
              testId="admin-login-submit"
            />
          </AdminStack>
        </AdminCard>
      </AdminPage>
    </main>
  );
}
