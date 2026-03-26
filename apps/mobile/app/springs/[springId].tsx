import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import { SpringDetailScreen } from '../../src/features/spring-detail/SpringDetailScreen';

const normalizeSpringId = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export default function SpringDetailRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    feedback?: string | string[];
    springId?: string | string[];
  }>();
  const feedback = Array.isArray(params.feedback)
    ? (params.feedback[0] ?? null)
    : (params.feedback ?? null);

  return (
    <SpringDetailScreen
      feedbackMessage={
        feedback === 'report-pending'
          ? 'הדיווח התקבל ונשמר בהמתנה לאישור. רק לאחר אישור הוא יוכל להשפיע על הסטטוס הציבורי.'
          : null
      }
      onBack={() => router.back()}
      onOpenReport={(springId) =>
        router.push({
          params: {
            springId,
          },
          pathname: '/springs/[springId]/report',
        })
      }
      springId={normalizeSpringId(params.springId)}
    />
  );
}
