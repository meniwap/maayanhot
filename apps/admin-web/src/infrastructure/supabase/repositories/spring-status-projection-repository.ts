'use client';

import type {
  SpringStatusProjection,
  SpringStatusProjectionRepository,
  UpsertSpringStatusProjectionCommand,
} from '@maayanhot/domain';

import { getSupabaseClient } from '../client';

type SpringStatusProjectionRow = {
  approved_report_count_considered: number;
  confidence: 'low' | 'medium' | 'high';
  derived_from_report_ids: string[];
  freshness: 'recent' | 'stale' | 'none';
  latest_approved_report_at: string | null;
  recalculated_at: string;
  spring_id: string;
  water_presence: 'water' | 'no_water' | 'unknown';
};

const toProjection = (row: SpringStatusProjectionRow): SpringStatusProjection => ({
  approvedReportCountConsidered: row.approved_report_count_considered,
  confidence: row.confidence,
  derivedFromReportIds: row.derived_from_report_ids,
  freshness: row.freshness,
  latestApprovedReportAt: row.latest_approved_report_at,
  recalculatedAt: row.recalculated_at,
  springId: row.spring_id,
  waterPresence: row.water_presence,
});

export class SupabaseSpringStatusProjectionRepository implements SpringStatusProjectionRepository {
  async getBySpringId(springId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('spring_status_projections')
      .select('*')
      .eq('spring_id', springId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toProjection(data as SpringStatusProjectionRow) : null;
  }

  async upsert(command: UpsertSpringStatusProjectionCommand) {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('staff_upsert_spring_status_projection', {
      input_approved_report_count_considered: command.approvedReportCountConsidered,
      input_confidence: command.confidence,
      input_derived_from_report_ids: command.derivedFromReportIds,
      input_freshness: command.freshness,
      input_latest_approved_report_at: command.latestApprovedReportAt,
      input_recalculated_at: command.recalculatedAt,
      input_water_presence: command.waterPresence,
      target_spring_id: command.springId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return toProjection(data as SpringStatusProjectionRow);
  }
}

export const springStatusProjectionRepository = new SupabaseSpringStatusProjectionRepository();
