import type { QueryClient } from '@tanstack/react-query';
import type { SubmitSpringReportCommand } from '@maayanhot/contracts';
import {
  submitSpringReportCommandSchema,
  type IsoTimestampString,
  type ReportId,
} from '@maayanhot/contracts';
import type { FinalizeReportMediaUploadCommand, SpringReportRepository } from '@maayanhot/domain';
import type { AnalyticsTracker, ErrorReporter } from '@maayanhot/observability-core';
import { createNoopAnalyticsTracker, createNoopErrorReporter } from '@maayanhot/observability-core';
import type {
  PendingUpload,
  PreparedUploadAsset,
  UploadAdapter,
  UploadAssetDescriptor,
  UploadAssetPreprocessor,
  UploadResult,
} from '@maayanhot/upload-core';
import {
  UploadValidationError,
  reportImageUploadPolicy,
  toPreparedUploadAsset,
} from '@maayanhot/upload-core';

export type ReportAttachmentDraft = PreparedUploadAsset;

export type SubmitSpringReportDraft = {
  note: string;
  observedAt: IsoTimestampString;
  springId: string;
  waterPresence: 'water' | 'no_water' | 'unknown';
  attachments: ReportAttachmentDraft[];
};

export type QueuedAttachmentDeliveryState =
  | 'binary_uploaded'
  | 'finalize_pending'
  | 'finalized'
  | 'local_ready'
  | 'slot_reserved';

export type QueuedReportAttachment = ReportAttachmentDraft & {
  deliveryState: QueuedAttachmentDeliveryState;
  finalizeCommand: FinalizeReportMediaUploadCommand | null;
  finalizedMediaId: string | null;
  lastErrorCode: string | null;
  pendingUpload: PendingUpload | null;
};

export type QueuedReportStatus =
  | 'blocked_auth'
  | 'failed_permanent'
  | 'queued'
  | 'retry_scheduled'
  | 'syncing';

export type QueuedReportSubmission = {
  attemptCount: number;
  attachments: QueuedReportAttachment[];
  clientSubmissionId: string;
  createdAt: IsoTimestampString;
  lastErrorCode: string | null;
  nextAttemptAt: IsoTimestampString | null;
  note: string | null;
  observedAt: IsoTimestampString;
  ownerUserId: string;
  queueId: string;
  remoteReportId: ReportId | null;
  springId: string;
  status: QueuedReportStatus;
  updatedAt: IsoTimestampString;
  waterPresence: 'water' | 'no_water' | 'unknown';
};

export type OfflineReportDeliveryReceipt = {
  deliveredAt: IsoTimestampString;
  ownerUserId: string;
  queueId: string;
  reportId: string;
  springId: string;
};

export type OfflineReportQueueSnapshot = {
  activeUserId: string | null;
  isAppActive: boolean;
  isHydrated: boolean;
  isOnline: boolean;
  items: QueuedReportSubmission[];
  recentDeliveries: OfflineReportDeliveryReceipt[];
};

export type OfflineReportSubmissionResult =
  | {
      feedback: 'report-pending';
      reportId: string;
      queueId: string;
      status: 'submitted';
    }
  | {
      feedback: 'report-queued-offline';
      queueId: string;
      status: 'queued';
    };

type PersistedQueueState = {
  items: QueuedReportSubmission[];
};

type QueueListener = () => void;

type QueueStorage = {
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  setItem(key: string, value: string): Promise<void>;
};

type QueueFileSystem = {
  copyAsync(options: { from: string; to: string }): Promise<void>;
  deleteAsync(uri: string, options?: { idempotent?: boolean }): Promise<void>;
  documentDirectory: string | null;
  getInfoAsync(uri: string): Promise<{ exists?: boolean; size?: number | null }>;
  makeDirectoryAsync(uri: string, options?: { intermediates?: boolean }): Promise<void>;
};

type QueueDependencies = {
  analyticsTracker?: AnalyticsTracker;
  assetPreprocessor?: UploadAssetPreprocessor;
  clearScheduled: (handle: ReturnType<typeof setTimeout>) => void;
  errorReporter?: ErrorReporter;
  fileSystem: QueueFileSystem;
  now: () => number;
  queryClient: QueryClient;
  reportRepository: SpringReportRepository;
  schedule: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  storage: QueueStorage;
  uploadAdapter: UploadAdapter;
};

