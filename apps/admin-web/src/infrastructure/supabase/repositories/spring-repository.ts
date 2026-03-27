'use client';

import type {
  BrowseSpringsQuery,
  CreateSpringCommand,
  GeoPoint,
  GetSpringDetailQuery,
  SpringRecord,
  SpringStatusProjectionRecord,
  UpdateSpringCommand,
  UserId,
} from '@maayanhot/contracts';
import type {
  CursorPage,
  SpringBrowseItem,
  SpringDetailAggregate,
  SpringRepository,
} from '@maayanhot/domain';

import { getSupabaseClient } from '../client';

type SpringRowRecord = {
  access_notes: string | null;
  alternate_names: string[];
  confidence: SpringStatusProjectionRecord['confidence'];
  created_at: string;
  created_by_user_id: UserId;
  description: string | null;
  freshness: SpringStatusProjectionRecord['freshness'];
  id: string;
  is_published: boolean;
  latest_approved_report_at: string | null;
  latitude: number;
  location_precision_meters: number | null;
  longitude: number;
  region_code: string | null;
  slug: string;
  title: string;
  updated_at: string;
  water_presence: SpringStatusProjectionRecord['waterPresence'];
};

type SpringRpcRowRecord = {
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

const toSpringLocation = (point: GeoPoint, precisionMeters: number | null) => ({
  latitude: point.latitude,
  longitude: point.longitude,
  precisionMeters,
});

const toSpring = (
  row: SpringRowRecord | SpringRpcRowRecord,
  coordinate: GeoPoint,
): SpringRecord => ({
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

const toSpringBrowseItem = (row: SpringRowRecord): SpringBrowseItem => ({
  coverMedia: null,
  projection: {
    approvedReportCountConsidered: 0,
    confidence: row.confidence,
    derivedFromReportIds: [],
    freshness: row.freshness,
    latestApprovedReportAt: row.latest_approved_report_at,
    recalculatedAt: row.updated_at,
    springId: row.id,
    waterPresence: row.water_presence,
  },
  spring: toSpring(row, {
    latitude: row.latitude,
    longitude: row.longitude,
  }),
});

export class SupabaseSpringRepository implements SpringRepository {
  async browse(query: BrowseSpringsQuery): Promise<CursorPage<SpringBrowseItem>> {
    void query;

    return {
      items: [],
      nextCursor: null,
    };
  }

  async getDetail(query: GetSpringDetailQuery): Promise<SpringDetailAggregate | null> {
    void query;

    return null;
  }

  async getManagedById(springId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('admin_spring_management_detail')
      .select('*')
      .eq('id', springId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toSpringBrowseItem(data as SpringRowRecord) : null;
  }

  async listManaged(_cursor?: string | null, limit = 50): Promise<CursorPage<SpringBrowseItem>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('admin_spring_management_catalog')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return {
      items: (data ?? []).map((row) => toSpringBrowseItem(row as SpringRowRecord)),
      nextCursor: null,
    };
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

    return toSpring(data as SpringRpcRowRecord, command.location);
  }

  async update(command: UpdateSpringCommand) {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('admin_update_spring', {
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
      target_spring_id: command.springId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return toSpring(data as SpringRpcRowRecord, command.location);
  }

  async findExistingSlugs(baseSlug: string, excludeSpringId?: string | null) {
    const client = getSupabaseClient();
    let request = client.from('springs').select('slug').ilike('slug', `${baseSlug}%`).limit(50);

    if (excludeSpringId) {
      request = request.neq('id', excludeSpringId);
    }

    const { data, error } = await request;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => String((row as { slug: string }).slug));
  }
}

export const springRepository = new SupabaseSpringRepository();
