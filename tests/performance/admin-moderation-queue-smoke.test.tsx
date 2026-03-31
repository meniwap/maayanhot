// @vitest-environment jsdom

import { performance } from 'node:perf_hooks';

import { cleanup, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const moderationQueueRepositoryModule = vi.hoisted(() => ({
  moderationQueueRepository: {
    applyDecision: vi.fn(),
    getReviewByReportId: vi.fn(),
    listPending: vi.fn(),
  },
}));

vi.mock(
  '../../apps/admin-web/src/infrastructure/supabase/repositories/moderation-queue-repository',
  () => moderationQueueRepositoryModule,
);

import { AdminModerationQueueScreen } from '../../apps/admin-web/src/features/moderation/AdminModerationQueueScreen';
import { createAuthenticatedSnapshot, renderAdmin } from '../web/render-admin';

describe('phase 14 performance smoke: admin moderation queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    moderationQueueRepositoryModule.moderationQueueRepository.listPending.mockResolvedValue({
      items: Array.from({ length: 100 }, (_, index) => ({
        note: `Pending note ${index}`,
        observedAt: '2026-03-30T08:00:00.000Z',
        photoCount: index % 4,
        regionCode: 'jerusalem_hills',
        reportId: `report-${index}`,
        reporterRoleSnapshot: 'user',
        springId: `spring-${index % 12}`,
        springSlug: `spring-${index % 12}`,
        springTitle: `Spring ${index}`,
        submittedAt: '2026-03-30T08:05:00.000Z',
        waterPresence: index % 3 === 0 ? 'unknown' : index % 2 === 0 ? 'water' : 'no_water',
      })),
      nextCursor: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders 100 pending rows under 750ms', async () => {
    const start = performance.now();

    renderAdmin(<AdminModerationQueueScreen />, {
      snapshot: createAuthenticatedSnapshot('moderator'),
    });

    expect(await screen.findByTestId('admin-moderation-item-report-99')).toBeTruthy();

    const durationMs = performance.now() - start;

    expect(durationMs).toBeLessThan(750);
  });
});
