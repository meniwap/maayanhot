'use client';

import { AdminProtectedShell } from '../../src/components/AdminProtectedShell';
import { AdminDashboardScreen } from '../../src/features/dashboard/AdminDashboardScreen';

export default function AdminDashboardPage() {
  return (
    <AdminProtectedShell
      requiredRole="staff"
      restrictedMessage="רק צוות מורשה יכול להיכנס ללוח הניהול."
      restrictedTitle="גישה מוגבלת"
    >
      <AdminDashboardScreen />
    </AdminProtectedShell>
  );
}
