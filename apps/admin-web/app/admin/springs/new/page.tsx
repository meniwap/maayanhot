'use client';

import { useRouter } from 'next/navigation';

import { AdminProtectedShell } from '../../../../src/components/AdminProtectedShell';
import { AdminSpringEditorScreen } from '../../../../src/features/spring-management/AdminSpringEditorScreen';

export default function AdminNewSpringPage() {
  const router = useRouter();

  return (
    <AdminProtectedShell
      requiredRole="admin"
      restrictedMessage="רק מנהלים יכולים ליצור מעיינות."
      restrictedTitle="יצירת מעיין מוגבלת למנהלים"
    >
      <AdminSpringEditorScreen
        mode="create"
        onBack={() => router.push('/admin/springs')}
        onSaved={(springId) => router.replace(`/admin/springs/${springId}/edit?status=created`)}
      />
    </AdminProtectedShell>
  );
}
