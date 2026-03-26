import type { MapMarkerDescriptor } from '@maayanhot/map-core';

import type { PublicSpringCatalogRow } from './public-spring-catalog';
import { formatPublicStatusLabel } from '../public-read/public-status';

export type SpringSummaryVM = {
  id: string;
  slug: string;
  title: string;
  regionLabel: string | null;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  status: {
    waterState: 'water' | 'no_water' | 'unknown';
    freshness: 'recent' | 'stale' | 'none';
    label: string;
    lastApprovedObservationAt: string | null;
  };
  coverImageUrl: string | null;
  distanceMeters?: number | null;
  isAccessibleByCurrentUser: boolean;
};

export const toSpringSummaryVM = (row: PublicSpringCatalogRow): SpringSummaryVM => ({
  coordinates: row.coordinates,
  coverImageUrl: row.coverImageUrl,
  id: row.id,
  isAccessibleByCurrentUser: row.isAccessibleByCurrentUser,
  regionLabel: row.regionLabel,
  slug: row.slug,
  status: {
    freshness: row.freshness,
    label: formatPublicStatusLabel(row.waterPresence, row.freshness),
    lastApprovedObservationAt: row.latestApprovedReportAt,
    waterState: row.waterPresence,
  },
  title: row.title,
});

export const toMarkerDescriptor = (
  spring: SpringSummaryVM,
  selectedSpringId: string | null,
): MapMarkerDescriptor => ({
  coordinate: spring.coordinates,
  freshness: spring.status.freshness,
  isSelected: spring.id === selectedSpringId,
  springId: spring.id,
  title: spring.title,
  waterPresence: spring.status.waterState,
});
