import React from 'react';
import { Button, Card, Chip, Inline, Stack, TextField, AppText } from '@maayanhot/ui';
import type { ReactNode } from 'react';

import type {
  DiscoveryFreshnessFilter,
  DiscoverySortMode,
  DiscoveryViewMode,
  DiscoveryWaterFilter,
} from './discovery';

type DiscoveryControlsProps = {
  actions?: ReactNode;
  bodyCopy: string;
  freshnessFilter: DiscoveryFreshnessFilter;
  onFreshnessFilterChange: (filter: DiscoveryFreshnessFilter) => void;
  onReset: () => void;
  onSearchTextChange: (value: string) => void;
  onSortModeChange: (mode: DiscoverySortMode) => void;
  onViewModeChange: (mode: DiscoveryViewMode) => void;
  onWaterFilterChange: (filter: DiscoveryWaterFilter) => void;
  resultCount: number;
  searchText: string;
  showReset: boolean;
  sortMode: DiscoverySortMode;
  totalCount: number;
  viewMode: DiscoveryViewMode;
  waterFilter: DiscoveryWaterFilter;
};

const waterOptions: Array<{ label: string; value: DiscoveryWaterFilter }> = [
  { label: 'הכול', value: 'all' },
  { label: 'יש מים', value: 'water' },
  { label: 'אין מים', value: 'no_water' },
  { label: 'לא ידוע', value: 'unknown' },
];

const freshnessOptions: Array<{ label: string; value: DiscoveryFreshnessFilter }> = [
  { label: 'כל העדכונים', value: 'all' },
  { label: 'עדכני', value: 'recent' },
  { label: 'ישן', value: 'stale' },
  { label: 'ללא דיווח', value: 'none' },
];

const sortOptions: Array<{ label: string; value: DiscoverySortMode }> = [
  { label: 'פעילות אחרונה', value: 'recent_activity' },
  { label: 'א״ב', value: 'title_asc' },
];

export function DiscoveryControls({
  actions,
  bodyCopy,
  freshnessFilter,
  onFreshnessFilterChange,
  onReset,
  onSearchTextChange,
  onSortModeChange,
  onViewModeChange,
  onWaterFilterChange,
  resultCount,
  searchText,
  showReset,
  sortMode,
  totalCount,
  viewMode,
  waterFilter,
}: DiscoveryControlsProps) {
  return (
    <Card testID="discovery-controls" variant="raised">
      <Stack gap="3">
        <Stack gap="1">
          <AppText variant="titleMd">מפת מעיינות</AppText>
          <AppText tone="secondary" variant="bodySm">
            {bodyCopy}
          </AppText>
        </Stack>

        {actions ? (
          <Inline gap="2" wrap>
            {actions}
          </Inline>
        ) : null}

        <Inline gap="2">
          <Chip
            label="מפה"
            onPress={() => onViewModeChange('map')}
            testID="discovery-view-map"
            variant={viewMode === 'map' ? 'selected' : 'filter'}
          />
          <Chip
            label="רשימה"
            onPress={() => onViewModeChange('list')}
            testID="discovery-view-list"
            variant={viewMode === 'list' ? 'selected' : 'filter'}
          />
        </Inline>

        <TextField
          autoCapitalize="none"
          helperText="חיפוש לפי שם, שם חלופי, אזור או slug"
          label="חיפוש מעיין"
          onChangeText={onSearchTextChange}
          placeholder="למשל עין חניה או בנימין"
          testID="discovery-search"
          value={searchText}
        />

        <Stack gap="2">
          <AppText tone="secondary" variant="bodySm">
            מצב מים
          </AppText>
          <Inline gap="2" wrap>
            {waterOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onPress={() => onWaterFilterChange(option.value)}
                testID={`discovery-water-${option.value}`}
                variant={waterFilter === option.value ? 'selected' : 'filter'}
              />
            ))}
          </Inline>
        </Stack>

        <Stack gap="2">
          <AppText tone="secondary" variant="bodySm">
            רעננות
          </AppText>
          <Inline gap="2" wrap>
            {freshnessOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onPress={() => onFreshnessFilterChange(option.value)}
                testID={`discovery-freshness-${option.value}`}
                variant={freshnessFilter === option.value ? 'selected' : 'filter'}
              />
            ))}
          </Inline>
        </Stack>

        <Stack gap="2">
          <AppText tone="secondary" variant="bodySm">
            מיון
          </AppText>
          <Inline gap="2" wrap>
            {sortOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                onPress={() => onSortModeChange(option.value)}
                testID={`discovery-sort-${option.value}`}
                variant={sortMode === option.value ? 'selected' : 'filter'}
              />
            ))}
          </Inline>
        </Stack>

        <Inline align="center" justify="between">
          <AppText testID="discovery-results-summary" tone="secondary" variant="bodySm">
            {resultCount} מתוך {totalCount} מעיינות
          </AppText>
          {showReset ? (
            <Button
              label="נקה חיפוש וסינון"
              onPress={onReset}
              testID="discovery-reset"
              variant="ghost"
            />
          ) : null}
        </Inline>
      </Stack>
    </Card>
  );
}
