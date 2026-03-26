import type {
  BrowseSpringsQuery,
  CreateSpringCommand,
  GeoPoint,
  SpringRecord,
  SpringStatusProjectionRecord,
  UserId,
} from '@maayanhot/contracts';
import type {
  CursorPage,
  SpringBrowseItem,
  SpringDetailAggregate,
  SpringRepository,
} from '@maayanhot/domain';

import { getSupabaseClient } from '../client';

type SpringInsertRpcRecord = {
  access_notes: string | null;
  alternate_names: string[];
  created_at: string;
  created_by_user_id: UserId;
  description: string | null;
  id: string;
  is_published: boolean;
  location_precision_meters: number | null;
  region_code: string | null;
  slug: string;
  title: string;
  updated_at: string;
};

type PublicCatalogRowRecord = {
  access_notes: string | null;
  confidence: SpringStatusProjectionRecord['confidence'];
  description: string | null;
  freshness: SpringStatusProjectionRecord['freshness'];
  id: string;
  latest_approved_report_at: string | null;
  latitude: number;
  longitude: number;
  region_code: string | null;
  slug: string;
  title: string;
  updated_at: string;
  water_presence: SpringStatusProjectionRecord['waterPresence'];
};

const toSpringLocation = (point: GeoPoint, precisionMeters: number | null) => ({
  latitude: point.latitude,
  longitude: point.longitude,
  precisionMeters,
});

const toSpringFromCatalog = (row: PublicCatalogRowRecord): SpringRecord => ({
  accessNotes: row.access_notes,
  alternateNames: [],
  createdAt: row.updated_at,
  createdByUserId: 'public-catalog',
  description: row.description,
  id: row.id,
  isPublished: true,
  location: toSpringLocation(
    {
      latitude: row.latitude,
      longitude: row.longitude,
    },
    null,
  ),
  regionCode: row.region_code,
  slug: row.slug,
  title: row.title,
  updatedAt: row.updated_at,
});

const toProjectionFromCatalog = (row: PublicCatalogRowRecord): SpringStatusProjectionRecord => ({
  approvedReportCountConsidered: 0,
  confidence: row.confidence,
  derivedFromReportIds: [],
  freshness: row.freshness,
  latestApprovedReportAt: row.latest_approved_report_at,
  recalculatedAt: row.updated_at,
  springId: row.id,
  waterPresence: row.water_presence,
});

const toCreatedSpring = (row: SpringInsertRpcRecord, coordinate: GeoPoint): SpringRecord => ({
  accessNotes: row.access_notes,
  alternateNames: row.alternate_names,
  createdAt: row.created_at,
  createdByUserId: row.created_by_user_id,
  description: row.description,
  id: row.id,
  isPublished: row.is_published,
  location: toSpringLocation(coordinate, row.location_precision_meters),
  regionCode: row.region_code,
  slug: row.slug,
  title: row.title,
  updatedAt: row.updated_at,
});

export class SupabaseSpringRepository implements SpringRepository {
  async browse(query: BrowseSpringsQuery): Promise<CursorPage<SpringBrowseItem>> {
    const client = getSupabaseClient();
    let request = client
      .from('public_spring_catalog')
      .select('*')
      .order('updated_at', { ascending: false });

    if (query.filters?.waterPresence?.length) {
      request = request.in('water_presence', query.filters.waterPresence);
    }

    if (query.filters?.freshness?.length) {
      request = request.in('freshness', query.filters.freshness);
    }

    if (query.filters?.regionCodes?.length) {
      request = request.in('region_code', query.filters.regionCodes);
    }

    if (query.viewport) {
      request = request
        .gte('latitude', query.viewport.south)
        .lte('latitude', query.viewport.north)
        .gte('longitude', query.viewport.west)
        .lte('longitude', query.viewport.east);
    }

    const { data, error } = await request.limit(query.limit);

    if (error) {
      throw new Error(error.message);
    }

    return {
      items: (data ?? []).map((row) => {
        const catalogRow = row as PublicCatalogRowRecord;

        return {
          coverMedia: null,
          projection: toProjectionFromCatalog(catalogRow),
          spring: toSpringFromCatalog(catalogRow),
        };
      }),
      nextCursor: null,
    };
  }

  async getDetail(): Promise<SpringDetailAggregate | null> {
    return null;
  }

  async create(command: CreateSpringCommand) {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('admin_create_spring', {
      input_access_notes: command.accessNotes ?? null,
      input_alternate_names: command.alternateNames,
      input_description: command.description ?? null,
      input_is_published: command.isPublished ?? false,
      input_latitude: command.location.latitude,
      input_location_precision_meters: command.location.precisionMeters ?? null,
      input_longitude: command.location.longitude,
      input_region_code: command.regionCode ?? null,
      input_slug: command.slug,
      input_title: command.title,
    });

    if (error) {
      throw new Error(error.message);
    }

    return toCreatedSpring(data as SpringInsertRpcRecord, command.location);
  }

  async findExistingSlugs(baseSlug: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('springs')
      .select('slug')
      .ilike('slug', `${baseSlug}%`)
      .limit(50);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => String((row as { slug: string }).slug));
  }
}

export const springRepository = new SupabaseSpringRepository();
