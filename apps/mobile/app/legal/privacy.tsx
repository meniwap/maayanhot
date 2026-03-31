import React from 'react';
import { useRouter } from 'expo-router';

import { LegalPlaceholderScreen } from '../../src/features/about/LegalPlaceholderScreen';

export default function PrivacyPlaceholderRoute() {
  const router = useRouter();

  return (
    <LegalPlaceholderScreen
      body="המסמך הסופי צריך לפרט אילו נתוני חשבון, דיווחים, תמונות וטלמטריה מוגבלת נאספים, למה הם נדרשים, מי מקבל גישה, ואיך מבקשים מחיקה או יצוא נתונים."
      onBack={() => router.back()}
      testID="privacy-placeholder-screen"
      title="מדיניות פרטיות placeholder"
    />
  );
}
