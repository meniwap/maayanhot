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
import { springRepository } from '../../infrastructure/supabase/repositories/spring-repository';
import { formatPublicStatusLabel, formatTimestamp } from '../../lib/status';

export function AdminSpringManagementScreen() {
  const springsQuery = useQuery({
    queryFn: () => springRepository.listManaged(),
    queryKey: ['admin-spring-management-list'],
  });

  if (springsQuery.isLoading) {
    return (
      <AdminPage title="ניהול מעיינות">
        <AdminCard testId="admin-springs-loading">טוען רשימת מעיינות...</AdminCard>
      </AdminPage>
    );
  }

  if (springsQuery.isError) {
    return (
      <AdminPage title="ניהול מעיינות">
        <AdminCard testId="admin-springs-error">
          טעינת רשימת המעיינות נכשלה. בדקו שהמשטח האדמיני של Phase 13 זמין.
        </AdminCard>
      </AdminPage>
    );
  }

  const items = springsQuery.data?.items ?? [];

  return (
    <AdminPage
      actions={
        <AdminButton
          href="/admin/springs/new"
          label="מעיין חדש"
          testId="admin-springs-create-link"
        />
      }
      subtitle="הרשימה מבוססת על surface אדמיני ייעודי ואינה מרחיבה את ה־public read model."
      title="ניהול מעיינות"
    >
      {items.length === 0 ? (
        <AdminCard testId="admin-springs-empty">אין עדיין מעיינות זמינים לניהול.</AdminCard>
      ) : (
        <AdminStack gap={16}>
          {items.map((item) => (
            <AdminCard key={item.spring.id} testId={`admin-spring-row-${item.spring.id}`}>
              <AdminStack>
                <AdminInline justify="space-between">
                  <strong>{item.spring.title}</strong>
                  <AdminInline>
                    <AdminPill
                      label={item.spring.isPublished ? 'Published' : 'Draft'}
                      tone={item.spring.isPublished ? 'success' : 'warning'}
                    />
                    <AdminPill
                      label={formatPublicStatusLabel(
                        item.projection?.waterPresence ?? 'unknown',
                        item.projection?.freshness ?? 'none',
                      )}
                    />
                  </AdminInline>
                </AdminInline>
                <div>
                  {item.spring.slug} · {item.spring.regionCode ?? 'ללא אזור'}
                </div>
                <div>עודכן {formatTimestamp(item.spring.updatedAt)}</div>
                <AdminInline justify="space-between">
                  <div>
                    מאושר אחרון: {formatTimestamp(item.projection?.latestApprovedReportAt ?? null)}
                  </div>
                  <AdminButton
                    href={`/admin/springs/${item.spring.id}/edit`}
                    label="עריכה"
                    testId={`admin-spring-edit-${item.spring.id}`}
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
