import { performance } from 'node:perf_hooks';

import { describe, expect, it } from 'vitest';

import { deriveSpringStatusProjection } from '../../packages/domain/src/status';

const reports = Array.from({ length: 500 }, (_, index) => ({
  id: `report-${index}`,
  locationEvidence: {
    latitude: 31.7,
    longitude: 35.1,
    precisionMeters: index % 3 === 0 ? 25 : 180,
  },
  mediaIds: index % 2 === 0 ? [`media-${index}`] : [],
  moderationStatus: 'approved' as const,
  note: index % 5 === 0 ? 'Observed from the path.' : null,
  observedAt: new Date(Date.parse('2026-03-30T10:00:00.000Z') - index * 3_600_000).toISOString(),
  reporterRoleSnapshot: index % 7 === 0 ? ('trusted_contributor' as const) : ('user' as const),
  reporterUserId: `user-${index % 40}`,
  springId: 'spring-1',
  submittedAt: new Date(Date.parse('2026-03-30T10:30:00.000Z') - index * 3_600_000).toISOString(),
  waterPresence:
    index % 6 === 0
      ? ('unknown' as const)
      : index % 3 === 0
        ? ('no_water' as const)
        : ('water' as const),
}));

const mediaByReportId = Object.fromEntries(
  reports
    .filter((report) => report.mediaIds.length > 0)
    .map((report) => [
      report.id,
      [
        {
          byteSize: 1_200_000,
          capturedAt: report.observedAt,
          createdAt: report.submittedAt,
          exifStripped: true,
          height: 900,
          id: report.mediaIds[0]!,
          mediaType: 'image' as const,
          publicUrl: null,
          reportId: report.id,
          springId: report.springId,
          storageBucket: 'report-media',
          storagePath: `${report.reporterUserId}/${report.id}/${report.mediaIds[0]}.jpg`,
          uploadState: 'uploaded' as const,
          width: 1200,
        },
      ],
    ]),
);

describe('phase 14 performance smoke: status derivation', () => {
  it('derives a projection from 500 approved reports under 150ms', () => {
    deriveSpringStatusProjection({
      mediaByReportId,
      now: '2026-03-31T10:00:00.000Z',
      reports,
      springId: 'spring-1',
    });

    const start = performance.now();
    const result = deriveSpringStatusProjection({
      mediaByReportId,
      now: '2026-03-31T10:00:00.000Z',
      reports,
      springId: 'spring-1',
    });
    const durationMs = performance.now() - start;

    expect(result.springId).toBe('spring-1');
    expect(durationMs).toBeLessThan(150);
  });
});
