import { performance } from 'node:perf_hooks';

import { describe, expect, it } from 'vitest';

import {
  applySpringCatalogDiscovery,
  defaultSpringDiscoveryState,
} from '../../apps/mobile/src/features/map-browse/discovery';
import { publicSpringCatalogFixture } from '../fixtures/public-spring-data';

const largeCatalog = Array.from({ length: 2000 }, (_, index) => {
  const base = publicSpringCatalogFixture[index % publicSpringCatalogFixture.length]!;

  return {
    ...base,
    alternateNames: [...base.alternateNames, `Alias ${index}`],
    id: `${base.id}-${index}`,
    slug: `${base.slug}-${index}`,
    title: `${base.title} ${index}`,
    updatedAt: new Date(Date.parse(base.updatedAt) + index * 60_000).toISOString(),
  };
});

describe('phase 14 performance smoke: discovery', () => {
  it('applies public catalog discovery across 2000 rows under 500ms', () => {
    applySpringCatalogDiscovery(largeCatalog, {
      ...defaultSpringDiscoveryState,
      freshnessFilter: 'recent',
      searchText: 'עין',
      sortMode: 'recent_activity',
      waterFilter: 'all',
    });

    const start = performance.now();
    const result = applySpringCatalogDiscovery(largeCatalog, {
      ...defaultSpringDiscoveryState,
      freshnessFilter: 'recent',
      searchText: 'עין',
      sortMode: 'recent_activity',
      waterFilter: 'all',
    });
    const durationMs = performance.now() - start;

    expect(result.length).toBeGreaterThan(0);
    expect(durationMs).toBeLessThan(500);
  });
});
