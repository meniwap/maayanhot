import { AppText, Button, Card, Screen, Stack } from '@maayanhot/ui';
import React, { useState } from 'react';

import { useDevSession } from './DevSessionProvider';

export function DevSessionScreen() {
  const { signInAsDemoAdmin, signInAsDemoUser, signOut, snapshot } = useDevSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const withErrorBoundary = async (action: () => Promise<void>) => {
    try {
      setErrorMessage(null);
      await action();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Development session action failed.',
      );
    }
  };

  return (
    <Screen testID="dev-session-screen">
      <Card variant="raised">
        <Stack gap="3">
          <AppText variant="titleLg">סשן פיתוח</AppText>
          <AppText tone="secondary" variant="bodySm">
            סוויץ׳ זמני בלבד עבור Phase 8. הכניסה כאן משתמשת בחשבונות Supabase אמיתיים ולא ברולים
            מזויפים מקומיים.
          </AppText>
          <AppText variant="bodySm">
            מצב נוכחי: {snapshot.status} {snapshot.email ? `· ${snapshot.email}` : ''}
          </AppText>
          <AppText variant="bodySm">
            תפקיד פעיל: {snapshot.primaryRole ?? 'ללא'} · מופעל:{' '}
            {snapshot.isDevSessionEnabled ? 'כן' : 'לא'}
          </AppText>
          {!snapshot.isConfigured ? (
            <AppText tone="secondary" variant="bodySm">
              חסרים משתני Supabase ציבוריים. יש לעדכן את סביבת Expo המקומית לפני ניסיון כניסה.
            </AppText>
          ) : null}
          {errorMessage ? (
            <AppText testID="dev-session-error" tone="secondary" variant="bodySm">
              {errorMessage}
            </AppText>
          ) : null}
          <Stack gap="2">
            <Button
              disabled={!snapshot.isConfigured || !snapshot.isDevSessionEnabled}
              label="התחבר כמשתמש דמו"
              onPress={() => void withErrorBoundary(signInAsDemoUser)}
              stretch
              testID="dev-session-sign-in-user"
            />
            <Button
              disabled={!snapshot.isConfigured || !snapshot.isDevSessionEnabled}
              label="התחבר כמנהל דמו"
              onPress={() => void withErrorBoundary(signInAsDemoAdmin)}
              stretch
              testID="dev-session-sign-in-admin"
              variant="secondary"
            />
            <Button
              disabled={!snapshot.isConfigured}
              label="התנתק"
              onPress={() => void withErrorBoundary(signOut)}
              stretch
              testID="dev-session-sign-out"
              variant="ghost"
            />
          </Stack>
        </Stack>
      </Card>
    </Screen>
  );
}
