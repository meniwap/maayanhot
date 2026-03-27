import type { ModerationReasonCode } from '@maayanhot/contracts';
import { canModerateReports } from '@maayanhot/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ModerateReportFlow } from '@maayanhot/use-cases';
import {
  AppText,
  Button,
  Card,
  Inline,
  PhotoTile,
  Screen,
  Stack,
  TextAreaField,
} from '@maayanhot/ui';
import {
  createSupabasePrivateMediaPreviewAdapter,
  type PrivateMediaPreviewAdapter,
} from '@maayanhot/upload-core';
import React, { useMemo, useState } from 'react';

import { useDevSession } from '../dev-session/DevSessionProvider';
import { formatWaterPresenceLabel } from '../public-read/public-status';
import { getSupabaseClient } from '../../infrastructure/supabase/client';
import { moderationQueueRepository } from '../../infrastructure/supabase/repositories/moderation-queue-repository';
import { springReportRepository } from '../../infrastructure/supabase/repositories/spring-report-repository';
import { springStatusProjectionRepository } from '../../infrastructure/supabase/repositories/spring-status-projection-repository';

type ModerationReviewScreenProps = {
  onBack: () => void;
  onDecisionComplete: (decision: 'approve' | 'reject') => void;
  previewAdapter?: PrivateMediaPreviewAdapter;
  reportId: string | null;
};

const reasonOptions: Array<{ label: string; value: ModerationReasonCode }> = [
  { label: 'חוסר בראיות', value: 'insufficient_evidence' },
  { label: 'דיווח כפול', value: 'duplicate_submission' },
  { label: 'פוגעני או לא תקין', value: 'abusive_or_invalid' },
  { label: 'אחר', value: 'other' },
];

const formatReviewDate = (value: string) => value.slice(0, 16).replace('T', ' ');

