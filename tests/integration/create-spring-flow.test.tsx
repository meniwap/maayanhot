import { __getRouter, __resetRouterMocks } from '../mocks/expo-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from '../ui/render-with-theme';

const { springRepositoryMock } = vi.hoisted(() => ({
  springRepositoryMock: {
    browse: vi.fn(),
    create: vi.fn(),
    findExistingSlugs: vi.fn(),
    getDetail: vi.fn(),
  },
}));

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock('expo-router', async () => import('../mocks/expo-router'));
vi.mock('../../apps/mobile/src/infrastructure/supabase/repositories/spring-repository', () => ({
  springRepository: springRepositoryMock,
}));

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
  __resetRouterMocks();
});

beforeEach(() => {
  springRepositoryMock.browse.mockReset();
  springRepositoryMock.create.mockReset();
  springRepositoryMock.findExistingSlugs.mockReset();
  springRepositoryMock.getDetail.mockReset();
  springRepositoryMock.findExistingSlugs.mockResolvedValue([]);
});

describe('phase 8 create spring flow', () => {
  it('keeps admin spring creation online-only when the app is offline', async () => {
    const { screen } = await import('@testing-library/react-native');
    const { default: AdminCreateRoute } = await import('../../apps/mobile/app/admin/springs/new');

    await renderWithTheme(<AdminCreateRoute />, {
      offlineQueueSnapshot: {
        isOnline: false,
      },
      sessionSnapshot: {
        email: 'admin@example.com',
        primaryRole: 'admin',
        roleSet: ['admin'],
        status: 'authenticated',
        userId: 'admin-1',
      },
    });

    expect(screen.getByTestId('admin-create-offline-message')).toBeDefined();
    expect(screen.getByTestId('admin-create-submit').props.disabled).toBe(true);
    expect(springRepositoryMock.create).not.toHaveBeenCalled();
  });

  it('creates a draft spring and stays in the create flow with a success confirmation', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { default: AdminCreateRoute } = await import('../../apps/mobile/app/admin/springs/new');

    springRepositoryMock.create.mockResolvedValue({
      accessNotes: null,
      alternateNames: [],
      createdAt: '2026-03-26T09:00:00.000Z',
      createdByUserId: 'admin-1',
      description: null,
      id: 'spring-draft-1',
      isPublished: false,
      location: {
        latitude: 31.7,
        longitude: 35.2,
        precisionMeters: 12,
      },
      regionCode: null,
      slug: 'ein-bustan',
      title: 'עין בוסתן',
      updatedAt: '2026-03-26T09:00:00.000Z',
    });

    await renderWithTheme(<AdminCreateRoute />, {
      sessionSnapshot: {
        email: 'admin@example.com',
        primaryRole: 'admin',
        roleSet: ['admin'],
        status: 'authenticated',
        userId: 'admin-1',
      },
    });

    fireEvent.changeText(screen.getByTestId('admin-create-title-input'), 'עין בוסתן');
    fireEvent.changeText(screen.getByTestId('admin-create-slug-input'), 'ein-bustan');
    fireEvent.press(screen.getByTestId('admin-create-submit'));

    await waitFor(() => expect(screen.getByTestId('admin-create-draft-success')).toBeDefined());
    expect(springRepositoryMock.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublished: false,
      }),
    );
  });

  it('creates a published spring and routes to the new public detail path', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { default: AdminCreateRoute } = await import('../../apps/mobile/app/admin/springs/new');

    springRepositoryMock.create.mockResolvedValue({
      accessNotes: null,
      alternateNames: [],
      createdAt: '2026-03-26T09:00:00.000Z',
      createdByUserId: 'admin-1',
      description: null,
      id: 'spring-published-1',
      isPublished: true,
      location: {
        latitude: 31.7,
        longitude: 35.2,
        precisionMeters: 12,
      },
      regionCode: null,
      slug: 'ein-oren',
      title: 'עין אורן',
      updatedAt: '2026-03-26T09:00:00.000Z',
    });

    await renderWithTheme(<AdminCreateRoute />, {
      sessionSnapshot: {
        email: 'admin@example.com',
        primaryRole: 'admin',
        roleSet: ['admin'],
        status: 'authenticated',
        userId: 'admin-1',
      },
    });

    fireEvent.changeText(screen.getByTestId('admin-create-title-input'), 'עין אורן');
    fireEvent.changeText(screen.getByTestId('admin-create-slug-input'), 'ein-oren');
    fireEvent.press(screen.getByTestId('admin-create-published-toggle'));
    fireEvent.press(screen.getByTestId('admin-create-submit'));

    await waitFor(() =>
      expect(__getRouter().replace).toHaveBeenCalledWith({
        params: {
          springId: 'spring-published-1',
        },
        pathname: '/springs/[springId]',
      }),
    );
  });
});
