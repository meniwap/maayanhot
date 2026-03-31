import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import type { UploadAssetPreprocessor } from '@maayanhot/upload-core';
import {
  UploadValidationError,
  shouldPreprocessAsset,
  toPreparedUploadAsset,
  type UploadAssetDescriptor,
} from '@maayanhot/upload-core';

const toResizeAction = (
  asset: UploadAssetDescriptor,
  maxImageDimension: number,
): { resize: { height?: number; width?: number } } | null => {
  const width = asset.width ?? null;
  const height = asset.height ?? null;

  if (!width || !height) {
    return null;
  }

  const longestEdge = Math.max(width, height);

  if (longestEdge <= maxImageDimension) {
    return null;
  }

  if (width >= height) {
    return {
      resize: {
        width: maxImageDimension,
      },
    };
  }

  return {
    resize: {
      height: maxImageDimension,
    },
  };
};

const readFileSize = async (uri: string) => {
  const info = await FileSystem.getInfoAsync(uri);

  return 'size' in info && typeof info.size === 'number' ? info.size : null;
};

export const createExpoImageUploadPreprocessor = (): UploadAssetPreprocessor => ({
  async prepare(asset, policy) {
    const preparedAsset = toPreparedUploadAsset(asset);

    if (!shouldPreprocessAsset(asset, policy)) {
      return preparedAsset;
    }

    const actions = [];
    const resizeAction = toResizeAction(asset, policy.maxImageDimension ?? 2048);

    if (resizeAction) {
      actions.push(resizeAction);
    }

    const result = await ImageManipulator.manipulateAsync(asset.localUri, actions, {
      compress: policy.jpegQuality,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    const transformedByteSize = await readFileSize(result.uri);
    const nextAsset = toPreparedUploadAsset(
      {
        ...asset,
        byteSize: transformedByteSize ?? asset.byteSize,
        height: result.height ?? asset.height,
        localUri: result.uri,
        mimeType: policy.targetMimeType,
        width: result.width ?? asset.width,
      },
      {
        exifStripped: policy.stripExif,
        preprocessStatus: 'optimized',
      },
    );

    if (
      (policy.maxImageDimension !== null &&
        ((nextAsset.width ?? 0) > policy.maxImageDimension ||
          (nextAsset.height ?? 0) > policy.maxImageDimension)) ||
      (typeof nextAsset.byteSize === 'number' && nextAsset.byteSize > policy.finalMaxBytes)
    ) {
      throw new UploadValidationError(
        'file_too_large_after_processing',
        'The selected media is still too large after the one-pass optimization.',
      );
    }

    return nextAsset;
  },
});