export function ModerationReviewScreen({
  onBack,
  onDecisionComplete,
  previewAdapter,
  reportId,
}: ModerationReviewScreenProps) {
  const queryClient = useQueryClient();
  const { snapshot } = useDevSession();
  const isStaff =
    snapshot.primaryRole !== null &&
    canModerateReports({
      primaryRole: snapshot.primaryRole,
      roleSet: snapshot.roleSet,
    });
  const resolvedPreviewAdapter = useMemo(() => {
    if (previewAdapter) {
      return previewAdapter;
    }

    if (!snapshot.isConfigured || !isStaff) {
      return null;
    }

    return createSupabasePrivateMediaPreviewAdapter(getSupabaseClient());
  }, [isStaff, previewAdapter, snapshot.isConfigured]);
  const reviewQuery = useQuery({
    enabled: Boolean(snapshot.isConfigured && isStaff && reportId),
    queryFn: () => moderationQueueRepository.getReviewByReportId(reportId!),
    queryKey: ['staff-moderation-report-detail', reportId],
  });
  const previewQuery = useQuery({
    enabled: Boolean(reviewQuery.data && resolvedPreviewAdapter),
    queryFn: async () => {
      const result = await Promise.all(
        reviewQuery.data!.media.map(async (media) => {
          const preview = await resolvedPreviewAdapter!.createSignedPreviewUrl({
            storageBucket: media.storageBucket,
            storagePath: media.storagePath,
          });

          return [media.id, preview.signedUrl] as const;
        }),
      );

      return Object.fromEntries(result);
    },
    queryKey: ['staff-moderation-report-media', reportId],
  });
  const [reasonCode, setReasonCode] = useState<ModerationReasonCode | null>(null);
  const [reasonNote, setReasonNote] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const moderateFlow = useMemo(() => {
    return new ModerateReportFlow(
      moderationQueueRepository,
      springReportRepository,
      springStatusProjectionRepository,
      {
        invalidate: (queryKey) => queryClient.invalidateQueries({ queryKey }),
      },
    );
  }, [queryClient]);

  const decisionMutation = useMutation({
    mutationFn: (decision: 'approve' | 'reject') =>
      moderateFlow.submit({
        decision,
        reportId: reportId!,
        ...(decision === 'reject' ? { reasonCode } : {}),
        ...(reasonNote.trim().length > 0 ? { reasonNote: reasonNote.trim() } : {}),
      }),
    onSuccess: (result) => {
      onDecisionComplete(result.decision);
    },
  });

  const handleApprove = async () => {
    setSubmissionMessage(null);
    setValidationMessage(null);

    try {
      await decisionMutation.mutateAsync('approve');
    } catch (error) {
      setSubmissionMessage(error instanceof Error ? error.message : 'אישור הדיווח נכשל.');
    }
  };

  const handleReject = async () => {
    setSubmissionMessage(null);

    if (!reasonCode) {
      setValidationMessage('יש לבחור סיבת דחייה לפני דחיית הדיווח.');
      return;
    }

    setValidationMessage(null);

    try {
      await decisionMutation.mutateAsync('reject');
    } catch (error) {
      setSubmissionMessage(error instanceof Error ? error.message : 'דחיית הדיווח נכשלה.');
    }
  };

  if (!snapshot.isConfigured) {
    return (
      <Screen testID="moderation-review-config-missing">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">מסך המודרציה עדיין לא זמין</AppText>
            <AppText tone="secondary" variant="bodySm">
              יש להגדיר תחילה את משתני Supabase הציבוריים לפני פתיחת מסך הבדיקה.
            </AppText>
            <Button label="חזרה" onPress={onBack} variant="ghost" />
          </Stack>
        </Card>
      </Screen>
    );
  }

  if (!isStaff) {
    return (
      <Screen testID="moderation-review-unauthorized">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">בדיקת דיווחים זמינה רק לצוות</AppText>
            <AppText tone="secondary" variant="bodySm">
              רק מודרטורים ומנהלים יכולים לפתוח דיווחים ממתינים ולתת החלטה.
            </AppText>
            <Button label="חזרה" onPress={onBack} variant="ghost" />
          </Stack>
        </Card>
      </Screen>
    );
  }

  if (reviewQuery.isLoading) {
    return (
      <Screen testID="moderation-review-loading">
        <Card variant="raised">
          <AppText variant="titleLg">טוען דיווח לבדיקה</AppText>
        </Card>
      </Screen>
    );
  }

  if (reviewQuery.isError) {
    return (
      <Screen testID="moderation-review-error">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">טעינת הדיווח נכשלה</AppText>
            <AppText tone="secondary" variant="bodySm">
              בדקו את משטחי Phase 9 או את החיבור ל־Supabase אם התקלה חוזרת.
            </AppText>
            <Button label="חזרה לתור" onPress={onBack} />
          </Stack>
        </Card>
      </Screen>
    );
  }

  if (!reviewQuery.data) {
    return (
      <Screen testID="moderation-review-not-found">
        <Card variant="raised">
          <Stack gap="3">
            <AppText variant="titleLg">הדיווח כבר לא זמין לבדיקה</AppText>
            <AppText tone="secondary" variant="bodySm">
              ייתכן שהוא כבר אושר, נדחה, או יצא מתור המודרציה.
            </AppText>
            <Button label="חזרה לתור" onPress={onBack} />
          </Stack>
        </Card>
      </Screen>
    );
  }

  const { media, review } = reviewQuery.data;
  const previewUrls = previewQuery.data ?? {};

  return (
    <Screen scrollable testID="moderation-review-screen">
      <Inline justify="between">
        <Button label="חזרה לתור" onPress={onBack} variant="ghost" />
      </Inline>

      <Card variant="raised">
        <Stack gap="2">
          <AppText variant="titleLg">{review.springTitle}</AppText>
          <AppText tone="secondary" variant="bodySm">
            {review.regionCode ?? 'ללא אזור'} · דיווח {review.reportId}
          </AppText>
          <AppText tone="secondary" variant="bodySm">
            נצפה {formatReviewDate(review.observedAt)} · הוגש {formatReviewDate(review.submittedAt)}
          </AppText>
          <AppText variant="bodyMd">{formatWaterPresenceLabel(review.waterPresence)}</AppText>
          <AppText tone="secondary" variant="bodySm">
            {review.reporterRoleSnapshot
              ? `תפקיד מדווח בזמן ההגשה: ${review.reporterRoleSnapshot}`
              : 'תפקיד מדווח לא נשמר בדיווח הזה'}
          </AppText>
          {review.accessNotes ? (
            <AppText tone="secondary" variant="bodySm">
              גישה: {review.accessNotes}
            </AppText>
          ) : null}
        </Stack>
      </Card>

      <Card>
        <Stack gap="2">
          <AppText variant="titleMd">הערת דיווח</AppText>
          <AppText variant="bodyMd">{review.note?.trim() || 'ללא הערה חופשית.'}</AppText>
        </Stack>
      </Card>

      <Card testID="moderation-review-photos">
        <Stack gap="3">
          <AppText variant="titleMd">תמונות לבדיקה</AppText>
          {previewQuery.isError ? (
            <AppText tone="secondary" variant="bodySm">
              לא הצלחנו ליצור תצוגה מקדימה פרטית לכל התמונות.
            </AppText>
          ) : null}
          {media.length === 0 ? (
            <AppText tone="secondary" variant="bodySm">
              לדיווח הזה אין כרגע תמונות שהועלו בהצלחה.
            </AppText>
          ) : (
            <Stack gap="3">
              {media.map((item) => {
                const previewUrl = previewUrls[item.id];

                return previewUrl ? (
                  <PhotoTile
                    key={item.id}
                    caption={item.capturedAt ? `צולם ב־${item.capturedAt.slice(0, 16)}` : null}
                    testID={`moderation-review-photo-${item.id}`}
                    uri={previewUrl}
                  />
                ) : (
                  <Card key={item.id} testID={`moderation-review-photo-missing-${item.id}`}>
                    <AppText tone="secondary" variant="bodySm">
                      אין תצוגה מקדימה זמינה עבור {item.id}
                    </AppText>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Card>

      <Card>
        <Stack gap="3">
          <AppText variant="titleMd">דחייה עם סיבה</AppText>
          <Inline gap="2">
            {reasonOptions.map((option) => (
              <Button
                key={option.value}
                label={option.label}
                onPress={() => setReasonCode(option.value)}
                testID={`moderation-review-reason-${option.value}`}
                variant={reasonCode === option.value ? 'primary' : 'secondary'}
              />
            ))}
          </Inline>
          <TextAreaField
            helperText="אופציונלי. מיועד לצוות בלבד ואינו נחשף במסכים הציבוריים."
            label="הערת צוות"
            onChangeText={setReasonNote}
            testID="moderation-review-reason-note"
            value={reasonNote}
          />
          {validationMessage ? (
            <AppText
              testID="moderation-review-validation-message"
              tone="secondary"
              variant="bodySm"
            >
              {validationMessage}
            </AppText>
          ) : null}
          {submissionMessage ? (
            <AppText
              testID="moderation-review-submission-message"
              tone="secondary"
              variant="bodySm"
            >
              {submissionMessage}
            </AppText>
          ) : null}
          <Inline gap="2">
            <Button
              disabled={decisionMutation.isPending}
              label="אשר דיווח"
              onPress={() => void handleApprove()}
              testID="moderation-review-approve"
            />
            <Button
              disabled={decisionMutation.isPending}
              label="דחה דיווח"
              onPress={() => void handleReject()}
              testID="moderation-review-reject"
              variant="danger"
            />
          </Inline>
        </Stack>
      </Card>
    </Screen>
  );
}
