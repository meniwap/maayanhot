import {
  shouldReplaceSpringStatusProjection,
  type SpringStatusProjection,
} from '@maayanhot/domain';
import { describe, expect, it } from 'vitest';

const makeProjection = (
  overrides: Partial<SpringStatusProjection> = {},
): SpringStatusProjection => ({
  approvedReportCountConsidered: overrides.approvedReportCountConsidered ?? 2,
  confidence: overrides.confidence ?? 'medium',
  derivedFromReportIds: overrides.derivedFromReportIds ?? ['report-1', 'report-2'],
  freshness: overrides.freshness ?? 'recent',
  latestApprovedReportAt: overrides.latestApprovedReportAt ?? '2026-03-26T08:00:00.000Z',
  recalculatedAt: overrides.recalculatedAt ?? '2026-03-26T09:00:00.000Z',
  springId: overrides.springId ?? 'spring-1',
  waterPresence: overrides.waterPresence ?? 'water',
});

describe('projection cache updates', () => {
  it('accepts a write when no cached projection exists yet', () => {
    expect(shouldReplaceSpringStatusProjection(null, makeProjection())).toBe(true);
  });

  it('accepts a write when the new projection is newer than the cached one', () => {
    expect(
      shouldReplaceSpringStatusProjection(
        makeProjection({
          recalculatedAt: '2026-03-26T08:55:00.000Z',
        }),
        makeProjection({
          recalculatedAt: '2026-03-26T09:00:00.000Z',
        }),
      ),
    ).toBe(true);
  });

  it('rejects a stale write when the cached projection is newer', () => {
    expect(
      shouldReplaceSpringStatusProjection(
        makeProjection({
          recalculatedAt: '2026-03-26T09:05:00.000Z',
        }),
        makeProjection({
          recalculatedAt: '2026-03-26T09:00:00.000Z',
        }),
      ),
    ).toBe(false);
  });
});