const OFFLINE_QUEUE_STORAGE_KEY = 'maayanhot:offline-report-queue:v1';
const OFFLINE_REPORT_DIRECTORY = 'offline-report-queue';
const RETRY_DELAYS_MS = [0, 30_000, 120_000, 600_000, 1_800_000] as const;

const defaultSnapshot: OfflineReportQueueSnapshot = {
  activeUserId: null,
  isAppActive: true,
  isHydrated: false,
  isOnline: true,
  items: [],
  recentDeliveries: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const createClientUuid = () => {
  const fromCrypto = globalThis.crypto?.randomUUID?.();

  if (fromCrypto) {
    return fromCrypto;
  }

  const randomHex = (length: number) =>
    Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  return `${randomHex(8)}-${randomHex(4)}-4${randomHex(3)}-a${randomHex(3)}-${randomHex(12)}`;
};

const toIsoNow = (now: () => number) => new Date(now()).toISOString();

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
  asset: PreparedUploadAsset,
  uploadResult?: UploadResult,
): FinalizeReportMediaUploadCommand => ({
  byteSize: uploadResult?.byteSize ?? asset.byteSize,
  capturedAt: asset.capturedAt,
  exifStripped: uploadResult?.exifStripped ?? asset.exifStripped,
  height: uploadResult?.height ?? asset.height,
  mediaId,
  width: uploadResult?.width ?? asset.width,
});

const toCommand = (item: QueuedReportSubmission): SubmitSpringReportCommand => {
  const parsed = submitSpringReportCommandSchema.parse({
    clientSubmissionId: item.clientSubmissionId,
    localMediaDraftIds: item.attachments.map((attachment) => attachment.localId),
    note: item.note,
    observedAt: item.observedAt,
    springId: item.springId,
    waterPresence: item.waterPresence,
  });

  return {
    clientSubmissionId: parsed.clientSubmissionId,
    observedAt: parsed.observedAt,
    springId: parsed.springId,
    waterPresence: parsed.waterPresence,
    ...(parsed.localMediaDraftIds !== undefined
      ? {
          localMediaDraftIds: parsed.localMediaDraftIds,
        }
      : {}),
    ...(parsed.locationEvidence !== undefined
      ? {
          locationEvidence: parsed.locationEvidence,
        }
      : {}),
    ...(parsed.note !== undefined
      ? {
          note: parsed.note,
        }
      : {}),
  };
};

const nextRetryDelayMs = (attemptCount: number) =>
  RETRY_DELAYS_MS[Math.min(attemptCount, RETRY_DELAYS_MS.length - 1)] ?? RETRY_DELAYS_MS.at(-1)!;

const toErrorCode = (error: unknown) => {
  if (error instanceof UploadValidationError) {
    return error.code;
  }

  if (isRecord(error) && typeof error.code === 'string') {
    return error.code;
  }

  return 'offline_replay_failed';
};

const toStatusCode = (error: unknown) => {
  if (isRecord(error) && typeof error.statusCode === 'number') {
    return error.statusCode;
  }

  if (isRecord(error) && typeof error.status === 'number') {
    return error.status;
  }

  return null;
};

const isPermanentError = (error: unknown) => {
  const errorCode = toErrorCode(error);
  const statusCode = toStatusCode(error);
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();

  if (statusCode === 401 || statusCode === 403 || statusCode === 404) {
    return true;
  }

  if (
    [
      'asset_fetch_failed',
      'file_too_large',
      'file_too_large_after_processing',
      'image_dimensions_exceed_limit',
      'mime_type_not_allowed',
      '23502',
    ].includes(errorCode)
  ) {
    return true;
  }

  return (
    message.includes('not published') ||
    message.includes('validation') ||
    message.includes('not found') ||
    message.includes('owned media slot not found') ||
    message.includes('too many attachments')
  );
};

const toRetryScheduledItem = (
  item: QueuedReportSubmission,
  error: unknown,
  now: () => number,
): QueuedReportSubmission => {
  const attemptCount = item.attemptCount + 1;
  const delayMs = nextRetryDelayMs(attemptCount);

  return {
    ...item,
    attemptCount,
    lastErrorCode: toErrorCode(error),
    nextAttemptAt: new Date(now() + delayMs).toISOString(),
    status: 'retry_scheduled',
    updatedAt: toIsoNow(now),
  };
};

