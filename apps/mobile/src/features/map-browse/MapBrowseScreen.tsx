import {
  mapLibreAdapter,
  type MapSelectionChange,
  type MapSurfacePalette,
} from '@maayanhot/map-core';
import { canModerateReports } from '@maayanhot/domain';
import { useQuery } from '@tanstack/react-query';
import { AppText, Button, Card, Inline, Stack, useTokens } from '@maayanhot/ui';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDevSession } from '../dev-session/DevSessionProvider';
import { publicSpringReadRepository } from '../../infrastructure/supabase/repositories/public-spring-read-repository';
import { SelectedSpringTeaser } from './SelectedSpringTeaser';
import { initialIsraelViewport } from './public-spring-catalog';
import { toMarkerDescriptor, toSpringSummaryVM } from './spring-summary-vm';

export function MapBrowseScreen() {
  const tokens = useTokens();
  const router = useRouter();
  const { snapshot } = useDevSession();
  const [selectedSpringId, setSelectedSpringId] = useState<string | null>(null);
  const MapSurface = mapLibreAdapter.Surface;
  const catalogQuery = useQuery({
    enabled: snapshot.isConfigured,
    queryFn: () => publicSpringReadRepository.getCatalog(),
    queryKey: ['public-spring-catalog'],
  });
  const springs = (catalogQuery.data ?? []).map(toSpringSummaryVM);
  const selectedSpring = springs.find((spring) => spring.id === selectedSpringId) ?? null;
  const markers = springs.map((spring) => toMarkerDescriptor(spring, selectedSpringId));
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
    setSelectedSpringId(change.springId);
  };

  const handleOpenDetails = (springId: string) => {
    router.push({
      params: {
        springId,
      },
      pathname: '/springs/[springId]',
    });
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
      : catalogQuery.isError
        ? 'טעינת הקטלוג נכשלה. בסיס המפה מוכן, אבל הקריאה הציבורית דורשת בדיקת חיבור.'
        : springs.length === 0
          ? 'עדיין אין מעיינות פומביים בקטלוג המקושר. מנהל יכול ליצור מעיין חדש מכאן.'
          : `${springs.length} מעיינות פומביים נטענו מהקריאה המאושרת לציבור.`;

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
        <Card padding="3" style={styles.topCard} variant="raised">
          <Stack gap="2">
            <AppText variant="titleMd">מפת מעיינות</AppText>
            <AppText tone="secondary" variant="bodySm">
              {topCardCopy}
            </AppText>
            <Inline gap="2">
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
            </Inline>
          </Stack>
        </Card>
      </View>

      {selectedSpring ? (
        <SelectedSpringTeaser
          onDismiss={() => setSelectedSpringId(null)}
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
  topCard: {
    alignSelf: 'flex-start',
  },
  topOverlay: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
