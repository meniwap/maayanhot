import {
  mapLibreAdapter,
  type MapSelectionChange,
  type MapSurfacePalette,
} from '@maayanhot/map-core';
import { canModerateReports } from '@maayanhot/domain';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Screen, Stack, useTokens, AppText } from '@maayanhot/ui';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDevSession } from '../dev-session/DevSessionProvider';
import { useOfflineReportQueue } from '../../infrastructure/offline/OfflineReportQueueProvider';
import { publicSpringReadRepository } from '../../infrastructure/supabase/repositories/public-spring-read-repository';
import {
  defaultSpringDiscoveryState,
  applySpringCatalogDiscovery,
  hasActiveDiscoveryRefinements,
  type DiscoveryFreshnessFilter,
  type DiscoverySortMode,
  type DiscoveryViewMode,
  type DiscoveryWaterFilter,
} from './discovery';
import { DiscoveryControls } from './DiscoveryControls';
import { initialIsraelViewport } from './public-spring-catalog';
import { SelectedSpringTeaser } from './SelectedSpringTeaser';
import { DiscoveryEmptyState, SpringDiscoveryList } from './SpringDiscoveryList';
import { toMarkerDescriptor, toSpringSummaryVM } from './spring-summary-vm';

export function MapBrowseScreen() {
  const tokens = useTokens();
  const router = useRouter();
  const { snapshot } = useDevSession();
  const offlineQueue = useOfflineReportQueue();
  const [discoveryState, setDiscoveryState] = useState(defaultSpringDiscoveryState);
  const MapSurface = mapLibreAdapter.Surface;
  const catalogQuery = useQuery({
    enabled: snapshot.isConfigured,
    queryFn: () => publicSpringReadRepository.getCatalog(),
    queryKey: ['public-spring-catalog'],
  });

  const catalogRows = catalogQuery.data ?? [];
  const discoveredRows = applySpringCatalogDiscovery(catalogRows, discoveryState);
  const springs = discoveredRows.map(toSpringSummaryVM);
  const selectedSpring =
    springs.find((spring) => spring.id === discoveryState.selectedSpringId) ?? null;
  const markers = springs.map((spring) =>
    toMarkerDescriptor(spring, discoveryState.selectedSpringId),
  );

  useEffect(() => {
    if (
      discoveryState.selectedSpringId &&
      !discoveredRows.some((spring) => spring.id === discoveryState.selectedSpringId)
    ) {
      setDiscoveryState((current) => ({
        ...current,
        selectedSpringId: null,
      }));
    }
  }, [discoveredRows, discoveryState.selectedSpringId]);

  const mapPalette: MapSurfacePalette = {
    markerSurface: tokens.bg.canvas,
    noWater: tokens.status.noWater.bg,
    outline: tokens.border.strong,
    selectedRing: tokens.action.primary.bg,
    stale: tokens.status.stale.bg,
    unknown: tokens.status.unknown.bg,
    water: tokens.status.water.bg,
  };

  const handleSelectionChange = (change: MapSelectionChange) => {
    setDiscoveryState((current) => ({
      ...current,
      selectedSpringId: change.springId,
    }));
  };

  const handleOpenDetails = (springId: string) => {
    router.push({
      params: {
        springId,
      },
      pathname: '/springs/[springId]',
    });
  };

  const handleDiscoveryPatch = (
    patch: Partial<
      Pick<
        typeof discoveryState,
        | 'freshnessFilter'
        | 'searchText'
        | 'selectedSpringId'
        | 'sortMode'
        | 'viewMode'
        | 'waterFilter'
      >
    >,
  ) => {
    setDiscoveryState((current) => ({
      ...current,
      ...patch,
    }));
  };

  const handleShowOnMap = (springId: string) => {
    handleDiscoveryPatch({
      selectedSpringId: springId,
      viewMode: 'map',
    });
  };

  const handleResetDiscovery = () => {
    setDiscoveryState((current) => ({
      ...defaultSpringDiscoveryState,
      viewMode: current.viewMode,
    }));
  };

  const canOpenModerationQueue =
    snapshot.primaryRole !== null &&
    canModerateReports({
      primaryRole: snapshot.primaryRole,
      roleSet: snapshot.roleSet,
    });

  const topCardCopy = !snapshot.isConfigured
    ? 'חסרים משתני Supabase ציבוריים ולכן הקטלוג עדיין לא נטען.'
    : catalogQuery.isLoading
      ? 'טוען את קטלוג המעיינות הציבורי מהפרויקט המקושר.'
      : catalogQuery.isError && !catalogQuery.data
        ? 'טעינת הקטלוג נכשלה. בסיס המפה מוכן, אבל הקריאה הציבורית דורשת בדיקת חיבור.'
        : !offlineQueue.snapshot.isOnline && catalogRows.length > 0
          ? `מוצגים ${catalogRows.length} מעיינות מהמטמון הציבורי המקומי. אריחי מפה מלאים דורשים חיבור.`
          : catalogRows.length === 0
            ? 'עדיין אין מעיינות פומביים בקטלוג המקושר. מנהל יכול ליצור מעיין חדש מכאן.'
            : `${catalogRows.length} מעיינות פומביים נטענו מהקריאה המאושרת לציבור.`;

  const actionButtons = (
    <>
      <Button
        label="סשן פיתוח"
        onPress={() => router.push('/dev/session')}
        testID="open-dev-session"
        variant="secondary"
      />
      {canOpenModerationQueue ? (
        <Button
          label="תור מודרציה"
          onPress={() => router.push('/moderation/queue')}
          testID="open-moderation-queue"
          variant="secondary"
        />
      ) : null}
      {snapshot.primaryRole === 'admin' ? (
        <Button
          label="מעיין חדש"
          onPress={() => router.push('/admin/springs/new')}
          testID="open-admin-create-spring"
        />
      ) : null}
    </>
  );

  const controls = (
    <DiscoveryControls
      actions={actionButtons}
      bodyCopy={topCardCopy}
      freshnessFilter={discoveryState.freshnessFilter}
      onFreshnessFilterChange={(freshnessFilter: DiscoveryFreshnessFilter) =>
        handleDiscoveryPatch({ freshnessFilter })
      }
      onReset={handleResetDiscovery}
      onSearchTextChange={(searchText: string) => handleDiscoveryPatch({ searchText })}
      onSortModeChange={(sortMode: DiscoverySortMode) => handleDiscoveryPatch({ sortMode })}
      onViewModeChange={(viewMode: DiscoveryViewMode) => handleDiscoveryPatch({ viewMode })}
      onWaterFilterChange={(waterFilter: DiscoveryWaterFilter) =>
        handleDiscoveryPatch({ waterFilter })
      }
      resultCount={springs.length}
      searchText={discoveryState.searchText}
      showReset={hasActiveDiscoveryRefinements(discoveryState)}
      sortMode={discoveryState.sortMode}
      totalCount={catalogRows.length}
      viewMode={discoveryState.viewMode}
      waterFilter={discoveryState.waterFilter}
    />
  );

  if (discoveryState.viewMode === 'list') {
    return (
      <Screen scrollable testID="map-browse-screen">
        <Stack gap="4">
          {controls}
          {catalogQuery.isLoading && !catalogQuery.data ? (
            <Card testID="discovery-loading-state" variant="raised">
              <AppText variant="titleMd">טוען תוצאות גילוי</AppText>
            </Card>
          ) : catalogQuery.isError && !catalogQuery.data ? (
            <Card testID="discovery-error-state" variant="raised">
              <Stack gap="2">
                <AppText variant="titleMd">אי אפשר לטעון תוצאות כרגע</AppText>
                <AppText tone="secondary" variant="bodySm">
                  קטלוג הגילוי נשען על הקריאה הציבורית שכבר קיימת. כדאי לבדוק חיבור או לנסות שוב
                  כשהרשת חוזרת.
                </AppText>
              </Stack>
            </Card>
          ) : springs.length === 0 ? (
            <DiscoveryEmptyState
              onReset={handleResetDiscovery}
              showReset={hasActiveDiscoveryRefinements(discoveryState)}
            />
          ) : (
            <SpringDiscoveryList
              onOpenDetails={handleOpenDetails}
              onShowOnMap={handleShowOnMap}
              selectedSpringId={discoveryState.selectedSpringId}
              springs={springs}
            />
          )}
        </Stack>
      </Screen>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: tokens.bg.canvas,
        },
      ]}
      testID="map-browse-screen"
    >
      <MapSurface
        markers={markers}
        onSelectionChange={handleSelectionChange}
        palette={mapPalette}
        selectionPaddingBottom={tokens.space['12'] * 4}
        style={styles.map}
        testID="map-surface"
        viewport={initialIsraelViewport}
      />

      <View
        pointerEvents="box-none"
        style={[
          styles.topOverlay,
          {
            paddingHorizontal: tokens.space['4'],
            paddingTop: tokens.space['6'],
          },
        ]}
      >
        {controls}
      </View>

      {selectedSpring ? (
        <SelectedSpringTeaser
          onDismiss={() => handleDiscoveryPatch({ selectedSpringId: null })}
          onOpenDetails={() => handleOpenDetails(selectedSpring.id)}
          spring={selectedSpring}
          style={[
            styles.bottomOverlay,
            {
              bottom: tokens.space['4'],
              left: tokens.space['4'],
              right: tokens.space['4'],
            },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomOverlay: {
    position: 'absolute',
  },
  map: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  topOverlay: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
