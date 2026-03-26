import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  __resetImagePickerMocks,
  __setCameraPermission,
  __setLibraryPermission,
  __setNextLibraryResult,
  launchImageLibraryAsync,
  requestMediaLibraryPermissionsAsync,
} from '../mocks/expo-image-picker';
import { renderWithTheme } from './render-with-theme';

const publicSpringReadRepositoryMock = {
  getCatalog: vi.fn(),
  getDetailById: vi.fn(),
};

const springReportRepositoryMock = {
  create: vi.fn(),
  finalizeMediaUpload: vi.fn(),
  getById: vi.fn(),
  listBySpringId: vi.fn(),
  listMediaByReportIds: vi.fn(),
  reserveMediaSlot: vi.fn(),
};

const uploadAdapterMock = {
  retry: vi.fn(),
  upload: vi.fn(),
  validate: vi.fn(),
};

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock('expo-image-picker', async () => import('../mocks/expo-image-picker'));
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/public-spring-read-repository',
  () => ({
    publicSpringReadRepository: publicSpringReadRepositoryMock,
  }),
);
vi.mock(
  '../../apps/mobile/src/infrastructure/supabase/repositories/spring-report-repository',
  () => ({
    springReportRepository: springReportRepositoryMock,
  }),
);
vi.mock('../../apps/mobile/src/infrastructure/supabase/client', () => ({
  getSupabaseClient: vi.fn(() => ({})),
  isSupabaseClientConfigured: vi.fn(() => true),
}));
vi.mock('@maayanhot/upload-core', async () => {
  const actual =
    await vi.importActual<typeof import('@maayanhot/upload-core')>('@maayanhot/upload-core');

  return {
    ...actual,
    createSupabaseUploadAdapter: vi.fn(() => uploadAdapterMock),
  };
});

afterEach(async () => {
  const { cleanup } = await import('@testing-library/react-native');

  cleanup();
  __resetImagePickerMocks();
});

beforeEach(() => {
  publicSpringReadRepositoryMock.getCatalog.mockReset();
  publicSpringReadRepositoryMock.getDetailById.mockReset();
  springReportRepositoryMock.create.mockReset();
  springReportRepositoryMock.finalizeMediaUpload.mockReset();
  springReportRepositoryMock.getById.mockReset();
  springReportRepositoryMock.listBySpringId.mockReset();
  springReportRepositoryMock.listMediaByReportIds.mockReset();
  springReportRepositoryMock.reserveMediaSlot.mockReset();
  uploadAdapterMock.retry.mockReset();
  uploadAdapterMock.upload.mockReset();
  uploadAdapterMock.validate.mockReset();

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
  springReportRepositoryMock.create.mockResolvedValue({
    id: 'report-1',
  });
  springReportRepositoryMock.reserveMediaSlot.mockResolvedValue({
    capturedAt: '2026-03-26T08:00:00.000Z',
    mediaId: 'media-1',
    reportId: 'report-1',
    springId: 'spring-ein-haniya',
    storageBucket: 'report-media',
    storagePath: 'user-1/report-1/media-1.jpg',
    uploadState: 'pending',
  });
  springReportRepositoryMock.finalizeMediaUpload.mockResolvedValue({
    byteSize: 1234,
    capturedAt: '2026-03-26T08:00:00.000Z',
    createdAt: '2026-03-26T08:05:00.000Z',
    exifStripped: false,
    height: 900,
    id: 'media-1',
    mediaType: 'image',
    publicUrl: null,
    reportId: 'report-1',
    springId: 'spring-ein-haniya',
    storageBucket: 'report-media',
    storagePath: 'user-1/report-1/media-1.jpg',
    uploadState: 'uploaded',
    width: 1200,
  });
  uploadAdapterMock.validate.mockReturnValue(undefined);
  uploadAdapterMock.upload.mockResolvedValue({
    byteSize: 1234,
    exifStripped: false,
    height: 900,
    kind: 'image',
    mediaId: 'media-1',
    publicUrl: null,
    storagePath: 'user-1/report-1/media-1.jpg',
    width: 1200,
  });
  uploadAdapterMock.retry.mockResolvedValue({
    byteSize: 1234,
    exifStripped: false,
    height: 900,
    kind: 'image',
    mediaId: 'media-1',
    publicUrl: null,
    storagePath: 'user-1/report-1/media-1.jpg',
    width: 1200,
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

    fireEvent.press(screen.getByTestId('report-attach-library'));

    await waitFor(() => expect(screen.getByTestId('photo-tile-asset-1')).toBeDefined());

    fireEvent.press(screen.getByTestId('photo-tile-asset-1-remove'));

    expect(screen.queryByTestId('photo-tile-asset-1')).toBeNull();
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

  it('keeps the report screen open and allows retry after an upload failure', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { ReportComposeScreen } =
      await import('../../apps/mobile/src/features/report-compose/ReportComposeScreen');
    const onReportSubmitted = vi.fn();

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
    uploadAdapterMock.upload.mockRejectedValueOnce(new Error('upload failed'));

    await renderWithTheme(
      <ReportComposeScreen
        onBack={() => undefined}
        onReportSubmitted={onReportSubmitted}
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

    fireEvent.press(screen.getByTestId('report-attach-library'));
    await waitFor(() => expect(screen.getByTestId('photo-tile-asset-1')).toBeDefined());

    fireEvent.press(screen.getByTestId('report-submit'));
    await waitFor(() => expect(screen.getByTestId('report-submit-message')).toBeDefined());
    expect(screen.getByTestId('photo-tile-asset-1-retry')).toBeDefined();

    fireEvent.press(screen.getByTestId('photo-tile-asset-1-retry'));
    await waitFor(() => expect(onReportSubmitted).toHaveBeenCalledWith('spring-ein-haniya'));
  });
});
