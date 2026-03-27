import { canModerateReports, type ModerationQueueItem } from '@maayanhot/domain';
import { useQuery } from '@tanstack/react-query';
import { AppText, Button, Card, Chip, Inline, Screen, Stack } from '@maayanhot/ui';
import React from 'react';

import { useDevSession } from '../dev-session/DevSessionProvider';
import { formatWaterPresenceLabel } from '../public-read/public-status';
import { moderationQueueRepository } from '../../infrastructure/supabase/repositories/moderation-queue-repository';

type ModerationQueueScreenProps = {
  feedbackMessage?: string | null;
  onBack: () => void;
  onOpenReport: (reportId: string) => void;
};

const formatReviewDate = (value: string) => value.slice(0, 16).replace('T', ' ');

const renderRoleLabel = (role: ModerationQueueItem['reporterRoleSnapshot']) => {
  if (role === 'admin') {
    return 'תפקיד מדווח: מנהל';
  }

  if (role === 'moderator') {
    return 'תפקיד מדווח: מודרטור';
  }

  if (role === 'trusted_contributor') {
    return 'תפקיד מדווח: תורם מהימן';
  }

  return 'תפקיד מדווח: משתמש';
};

export function ModerationQueueScreen({
  feedbackMessage = null,
  onBack,
  onOpenReport,
}: ModerationQueueScreenProps) {
  const { snapshot } = useDevSession();
  const isStaff =
    snapshot.primaryRole !== null &&
    canModerateReports({
      primaryRole: snapshot.primaryRole,
      roleSet: snapshot.roleSet,
    });
  const queueQuery = useQuery({
    enabled: snapshot.isConfigured && isStaff,
    queryFn: () => moderationQueueRepository.listPending(),
    queryKey: ['staff-moderation-queue'],
  });

  if (!snapshot.isConfigured) {
    return (
      <Screen testID="moderation-queue-config-missing">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">תור המודרציה עדיין לא זמין</AppText>
            <AppText tone="secondary" variant="bodySm">
              יש להגדיר תחילה את משתני Supabase הציבוריים כדי לעבוד מול הפרויקט המקושר.
            </AppText>
            <Button label="חזרה" onPress={onBack} variant="ghost" />
          </Stack>
        </Card>
      </Screen>
    );
  }

  if (!isStaff) {
    return (
      <Screen testID="moderation-queue-unauthorized">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">תור המודרציה זמין רק לצוות</AppText>
            <AppText tone="secondary" variant="bodySm">
              רק מודרטורים ומנהלים יכולים לראות את הדיווחים הממתינים לבדיקה.
            </AppText>
            <Button label="חזרה" onPress={onBack} variant="ghost" />
          </Stack>
        </Card>
      </Screen>
    );
  }

  if (queueQuery.isLoading) {
    return (
      <Screen testID="moderation-queue-loading">
        <Card variant="raised">
          <AppText variant="titleLg">טוען דיווחים ממתינים</AppText>
        </Card>
      </Screen>
    );
  }

  if (queueQuery.isError) {
    return (
      <Screen testID="moderation-queue-error">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">טעינת תור המודרציה נכשלה</AppText>
            <AppText tone="secondary" variant="bodySm">
              בדקו את החיבור ל־Supabase או את מיגרציית Phase 9 אם התקלה חוזרת.
            </AppText>
            <Button label="חזרה" onPress={onBack} />
          </Stack>
        </Card>
      </Screen>
    );
  }

  const items = queueQuery.data?.items ?? [];

  return (
    <Screen scrollable testID="moderation-queue-screen">
      <Inline justify="between">
        <Button label="חזרה" onPress={onBack} variant="ghost" />
      </Inline>

      <Card variant="raised">
        <Stack gap="2">
          <AppText variant="titleLg">תור מודרציה</AppText>
          <AppText tone="secondary" variant="bodySm">
            רק דיווחים ממתינים מופיעים כאן. אישור ישפיע על ה־projection הציבורי רק דרך מסלול הנגזרת
            המוגדר.
          </AppText>
          {feedbackMessage ? (
            <AppText testID="moderation-queue-feedback" tone="secondary" variant="bodySm">
              {feedbackMessage}
            </AppText>
          ) : null}
        </Stack>
      </Card>

      {items.length === 0 ? (
        <Card testID="moderation-queue-empty">
          <Stack gap="2">
            <AppText variant="titleMd">אין כרגע דיווחים ממתינים</AppText>
            <AppText tone="secondary" variant="bodySm">
              אחרי שיגיעו דיווחים חדשים מהשטח, הם יופיעו כאן לפי זמן ההגשה.
            </AppText>
          </Stack>
        </Card>
      ) : (
        <Stack gap="3">
          {items.map((item) => (
            <Card key={item.reportId} testID={`moderation-queue-item-${item.reportId}`}>
              <Stack gap="2">
                <Inline justify="between">
                  <AppText variant="titleMd">{item.springTitle}</AppText>
                  <Chip label={formatWaterPresenceLabel(item.waterPresence)} variant="status" />
                </Inline>
                <AppText tone="secondary" variant="bodySm">
                  {item.regionCode ?? 'ללא אזור'} · נצפה {formatReviewDate(item.observedAt)}
                </AppText>
                <AppText tone="secondary" variant="bodySm">
                  הוגש {formatReviewDate(item.submittedAt)} · {item.photoCount} תמונות ·{' '}
                  {renderRoleLabel(item.reporterRoleSnapshot)}
                </AppText>
                <AppText variant="bodyMd">{item.note?.trim() || 'ללא הערה חופשית.'}</AppText>
                <Inline justify="between">
                  <AppText tone="secondary" variant="bodySm">
                    מזהה דיווח: {item.reportId}
                  </AppText>
                  <Button
                    label="לבדיקה"
                    onPress={() => onOpenReport(item.reportId)}
                    testID={`open-moderation-review-${item.reportId}`}
                  />
                </Inline>
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </Screen>
  );
}
