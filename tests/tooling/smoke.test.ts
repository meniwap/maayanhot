import { describe, expect, it } from 'vitest';

import { foundationMarker } from '../../packages/shared-utils/src/index';

describe('phase 1 tooling scaffold', () => {
  it('exposes a shared workspace module', () => {
    expect(foundationMarker).toBe('phase-1-foundation');
  });
});
