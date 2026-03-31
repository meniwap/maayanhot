import React from 'react';
import { useRouter } from 'expo-router';

import { LegalPlaceholderScreen } from '../../src/features/about/LegalPlaceholderScreen';

export default function TermsPlaceholderRoute() {
  const router = useRouter();

  return (
    <LegalPlaceholderScreen
      body="המסמך הסופי צריך לפרט שימוש מותר באפליקציה, אחריות מוגבלת על דיווחי קהילה, תלות באפליקציות ניווט חיצוניות, כללי העלאת מדיה, ומסלול דיווח על תוכן פוגעני."
      onBack={() => router.back()}
      testID="terms-placeholder-screen"
      title="תנאי שימוש placeholder"
    />
  );
}
