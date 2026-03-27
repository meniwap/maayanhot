'use client';

import Link from 'next/link';
import type { PropsWithChildren, ReactNode } from 'react';

import { useAdminSession } from '../infrastructure/session/AdminSessionProvider';
import { adminTheme } from '../lib/theme';
import { AdminButton, AdminCard, AdminInline, AdminStack } from './AdminPrimitives';

export function AdminShell({ actions, children }: PropsWithChildren<{ actions?: ReactNode }>) {
  const { signOut, snapshot } = useAdminSession();

  return (
    <main
      style={{
        background: adminTheme.bg.canvas,
        minHeight: '100vh',
        padding: adminTheme.space['6'],
      }}
    >
      <div
        style={{
          display: 'grid',
          gap: adminTheme.space['4'],
          margin: '0 auto',
          maxWidth: 1180,
        }}
      >
        <AdminCard testId="admin-shell-header">
          <AdminInline justify="space-between">
            <AdminStack gap={adminTheme.space['2']}>
              <div
                style={{
                  color: adminTheme.text.primary,
                  fontSize: adminTheme.typography.scale.titleLg.fontSize,
                  fontWeight: Number(adminTheme.typography.scale.titleLg.fontWeight),
                }}
              >
                לוח ניהול
              </div>
              <div
                style={{
                  color: adminTheme.text.secondary,
                  fontSize: adminTheme.typography.scale.bodySm.fontSize,
                }}
              >
                {snapshot.email
                  ? `${snapshot.email} · ${snapshot.primaryRole ?? 'ללא תפקיד'}`
                  : 'ללא סשן מחובר'}
              </div>
            </AdminStack>
            <AdminInline justify="flex-end">
              <Link data-testid="admin-shell-nav-dashboard" href="/admin">
                בית
              </Link>
              <Link data-testid="admin-shell-nav-springs" href="/admin/springs">
                מעיינות
              </Link>
              <Link data-testid="admin-shell-nav-moderation" href="/admin/moderation">
                מודרציה
              </Link>
              {actions}
              {snapshot.status === 'authenticated' ? (
                <AdminButton
                  label="התנתקות"
                  onClick={() => void signOut()}
                  testId="admin-shell-sign-out"
                  tone="ghost"
                />
              ) : null}
            </AdminInline>
          </AdminInline>
        </AdminCard>
        {children}
      </div>
    </main>
  );
}
