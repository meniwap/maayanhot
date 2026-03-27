import { QueryClient } from '@tanstack/react-query';
import type { SpringMedia, SpringReportRepository } from '@maayanhot/domain';
import type { UploadAdapter } from '@maayanhot/upload-core';
import { describe, expect, it, vi } from 'vitest';

import {
  OfflineReportQueueController,
  type ReportAttachmentDraft,
} from '../../apps/mobile/src/infrastructure/offline/offline-report-queue';

const makeAttachment = (overrides: Partial<ReportAttachmentDraft> = {}): ReportAttachmentDraft => ({
  byteSize: 1_234,
  capturedAt: '2026-03-27T09:00:00.000Z',
  height: 900,
  kind: 'image',
  localId: 'asset-1',
  localUri: 'file:///tmp/photo-1.jpg',
  mimeType: 'image/jpeg',
  width: 1200,
  ...overrides,
});

const makeStorage = () => {
  const values = new Map<string, string>();

  return {
    async getItem(key: string) {
      return values.get(key) ?? null;
    },
    async removeItem(key: string) {
      values.delete(key);
    },
    async setItem(key: string, value: string) {
      values.set(key, value);
    },
    values,
  };
};

const makeFileSystem = () => {
  const copied = new Map<string, string>();
  const deleted: string[] = [];
  const directories = new Set<string>();

  return {
    async copyAsync(options: { from: string; to: string }) {
      copied.set(options.to, options.from);
    },
    async deleteAsync(uri: string) {
      deleted.push(uri);
      copied.delete(uri);
    },
    documentDirectory: 'file:///documents/',
    async getInfoAsync(uri: string) {
      return {
        exists: directories.has(uri),
      };
    },
    async makeDirectoryAsync(uri: string) {
      directories.add(uri);
    },
    copied,
    deleted,
  };
};

const makeDependencies = () => {
  const storage = makeStorage();
  const fileSystem = makeFileSystem();
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  let now = Date.parse('2026-03-27T10:00:00.000Z');

  const sampleMedia: SpringMedia = {
    byteSize: 1_234,
    capturedAt: '2026-03-27T09:00:00.000Z',
    createdAt: '2026-03-27T10:01:00.000Z',
    exifStripped: false,
    height: 900,
    id: 'media-1',
    mediaType: 'image',
    publicUrl: null,
    reportId: 'report-1',
    springId: 'spring-1',
    storageBucket: 'report-media',
    storagePath: 'user-1/report-1/media-1.jpg',
    uploadState: 'uploaded',
    width: 1200,
  };

  const reportRepository = {
    create: vi.fn(async () => ({
      id: 'report-1',
      locationEvidence: {
        latitude: null,
        longitude: null,
        precisionMeters: null,
      },
      mediaIds: [],
      moderationStatus: 'pending' as const,
      note: null,
      observedAt: '2026-03-27T09:00:00.000Z',
      reporterRoleSnapshot: 'user' as const,
      reporterUserId: 'user-1',
      springId: 'spring-1',
      submittedAt: '2026-03-27T10:00:00.000Z',
      waterPresence: 'water' as const,
    })),
    finalizeMediaUpload: vi.fn(async () => sampleMedia),
    getById: vi.fn(async () => null),
    listBySpringId: vi.fn(async () => []),
    listMediaByReportIds: vi.fn(async () => ({})),
    reserveMediaSlot: vi.fn(async () => ({
      capturedAt: '2026-03-27T09:00:00.000Z',
      mediaId: 'media-1',
      reportId: 'report-1',
      springId: 'spring-1',
      storageBucket: 'report-media',
      storagePath: 'user-1/report-1/media-1.jpg',
      uploadState: 'pending' as const,
    })),
  } satisfies SpringReportRepository;

  const uploadAdapter = {
    retry: vi.fn(async (pending) => ({
      byteSize: pending.asset.byteSize,
      exifStripped: false,
      height: pending.asset.height,
      kind: pending.asset.kind,
      mediaId: pending.mediaId,
      publicUrl: null,
      storagePath: pending.storagePath,
      width: pending.asset.width,
    })),
    upload: vi.fn(async (pending) => ({
      byteSize: pending.asset.byteSize,
      exifStripped: false,
      height: pending.asset.height,
      kind: pending.asset.kind,
      mediaId: pending.mediaId,
      publicUrl: null,
      storagePath: pending.storagePath,
      width: pending.asset.width,
    })),
    validate: vi.fn(),
  } satisfies UploadAdapter;

  const controller = new OfflineReportQueueController({
    clearScheduled: (handle) => clearTimeout(handle),
    fileSystem,
    now: () => now,
    queryClient,
    reportRepository,
    schedule: (callback, delayMs) => setTimeout(callback, delayMs),
    storage,
    uploadAdapter,
  });

  return {
    controller,
    fileSystem,
    invalidateSpy,
    queryClient,
    reportRepository,
    setNow: (value: number) => {
      now = value;
    },
    storage,
    uploadAdapter,
  };
};

