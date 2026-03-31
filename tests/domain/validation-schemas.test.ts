import { describe, expect, it } from 'vitest';

import { submitSpringReportCommandSchema } from '../../packages/contracts/src/index';

describe('shared validation schemas', () => {
  it('rejects report notes longer than 2000 characters', () => {
    const parsed = submitSpringReportCommandSchema.safeParse({
      clientSubmissionId: '11111111-1111-4111-8111-111111111111',
      note: 'א'.repeat(2001),
      observedAt: '2026-03-31T08:00:00.000Z',
      springId: 'spring-1',
      waterPresence: 'water',
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects more than 8 local media draft ids', () => {
    const parsed = submitSpringReportCommandSchema.safeParse({
      clientSubmissionId: '11111111-1111-4111-8111-111111111111',
      localMediaDraftIds: Array.from({ length: 9 }, (_, index) => `draft-${index + 1}`),
      observedAt: '2026-03-31T08:00:00.000Z',
      springId: 'spring-1',
      waterPresence: 'water',
    });

    expect(parsed.success).toBe(false);
  });
});
