import { describe, expect, it } from 'vitest';

import {
  applySpringCatalogDiscovery,
  defaultSpringDiscoveryState,
  hasActiveDiscoveryRefinements,
} from '../../apps/mobile/src/features/map-browse/discovery';
import { getQueryPersistenceOptions } from '../../apps/mobile/src/infrastructure/query/query-client';
import { publicSpringCatalogFixture } from '../fixtures/public-spring-data';

describe('phase 12 spring discovery helper', () => {
  it('matches title and alternate-name searches on the public-safe catalog only', () => {
    const byTitle = applySpringCatalogDiscovery(publicSpringCatalogFixture, {
      ...defaultSpringDiscoveryState,
      searchText: 'חניה',
    });
    const byAlternateName = applySpringCatalogDiscovery(publicSpringCatalogFixture, {
      ...defaultSpringDiscoveryState,
      searchText: 'prat',
    });

    expect(byTitle.map((spring) => spring.id)).toEqual(['spring-ein-haniya']);
    expect(byAlternateName.map((spring) => spring.id)).toEqual(['spring-ein-fara']);
  });

  it('matches slug and region searches with normalized case-insensitive text', () => {
    const bySlug = applySpringCatalogDiscovery(publicSpringCatalogFixture, {
      ...defaultSpringDiscoveryState,
      searchText: '  EIN-TINA ',
    });
    const byRegion = applySpringCatalogDiscovery(publicSpringCatalogFixture, {
      ...defaultSpringDiscoveryState,
      searchText: 'הנגב',
    });

    expect(bySlug.map((spring) => spring.id)).toEqual(['spring-ein-tina']);
    expect(byRegion.map((spring) => spring.id)).toEqual(['spring-ein-akev']);
  });

  it('filters conjunctively by water state and freshness', () => {
    const results = applySpringCatalogDiscovery(publicSpringCatalogFixture, {
      ...defaultSpringDiscoveryState,
      freshnessFilter: 'recent',
      waterFilter: 'water',
    });

    expect(results.map((spring) => spring.id)).toEqual(['spring-ein-tina', 'spring-ein-haniya']);
  });

  it('keeps description and access-notes text out of discovery matching', () => {
    const results = applySpringCatalogDiscovery(publicSpringCatalogFixture, {
      ...defaultSpringDiscoveryState,
      searchText: 'טרסות',
    });

    expect(results).toHaveLength(0);
  });

  it('sorts by recent activity by default and supports title sort', () => {
    const recentActivity = applySpringCatalogDiscovery(publicSpringCatalogFixture, {
      ...defaultSpringDiscoveryState,
      sortMode: 'recent_activity',
    });
    const titleOrder = applySpringCatalogDiscovery(publicSpringCatalogFixture, {
      ...defaultSpringDiscoveryState,
      sortMode: 'title_asc',
    });

    expect(recentActivity.map((spring) => spring.id)).toEqual([
      'spring-ein-tina',
      'spring-ein-haniya',
      'spring-ein-akev',
      'spring-ein-fara',
    ]);
    expect(titleOrder.map((spring) => spring.id)).toEqual([
      'spring-ein-haniya',
      'spring-ein-akev',
      'spring-ein-fara',
      'spring-ein-tina',
    ]);
  });

  it('tracks when refinements are active and keeps query persistence public-only', () => {
    const shouldDehydrateQuery = getQueryPersistenceOptions().dehydrateOptions.shouldDehydrateQuery;

    expect(hasActiveDiscoveryRefinements(defaultSpringDiscoveryState)).toBe(false);
    expect(
      hasActiveDiscoveryRefinements({
        ...defaultSpringDiscoveryState,
        searchText: 'חניה',
      }),
    ).toBe(true);

    expect(shouldDehydrateQuery({ queryKey: ['public-spring-catalog'] })).toBe(true);
    expect(shouldDehydrateQuery({ queryKey: ['public-spring-detail', 'spring-1'] })).toBe(true);
    expect(shouldDehydrateQuery({ queryKey: ['staff-moderation-queue'] })).toBe(false);
  });
});
