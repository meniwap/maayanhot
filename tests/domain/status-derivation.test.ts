import type { ReportId } from '@maayanhot/contracts';
import {
  deriveSpringStatusProjection,
  filterApprovedReportsForPublicStatus,
  type SpringMedia,
  type SpringReport,
} from '@maayanhot/domain';
import { describe, expect, it } from 'vitest';

const springId = 'spring-ein-karem';
const now = '2026-03-26T12:00:00.000Z';

const makeReport = (overrides: Partial<SpringReport> & Pick<SpringReport, 'id'>): SpringReport => ({
  id: overrides.id,
  springId,
  reporterUserId: overrides.reporterUserId ?? 'user-1',
  observedAt: overrides.observedAt ?? '2026-03-25T08:00:00.000Z',
  submittedAt: overrides.submittedAt ?? '2026-03-25T08:30:00.000Z',
  waterPresence: overrides.waterPresence ?? 'unknown',
  note: overrides.note ?? null,
  locationEvidence: overrides.locationEvidence ?? {
    latitude: null,
    longitude: null,
    precisionMeters: null,
  },
  moderationStatus: overrides.moderationStatus ?? 'approved',
  mediaIds: overrides.mediaIds ?? [],
  reporterRoleSnapshot: overrides.reporterRoleSnapshot ?? null,
});

const makeMedia = (reportId: ReportId): SpringMedia => ({
  id: `media-${reportId}`,
  springId,
  reportId,
  storageBucket: 'report-media',
  storagePath: `reports/${reportId}/cover.jpg`,
  publicUrl: `https://example.com/${reportId}.jpg`,
  width: 1200,
  height: 900,
  byteSize: 240000,
  mediaType: 'image',
  exifStripped: true,
  uploadState: 'uploaded',
  createdAt: '2026-03-25T08:31:00.000Z',
  capturedAt: '2026-03-25T08:00:00.000Z',
});

describe('status derivation', () => {
  it('uses approved reports only for the public projection', () => {
    const projection = deriveSpringStatusProjection({
      springId,
      now,
      reports: [
        makeReport({
          id: 'report-approved',
          observedAt: '2026-03-24T09:00:00.000Z',
          waterPresence: 'water',
          moderationStatus: 'approved',
        }),
        makeReport({
          id: 'report-pending',
          observedAt: '2026-03-26T09:00:00.000Z',
          waterPresence: 'no_water',
          moderationStatus: 'pending',
        }),
      ],
    });

    expect(projection.waterPresence).toBe('water');
    expect(projection.derivedFromReportIds).toEqual(['report-approved']);
    expect(projection.latestApprovedReportAt).toBe('2026-03-24T09:00:00.000Z');
  });

  it('falls back to unknown when there is no approved evidence', () => {
    const projection = deriveSpringStatusProjection({
      springId,
      now,
      reports: [
        makeReport({ id: 'report-1', moderationStatus: 'pending' }),
        makeReport({ id: 'report-2', moderationStatus: 'rejected' }),
      ],
    });

    expect(projection.waterPresence).toBe('unknown');
    expect(projection.freshness).toBe('none');
    expect(projection.confidence).toBe('low');
    expect(projection.derivedFromReportIds).toEqual([]);
  });

  it('marks old approved evidence as stale', () => {
    const projection = deriveSpringStatusProjection({
      springId,
      now,
      reports: [
        makeReport({
          id: 'report-old',
          observedAt: '2026-03-20T10:00:00.000Z',
          waterPresence: 'water',
        }),
      ],
    });

    expect(projection.waterPresence).toBe('water');
    expect(projection.freshness).toBe('stale');
  });

  it('lets evidence weighting influence the winning water presence', () => {
    const dryReport = makeReport({
      id: 'report-dry',
      waterPresence: 'no_water',
      note: 'הבריכה ריקה',
    });
    const wetReport = makeReport({
      id: 'report-wet',
      waterPresence: 'water',
      note: null,
    });

    const projection = deriveSpringStatusProjection({
      springId,
      now,
      reports: [wetReport, dryReport],
      mediaByReportId: {
        'report-dry': [makeMedia('report-dry')],
      },
    });

    expect(projection.waterPresence).toBe('no_water');
    expect(projection.confidence).toBe('medium');
  });

  it('lets reporter role weighting influence the winning water presence', () => {
    const projection = deriveSpringStatusProjection({
      springId,
      now,
      reports: [
        makeReport({
          id: 'report-user',
          reporterUserId: 'user-basic',
          waterPresence: 'water',
          reporterRoleSnapshot: 'user',
        }),
        makeReport({
          id: 'report-trusted',
          reporterUserId: 'user-trusted',
          waterPresence: 'no_water',
        }),
      ],
      reporterRolesByUserId: {
        'user-basic': 'user',
        'user-trusted': 'trusted_contributor',
      },
    });

    expect(projection.waterPresence).toBe('no_water');
  });

  it('sorts approved reports by observation time before derivation', () => {
    const approved = filterApprovedReportsForPublicStatus([
      makeReport({
        id: 'report-a',
        observedAt: '2026-03-22T10:00:00.000Z',
        moderationStatus: 'approved',
      }),
      makeReport({
        id: 'report-b',
        observedAt: '2026-03-24T10:00:00.000Z',
        moderationStatus: 'approved',
      }),
      makeReport({
        id: 'report-c',
        observedAt: '2026-03-26T10:00:00.000Z',
        moderationStatus: 'pending',
      }),
    ]);

    expect(approved.map((report) => report.id)).toEqual(['report-b', 'report-a']);
  });
});
