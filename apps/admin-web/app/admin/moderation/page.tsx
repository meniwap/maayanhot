'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { AdminProtectedShell } from '../../../src/components/AdminProtectedShell';
import { AdminModerationQueueScreen } from '../../../src/features/moderation/AdminModerationQueueScreen';

function AdminModerationPageContent() {
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

export default function AdminModerationPage() {
  return (
    <Suspense fallback={<AdminModerationQueueScreen />}>
      <AdminModerationPageContent />
    </Suspense>
  );
}
