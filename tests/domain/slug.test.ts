import {
  generateSpringSlugFromTitle,
  normalizeSpringSlug,
  resolveSpringSlugConflict,
} from '@maayanhot/domain';
import { describe, expect, it } from 'vitest';

describe('slug helpers', () => {
  it('normalizes mixed-language titles into stable spring slugs', () => {
    expect(generateSpringSlugFromTitle('Ein Haniya')).toBe('ein-haniya');
    expect(normalizeSpringSlug('עין חניה')).toBe('ayn-hnyh');
  });

  it('resolves conflicts with numeric suffixes deterministically', () => {
    expect(resolveSpringSlugConflict('ein-haniya', ['ein-haniya'])).toBe('ein-haniya-2');
    expect(resolveSpringSlugConflict('ein-haniya', ['ein-haniya', 'ein-haniya-2'])).toBe(
      'ein-haniya-3',
    );
  });
});
