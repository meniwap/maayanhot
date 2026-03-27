import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import { ReportComposeScreen } from '../../../src/features/report-compose/ReportComposeScreen';

const normalizeSpringId = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

export default function ReportComposeRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ springId?: string | string[] }>();
  const springId = normalizeSpringId(params.springId);

  return (
    <ReportComposeScreen
      onBack={() => router.back()}
      onReportSubmitted={({ feedback, springId: submittedSpringId }) =>
        router.replace({
          params: {
            feedback,
            springId: submittedSpringId,
          },
          pathname: '/springs/[springId]',
        })
      }
      springId={springId}
    />
  );
}
