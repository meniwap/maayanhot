import { AppText, Button, Card, Stack } from '@maayanhot/ui';
import React from 'react';

type ReleaseOnboardingCardProps = {
  onDismiss: () => void;
  onOpenAbout: () => void;
};

export function ReleaseOnboardingCard({ onDismiss, onOpenAbout }: ReleaseOnboardingCardProps) {
  return (
    <Card testID="release-onboarding-card" variant="raised">
      <Stack gap="3">
        <Stack gap="1">
          <AppText variant="titleMd">ברוכים הבאים לבטא הפנימית</AppText>
          <AppText tone="secondary" variant="bodySm">
            כאן אפשר לגלות מעיינות ציבוריים, לשלוח דיווחי שטח ותמונות, ולעקוב אחרי סטטוס מים שנגזר
            רק מדיווחים מאושרים.
          </AppText>
        </Stack>
        <AppText tone="secondary" variant="bodySm">
          חשוב לדעת: דיווחים חדשים אינם מתפרסמים מיד, עבודה אופליין מוגבלת רק לנתונים שכבר נטענו,
          וניווט מלא מתבצע דרך אפליקציות חיצוניות.
        </AppText>
        <Stack gap="2">
          <Button label="המשך לקטלוג" onPress={onDismiss} testID="onboarding-dismiss" />
          <Button
            label="מידע על הבטא"
            onPress={onOpenAbout}
            testID="onboarding-open-about"
            variant="secondary"
          />
        </Stack>
      </Stack>
    </Card>
  );
}
