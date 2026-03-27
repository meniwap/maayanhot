'use client';

import { useQuery } from '@tanstack/react-query';

import {
  AdminButton,
  AdminCard,
  AdminInline,
  AdminPage,
  AdminPill,
  AdminStack,
} from '../../components/AdminPrimitives';
import { moderationQueueRepository } from '../../infrastructure/supabase/repositories/moderation-queue-repository';
import { formatTimestamp, formatWaterPresenceLabel } from '../../lib/status';

export function AdminModerationQueueScreen({
  feedbackMessage = null,
}: {
  feedbackMessage?: string | null;
}) {
  const queueQuery = useQuery({
    queryFn: () => moderationQueueRepository.listPending(),
    queryKey: ['staff-moderation-queue'],
  });

  if (queueQuery.isLoading) {
    return (
      <AdminPage title="תור מודרציה">
        <AdminCard testId="admin-moderation-loading">טוען דיווחים ממתינים...</AdminCard>
      </AdminPage>
    );
  }

  if (queueQuery.isError) {
    return (
      <AdminPage title="תור מודרציה">
        <AdminCard testId="admin-moderation-error">טעינת תור המודרציה נכשלה.</AdminCard>
      </AdminPage>
    );
  }

  const items = queueQuery.data?.items ?? [];

  return (
    <AdminPage
      subtitle="ה־web admin משתמש באותם staff surfaces כמו המובייל, אבל במסך עבודה רחב ונפרד."
      title="תור מודרציה"
    >
      {feedbackMessage ? (
        <AdminCard testId="admin-moderation-feedback">{feedbackMessage}</AdminCard>
      ) : null}
      {items.length === 0 ? (
        <AdminCard testId="admin-moderation-empty">אין כרגע דיווחים ממתינים.</AdminCard>
      ) : (
        <AdminStack gap={16}>
          {items.map((item) => (
            <AdminCard key={item.reportId} testId={`admin-moderation-item-${item.reportId}`}>
              <AdminStack>
                <AdminInline justify="space-between">
                  <strong>{item.springTitle}</strong>
                  <AdminPill label={formatWaterPresenceLabel(item.waterPresence)} />
                </AdminInline>
                <div>
                  {item.regionCode ?? 'ללא אזור'} · נצפה {formatTimestamp(item.observedAt)}
                </div>
                <div>
                  הוגש {formatTimestamp(item.submittedAt)} · {item.photoCount} תמונות
                </div>
                <div>{item.note?.trim() || 'ללא הערה חופשית.'}</div>
                <AdminInline justify="space-between">
                  <span>מזהה דיווח: {item.reportId}</span>
                  <AdminButton
                    href={`/admin/moderation/${item.reportId}`}
                    label="בדיקה"
                    testId={`admin-moderation-open-${item.reportId}`}
                    tone="secondary"
                  />
                </AdminInline>
              </AdminStack>
            </AdminCard>
          ))}
        </AdminStack>
      )}
    </AdminPage>
  );
}
