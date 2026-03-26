import type {
  GeoPoint,
  IsoTimestampString,
  ProjectionConfidence,
  ProjectionFreshness,
  SpringId,
  WaterPresence,
} from '@maayanhot/contracts';
import type { MapViewport } from '@maayanhot/map-core';

export type PublicSpringCatalogRow = {
  accessNotes: string | null;
  confidence: ProjectionConfidence;
  coordinates: GeoPoint;
  coverImageUrl: string | null;
  description: string | null;
  freshness: ProjectionFreshness;
  id: SpringId;
  isAccessibleByCurrentUser: boolean;
  latestApprovedReportAt: IsoTimestampString | null;
  regionLabel: string | null;
  slug: string;
  title: string;
  updatedAt: IsoTimestampString;
  waterPresence: WaterPresence;
};

export const initialIsraelViewport: MapViewport = {
  center: {
    latitude: 31.4117,
    longitude: 35.0818,
  },
  east: 35.92,
  north: 33.31,
  south: 29.49,
  west: 34.2,
  zoom: 7.2,
};
