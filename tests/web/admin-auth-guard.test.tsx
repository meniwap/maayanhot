// @vitest-environment jsdom

import { cleanup, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AdminProtectedShell } from '../../apps/admin-web/src/components/AdminProtectedShell';
import { __getRouterMock, __resetNextNavigationMock } from '../mocks/next-navigation';
import { createAuthenticatedSnapshot, renderAdmin } from './render-admin';

describe('admin web auth guard', () => {
  beforeEach(() => {
    __resetNextNavigationMock();
  });

  afterEach(() => {
    cleanup();
  });

  it('redirects unauthenticated users to login', async () => {
    renderAdmin(
      <AdminProtectedShell
        requiredRole="staff"
        restrictedMessage="לא מורשה"
        restrictedTitle="אין גישה"
      >
        <div data-testid="guard-child">allowed</div>
      </AdminProtectedShell>,
    );

    expect(screen.getByTestId('admin-route-loading')).toBeTruthy();

    await waitFor(() => {
      expect(__getRouterMock().replace).toHaveBeenCalledWith('/login');
    });
  });

  it('allows moderators into the moderation surface', () => {
    renderAdmin(
      <AdminProtectedShell
        requiredRole="staff"
        restrictedMessage="לא מורשה"
        restrictedTitle="אין גישה"
      >
        <div data-testid="guard-child">allowed</div>
      </AdminProtectedShell>,
      {
        snapshot: createAuthenticatedSnapshot('moderator'),
      },
    );

    expect(screen.getByTestId('guard-child')).toBeTruthy();
    expect(screen.queryByTestId('admin-route-restricted')).toBeNull();
  });

  it('blocks moderators from admin-only spring management', () => {
    renderAdmin(
      <AdminProtectedShell
        requiredRole="admin"
        restrictedMessage="רק אדמין"
        restrictedTitle="אין גישה"
      >
        <div data-testid="guard-child">allowed</div>
      </AdminProtectedShell>,
      {
        snapshot: createAuthenticatedSnapshot('moderator'),
      },
    );

    expect(screen.getByTestId('admin-route-restricted').textContent).toContain('רק אדמין');
    expect(screen.queryByTestId('guard-child')).toBeNull();
  });

  it('allows admins into admin-only routes', () => {
    renderAdmin(
      <AdminProtectedShell
        requiredRole="admin"
        restrictedMessage="רק אדמין"
        restrictedTitle="אין גישה"
      >
        <div data-testid="guard-child">allowed</div>
      </AdminProtectedShell>,
      {
        snapshot: createAuthenticatedSnapshot('admin'),
      },
    );

    expect(screen.getByTestId('guard-child')).toBeTruthy();
  });
});
