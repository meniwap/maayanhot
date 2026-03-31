import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UploadValidationError, toPreparedUploadAsset } from '@maayanhot/upload-core';

import {
  __resetImagePickerMocks,
  __setCameraPermission,
  __setLibraryPermission,
  __setNextLibraryResult,
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from '../mocks/expo-image-picker';
import { renderWithTheme } from './render-with-theme';

const { publicSpringReadRepositoryMock } = vi.hoisted(() => ({
  publicSpringReadRepositoryMock: {
    getCatalog: vi.fn(),
    getDetailById: vi.fn(),
  },
}));

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock('expo-image-picker', async () => import('../mocks/expo-image-picker'));
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/public-spring-read-repository',
  () => ({
    publicSpringReadRepository: publicSpringReadRepositoryMock,
  }),
);

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
  __resetImagePickerMocks();
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

describe('report compose screen', () => {
  it('shows validation feedback when required values are missing', async () => {
    const { fireEvent, screen } = await import('@testing-library/react-native');
    const { ReportComposeScreen } =
      await import('../../apps/mobile/src/features/report-compose/ReportComposeScreen');

    await renderWithTheme(
      <ReportComposeScreen
        onBack={() => undefined}
        onReportSubmitted={() => undefined}
        springId="spring-ein-haniya"
      />,
      {
        sessionSnapshot: {
          email: 'user@example.com',
          primaryRole: 'user',
          roleSet: ['user'],
          status: 'authenticated',
          userId: 'user-1',
        },
      },
    );

    fireEvent.changeText(screen.getByTestId('report-observed-at-input'), '');
    fireEvent.press(screen.getByTestId('report-submit'));

    expect(screen.getByTestId('report-validation-message')).toBeDefined();
  });

  it('supports photo attach and remove state through the picker mock', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { ReportComposeScreen } =
      await import('../../apps/mobile/src/features/report-compose/ReportComposeScreen');

    __setNextLibraryResult([
      {
        assetId: 'asset-1',
        fileSize: 1234,
        height: 900,
        mimeType: 'image/jpeg',
        uri: 'file:///tmp/photo-1.jpg',
        width: 1200,
      },
    ]);

    await renderWithTheme(
      <ReportComposeScreen
        onBack={() => undefined}
        onReportSubmitted={() => undefined}
        springId="spring-ein-haniya"
      />,
      {
        sessionSnapshot: {
          email: 'user@example.com',
          primaryRole: 'user',
          roleSet: ['user'],
          status: 'authenticated',
          userId: 'user-1',
        },
      },
    );

    await fireEvent.press(screen.getByTestId('report-attach-library'));

    await waitFor(() => expect(screen.getByTestId('photo-tile-asset-1')).toBeDefined());
    expect(screen.getByTestId('report-permission-message').children.join('')).toBe(
      'התמונה נשמרה ללא עיבוד נוסף.',
    );

    await fireEvent.press(screen.getByTestId('photo-tile-asset-1-remove'));

    await waitFor(() => expect(screen.queryByTestId('photo-tile-asset-1')).toBeNull());
  });

  it('shows the optimized attachment state when preprocessing runs before upload', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { ReportComposeScreen } =
      await import('../../apps/mobile/src/features/report-compose/ReportComposeScreen');

    __setNextLibraryResult([
      {
        assetId: 'asset-optimized',
        fileSize: 14 * 1024 * 1024,
        height: 3000,
        mimeType: 'image/heic',
        uri: 'file:///tmp/photo-optimized.heic',
        width: 4000,
      },
    ]);

    await renderWithTheme(
      <ReportComposeScreen
        onBack={() => undefined}
        onReportSubmitted={() => undefined}
        springId="spring-ein-haniya"
      />,
      {
        offlineQueueValue: {
          prepareAttachment: async (asset) =>
            toPreparedUploadAsset(
              {
                ...asset,
                byteSize: 4 * 1024 * 1024,
                localUri: 'file:///documents/optimized.jpg',
                mimeType: 'image/jpeg',
              },
              {
                exifStripped: true,
                preprocessStatus: 'optimized',
              },
            ),
        },
        sessionSnapshot: {
          email: 'user@example.com',
          primaryRole: 'user',
          roleSet: ['user'],
          status: 'authenticated',
          userId: 'user-1',
        },
      },
    );

    await fireEvent.press(screen.getByTestId('report-attach-library'));

    await waitFor(() => expect(screen.getByTestId('photo-tile-asset-optimized')).toBeDefined());
    expect(screen.getByTestId('report-permission-message').children.join('')).toContain(
      'הוקטנה ודחוסה פעם אחת',
    );
  });

  it('surfaces the dedicated too-large-after-optimization rejection message', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { ReportComposeScreen } =
      await import('../../apps/mobile/src/features/report-compose/ReportComposeScreen');

    __setNextLibraryResult([
      {
        assetId: 'asset-too-large',
        fileSize: 20 * 1024 * 1024,
        height: 3000,
        mimeType: 'image/jpeg',
        uri: 'file:///tmp/photo-too-large.jpg',
        width: 4000,
      },
    ]);

    await renderWithTheme(
      <ReportComposeScreen
        onBack={() => undefined}
        onReportSubmitted={() => undefined}
        springId="spring-ein-haniya"
      />,
      {
        offlineQueueValue: {
          prepareAttachment: async () => {
            throw new UploadValidationError('file_too_large_after_processing', 'still too large');
          },
        },
        sessionSnapshot: {
          email: 'user@example.com',
          primaryRole: 'user',
          roleSet: ['user'],
          status: 'authenticated',
          userId: 'user-1',
        },
      },
    );

    await fireEvent.press(screen.getByTestId('report-attach-library'));

    await waitFor(() =>
      expect(screen.getByTestId('report-permission-message').children.join('')).toContain(
        'גם אחרי הקטנה ודחיסה',
      ),
    );
  });

  it('surfaces denied camera and library permissions', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { ReportComposeScreen } =
      await import('../../apps/mobile/src/features/report-compose/ReportComposeScreen');

    __setCameraPermission('denied');
    __setLibraryPermission('denied');

    await renderWithTheme(
      <ReportComposeScreen
        onBack={() => undefined}
        onReportSubmitted={() => undefined}
        springId="spring-ein-haniya"
      />,
      {
        sessionSnapshot: {
          email: 'user@example.com',
          primaryRole: 'user',
          roleSet: ['user'],
          status: 'authenticated',
          userId: 'user-1',
        },
      },
    );

    fireEvent.press(screen.getByTestId('report-attach-camera'));
    await waitFor(() =>
      expect(screen.getByTestId('report-permission-message').children.join('')).toBe(
        'הרשאת מצלמה נדחתה.',
      ),
    );

    fireEvent.press(screen.getByTestId('report-attach-library'));
    await waitFor(() => expect(requestMediaLibraryPermissionsAsync).toHaveBeenCalled());
    expect(launchImageLibraryAsync).not.toHaveBeenCalled();
    expect(screen.getByTestId('report-permission-message').children.join('')).toBe(
      'הרשאת גלריה נדחתה.',
    );
  });

  it('shows offline-local-save wording when the app is offline', async () => {
    const { screen } = await import('@testing-library/react-native');
    const { ReportComposeScreen } =
      await import('../../apps/mobile/src/features/report-compose/ReportComposeScreen');

    await renderWithTheme(
      <ReportComposeScreen
        onBack={() => undefined}
        onReportSubmitted={() => undefined}
        springId="spring-ein-haniya"
      />,
      {
        offlineQueueSnapshot: {
          isOnline: false,
        },
        sessionSnapshot: {
          email: 'user@example.com',
          primaryRole: 'user',
          roleSet: ['user'],
          status: 'authenticated',
          userId: 'user-1',
        },
      },
    );

    expect(screen.getByTestId('report-connectivity-state').children.join('')).toContain(
      'אין חיבור',
    );
    expect(screen.getByText('שמור דיווח מקומית')).toBeDefined();
  });
});