const toPermanentFailureItem = (
  item: QueuedReportSubmission,
  error: unknown,
  now: () => number,
): QueuedReportSubmission => ({
  ...item,
  attemptCount: item.attemptCount + 1,
  lastErrorCode: toErrorCode(error),
  nextAttemptAt: null,
  status: 'failed_permanent',
  updatedAt: toIsoNow(now),
});

const toPreparedAttachment = (asset: PreparedUploadAsset): QueuedReportAttachment => ({
  ...asset,
  deliveryState: 'local_ready',
  finalizeCommand: null,
  finalizedMediaId: null,
  lastErrorCode: null,
  pendingUpload: null,
});

const toPersistedState = (snapshot: OfflineReportQueueSnapshot): PersistedQueueState => ({
  items: snapshot.items,
});

const nextPendingUploadState = (pendingUpload: PendingUpload, errorCode: string | null) => ({
  ...pendingUpload,
  attemptCount: pendingUpload.attemptCount + 1,
  lastErrorCode: errorCode,
});

export class OfflineReportQueueController {
  private readonly analyticsTracker: AnalyticsTracker;
  private readonly errorReporter: ErrorReporter;
  private listeners = new Set<QueueListener>();
  private processing = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private snapshot: OfflineReportQueueSnapshot = defaultSnapshot;

  constructor(private readonly dependencies: QueueDependencies) {
    this.analyticsTracker = dependencies.analyticsTracker ?? createNoopAnalyticsTracker();
    this.errorReporter = dependencies.errorReporter ?? createNoopErrorReporter();
  }

  subscribe(listener: QueueListener) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot() {
    return this.snapshot;
  }

  async hydrate() {
    if (this.snapshot.isHydrated) {
      return;
    }

    const raw = await this.dependencies.storage.getItem(OFFLINE_QUEUE_STORAGE_KEY);

    if (!raw) {
      this.snapshot = {
        ...this.snapshot,
        isHydrated: true,
      };
      this.emit();
      return;
    }

    try {
      const parsed = JSON.parse(raw) as PersistedQueueState;

      this.snapshot = {
        ...this.snapshot,
        isHydrated: true,
        items: parsed.items ?? [],
      };
    } catch {
      this.snapshot = {
        ...this.snapshot,
        isHydrated: true,
        items: [],
      };
    }

    this.emit();
    await this.processQueue();
  }

  async setActiveUser(userId: string | null) {
    const nextItems = this.snapshot.items.map((item) => {
      if (item.status === 'failed_permanent') {
        return item;
      }

      if (!userId || item.ownerUserId !== userId) {
        return item.status === 'blocked_auth'
          ? item
          : {
              ...item,
              status: 'blocked_auth' as const,
              updatedAt: toIsoNow(this.dependencies.now),
            };
      }

      return item.status === 'blocked_auth'
        ? {
            ...item,
            nextAttemptAt: null,
            status: 'queued' as const,
            updatedAt: toIsoNow(this.dependencies.now),
          }
        : item;
    });

    this.snapshot = {
      ...this.snapshot,
      activeUserId: userId,
      items: nextItems,
    };

    await this.persist();
    this.emit();
    await this.processQueue();
  }

  setAppActive(isAppActive: boolean) {
    this.snapshot = {
      ...this.snapshot,
      isAppActive,
    };

    this.emit();
    this.reschedule();

    if (isAppActive) {
      void this.processQueue();
    }
  }

  setOnline(isOnline: boolean) {
    this.snapshot = {
      ...this.snapshot,
      isOnline,
    };

    this.emit();
    this.reschedule();

    if (isOnline) {
      void this.processQueue();
    }
  }

