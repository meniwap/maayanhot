import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from './render-with-theme';

const { springRepositoryMock } = vi.hoisted(() => ({
  springRepositoryMock: {
    browse: vi.fn(),
    create: vi.fn(),
    findExistingSlugs: vi.fn(),
    getDetail: vi.fn(),
  },
}));

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock('../../apps/mobile/src/infrastructure/supabase/repositories/spring-repository', () => ({
  springRepository: springRepositoryMock,
}));

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
});

beforeEach(() => {
  springRepositoryMock.browse.mockReset();
  springRepositoryMock.create.mockReset();
  springRepositoryMock.findExistingSlugs.mockReset();
  springRepositoryMock.getDetail.mockReset();
});

describe('admin create spring screen', () => {
  it('auto-generates a base slug from the title and keeps it editable', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { AdminSpringCreateScreen } =
      await import('../../apps/mobile/src/features/admin-spring-create/AdminSpringCreateScreen');

    springRepositoryMock.findExistingSlugs.mockResolvedValue(['ein-haniya']);

    await renderWithTheme(
      <AdminSpringCreateScreen onBack={() => undefined} onOpenPublishedSpring={() => undefined} />,
      {
        sessionSnapshot: {
          email: 'admin@example.com',
          primaryRole: 'admin',
          roleSet: ['admin'],
          status: 'authenticated',
          userId: 'admin-1',
        },
      },
    );

    fireEvent.changeText(screen.getByTestId('admin-create-title-input'), 'Ein Haniya');

    await waitFor(() =>
      expect(screen.getByTestId('admin-create-slug-input').props.value).toBe('ein-haniya'),
    );

    fireEvent.changeText(screen.getByTestId('admin-create-slug-input'), 'custom-slug');

    expect(screen.getByTestId('admin-create-slug-input').props.value).toBe('custom-slug');
  });

  it('supports map-pick plus numeric refinement for coordinates', async () => {
    const { fireEvent, screen } = await import('@testing-library/react-native');
    const { AdminSpringCreateScreen } =
      await import('../../apps/mobile/src/features/admin-spring-create/AdminSpringCreateScreen');

    springRepositoryMock.findExistingSlugs.mockResolvedValue([]);

    await renderWithTheme(
      <AdminSpringCreateScreen onBack={() => undefined} onOpenPublishedSpring={() => undefined} />,
      {
        sessionSnapshot: {
          email: 'admin@example.com',
          primaryRole: 'admin',
          roleSet: ['admin'],
          status: 'authenticated',
          userId: 'admin-1',
        },
      },
    );

    fireEvent.press(screen.getByTestId('admin-coordinate-picker'), {
      geometry: {
        coordinates: [35.200001, 31.700001],
        type: 'Point',
      },
    });

    expect(screen.getByTestId('admin-create-latitude-input').props.value).toBe('31.700001');
    expect(screen.getByTestId('admin-create-longitude-input').props.value).toBe('35.200001');

    fireEvent.changeText(screen.getByTestId('admin-create-latitude-input'), '31.710000');
    fireEvent.changeText(screen.getByTestId('admin-create-longitude-input'), '35.210000');

    expect(screen.getByTestId('admin-create-latitude-input').props.value).toBe('31.710000');
    expect(screen.getByTestId('admin-create-longitude-input').props.value).toBe('35.210000');
  });

  it('shows validation feedback when required fields are missing', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { AdminSpringCreateScreen } =
      await import('../../apps/mobile/src/features/admin-spring-create/AdminSpringCreateScreen');

    springRepositoryMock.findExistingSlugs.mockResolvedValue([]);

    await renderWithTheme(
      <AdminSpringCreateScreen onBack={() => undefined} onOpenPublishedSpring={() => undefined} />,
      {
        sessionSnapshot: {
          email: 'admin@example.com',
          primaryRole: 'admin',
          roleSet: ['admin'],
          status: 'authenticated',
          userId: 'admin-1',
        },
      },
    );

    fireEvent.press(screen.getByTestId('admin-create-submit'));

    await waitFor(() => expect(screen.getByTestId('admin-create-validation')).toBeDefined());
  });
});
