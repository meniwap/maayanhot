import type { IsoTimestampString, MediaId, ReportId, UploadAssetKind } from '@maayanhot/contracts';
import type { SupabaseClient } from '@supabase/supabase-js';

export type UploadAssetDescriptor = {
  localId: string;
  kind: UploadAssetKind;
  localUri: string;
  mimeType: string | null;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  capturedAt: IsoTimestampString | null;
};

export type PreparedUploadAsset = UploadAssetDescriptor & {
  exifStripped: boolean;
  originalByteSize: number | null;
  originalHeight: number | null;
  originalMimeType: string | null;
  originalWidth: number | null;
  preprocessStatus: 'accepted' | 'optimized';
};

export type PendingUpload = {
  queueId: string;
  asset: PreparedUploadAsset;
  attemptCount: number;
  lastErrorCode: string | null;
  mediaId: MediaId;
  reportId: ReportId;
  storageBucket: string;
  storagePath: string;
};

export type UploadResult = {
  mediaId: MediaId;
  kind: UploadAssetKind;
  storagePath: string;
  publicUrl: string | null;
  byteSize: number | null;
  width: number | null;
  height: number | null;
  exifStripped: boolean;
};

export type PrivateMediaPreviewRequest = {
  expiresInSeconds?: number;
  storageBucket: string;
  storagePath: string;
};

export type PrivateMediaPreviewResult = {
  expiresInSeconds: number;
  signedUrl: string;
  storageBucket: string;
  storagePath: string;
};

export type UploadPolicy = {
  allowedMimeTypes: string[];
  maxImageDimension: number | null;
  maxBytes: number;
  preprocessTriggerBytes: number;
  finalMaxBytes: number;
  jpegQuality: number;
  stripExif: boolean;
  targetMimeType: 'image/jpeg';
};

export type ImageTransformPolicy = Pick<
  UploadPolicy,
  | 'finalMaxBytes'
  | 'jpegQuality'
  | 'maxImageDimension'
  | 'preprocessTriggerBytes'
  | 'stripExif'
  | 'targetMimeType'
>;

export interface UploadAdapter {
  validate(asset: PreparedUploadAsset, policy: UploadPolicy): Promise<void> | void;
  upload(pending: PendingUpload): Promise<UploadResult>;
  retry(pending: PendingUpload): Promise<UploadResult>;
}

export interface UploadAssetPreprocessor {
  prepare(asset: UploadAssetDescriptor, policy: UploadPolicy): Promise<PreparedUploadAsset>;
}

export interface PrivateMediaPreviewAdapter {
  createSignedPreviewUrl(request: PrivateMediaPreviewRequest): Promise<PrivateMediaPreviewResult>;
}

export class UploadValidationError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'UploadValidationError';
  }
}

type SupabaseStorageClient = Pick<SupabaseClient, 'storage'>;

const toUploadBody = async (localUri: string) => {
  const response = await fetch(localUri);

  if (!response.ok) {
    throw new UploadValidationError('asset_fetch_failed', 'Unable to read the local asset.');
  }

  return response.blob();
};

const ensureMimeAllowed = (asset: UploadAssetDescriptor, policy: UploadPolicy) => {
  if (!asset.mimeType || !policy.allowedMimeTypes.includes(asset.mimeType)) {
    throw new UploadValidationError(
      'mime_type_not_allowed',
      'The selected media type is not allowed by the upload policy.',
    );
  }
};

const ensureSizeAllowed = (asset: UploadAssetDescriptor, policy: UploadPolicy) => {
  if (typeof asset.byteSize === 'number' && asset.byteSize > policy.finalMaxBytes) {
    throw new UploadValidationError(
      'file_too_large',
      'The selected media exceeds the upload size limit.',
    );
  }
};

const ensureDimensionsAllowed = (asset: UploadAssetDescriptor, policy: UploadPolicy) => {
  if (policy.maxImageDimension === null) {
    return;
  }

  if (
    (typeof asset.width === 'number' && asset.width > policy.maxImageDimension) ||
    (typeof asset.height === 'number' && asset.height > policy.maxImageDimension)
  ) {
    throw new UploadValidationError(
      'image_dimensions_exceed_limit',
      'The selected image exceeds the maximum supported dimensions.',
    );
  }
};

