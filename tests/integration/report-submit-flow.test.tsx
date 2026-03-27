import { __getRouter, __resetRouterMocks, __setLocalSearchParams } from '../mocks/expo-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from '../ui/render-with-theme';

const publicSpringReadRepositoryMock = {
  getCatalog: vi.fn(),
  getDetailById: vi.fn(),
};

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock('expo-router', async () => import('../mocks/expo-router'));
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/public-spring-read-repository',
  () => ({
    publicSpringReadRepository: publicSpringReadRepositoryMock,
  }),
);

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
  __resetRouterMocks();
});

beforeEach(() => {
  publicSpringReadRepositoryMock.getCatalog.mockReset();
  publicSpringReadRepositoryMock.getDetailById.mockReset();

  publicSpringReadRepositoryMock.getDetailById.mockResolvedValue({
    accessNotes: 'גישה ציבורית',
    alternateNames: ['Ein Haniya'],
    confidence: 'high',
    coordinates: {
      latitude: 31.7454,
      longitude: 35.1691,
    },
    coverImageUrl: null,
    description: 'תיאור',
    freshness: 'recent',
    gallery: [],
    historySummary: [],
    id: 'spring-ein-haniya',
    isAccessibleByCurrentUser: true,
    latestApprovedReportAt: '2026-03-21T08:10:00.000Z',
    locationLabel: 'עמק רפאים',
    regionLabel: 'הרי ירושלים',
    slug: 'ein-haniya',
    title: 'עין חניה',
    updatedAt: '2026-03-22T09:00:00.000Z',
    waterPresence: 'water',
  });
});

describe('phase 11 report submit flow', () => {
  it('routes back to detail with the pending moderation feedback after an immediate send', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { default: ReportComposeRoute } =
      await import('../../apps/mobile/app/springs/[springId]/report');

    __setLocalSearchParams({
      springId: 'spring-ein-haniya',
    });

    await renderWithTheme(<ReportComposeRoute />, {
      offlineQueueValue: {
        submitDraft: async () => ({
          feedback: 'report-pending',
          queueId: 'queue-1',
          reportId: 'report-1',
          status: 'submitted',
        }),
      },
      sessionSnapshot: {
        email: 'user@example.com',
        primaryRole: 'user',
        roleSet: ['user'],
        status: 'authenticated',
        userId: 'user-1',
      },
    });

    fireEvent.press(screen.getByTestId('report-submit'));

    await waitFor(() =>
      expect(__getRouter().replace).toHaveBeenCalledWith({
        params: {
          feedback: 'report-pending',
          springId: 'spring-ein-haniya',
        },
        pathname: '/springs/[springId]',
      }),
    );
  });

  it('routes back to detail with local-queue feedback when the report is stored offline', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { default: ReportComposeRoute } =
      await import('../../apps/mobile/app/springs/[springId]/report');

    __setLocalSearchParams({
      springId: 'spring-ein-haniya',
    });

    await renderWithTheme(<ReportComposeRoute />, {
      offlineQueueSnapshot: {
        isOnline: false,
      },
      offlineQueueValue: {
        submitDraft: async () => ({
          feedback: 'report-queued-offline',
          queueId: 'queue-1',
          status: 'queued',
        }),
      },
      sessionSnapshot: {
        email: 'user@example.com',
        primaryRole: 'user',
        roleSet: ['user'],
        status: 'authenticated',
        userId: 'user-1',
      },
    });

    fireEvent.press(screen.getByTestId('report-submit'));

    await waitFor(() =>
      expect(__getRouter().replace).toHaveBeenCalledWith({
        params: {
          feedback: 'report-queued-offline',
          springId: 'spring-ein-haniya',
        },
        pathname: '/springs/[springId]',
      }),
    );
  });
});
