import { beforeEach, describe, expect, it } from 'vitest';
import { reportImageUploadPolicy } from '@maayanhot/upload-core';

import { __resetFileSystem, __setFileInfo } from '../mocks/expo-file-system-legacy';
import {
  __resetImageManipulatorMocks,
  __setNextManipulateResult,
  manipulateAsync,
  SaveFormat,
} from '../mocks/expo-image-manipulator';

describe('mobile image upload preprocessor', () => {
  beforeEach(() => {
    __resetFileSystem();
    __resetImageManipulatorMocks();
  });

  it('keeps already-bounded images unchanged', async () => {
    const { createExpoImageUploadPreprocessor } =
      await import('../../apps/mobile/src/infrastructure/upload/mobile-image-preprocessor');
    const preprocessor = createExpoImageUploadPreprocessor();
    const result = await preprocessor.prepare(
      {
        byteSize: 1_024,
        capturedAt: '2026-03-31T08:00:00.000Z',
        height: 900,
        kind: 'image',
        localId: 'asset-1',
        localUri: 'file:///documents/source-1.jpg',
        mimeType: 'image/jpeg',
        width: 1200,
      },
      reportImageUploadPolicy,
    );

    expect(result.preprocessStatus).toBe('accepted');
    expect(manipulateAsync).not.toHaveBeenCalled();
  });

  it('resizes and compresses an oversized image once before upload', async () => {
    const { createExpoImageUploadPreprocessor } =
      await import('../../apps/mobile/src/infrastructure/upload/mobile-image-preprocessor');
    const preprocessor = createExpoImageUploadPreprocessor();

    __setNextManipulateResult({
      height: 1536,
      uri: 'file:///tmp/optimized-1.jpg',
      width: 2048,
    });
    __setFileInfo('file:///tmp/optimized-1.jpg', 4 * 1024 * 1024);

    const result = await preprocessor.prepare(
      {
        byteSize: 14 * 1024 * 1024,
        capturedAt: '2026-03-31T08:00:00.000Z',
        height: 3000,
        kind: 'image',
        localId: 'asset-1',
        localUri: 'file:///documents/source-1.jpg',
        mimeType: 'image/heic',
        width: 4000,
      },
      reportImageUploadPolicy,
    );

    expect(result.preprocessStatus).toBe('optimized');
    expect(result.exifStripped).toBe(true);
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.byteSize).toBe(4 * 1024 * 1024);
    expect(manipulateAsync).toHaveBeenCalledTimes(1);
    expect(manipulateAsync).toHaveBeenCalledWith(
      'file:///documents/source-1.jpg',
      [{ resize: { width: 2048 } }],
      {
        compress: 0.75,
        format: SaveFormat.JPEG,
      },
    );
  });

  it('rejects an image that remains too large after the one-pass optimization', async () => {
    const { createExpoImageUploadPreprocessor } =
      await import('../../apps/mobile/src/infrastructure/upload/mobile-image-preprocessor');
    const preprocessor = createExpoImageUploadPreprocessor();

    __setNextManipulateResult({
      height: 1536,
      uri: 'file:///tmp/optimized-too-large.jpg',
      width: 2048,
    });
    __setFileInfo('file:///tmp/optimized-too-large.jpg', 16 * 1024 * 1024);

    await expect(
      preprocessor.prepare(
        {
          byteSize: 18 * 1024 * 1024,
          capturedAt: '2026-03-31T08:00:00.000Z',
          height: 3000,
          kind: 'image',
          localId: 'asset-1',
          localUri: 'file:///documents/source-1.jpg',
          mimeType: 'image/jpeg',
          width: 4000,
        },
        reportImageUploadPolicy,
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'file_too_large_after_processing',
      }),
    );
  });
});
