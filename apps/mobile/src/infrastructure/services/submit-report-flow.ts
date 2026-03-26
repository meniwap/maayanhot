import { submitSpringReportCommandSchema, type IsoTimestampString } from '@maayanhot/contracts';
import type { PendingUpload, UploadAdapter, UploadAssetDescriptor } from '@maayanhot/upload-core';
import type {
  FinalizeReportMediaUploadCommand,
  SpringMedia,
  SpringReportRepository,
} from '@maayanhot/domain';

const fileExtensionFromAsset = (asset: UploadAssetDescriptor) => {
  const fromMime = asset.mimeType?.split('/')[1]?.toLowerCase() ?? null;

  if (fromMime) {
    return fromMime === 'jpeg' ? 'jpg' : fromMime;
  }

  const uriParts = asset.localUri.split('.');
  const uriExtension = uriParts.length > 1 ? uriParts[uriParts.length - 1] : null;

  return uriExtension?.toLowerCase() ?? null;
};

const toFinalizeCommand = (
  mediaId: string,
  asset: UploadAssetDescriptor,
): FinalizeReportMediaUploadCommand => ({
  byteSize: asset.byteSize,
  capturedAt: asset.capturedAt,
  exifStripped: false,
  height: asset.height,
  mediaId,
  width: asset.width,
});

const toErrorCode = (error: unknown) => {
  if (error instanceof Error && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }

  return 'upload_failed';
};

export type ReportAttachmentDraft = UploadAssetDescriptor & {
  localId: string;
};

export type SubmitSpringReportDraft = {
  note: string;
  observedAt: IsoTimestampString;
  springId: string;
  waterPresence: 'water' | 'no_water' | 'unknown';
  attachments: ReportAttachmentDraft[];
};

export type ReportSubmissionResult = {
  failedUploads: PendingUpload[];
  reportId: string;
  uploadedMedia: SpringMedia[];
};

export class SubmitReportFlow {
  constructor(
    private readonly reportRepository: SpringReportRepository,
    private readonly uploadAdapter: UploadAdapter,
  ) {}

  async submit(input: SubmitSpringReportDraft): Promise<ReportSubmissionResult> {
    const parsedCommand = submitSpringReportCommandSchema.parse({
      localMediaDraftIds: input.attachments.map((asset) => asset.localId),
      note: input.note.trim().length > 0 ? input.note : null,
      observedAt: input.observedAt,
      springId: input.springId,
      waterPresence: input.waterPresence,
    });
    const command = {
      observedAt: parsedCommand.observedAt,
      springId: parsedCommand.springId,
      waterPresence: parsedCommand.waterPresence,
      ...(parsedCommand.localMediaDraftIds !== undefined
        ? { localMediaDraftIds: parsedCommand.localMediaDraftIds }
        : {}),
      ...(parsedCommand.locationEvidence !== undefined
        ? { locationEvidence: parsedCommand.locationEvidence }
        : {}),
      ...(parsedCommand.note !== undefined ? { note: parsedCommand.note } : {}),
    };

    const report = await this.reportRepository.create(command);
    const failedUploads: PendingUpload[] = [];
    const uploadedMedia: SpringMedia[] = [];

    for (const asset of input.attachments) {
      const slot = await this.reportRepository.reserveMediaSlot({
        capturedAt: asset.capturedAt,
        fileExtension: fileExtensionFromAsset(asset),
        reportId: report.id,
      });

      const pendingUpload: PendingUpload = {
        asset,
        attemptCount: 0,
        lastErrorCode: null,
        mediaId: slot.mediaId,
        queueId: asset.localId,
        reportId: slot.reportId,
        storageBucket: slot.storageBucket,
        storagePath: slot.storagePath,
      };

      try {
        this.uploadAdapter.validate(asset, {
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
          maxBytes: 15 * 1024 * 1024,
          maxImageDimension: null,
          stripExif: false,
        });

        const uploadResult = await this.uploadAdapter.upload(pendingUpload);
        const finalizedMedia = await this.reportRepository.finalizeMediaUpload(
          toFinalizeCommand(uploadResult.mediaId, asset),
        );

        uploadedMedia.push(finalizedMedia);
      } catch (error) {
        failedUploads.push({
          ...pendingUpload,
          attemptCount: 1,
          lastErrorCode: toErrorCode(error),
        });
      }
    }

    return {
      failedUploads,
      reportId: report.id,
      uploadedMedia,
    };
  }

  async retryUpload(pendingUpload: PendingUpload) {
    this.uploadAdapter.validate(pendingUpload.asset, {
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
      maxBytes: 15 * 1024 * 1024,
      maxImageDimension: null,
      stripExif: false,
    });

    const uploadResult = await this.uploadAdapter.retry({
      ...pendingUpload,
      attemptCount: pendingUpload.attemptCount + 1,
    });

    return this.reportRepository.finalizeMediaUpload(
      toFinalizeCommand(uploadResult.mediaId, pendingUpload.asset),
    );
  }
}
