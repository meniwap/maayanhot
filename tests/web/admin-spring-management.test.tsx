// @vitest-environment jsdom

import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { createMemoryObservability } from '@maayanhot/observability-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AdminEditSpringPage from '../../apps/admin-web/app/admin/springs/[springId]/edit/page';
import AdminNewSpringPage from '../../apps/admin-web/app/admin/springs/new/page';
import AdminSpringsPage from '../../apps/admin-web/app/admin/springs/page';
import {
  __getRouterMock,
  __resetNextNavigationMock,
  __setSearchParams,
} from '../mocks/next-navigation';
import { createAuthenticatedSnapshot, renderAdmin } from './render-admin';

const springRepositoryModule = vi.hoisted(() => ({
  springRepository: {
    browse: vi.fn(),
    create: vi.fn(),
    findExistingSlugs: vi.fn(),
    getDetail: vi.fn(),
    getManagedById: vi.fn(),
    listManaged: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock(
  '../../apps/admin-web/src/infrastructure/supabase/repositories/spring-repository',
  () => springRepositoryModule,
);

const managedItem = {
  coverMedia: null,
  projection: {
    approvedReportCountConsidered: 2,
    confidence: 'medium' as const,
    derivedFromReportIds: ['report-2', 'report-1'],
    freshness: 'recent' as const,
    latestApprovedReportAt: '2026-03-27T08:00:00.000Z',
    recalculatedAt: '2026-03-27T08:15:00.000Z',
    springId: 'spring-1',
    waterPresence: 'water' as const,
  },
  spring: {
    accessNotes: 'שביל קצר מהכביש',
    alternateNames: ['עין בדיקה'],
    createdAt: '2026-03-20T08:00:00.000Z',
    createdByUserId: 'admin-1',
    description: 'תיאור בדיקה',
    id: 'spring-1',
    isPublished: false,
    location: {
      latitude: 31.778,
      longitude: 35.235,
      precisionMeters: 12,
    },
    regionCode: 'jerusalem_hills',
    slug: 'ein-test',
    title: 'עין בדיקה',
    updatedAt: '2026-03-27T08:20:00.000Z',
  },
};

describe('admin spring management web flows', () => {
  beforeEach(() => {
    __resetNextNavigationMock();
    __setSearchParams({});
    vi.clearAllMocks();

    springRepositoryModule.springRepository.listManaged.mockResolvedValue({
      items: [managedItem],
      nextCursor: null,
    });
    springRepositoryModule.springRepository.getManagedById.mockResolvedValue(managedItem);
    springRepositoryModule.springRepository.findExistingSlugs.mockResolvedValue([]);
    springRepositoryModule.springRepository.create.mockResolvedValue(managedItem.spring);
    springRepositoryModule.springRepository.update.mockResolvedValue({
      ...managedItem.spring,
      isPublished: true,
      title: 'עין בדיקה מעודכן',
      updatedAt: '2026-03-27T09:00:00.000Z',
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('loads the admin spring list for admins', async () => {
    renderAdmin(<AdminSpringsPage />, {
      snapshot: createAuthenticatedSnapshot('admin'),
    });

    expect((await screen.findByTestId('admin-spring-row-spring-1')).textContent).toContain(
      'עין בדיקה',
    );
    expect(screen.getByTestId('admin-springs-create-link').getAttribute('href')).toBe(
      '/admin/springs/new',
    );
  });

  it('creates a draft spring and routes into the edit surface', async () => {
    const memoryObservability = createMemoryObservability();

    renderAdmin(<AdminNewSpringPage />, {
      observability: memoryObservability.observability,
      snapshot: createAuthenticatedSnapshot('admin'),
    });

    fireEvent.change(screen.getByTestId('admin-web-spring-title'), {
      target: { value: 'עין יצירה חדשה' },
    });
    fireEvent.click(screen.getByTestId('admin-web-spring-submit'));

    await waitFor(() => {
      expect(springRepositoryModule.springRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublished: false,
          title: 'עין יצירה חדשה',
        }),
      );
    });
    expect(springRepositoryModule.springRepository.create.mock.calls[0]?.[0]?.slug).toEqual(
      expect.any(String),
    );
    expect(__getRouterMock().replace).toHaveBeenCalledWith(
      '/admin/springs/spring-1/edit?status=created',
    );
    expect(memoryObservability.analytics.map((entry) => entry.name)).toContain(
      'admin_spring_saved',
    );
  });

  it('updates an existing spring and preserves the published toggle in the command', async () => {
    __setSearchParams({ status: 'created' });

    renderAdmin(<AdminEditSpringPage params={{ springId: 'spring-1' }} />, {
      snapshot: createAuthenticatedSnapshot('admin'),
    });

    expect((await screen.findByTestId('admin-web-spring-title')).getAttribute('value')).toBe(
      'עין בדיקה',
    );

    fireEvent.change(screen.getByTestId('admin-web-spring-title'), {
      target: { value: 'עין בדיקה מעודכן' },
    });
    fireEvent.click(screen.getByTestId('admin-web-spring-published-toggle'));
    fireEvent.click(screen.getByTestId('admin-web-spring-submit'));

    await waitFor(() => {
      expect(springRepositoryModule.springRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublished: true,
          springId: 'spring-1',
          title: 'עין בדיקה מעודכן',
        }),
      );
    });
    expect(__getRouterMock().replace).toHaveBeenCalledWith(
      '/admin/springs/spring-1/edit?status=updated',
    );
  });

  it('shows a validation error instead of creating when title is missing', async () => {
    renderAdmin(<AdminNewSpringPage />, {
      snapshot: createAuthenticatedSnapshot('admin'),
    });

    fireEvent.click(screen.getByTestId('admin-web-spring-submit'));

    expect((await screen.findByTestId('admin-web-spring-validation')).textContent).toContain(
      'הסלאג עודכן כדי לשמור על צורה ייחודית.',
    );
    expect(springRepositoryModule.springRepository.create).not.toHaveBeenCalled();
  });
});
