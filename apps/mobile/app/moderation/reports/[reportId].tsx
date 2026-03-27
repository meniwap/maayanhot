import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import { ModerationReviewScreen } from '../../../src/features/moderation/ModerationReviewScreen';

const normalizeReportId = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export default function ModerationReviewRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reportId?: string | string[] }>();
  const reportId = normalizeReportId(params.reportId);

  return (
    <ModerationReviewScreen
      onBack={() => router.back()}
      onDecisionComplete={(decision) =>
        router.replace({
          params: {
            feedback: decision,
          },
          pathname: '/moderation/queue',
        })
      }
      reportId={reportId}
    />
  );
}
