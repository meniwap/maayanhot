'use client';

import { useSearchParams } from 'next/navigation';

import { AdminProtectedShell } from '../../../src/components/AdminProtectedShell';
import { AdminModerationQueueScreen } from '../../../src/features/moderation/AdminModerationQueueScreen';

export default function AdminModerationPage() {
  const searchParams = useSearchParams();
  const feedback = searchParams.get('feedback');

  return (
    <AdminProtectedShell
      requiredRole="staff"
      restrictedMessage="רק מודרטורים ומנהלים יכולים לסקור דיווחים ממתינים."
      restrictedTitle="תור המודרציה זמין רק לצוות"
    >
      <AdminModerationQueueScreen feedbackMessage={feedback} />
    </AdminProtectedShell>
  );
}
