'use client';

import { canCreateSpring, canModerateReports } from '@maayanhot/domain';
import Link from 'next/link';

import { AdminCard, AdminPage, AdminPill, AdminStack } from '../../components/AdminPrimitives';
import { useAdminSession } from '../../infrastructure/session/AdminSessionProvider';

export function AdminDashboardScreen() {
  const { snapshot } = useAdminSession();
  const canManageSprings =
    snapshot.primaryRole !== null &&
    canCreateSpring({
      primaryRole: snapshot.primaryRole,
      roleSet: snapshot.roleSet,
    });
  const canReviewModeration =
    snapshot.primaryRole !== null &&
    canModerateReports({
      primaryRole: snapshot.primaryRole,
      roleSet: snapshot.roleSet,
    });

  return (
    <AdminPage
      subtitle="Phase 13 מרכז את משטחי הניהול והמודרציה ב־web, תוך שמירה על אותם כללי domain ו־Supabase."
      title="בית ניהול"
    >
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        }}
      >
        <AdminCard testId="admin-dashboard-springs">
          <AdminStack>
            <strong>ניהול מעיינות</strong>
            <span>יצירה, רשימה ועריכה של המעיינות הקנוניים במערכת.</span>
            <AdminPill
              label={canManageSprings ? 'זמין בסשן הזה' : 'מוגבל למנהלים בלבד'}
              testId="admin-dashboard-springs-access"
              tone={canManageSprings ? 'success' : 'warning'}
            />
            <Link data-testid="admin-dashboard-open-springs" href="/admin/springs">
              פתח ניהול מעיינות
            </Link>
          </AdminStack>
        </AdminCard>
        <AdminCard testId="admin-dashboard-moderation">
          <AdminStack>
            <strong>מודרציה</strong>
            <span>
              סקירת דיווחים ממתינים, תצוגות מקדימות פרטיות, ואישור/דחייה דרך המסלול המאושר.
            </span>
            <AdminPill
              label={canReviewModeration ? 'זמין בסשן הזה' : 'מוגבל לצוות'}
              testId="admin-dashboard-moderation-access"
              tone={canReviewModeration ? 'success' : 'warning'}
            />
            <Link data-testid="admin-dashboard-open-moderation" href="/admin/moderation">
              פתח תור מודרציה
            </Link>
          </AdminStack>
        </AdminCard>
      </div>
    </AdminPage>
  );
}
