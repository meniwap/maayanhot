import type { PublicSpringCatalogRow } from './public-spring-catalog';

export type DiscoveryViewMode = 'map' | 'list';
export type DiscoveryWaterFilter = 'all' | 'water' | 'no_water' | 'unknown';
export type DiscoveryFreshnessFilter = 'all' | 'recent' | 'stale' | 'none';
export type DiscoverySortMode = 'recent_activity' | 'title_asc';

export type SpringDiscoveryState = {
  viewMode: DiscoveryViewMode;
  searchText: string;
  waterFilter: DiscoveryWaterFilter;
  freshnessFilter: DiscoveryFreshnessFilter;
  sortMode: DiscoverySortMode;
  selectedSpringId: string | null;
};

export const defaultSpringDiscoveryState: SpringDiscoveryState = {
  freshnessFilter: 'all',
  searchText: '',
  selectedSpringId: null,
  sortMode: 'recent_activity',
  viewMode: 'map',
  waterFilter: 'all',
};

const normalizeDiscoveryText = (value: string) =>
  value.toLocaleLowerCase('he-IL').trim().replace(/\s+/g, ' ');

const getSearchHaystack = (row: PublicSpringCatalogRow) =>
  normalizeDiscoveryText(
    [row.title, ...row.alternateNames, row.slug, row.regionLabel ?? ''].filter(Boolean).join(' '),
  );

const getRecentActivityTimestamp = (row: PublicSpringCatalogRow) =>
  Date.parse(row.latestApprovedReportAt ?? row.updatedAt);

export const hasActiveDiscoveryRefinements = (state: SpringDiscoveryState) =>
  state.searchText.trim().length > 0 ||
  state.waterFilter !== 'all' ||
  state.freshnessFilter !== 'all' ||
  state.sortMode !== 'recent_activity';

export const applySpringCatalogDiscovery = (
  rows: PublicSpringCatalogRow[],
  state: Pick<SpringDiscoveryState, 'freshnessFilter' | 'searchText' | 'sortMode' | 'waterFilter'>,
) => {
  const normalizedSearch = normalizeDiscoveryText(state.searchText);

  const filteredRows = rows.filter((row) => {
    if (state.waterFilter !== 'all' && row.waterPresence !== state.waterFilter) {
      return false;
    }

    if (state.freshnessFilter !== 'all' && row.freshness !== state.freshnessFilter) {
      return false;
    }

    if (normalizedSearch.length > 0 && !getSearchHaystack(row).includes(normalizedSearch)) {
      return false;
    }

    return true;
  });

  return [...filteredRows].sort((left, right) => {
    if (state.sortMode === 'title_asc') {
      return left.title.localeCompare(right.title, 'he');
    }

    const activityDelta = getRecentActivityTimestamp(right) - getRecentActivityTimestamp(left);

    if (activityDelta !== 0) {
      return activityDelta;
    }

    return left.title.localeCompare(right.title, 'he');
  });
};
