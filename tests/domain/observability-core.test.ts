import { describe, expect, it } from 'vitest';

import {
  createMemoryObservability,
  createNoopObservability,
} from '../../packages/observability-core/src/index';

describe('observability core', () => {
  it('noop observability adapters never throw', () => {
    const observability = createNoopObservability();

    expect(() =>
      observability.errors.captureError(new Error('boom'), {
        feature: 'test',
      }),
    ).not.toThrow();
    expect(() =>
      observability.analytics.track({
        name: 'report_queue_enqueued',
      }),
    ).not.toThrow();
  });

  it('memory observability records analytics and error payloads', () => {
    const memory = createMemoryObservability();

    memory.observability.analytics.track({
      metadata: {
        queueId: 'queue-1',
      },
      name: 'report_queue_enqueued',
    });
    memory.observability.errors.captureError(new Error('boom'), {
      action: 'submit',
      feature: 'report_queue',
    });

    expect(memory.analytics).toHaveLength(1);
    expect(memory.errors).toHaveLength(1);
    expect(memory.analytics[0]?.name).toBe('report_queue_enqueued');
    expect(memory.errors[0]?.feature).toBe('report_queue');
  });
});