  async prepareAttachment(asset: UploadAssetDescriptor) {
    const documentDirectory = this.dependencies.fileSystem.documentDirectory;

    if (!documentDirectory) {
      throw new Error('Document directory is not available for offline attachments.');
    }

    const directoryUri = `${documentDirectory}${OFFLINE_REPORT_DIRECTORY}/`;
    const directoryInfo = await this.dependencies.fileSystem.getInfoAsync(directoryUri);

    if (!directoryInfo.exists) {
      await this.dependencies.fileSystem.makeDirectoryAsync(directoryUri, {
        intermediates: true,
      });
    }

    const fileExtension = fileExtensionFromAsset(asset) ?? 'jpg';
    const copiedUri = `${directoryUri}${asset.localId}-${createClientUuid()}.${fileExtension}`;

    await this.dependencies.fileSystem.copyAsync({
      from: asset.localUri,
      to: copiedUri,
    });

    try {
      let preparedAsset = toPreparedUploadAsset({
        ...asset,
        localUri: copiedUri,
      });

      if (this.dependencies.assetPreprocessor) {
        preparedAsset = await this.dependencies.assetPreprocessor.prepare(
          preparedAsset,
          reportImageUploadPolicy,
        );
      }

      if (preparedAsset.localUri !== copiedUri) {
        const transformedUri = `${directoryUri}${asset.localId}-${createClientUuid()}.${
          fileExtensionFromAsset(preparedAsset) ?? 'jpg'
        }`;

        await this.dependencies.fileSystem.copyAsync({
          from: preparedAsset.localUri,
          to: transformedUri,
        });
        await this.dependencies.fileSystem.deleteAsync(copiedUri, {
          idempotent: true,
        });
        await this.dependencies.fileSystem.deleteAsync(preparedAsset.localUri, {
          idempotent: true,
        });
        preparedAsset = {
          ...preparedAsset,
          localUri: transformedUri,
        };
      }

      if (preparedAsset.preprocessStatus === 'optimized') {
        void this.analyticsTracker.track({
          metadata: {
            optimizedByteSize: preparedAsset.byteSize,
            originalByteSize: preparedAsset.originalByteSize,
          },
          name: 'report_attachment_preprocessed',
        });
      }

      return toPreparedAttachment(preparedAsset);
    } catch (error) {
      await this.dependencies.fileSystem.deleteAsync(copiedUri, {
        idempotent: true,
      });

      const errorCode = toErrorCode(error);

      if (errorCode === 'file_too_large_after_processing') {
        void this.analyticsTracker.track({
          metadata: {
            originalByteSize: asset.byteSize,
          },
          name: 'report_attachment_rejected_large',
        });
      }

      void this.errorReporter.captureError(error, {
        action: 'prepare_attachment',
        code: errorCode,
        feature: 'report_queue',
        metadata: {
          localId: asset.localId,
        },
        severity: 'warning',
      });

      throw error;
    }
  }

  async discard(queueId: string) {
    const item = this.snapshot.items.find((candidate) => candidate.queueId === queueId);

    if (!item) {
      return;
    }

    await this.cleanupAttachments(item.attachments);
    this.snapshot = {
      ...this.snapshot,
      items: this.snapshot.items.filter((candidate) => candidate.queueId !== queueId),
    };
    await this.persist();
    this.emit();
  }

  async discardPreparedAttachment(attachment: UploadAssetDescriptor) {
    await this.dependencies.fileSystem.deleteAsync(attachment.localUri, {
      idempotent: true,
    });
  }

  async retryNow(queueId: string) {
    const item = this.snapshot.items.find((candidate) => candidate.queueId === queueId);

    if (!item) {
      return;
    }

    this.snapshot = {
      ...this.snapshot,
      items: this.snapshot.items.map((candidate) =>
        candidate.queueId === queueId
          ? {
              ...candidate,
              lastErrorCode: null,
              nextAttemptAt: null,
              status: this.canProcessCandidate(candidate.ownerUserId) ? 'queued' : 'blocked_auth',
              updatedAt: toIsoNow(this.dependencies.now),
            }
          : candidate,
      ),
    };
    await this.persist();
    this.emit();
    await this.processQueue(queueId);
  }

