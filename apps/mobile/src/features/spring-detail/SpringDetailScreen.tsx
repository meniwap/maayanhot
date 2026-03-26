import {
  linkingNavigationAdapter,
  navigationAppOptions,
  type ExternalNavigationAdapter,
} from '@maayanhot/navigation-core';
import { useQuery } from '@tanstack/react-query';
import { AppText, Button, Card, Screen, Stack } from '@maayanhot/ui';
import React from 'react';

import { useDevSession } from '../dev-session/DevSessionProvider';
import { publicSpringReadRepository } from '../../infrastructure/supabase/repositories/public-spring-read-repository';
import { toSpringDetailVM } from './spring-detail-vm';
import { SpringDetailView } from './SpringDetailView';

export type SpringDetailScreenProps = {
  feedbackMessage?: string | null;
  navigationAdapter?: ExternalNavigationAdapter;
  onBack: () => void;
  onOpenReport?: (springId: string) => void;
  springId: string | null;
};

export function SpringDetailScreen({
  feedbackMessage = null,
  navigationAdapter = linkingNavigationAdapter,
  onBack,
  onOpenReport,
  springId,
}: SpringDetailScreenProps) {
  const { snapshot } = useDevSession();
  const detailQuery = useQuery({
    enabled: Boolean(snapshot.isConfigured && springId),
    queryFn: () => publicSpringReadRepository.getDetailById(springId!),
    queryKey: ['public-spring-detail', springId],
  });

  if (!snapshot.isConfigured) {
    return (
      <Screen testID="spring-detail-config-missing">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">הקריאה הציבורית עדיין לא זמינה</AppText>
            <AppText tone="secondary" variant="bodySm">
              יש להגדיר תחילה את משתני Supabase הציבוריים כדי לטעון את מסך הפרטים מהפרויקט המקושר.
            </AppText>
            <Button label="חזרה למפה" onPress={onBack} variant="ghost" />
          </Stack>
        </Card>
      </Screen>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <Screen testID="spring-detail-loading">
        <Card variant="raised">
          <AppText variant="titleLg">טוען פרטי מעיין ציבוריים</AppText>
        </Card>
      </Screen>
    );
  }

  if (detailQuery.isError) {
    return (
      <Screen testID="spring-detail-error">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">טעינת פרטי המעיין נכשלה</AppText>
            <AppText tone="secondary" variant="bodySm">
              מסך הקריאה משתמש כעת במשטחי הקריאה הציבוריים מה־Supabase המקושר. צריך לבדוק את החיבור
              או את המיגרציות אם השגיאה חוזרת.
            </AppText>
            <Button label="חזרה למפה" onPress={onBack} testID="spring-detail-error-back" />
          </Stack>
        </Card>
      </Screen>
    );
  }

  const spring = detailQuery.data;

  if (!spring) {
    return (
      <Screen testID="spring-detail-not-found">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">המעיין לא נמצא בקטלוג הציבורי</AppText>
            <AppText tone="secondary" variant="bodySm">
              ייתכן שהקישור ישן או שהפריט עדיין לא זמין לתצוגת קריאה ציבורית.
            </AppText>
            <Button label="חזרה למפה" onPress={onBack} testID="spring-detail-not-found-back" />
          </Stack>
        </Card>
      </Screen>
    );
  }

  const detail = toSpringDetailVM(spring);

  const handleNavigate = async (app: (typeof navigationAppOptions)[number]['app']) => {
    await navigationAdapter.open({
      app,
      destination: {
        coordinate: detail.coordinates,
        label: detail.title,
        springId: detail.id,
      },
      sourceLabel: 'spring_detail',
      travelMode: 'driving',
    });
  };

  return (
    <SpringDetailView
      canSubmitReport={snapshot.status === 'authenticated'}
      feedbackMessage={feedbackMessage}
      navigationOptions={navigationAppOptions}
      onBack={onBack}
      onNavigate={handleNavigate}
      spring={detail}
      {...(onOpenReport ? { onOpenReport: () => onOpenReport(detail.id) } : {})}
    />
  );
}
