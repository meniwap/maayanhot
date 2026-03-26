import {
  UploadValidationError,
  createSupabaseUploadAdapter,
  reportImageUploadPolicy,
  type PendingUpload,
} from '@maayanhot/upload-core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const uploadMock = vi.fn(async () => ({ error: null }));

const makePendingUpload = (): PendingUpload => ({
  asset: {
    byteSize: 1024,
    capturedAt: '2026-03-26T09:00:00.000Z',
    height: 900,
    kind: 'image',
    localId: 'asset-1',
    localUri: 'file:///tmp/report-photo.jpg',
    mimeType: 'image/jpeg',
    width: 1200,
  },
  attemptCount: 0,
  lastErrorCode: null,
  mediaId: 'media-1',
  queueId: 'asset-1',
  reportId: 'report-1',
  storageBucket: 'report-media',
  storagePath: 'user-1/report-1/media-1.jpg',
});

describe('supabase upload adapter', () => {
  beforeEach(() => {
    uploadMock.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        blob: async () => new Blob(['demo']),
        ok: true,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects files with a disallowed MIME type', async () => {
    const adapter = createSupabaseUploadAdapter({
      storage: {
        from: () => ({
          upload: uploadMock,
        }),
      },
    } as never);

    await expect(
      adapter.upload({
        ...makePendingUpload(),
        asset: {
          ...makePendingUpload().asset,
          mimeType: 'image/gif',
        },
      }),
    ).rejects.toBeInstanceOf(UploadValidationError);
  });

  it('rejects files over the phase 8 size limit', async () => {
    const adapter = createSupabaseUploadAdapter({
      storage: {
        from: () => ({
          upload: uploadMock,
        }),
      },
    } as never);

    await expect(
      adapter.upload({
        ...makePendingUpload(),
        asset: {
          ...makePendingUpload().asset,
          byteSize: reportImageUploadPolicy.maxBytes + 1,
        },
      }),
    ).rejects.toBeInstanceOf(UploadValidationError);
  });

  it('keeps the reserved media slot path stable across upload and retry', async () => {
    const adapter = createSupabaseUploadAdapter({
      storage: {
        from: () => ({
          upload: uploadMock,
        }),
      },
    } as never);
    const pendingUpload = makePendingUpload();

    const firstResult = await adapter.upload(pendingUpload);
    const retryResult = await adapter.retry({
      ...pendingUpload,
      attemptCount: 1,
    });

    expect(firstResult.mediaId).toBe('media-1');
    expect(firstResult.storagePath).toBe(pendingUpload.storagePath);
    expect(retryResult.mediaId).toBe('media-1');
    expect(retryResult.storagePath).toBe(pendingUpload.storagePath);
    expect(uploadMock).toHaveBeenCalledTimes(2);
  });
});
