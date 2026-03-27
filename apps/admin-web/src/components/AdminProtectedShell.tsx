'use client';

import { canCreateSpring, canModerateReports } from '@maayanhot/domain';
import { useRouter } from 'next/navigation';
import { type PropsWithChildren, useEffect } from 'react';

import { useAdminSession } from '../infrastructure/session/AdminSessionProvider';
import { AdminCard, AdminStack } from './AdminPrimitives';
import { AdminShell } from './AdminShell';

type AdminProtectedShellProps = PropsWithChildren<{
  requiredRole: 'admin' | 'staff';
  restrictedMessage: string;
  restrictedTitle: string;
}>;

export function AdminProtectedShell({
  children,
  requiredRole,
  restrictedMessage,
  restrictedTitle,
}: AdminProtectedShellProps) {
  const router = useRouter();
  const { snapshot } = useAdminSession();
  const isAdmin =
    snapshot.primaryRole !== null &&
    canCreateSpring({
      primaryRole: snapshot.primaryRole,
      roleSet: snapshot.roleSet,
    });
  const isStaff =
    snapshot.primaryRole !== null &&
    canModerateReports({
      primaryRole: snapshot.primaryRole,
      roleSet: snapshot.roleSet,
    });

  useEffect(() => {
    if (snapshot.status === 'anonymous') {
      router.replace('/login');
    }
  }, [router, snapshot.status]);

  if (snapshot.status === 'loading' || snapshot.status === 'anonymous') {
    return (
      <AdminShell>
        <AdminCard testId="admin-route-loading">טוען סשן ניהול...</AdminCard>
      </AdminShell>
    );
  }

  if ((requiredRole === 'admin' && !isAdmin) || (requiredRole === 'staff' && !isStaff)) {
    return (
      <AdminShell>
        <AdminCard testId="admin-route-restricted">
          <AdminStack>
            <strong>{restrictedTitle}</strong>
            <span>{restrictedMessage}</span>
          </AdminStack>
        </AdminCard>
      </AdminShell>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