  async submitDraft(
    draft: SubmitSpringReportDraft,
    ownerUserId: string,
  ): Promise<OfflineReportSubmissionResult> {
    const queueId = createClientUuid();
    const parsedCommand = submitSpringReportCommandSchema.parse({
      clientSubmissionId: createClientUuid(),
      localMediaDraftIds: draft.attachments.map((attachment) => attachment.localId),
      note: draft.note.trim().length > 0 ? draft.note.trim() : null,
      observedAt: draft.observedAt,
      springId: draft.springId,
      waterPresence: draft.waterPresence,
    });
    const nowIso = toIsoNow(this.dependencies.now);
    const item: QueuedReportSubmission = {
      attemptCount: 0,
      attachments: draft.attachments.map((attachment) => ({
        ...attachment,
        deliveryState: 'local_ready',
        finalizeCommand: null,
        finalizedMediaId: null,
        lastErrorCode: null,
        pendingUpload: null,
      })),
      clientSubmissionId: parsedCommand.clientSubmissionId,
      createdAt: nowIso,
      lastErrorCode: null,
      nextAttemptAt: null,
      note: parsedCommand.note ?? null,
      observedAt: parsedCommand.observedAt,
      ownerUserId,
      queueId,
      remoteReportId: null,
      springId: parsedCommand.springId,
      status: this.snapshot.activeUserId === ownerUserId ? 'queued' : 'blocked_auth',
      updatedAt: nowIso,
      waterPresence: parsedCommand.waterPresence,
    };

    this.snapshot = {
      ...this.snapshot,
      items: [...this.snapshot.items, item],
    };

    await this.persist();
    this.emit();
    void this.analyticsTracker.track({
      metadata: {
        attachmentCount: item.attachments.length,
        ownerUserId,
        queueId,
        springId: item.springId,
      },
      name: 'report_queue_enqueued',
    });

    if (!this.canProcessCandidate(ownerUserId)) {
      return {
        feedback: 'report-queued-offline',
        queueId,
        status: 'queued',
      };
    }

    const immediateResult = await this.processQueue(queueId);

    if (immediateResult?.kind === 'success') {
      return {
        feedback: 'report-pending',
        queueId,
        reportId: immediateResult.reportId,
        status: 'submitted',
      };
    }

    return {
      feedback: 'report-queued-offline',
      queueId,
      status: 'queued',
    };
  }

  private async processQueue(targetQueueId?: string) {
    if (this.processing || !this.snapshot.isHydrated) {
      return null;
    }

    if (!this.snapshot.isAppActive || !this.snapshot.isOnline || !this.snapshot.activeUserId) {
      this.reschedule();
      return null;
    }

    this.processing = true;

    try {
      let lastResult: { kind: 'success'; queueId: string; reportId: string } | null = null;

      while (true) {
        const nextItem = this.findNextEligibleItem(targetQueueId);

        if (!nextItem) {
          break;
        }

        const outcome = await this.processItem(nextItem);

        if (outcome.kind === 'success') {
          lastResult = outcome;
        }

        if (targetQueueId) {
          break;
        }
      }

      return lastResult;
    } finally {
      this.processing = false;
      this.reschedule();
    }
  }

