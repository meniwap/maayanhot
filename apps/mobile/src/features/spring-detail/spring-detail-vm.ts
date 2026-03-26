import type {
  PublicApprovedHistorySummaryRow,
  PublicSpringDetailRow,
} from './public-spring-detail';
import {
  formatConfidenceLabel,
  formatFreshnessLabel,
  formatPublicStatusLabel,
  formatWaterPresenceLabel,
} from '../public-read/public-status';

export type SpringDetailVM = {
  accessNotes: string | null;
  alternateNames: string[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
  description: string | null;
  gallery: Array<{
    alt: string | null;
    capturedAt: string | null;
    id: string;
    url: string;
  }>;
  historySummary: Array<{
    label: string;
    observedAt: string;
    photoCount: number;
    reportId: string;
    waterState: 'water' | 'no_water' | 'unknown';
  }>;
  id: string;
  locationLabel: string | null;
  regionLabel: string | null;
  slug: string;
  status: {
    approvedHistoryCount: number;
    confidenceLabel: string;
    freshness: 'recent' | 'stale' | 'none';
    freshnessLabel: string;
    label: string;
    lastApprovedObservationAt: string | null;
    waterState: 'water' | 'no_water' | 'unknown';
  };
  title: string;
};

const toHistoryLabel = (entry: PublicApprovedHistorySummaryRow) => {
  const baseLabel = formatWaterPresenceLabel(entry.waterPresence);

  if (entry.photoCount === 0) {
    return `${baseLabel} בתצפית מאושרת`;
  }

  return `${baseLabel} בתצפית מאושרת עם ${entry.photoCount} תמונות`;
};

export const toSpringDetailVM = (row: PublicSpringDetailRow): SpringDetailVM => ({
  accessNotes: row.accessNotes,
  alternateNames: row.alternateNames,
  coordinates: row.coordinates,
  description: row.description,
  gallery: row.gallery,
  historySummary: row.historySummary.map((entry) => ({
    label: toHistoryLabel(entry),
    observedAt: entry.observedAt,
    photoCount: entry.photoCount,
    reportId: entry.reportId,
    waterState: entry.waterPresence,
  })),
  id: row.id,
  locationLabel: row.locationLabel,
  regionLabel: row.regionLabel,
  slug: row.slug,
  status: {
    approvedHistoryCount: row.historySummary.length,
    confidenceLabel: formatConfidenceLabel(row.confidence),
    freshness: row.freshness,
    freshnessLabel: formatFreshnessLabel(row.freshness),
    label: formatPublicStatusLabel(row.waterPresence, row.freshness),
    lastApprovedObservationAt: row.latestApprovedReportAt,
    waterState: row.waterPresence,
  },
  title: row.title,
});
