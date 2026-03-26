import type { IsoTimestampString, MediaId, ReportId, WaterPresence } from '@maayanhot/contracts';
import type { PublicSpringCatalogRow } from '../map-browse/public-spring-catalog';

export type PublicApprovedGalleryItem = {
  alt: string | null;
  capturedAt: IsoTimestampString | null;
  id: MediaId;
  url: string;
};

export type PublicApprovedHistorySummaryRow = {
  observedAt: IsoTimestampString;
  photoCount: number;
  reportId: ReportId;
  waterPresence: WaterPresence;
};

export type PublicSpringDetailRow = PublicSpringCatalogRow & {
  alternateNames: string[];
  gallery: PublicApprovedGalleryItem[];
  historySummary: PublicApprovedHistorySummaryRow[];
  locationLabel: string | null;
};
