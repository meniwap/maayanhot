'use client';

import { AdminProtectedShell } from '../../../src/components/AdminProtectedShell';
import { AdminSpringManagementScreen } from '../../../src/features/spring-management/AdminSpringManagementScreen';

export default function AdminSpringsPage() {
  return (
    <AdminProtectedShell
      requiredRole="admin"
      restrictedMessage="רק מנהלים יכולים לנהל את רשימת המעיינות."
      restrictedTitle="ניהול מעיינות זמין רק למנהלים"
    >
      <AdminSpringManagementScreen />
    </AdminProtectedShell>
  );
}
