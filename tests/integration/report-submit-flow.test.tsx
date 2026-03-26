import { __getRouter, __resetRouterMocks, __setLocalSearchParams } from '../mocks/expo-router';
import { __resetImagePickerMocks, __setNextLibraryResult } from '../mocks/expo-image-picker';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from '../ui/render-with-theme';

const { publicSpringReadRepositoryMock, springReportRepositoryMock, uploadAdapterMock } =
  vi.hoisted(() => ({
    publicSpringReadRepositoryMock: {
      getCatalog: vi.fn(),
      getDetailById: vi.fn(),
    },
    springReportRepositoryMock: {
      create: vi.fn(),
      finalizeMediaUpload: vi.fn(),
      getById: vi.fn(),
      listBySpringId: vi.fn(),
      listMediaByReportIds: vi.fn(),
      reserveMediaSlot: vi.fn(),
    },
    uploadAdapterMock: {
      retry: vi.fn(),
      upload: vi.fn(),
      validate: vi.fn(),
    },
  }));

vi.mock('react-native', async () => import('../mocks/react-native'));
vi.mock('expo-router', async () => import('../mocks/expo-router'));
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
  __resetRouterMocks();
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

describe('phase 8 report submit flow', () => {
  it('submits a report and routes back to detail with the pending moderation banner', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { default: ReportComposeRoute } =
      await import('../../apps/mobile/app/springs/[springId]/report');

    __setLocalSearchParams({
      springId: 'spring-ein-haniya',
    });

    await renderWithTheme(<ReportComposeRoute />, {
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

  it('submits a report with an attachment through the reserved-slot upload sequence', async () => {
    const { fireEvent, screen, waitFor } = await import('@testing-library/react-native');
    const { default: ReportComposeRoute } =
      await import('../../apps/mobile/app/springs/[springId]/report');

    __setLocalSearchParams({
      springId: 'spring-ein-haniya',
    });
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

    await renderWithTheme(<ReportComposeRoute />, {
      sessionSnapshot: {
        email: 'user@example.com',
        primaryRole: 'user',
        roleSet: ['user'],
        status: 'authenticated',
        userId: 'user-1',
      },
    });

    fireEvent.press(screen.getByTestId('report-attach-library'));
    await waitFor(() => expect(screen.getByTestId('photo-tile-asset-1')).toBeDefined());
    fireEvent.press(screen.getByTestId('report-submit'));

    await waitFor(() => expect(springReportRepositoryMock.reserveMediaSlot).toHaveBeenCalledOnce());
    expect(uploadAdapterMock.upload).toHaveBeenCalledOnce();
    expect(springReportRepositoryMock.finalizeMediaUpload).toHaveBeenCalledOnce();
  });
});
