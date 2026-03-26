import type { IsoTimestampString, MediaId, ReportId, UploadAssetKind } from '@maayanhot/contracts';

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
  reportId: ReportId | null;
  asset: UploadAssetDescriptor;
  attemptCount: number;
  lastErrorCode: string | null;
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
