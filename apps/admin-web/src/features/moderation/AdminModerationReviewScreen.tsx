'use client';

import type { ModerationReasonCode } from '@maayanhot/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ModerateReportFlow } from '@maayanhot/use-cases';
import {
  createSupabasePrivateMediaPreviewAdapter,
  type PrivateMediaPreviewAdapter,
} from '@maayanhot/upload-core';
import { useMemo, useState } from 'react';

import {
  AdminButton,
  AdminCard,
  AdminInline,
  AdminPage,
  AdminPill,
  AdminStack,
  AdminTextArea,
} from '../../components/AdminPrimitives';
import { getSupabaseClient } from '../../infrastructure/supabase/client';
import { moderationQueueRepository } from '../../infrastructure/supabase/repositories/moderation-queue-repository';
import { springReportRepository } from '../../infrastructure/supabase/repositories/spring-report-repository';
import { springStatusProjectionRepository } from '../../infrastructure/supabase/repositories/spring-status-projection-repository';
import { formatTimestamp, formatWaterPresenceLabel } from '../../lib/status';

const reasonOptions: Array<{ label: string; value: ModerationReasonCode }> = [
  { label: 'חוסר בראיות', value: 'insufficient_evidence' },
  { label: 'דיווח כפול', value: 'duplicate_submission' },
  { label: 'פוגעני או לא תקין', value: 'abusive_or_invalid' },
  { label: 'אחר', value: 'other' },
];

export function AdminModerationReviewScreen({
  onDecisionComplete,
  onBack,
  previewAdapter,
  reportId,
}: {
  onBack: () => void;
  onDecisionComplete: (decision: 'approve' | 'reject') => void;
  previewAdapter?: PrivateMediaPreviewAdapter;
  reportId: string;
}) {
  const queryClient = useQueryClient();
  const resolvedPreviewAdapter = useMemo(
    () => previewAdapter ?? createSupabasePrivateMediaPreviewAdapter(getSupabaseClient()),
    [previewAdapter],
  );
  const reviewQuery = useQuery({
    queryFn: () => moderationQueueRepository.getReviewByReportId(reportId),
    queryKey: ['staff-moderation-report-detail', reportId],
  });
  const previewQuery = useQuery({
    enabled: Boolean(reviewQuery.data),
    queryFn: async () => {
      const result = await Promise.all(
        reviewQuery.data!.media.map(async (media) => {
          const preview = await resolvedPreviewAdapter.createSignedPreviewUrl({
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
  const moderateFlow = useMemo(
    () =>
      new ModerateReportFlow(
        moderationQueueRepository,
        springReportRepository,
        springStatusProjectionRepository,
        {
          invalidate: (queryKey) => queryClient.invalidateQueries({ queryKey }),
        },
      ),
    [queryClient],
  );
  const decisionMutation = useMutation({
    mutationFn: (decision: 'approve' | 'reject') =>
      moderateFlow.submit({
        decision,
        reportId,
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

  if (reviewQuery.isLoading) {
    return (
      <AdminPage title="בדיקת דיווח">
        <AdminCard testId="admin-review-loading">טוען דיווח לבדיקה...</AdminCard>
      </AdminPage>
    );
  }

  if (reviewQuery.isError) {
    return (
      <AdminPage title="בדיקת דיווח">
        <AdminCard testId="admin-review-error">טעינת הדיווח נכשלה.</AdminCard>
      </AdminPage>
    );
  }

  if (!reviewQuery.data) {
    return (
      <AdminPage title="בדיקת דיווח">
        <AdminCard testId="admin-review-not-found">הדיווח כבר לא זמין לבדיקה.</AdminCard>
      </AdminPage>
    );
  }

  const { media, review } = reviewQuery.data;
  const previewUrls = previewQuery.data ?? {};

  return (
    <AdminPage
      actions={<AdminButton label="חזרה לתור" onClick={onBack} tone="ghost" />}
      subtitle="אישור ודחייה ממשיכים לעבור דרך ModerateReportFlow המשותף ודרך מסלול ה־RPC המאושר."
      title={review.springTitle}
    >
      <AdminCard testId="admin-review-screen">
        <AdminStack>
          <AdminInline justify="space-between">
            <strong>{review.springTitle}</strong>
            <AdminPill label={formatWaterPresenceLabel(review.waterPresence)} />
          </AdminInline>
          <div>
            {review.regionCode ?? 'ללא אזור'} · דיווח {review.reportId}
          </div>
          <div>
            נצפה {formatTimestamp(review.observedAt)} · הוגש {formatTimestamp(review.submittedAt)}
          </div>
          <div>{review.note?.trim() || 'ללא הערה חופשית.'}</div>
          {review.accessNotes ? <div>גישה: {review.accessNotes}</div> : null}
        </AdminStack>
      </AdminCard>

      <AdminCard testId="admin-review-photos">
        <AdminStack>
          <strong>תצוגות מקדימות פרטיות</strong>
          {media.length === 0 ? (
            <div>אין תמונות שהועלו בהצלחה.</div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              {media.map((item) => {
                const previewUrl = previewUrls[item.id];

                return previewUrl ? (
                  <figure
                    key={item.id}
                    data-testid={`admin-review-photo-${item.id}`}
                    style={{ margin: 0 }}
                  >
                    <img
                      alt={`media-${item.id}`}
                      src={previewUrl}
                      style={{
                        borderRadius: 18,
                        display: 'block',
                        maxWidth: '100%',
                        width: '100%',
                      }}
                    />
                    <figcaption style={{ marginTop: 8 }}>
                      {item.capturedAt
                        ? `צולם ב־${formatTimestamp(item.capturedAt)}`
                        : 'ללא זמן צילום'}
                    </figcaption>
                  </figure>
                ) : (
                  <div key={item.id} data-testid={`admin-review-photo-missing-${item.id}`}>
                    אין preview זמין עבור {item.id}
                  </div>
                );
              })}
            </div>
          )}
        </AdminStack>
      </AdminCard>

      <AdminCard>
        <AdminStack>
          <strong>החלטת מודרציה</strong>
          <AdminInline>
            {reasonOptions.map((option) => (
              <AdminButton
                key={option.value}
                label={option.label}
                onClick={() => setReasonCode(option.value)}
                testId={`admin-review-reason-${option.value}`}
                tone={reasonCode === option.value ? 'primary' : 'secondary'}
              />
            ))}
          </AdminInline>
          <AdminTextArea
            helperText="הערה אופציונלית לצוות בלבד."
            label="הערת צוות"
            onChange={setReasonNote}
            testId="admin-review-reason-note"
            value={reasonNote}
          />
          {validationMessage ? (
            <div data-testid="admin-review-validation">{validationMessage}</div>
          ) : null}
          {submissionMessage ? (
            <div data-testid="admin-review-submission">{submissionMessage}</div>
          ) : null}
          <AdminInline>
            <AdminButton
              disabled={decisionMutation.isPending}
              label="אשר דיווח"
              onClick={() => void handleApprove()}
              testId="admin-review-approve"
            />
            <AdminButton
              disabled={decisionMutation.isPending}
              label="דחה דיווח"
              onClick={() => void handleReject()}
              testId="admin-review-reject"
              tone="danger"
            />
          </AdminInline>
        </AdminStack>
      </AdminCard>
    </AdminPage>
  );
}
