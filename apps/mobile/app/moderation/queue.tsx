import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import { ModerationQueueScreen } from '../../src/features/moderation/ModerationQueueScreen';

const feedbackMessages: Record<string, string> = {
  approved: 'הדיווח אושר. אם הוא רלוונטי לסטטוס הציבורי, ה־projection עודכן מחדש.',
  rejected: 'הדיווח נדחה ונשאר מחוץ למשטחי הקריאה הציבוריים.',
};

export default function ModerationQueueRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ feedback?: string | string[] }>();
  const feedbackValue = Array.isArray(params.feedback)
    ? (params.feedback[0] ?? null)
    : params.feedback;

  return (
    <ModerationQueueScreen
      feedbackMessage={feedbackValue ? (feedbackMessages[feedbackValue] ?? null) : null}
      onBack={() => router.back()}
      onOpenReport={(reportId) =>
        router.push({
          params: {
            reportId,
          },
          pathname: '/moderation/reports/[reportId]',
        })
      }
    />
  );
}
