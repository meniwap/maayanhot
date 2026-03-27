import type {
  ProjectionConfidence,
  ProjectionFreshness,
  WaterPresence,
} from '@maayanhot/contracts';

import type {
  PublicApprovedGalleryItem,
  PublicApprovedHistorySummaryRow,
  PublicSpringDetailRow,
} from '../../../features/spring-detail/public-spring-detail';
import type { PublicSpringCatalogRow } from '../../../features/map-browse/public-spring-catalog';
import { getSupabaseClient } from '../client';

type CatalogRowRecord = {
  access_notes: string | null;
  alternate_names: string[];
  confidence: ProjectionConfidence;
  description: string | null;
  freshness: ProjectionFreshness;
  id: string;
  latest_approved_report_at: string | null;
  latitude: number;
  longitude: number;
  region_code: string | null;
  slug: string;
  title: string;
  updated_at: string;
  water_presence: WaterPresence;
};

type DetailRowRecord = CatalogRowRecord & {
  alternate_names: string[];
  approved_history_count: number;
  location_precision_meters: number | null;
};

type DetailMediaRowRecord = {
  captured_at: string | null;
  id: string;
  public_url: string;
  sort_order: number;
};

type DetailHistoryRowRecord = {
  observed_at: string;
  photo_count: number;
  report_id: string;
  water_presence: WaterPresence;
};

const toRegionLabel = (regionCode: string | null) => regionCode;

const toCatalogRow = (row: CatalogRowRecord): PublicSpringCatalogRow => ({
  accessNotes: row.access_notes,
  alternateNames: row.alternate_names,
  confidence: row.confidence,
  coordinates: {
    latitude: row.latitude,
    longitude: row.longitude,
  },
  coverImageUrl: null,
  description: row.description,
  freshness: row.freshness,
  id: row.id,
  isAccessibleByCurrentUser: true,
  latestApprovedReportAt: row.latest_approved_report_at,
  regionLabel: toRegionLabel(row.region_code),
  slug: row.slug,
  title: row.title,
  updatedAt: row.updated_at,
  waterPresence: row.water_presence,
});

const toGalleryItem = (row: DetailMediaRowRecord): PublicApprovedGalleryItem => ({
  alt: null,
  capturedAt: row.captured_at,
  id: row.id,
  url: row.public_url,
});

const toHistoryItem = (row: DetailHistoryRowRecord): PublicApprovedHistorySummaryRow => ({
  observedAt: row.observed_at,
  photoCount: row.photo_count,
  reportId: row.report_id,
  waterPresence: row.water_presence,
});

export interface PublicSpringReadRepository {
  getCatalog(): Promise<PublicSpringCatalogRow[]>;
  getDetailById(springId: string): Promise<PublicSpringDetailRow | null>;
}

export class SupabasePublicSpringReadRepository implements PublicSpringReadRepository {
  async getCatalog() {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('public_spring_catalog')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => toCatalogRow(row as CatalogRowRecord));
  }

  async getDetailById(springId: string) {
    const client = getSupabaseClient();
    const { data: detailRow, error: detailError } = await client
      .from('public_spring_detail')
      .select('*')
      .eq('id', springId)
      .maybeSingle();

    if (detailError) {
      throw new Error(detailError.message);
    }

    if (!detailRow) {
      return null;
    }

    const [{ data: mediaRows, error: mediaError }, { data: historyRows, error: historyError }] =
      await Promise.all([
        client
          .from('public_spring_detail_media')
          .select('*')
          .eq('spring_id', springId)
          .order('sort_order', { ascending: true }),
        client
          .from('public_spring_detail_history')
          .select('*')
          .eq('spring_id', springId)
          .order('observed_at', { ascending: false }),
      ]);

    if (mediaError) {
      throw new Error(mediaError.message);
    }

    if (historyError) {
      throw new Error(historyError.message);
    }

    const typedDetail = detailRow as DetailRowRecord;

    return {
      ...toCatalogRow(typedDetail),
      alternateNames: typedDetail.alternate_names,
      gallery: (mediaRows ?? []).map((row) => toGalleryItem(row as DetailMediaRowRecord)),
      historySummary: (historyRows ?? []).map((row) =>
        toHistoryItem(row as DetailHistoryRowRecord),
      ),
      locationLabel: toRegionLabel(typedDetail.region_code),
    };
  }
}

export const publicSpringReadRepository = new SupabasePublicSpringReadRepository();
