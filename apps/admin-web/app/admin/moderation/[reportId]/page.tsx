'use client';

import { useRouter } from 'next/navigation';
import { use } from 'react';

import { AdminProtectedShell } from '../../../../src/components/AdminProtectedShell';
import { AdminModerationReviewScreen } from '../../../../src/features/moderation/AdminModerationReviewScreen';

export default function AdminModerationReviewPage({
  params,
}: {
  params: Promise<{ reportId: string }> | { reportId: string };
}) {
  const router = useRouter();
  const resolvedParams = 'then' in params ? use(params) : params;

  return (
    <AdminProtectedShell
      requiredRole="staff"
      restrictedMessage="רק מודרטורים ומנהלים יכולים לבדוק דיווחים ממתינים."
      restrictedTitle="בדיקת דיווח זמינה רק לצוות"
    >
      <AdminModerationReviewScreen
        onBack={() => router.push('/admin/moderation')}
        onDecisionComplete={(decision: 'approve' | 'reject') =>
          router.replace(
            `/admin/moderation?feedback=${decision === 'approve' ? 'הדיווח אושר.' : 'הדיווח נדחה.'}`,
          )
        }
        reportId={resolvedParams.reportId}
      />
    </AdminProtectedShell>
  );
}