  private findNextEligibleItem(targetQueueId?: string) {
    const now = this.dependencies.now();

    return (
      [...this.snapshot.items]
        .filter((item) => item.ownerUserId === this.snapshot.activeUserId)
        .filter((item) => (targetQueueId ? item.queueId === targetQueueId : true))
        .filter((item) => item.status === 'queued' || item.status === 'retry_scheduled')
        .filter((item) => !item.nextAttemptAt || Date.parse(item.nextAttemptAt) <= now)
        .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))[0] ?? null
    );
  }

  private async processItem(item: QueuedReportSubmission) {
    await this.replaceItem(item.queueId, {
      ...item,
      lastErrorCode: null,
      status: 'syncing',
      updatedAt: toIsoNow(this.dependencies.now),
    });
    void this.analyticsTracker.track({
      metadata: {
        queueId: item.queueId,
        springId: item.springId,
      },
      name: 'report_queue_replay_started',
    });

    try {
      const report = item.remoteReportId
        ? { id: item.remoteReportId }
        : await this.dependencies.reportRepository.create(toCommand(item));

      let nextItem = this.getItem(item.queueId);

      if (!nextItem) {
        return {
          kind: 'success' as const,
          queueId: item.queueId,
          reportId: report.id,
        };
      }

      nextItem = {
        ...nextItem,
        remoteReportId: report.id,
        updatedAt: toIsoNow(this.dependencies.now),
      };
      await this.replaceItem(item.queueId, nextItem);

      for (const originalAttachment of nextItem.attachments) {
        let attachment = this.getAttachment(nextItem.queueId, originalAttachment.localId);

        if (!attachment || attachment.finalizedMediaId) {
          continue;
        }

        if (attachment.finalizeCommand) {
          const finalizedMedia = await this.finalizeAttachment(nextItem.queueId, attachment);
          attachment = this.getAttachment(nextItem.queueId, originalAttachment.localId);

          if (!attachment || finalizedMedia.id !== attachment.finalizedMediaId) {
            continue;
          }

          continue;
        }

        let pendingUpload = attachment.pendingUpload;

        if (!pendingUpload) {
          const reservedSlot = await this.dependencies.reportRepository.reserveMediaSlot({
            capturedAt: attachment.capturedAt,
            clientMediaDraftId: attachment.localId,
            fileExtension: fileExtensionFromAsset(attachment),
            reportId: report.id,
          });

          pendingUpload = {
            asset: attachment,
            attemptCount: 0,
            lastErrorCode: null,
            mediaId: reservedSlot.mediaId,
            queueId: nextItem.queueId,
            reportId: reservedSlot.reportId,
            storageBucket: reservedSlot.storageBucket,
            storagePath: reservedSlot.storagePath,
          };

          await this.replaceAttachment(nextItem.queueId, attachment.localId, {
            ...attachment,
            deliveryState: 'slot_reserved',
            pendingUpload,
          });
          attachment =
            this.getAttachment(nextItem.queueId, originalAttachment.localId) ?? attachment;
        }

        await this.dependencies.uploadAdapter.validate(attachment, reportImageUploadPolicy);

        try {
          const uploadResult =
            pendingUpload.attemptCount > 0 || pendingUpload.lastErrorCode
              ? await this.dependencies.uploadAdapter.retry({
                  ...pendingUpload,
                  asset: attachment,
                  attemptCount: pendingUpload.attemptCount + 1,
                })
              : await this.dependencies.uploadAdapter.upload({
                  ...pendingUpload,
                  asset: attachment,
                });

          const finalizeCommand = toFinalizeCommand(uploadResult.mediaId, attachment, uploadResult);

          await this.replaceAttachment(nextItem.queueId, attachment.localId, {
            ...attachment,
            deliveryState: 'binary_uploaded',
            finalizeCommand,
            lastErrorCode: null,
            pendingUpload: null,
          });
          await this.replaceAttachment(nextItem.queueId, attachment.localId, {
            ...(this.getAttachment(nextItem.queueId, attachment.localId) ?? attachment),
            deliveryState: 'finalize_pending',
            finalizeCommand,
            lastErrorCode: null,
            pendingUpload: null,
          });
          attachment =
            this.getAttachment(nextItem.queueId, originalAttachment.localId) ?? attachment;

          await this.finalizeAttachment(nextItem.queueId, attachment);
        } catch (error) {
          const errorCode = toErrorCode(error);
          const currentAttachment =
            this.getAttachment(nextItem.queueId, originalAttachment.localId) ?? attachment;

          await this.replaceAttachment(nextItem.queueId, originalAttachment.localId, {
            ...currentAttachment,
            lastErrorCode: errorCode,
            pendingUpload:
              currentAttachment.pendingUpload !== null
                ? nextPendingUploadState(currentAttachment.pendingUpload, errorCode)
                : currentAttachment.pendingUpload,
          });

          throw error;
        }
      }

      const completedItem = this.getItem(item.queueId);

      if (completedItem) {
        await this.cleanupAttachments(completedItem.attachments);
      }

      this.snapshot = {
        ...this.snapshot,
        items: this.snapshot.items.filter((candidate) => candidate.queueId !== item.queueId),
        recentDeliveries: [
          {
            deliveredAt: toIsoNow(this.dependencies.now),
            ownerUserId: item.ownerUserId,
            queueId: item.queueId,
            reportId: report.id,
            springId: item.springId,
          },
          ...this.snapshot.recentDeliveries.filter(
            (candidate) => candidate.queueId !== item.queueId,
          ),
        ].slice(0, 12),
      };
      await this.persist();
      this.emit();
      void this.analyticsTracker.track({
        metadata: {
          queueId: item.queueId,
          reportId: report.id,
          springId: item.springId,
        },
        name: 'report_queue_replay_succeeded',
      });
      await this.dependencies.queryClient.invalidateQueries({
        queryKey: ['public-spring-catalog'],
      });
      await this.dependencies.queryClient.invalidateQueries({
        queryKey: ['public-spring-detail', item.springId],
      });

      return {
        kind: 'success' as const,
        queueId: item.queueId,
        reportId: report.id,
      };
    } catch (error) {
      const currentItem = this.getItem(item.queueId);

      if (!currentItem) {
        return {
          kind: 'error' as const,
        };
      }

      const nextItem = isPermanentError(error)
        ? toPermanentFailureItem(currentItem, error, this.dependencies.now)
        : toRetryScheduledItem(currentItem, error, this.dependencies.now);
      const errorCode = toErrorCode(error);

      await this.replaceItem(currentItem.queueId, nextItem);
      void this.errorReporter.captureError(error, {
        action: 'process_queue_item',
        code: errorCode,
        feature: 'report_queue',
        metadata: {
          queueId: currentItem.queueId,
          springId: currentItem.springId,
          status: nextItem.status,
        },
        severity: nextItem.status === 'failed_permanent' ? 'error' : 'warning',
      });
      void this.analyticsTracker.track({
        metadata: {
          errorCode,
          queueId: currentItem.queueId,
          springId: currentItem.springId,
        },
        name:
          nextItem.status === 'failed_permanent'
            ? 'report_queue_failed_permanent'
            : 'report_queue_retry_scheduled',
      });

      return {
        kind: 'error' as const,
      };
    }
  }

  private async finalizeAttachment(queueId: string, attachment: QueuedReportAttachment) {
    if (!attachment.finalizeCommand) {
      throw new Error('Finalize command is missing for the uploaded attachment.');
    }

    const finalizedMedia = await this.dependencies.reportRepository.finalizeMediaUpload(
      attachment.finalizeCommand,
    );

    await this.replaceAttachment(queueId, attachment.localId, {
      ...attachment,
      deliveryState: 'finalized',
      finalizeCommand: null,
      finalizedMediaId: finalizedMedia.id,
      lastErrorCode: null,
      pendingUpload: null,
    });

    return finalizedMedia;
  }

  private canProcessCandidate(ownerUserId: string) {
    return (
      this.snapshot.isHydrated &&
      this.snapshot.isAppActive &&
      this.snapshot.isOnline &&
      this.snapshot.activeUserId === ownerUserId
    );
  }

  private getItem(queueId: string) {
    return this.snapshot.items.find((candidate) => candidate.queueId === queueId) ?? null;
  }

  private getAttachment(queueId: string, localId: string) {
    const item = this.getItem(queueId);

    return item?.attachments.find((attachment) => attachment.localId === localId) ?? null;
  }

  private async replaceAttachment(
    queueId: string,
    localId: string,
    nextAttachment: QueuedReportAttachment,
  ) {
    const item = this.getItem(queueId);

    if (!item) {
      return;
    }

    await this.replaceItem(queueId, {
      ...item,
      attachments: item.attachments.map((attachment) =>
        attachment.localId === localId ? nextAttachment : attachment,
      ),
      updatedAt: toIsoNow(this.dependencies.now),
    });
  }

  private async replaceItem(queueId: string, nextItem: QueuedReportSubmission) {
    this.snapshot = {
      ...this.snapshot,
      items: this.snapshot.items.map((candidate) =>
        candidate.queueId === queueId ? nextItem : candidate,
      ),
    };
    await this.persist();
    this.emit();
  }

  private async persist() {
    const persistedState = toPersistedState(this.snapshot);

    if (persistedState.items.length === 0) {
      await this.dependencies.storage.removeItem(OFFLINE_QUEUE_STORAGE_KEY);
      return;
    }

    await this.dependencies.storage.setItem(
      OFFLINE_QUEUE_STORAGE_KEY,
      JSON.stringify(persistedState),
    );
  }

  private emit() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private reschedule() {
    if (this.retryTimer) {
      this.dependencies.clearScheduled(this.retryTimer);
      this.retryTimer = null;
    }

    if (
      !this.snapshot.isHydrated ||
      !this.snapshot.isOnline ||
      !this.snapshot.isAppActive ||
      !this.snapshot.activeUserId
    ) {
      return;
    }

    const nextItem = [...this.snapshot.items]
      .filter((item) => item.ownerUserId === this.snapshot.activeUserId)
      .filter((item) => item.status === 'retry_scheduled' && item.nextAttemptAt)
      .sort((left, right) => Date.parse(left.nextAttemptAt!) - Date.parse(right.nextAttemptAt!))[0];

    if (!nextItem?.nextAttemptAt) {
      return;
    }

    const delayMs = Math.max(0, Date.parse(nextItem.nextAttemptAt) - this.dependencies.now());

    this.retryTimer = this.dependencies.schedule(() => {
      void this.processQueue();
    }, delayMs);
  }

  private async cleanupAttachments(attachments: QueuedReportAttachment[]) {
    for (const attachment of attachments) {
      await this.dependencies.fileSystem.deleteAsync(attachment.localUri, {
        idempotent: true,
      });
    }
  }
}