describe('phase 11 offline report queue', () => {
  it('copies selected attachments into app-private storage for relaunch-safe queueing', async () => {
    const { controller, fileSystem } = makeDependencies();

    const prepared = await controller.prepareAttachment(makeAttachment());

    expect(prepared.localUri).toContain('file:///documents/offline-report-queue/');
    expect(fileSystem.copied.get(prepared.localUri)).toBe('file:///tmp/photo-1.jpg');
  });

  it('queues a report locally when offline and persists it across relaunch', async () => {
    const { controller, storage } = makeDependencies();

    await controller.hydrate();
    await controller.setActiveUser('user-1');
    controller.setOnline(false);

    const result = await controller.submitDraft(
      {
        attachments: [makeAttachment()],
        note: 'offline draft',
        observedAt: '2026-03-27T09:00:00.000Z',
        springId: 'spring-1',
        waterPresence: 'water',
      },
      'user-1',
    );

    expect(result.status).toBe('queued');
    expect(controller.getSnapshot().items).toHaveLength(1);
    expect(controller.getSnapshot().items[0]?.status).toBe('queued');
    expect(storage.values.get('maayanhot:offline-report-queue:v1')).toContain('offline draft');

    const restored = makeDependencies();
    await restored.storage.setItem(
      'maayanhot:offline-report-queue:v1',
      storage.values.get('maayanhot:offline-report-queue:v1') ?? '',
    );
    await restored.controller.hydrate();

    expect(restored.controller.getSnapshot().items).toHaveLength(1);
    expect(restored.controller.getSnapshot().items[0]?.note).toBe('offline draft');
  });

  it('replays a persisted queued report only when the same user signs back in', async () => {
    const setup = makeDependencies();

    await setup.controller.hydrate();
    await setup.controller.setActiveUser('user-1');
    setup.controller.setOnline(false);
    await setup.controller.submitDraft(
      {
        attachments: [],
        note: 'queued offline',
        observedAt: '2026-03-27T09:00:00.000Z',
        springId: 'spring-1',
        waterPresence: 'unknown',
      },
      'user-1',
    );

    const restored = makeDependencies();
    await restored.storage.setItem(
      'maayanhot:offline-report-queue:v1',
      setup.storage.values.get('maayanhot:offline-report-queue:v1') ?? '',
    );
    await restored.controller.hydrate();
    restored.controller.setOnline(true);

    await restored.controller.setActiveUser('user-2');
    expect(restored.reportRepository.create).not.toHaveBeenCalled();
    expect(restored.controller.getSnapshot().items).toHaveLength(1);

    await restored.controller.setActiveUser('user-1');
    expect(restored.reportRepository.create).toHaveBeenCalledOnce();
    expect(restored.controller.getSnapshot().items).toHaveLength(0);
  });

  it('schedules retry backoff for transient upload failures and keeps the queue item', async () => {
    const setup = makeDependencies();

    setup.uploadAdapter.upload.mockRejectedValueOnce(new Error('temporary upload failure'));

    await setup.controller.hydrate();
    await setup.controller.setActiveUser('user-1');
    setup.controller.setOnline(true);

    const result = await setup.controller.submitDraft(
      {
        attachments: [makeAttachment()],
        note: 'retry me',
        observedAt: '2026-03-27T09:00:00.000Z',
        springId: 'spring-1',
        waterPresence: 'water',
      },
      'user-1',
    );

    expect(result.status).toBe('queued');
    const queued = setup.controller.getSnapshot().items[0];

    expect(queued?.status).toBe('retry_scheduled');
    expect(queued?.attemptCount).toBe(1);
    expect(queued?.nextAttemptAt).not.toBeNull();
  });

  it('reuses the created report and reserved media slot on retry after partial progress', async () => {
    const setup = makeDependencies();

    setup.uploadAdapter.upload.mockRejectedValueOnce(new Error('temporary upload failure'));

    await setup.controller.hydrate();
    await setup.controller.setActiveUser('user-1');
    setup.controller.setOnline(true);

    await setup.controller.submitDraft(
      {
        attachments: [makeAttachment()],
        note: 'partial progress',
        observedAt: '2026-03-27T09:00:00.000Z',
        springId: 'spring-1',
        waterPresence: 'water',
      },
      'user-1',
    );

    const queueId = setup.controller.getSnapshot().items[0]?.queueId;
    expect(queueId).toBeTruthy();
    expect(setup.reportRepository.create).toHaveBeenCalledTimes(1);
    expect(setup.reportRepository.reserveMediaSlot).toHaveBeenCalledTimes(1);

    await setup.controller.retryNow(queueId!);

    expect(setup.reportRepository.create).toHaveBeenCalledTimes(1);
    expect(setup.reportRepository.reserveMediaSlot).toHaveBeenCalledTimes(1);
    expect(setup.reportRepository.finalizeMediaUpload).toHaveBeenCalledTimes(1);
    expect(setup.invalidateSpy).toHaveBeenCalled();
    expect(setup.controller.getSnapshot().items).toHaveLength(0);
    expect(setup.controller.getSnapshot().recentDeliveries).toHaveLength(1);
  });
});