export const toPreparedUploadAsset = (
  asset: UploadAssetDescriptor,
  overrides: Partial<PreparedUploadAsset> = {},
): PreparedUploadAsset => ({
  ...asset,
  exifStripped: overrides.exifStripped ?? false,
  originalByteSize: overrides.originalByteSize ?? asset.byteSize,
  originalHeight: overrides.originalHeight ?? asset.height,
  originalMimeType: overrides.originalMimeType ?? asset.mimeType,
  originalWidth: overrides.originalWidth ?? asset.width,
  preprocessStatus: overrides.preprocessStatus ?? 'accepted',
});

export const shouldPreprocessAsset = (
  asset: UploadAssetDescriptor,
  policy: ImageTransformPolicy,
) => {
  const maxImageDimension = policy.maxImageDimension ?? 0;

  if (asset.kind !== 'image') {
    return false;
  }

  const largestDimension = Math.max(asset.width ?? 0, asset.height ?? 0);

  return (
    largestDimension > maxImageDimension ||
    (typeof asset.byteSize === 'number' && asset.byteSize > policy.preprocessTriggerBytes)
  );
};

const uploadPendingAsset = async (
  client: SupabaseStorageClient,
  pending: PendingUpload,
): Promise<UploadResult> => {
  const body = await toUploadBody(pending.asset.localUri);
  const { error } = await client.storage
    .from(pending.storageBucket)
    .upload(pending.storagePath, body, {
      contentType: pending.asset.mimeType ?? 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    throw new UploadValidationError('upload_failed', error.message);
  }

  return {
    byteSize: pending.asset.byteSize,
    exifStripped: pending.asset.exifStripped,
    height: pending.asset.height,
    kind: pending.asset.kind,
    mediaId: pending.mediaId,
    publicUrl: null,
    storagePath: pending.storagePath,
    width: pending.asset.width,
  };
};

export const reportImageUploadPolicy: UploadPolicy = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  finalMaxBytes: 15 * 1024 * 1024,
  jpegQuality: 0.75,
  maxBytes: 15 * 1024 * 1024,
  maxImageDimension: 2048,
  preprocessTriggerBytes: 12 * 1024 * 1024,
  stripExif: true,
  targetMimeType: 'image/jpeg',
};

export const createSupabaseUploadAdapter = (
  client: SupabaseStorageClient,
  policy: UploadPolicy = reportImageUploadPolicy,
): UploadAdapter => ({
  validate: (asset) => {
    ensureMimeAllowed(asset, policy);
    ensureDimensionsAllowed(asset, policy);
    ensureSizeAllowed(asset, policy);
  },
  retry: async (pending) => {
    ensureMimeAllowed(pending.asset, policy);
    ensureDimensionsAllowed(pending.asset, policy);
    ensureSizeAllowed(pending.asset, policy);

    return uploadPendingAsset(client, pending);
  },
  upload: async (pending) => {
    ensureMimeAllowed(pending.asset, policy);
    ensureDimensionsAllowed(pending.asset, policy);
    ensureSizeAllowed(pending.asset, policy);

    return uploadPendingAsset(client, pending);
  },
});

export const createSupabasePrivateMediaPreviewAdapter = (
  client: SupabaseStorageClient,
  defaultExpiresInSeconds = 60 * 15,
): PrivateMediaPreviewAdapter => ({
  async createSignedPreviewUrl(request) {
    const expiresInSeconds = request.expiresInSeconds ?? defaultExpiresInSeconds;
    const { data, error } = await client.storage
      .from(request.storageBucket)
      .createSignedUrl(request.storagePath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      throw new UploadValidationError(
        'preview_url_failed',
        error?.message ?? 'Unable to create a signed preview URL.',
      );
    }

    return {
      expiresInSeconds,
      signedUrl: data.signedUrl,
      storageBucket: request.storageBucket,
      storagePath: request.storagePath,
    };
  },
});
