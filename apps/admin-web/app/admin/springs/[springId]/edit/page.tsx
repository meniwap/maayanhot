'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, use } from 'react';

import { AdminProtectedShell } from '../../../../../src/components/AdminProtectedShell';
import { AdminSpringEditorScreen } from '../../../../../src/features/spring-management/AdminSpringEditorScreen';

function AdminEditSpringPageContent({
  params,
}: {
  params: Promise<{ springId: string }> | { springId: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const resolvedParams = 'then' in params ? use(params) : params;

  return (
    <AdminProtectedShell
      requiredRole="admin"
      restrictedMessage="רק מנהלים יכולים לערוך מעיינות."
      restrictedTitle="עריכת מעיין מוגבלת למנהלים"
    >
      <AdminSpringEditorScreen
        key={`${resolvedParams.springId}:${status ?? 'none'}`}
        mode="edit"
        onBack={() => router.push('/admin/springs')}
        onSaved={(springId) => router.replace(`/admin/springs/${springId}/edit?status=updated`)}
        springId={resolvedParams.springId}
      />
    </AdminProtectedShell>
  );
}

export default function AdminEditSpringPage({
  params,
}: {
  params: Promise<{ springId: string }> | { springId: string };
}) {
  return (
    <Suspense
      fallback={
        <AdminSpringEditorScreen
          mode="edit"
          onBack={() => undefined}
          onSaved={() => undefined}
          springId={null}
        />
      }
    >
      <AdminEditSpringPageContent params={params} />
    </Suspense>
  );
}
