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

export type PendingUpload = {
  queueId: string;
  asset: UploadAssetDescriptor;
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

export type UploadPolicy = {
  maxBytes: number;
  allowedMimeTypes: string[];
  stripExif: boolean;
  maxImageDimension: number | null;
};

export interface UploadAdapter {
  validate(asset: UploadAssetDescriptor, policy: UploadPolicy): Promise<void> | void;
  upload(pending: PendingUpload): Promise<UploadResult>;
  retry(pending: PendingUpload): Promise<UploadResult>;
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
  if (typeof asset.byteSize === 'number' && asset.byteSize > policy.maxBytes) {
    throw new UploadValidationError(
      'file_too_large',
      'The selected media exceeds the upload size limit.',
    );
  }
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
    exifStripped: false,
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
  maxBytes: 15 * 1024 * 1024,
  maxImageDimension: null,
  stripExif: false,
};

export const createSupabaseUploadAdapter = (
  client: SupabaseStorageClient,
  policy: UploadPolicy = reportImageUploadPolicy,
): UploadAdapter => ({
  validate: (asset) => {
    ensureMimeAllowed(asset, policy);
    ensureSizeAllowed(asset, policy);
  },
  retry: async (pending) => {
    ensureMimeAllowed(pending.asset, policy);
    ensureSizeAllowed(pending.asset, policy);

    return uploadPendingAsset(client, pending);
  },
  upload: async (pending) => {
    ensureMimeAllowed(pending.asset, policy);
    ensureSizeAllowed(pending.asset, policy);

    return uploadPendingAsset(client, pending);
  },
});
