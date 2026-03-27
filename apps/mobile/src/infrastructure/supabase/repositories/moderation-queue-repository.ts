import type { ModerateReportCommand } from '@maayanhot/contracts';
import type {
  CursorPage,
  ModerationAction,
  ModerationQueueItem,
  ModerationQueueRepository,
  ModerationReviewAggregate,
  ModerationReviewMedia,
} from '@maayanhot/domain';

import { getSupabaseClient } from '../client';

type QueueRowRecord = {
  note: string | null;
  observed_at: string;
  photo_count: number;
  region_code: string | null;
  report_id: string;
  reporter_role_snapshot: 'user' | 'trusted_contributor' | 'moderator' | 'admin' | null;
  spring_id: string;
  spring_slug: string;
  spring_title: string;
  submitted_at: string;
  water_presence: 'water' | 'no_water' | 'unknown';
};

type ReviewRowRecord = QueueRowRecord & {
  access_notes: string | null;
  description: string | null;
};

type ReviewMediaRowRecord = {
  byte_size: number | null;
  captured_at: string | null;
  created_at: string;
  height: number | null;
  id: string;
  media_type: 'image';
  report_id: string;
  sort_order: number;
  spring_id: string;
  storage_bucket: string;
  storage_path: string;
  upload_state: 'pending' | 'uploaded' | 'failed';
  width: number | null;
};

type ModerationActionRowRecord = {
  acted_at: string;
  actor_user_id: string;
  decision: 'approve' | 'reject';
  id: string;
  reason_code: ModerateReportCommand['reasonCode'];
  reason_note: string | null;
  report_id: string;
};

const toQueueItem = (row: QueueRowRecord): ModerationQueueItem => ({
  note: row.note,
  observedAt: row.observed_at,
  photoCount: row.photo_count,
  regionCode: row.region_code,
  reportId: row.report_id,
  reporterRoleSnapshot: row.reporter_role_snapshot,
  springId: row.spring_id,
  springSlug: row.spring_slug,
  springTitle: row.spring_title,
  submittedAt: row.submitted_at,
  waterPresence: row.water_presence,
});

const toReviewMedia = (row: ReviewMediaRowRecord): ModerationReviewMedia => ({
  byteSize: row.byte_size,
  capturedAt: row.captured_at,
  createdAt: row.created_at,
  height: row.height,
  id: row.id,
  mediaType: row.media_type,
  reportId: row.report_id,
  sortOrder: row.sort_order,
  springId: row.spring_id,
  storageBucket: row.storage_bucket,
  storagePath: row.storage_path,
  uploadState: row.upload_state,
  width: row.width,
});

const toModerationAction = (row: ModerationActionRowRecord): ModerationAction => ({
  actedAt: row.acted_at,
  actorUserId: row.actor_user_id,
  decision: row.decision,
  id: row.id,
  reasonCode: row.reason_code ?? null,
  reasonNote: row.reason_note,
  reportId: row.report_id,
});

export class SupabaseModerationQueueRepository implements ModerationQueueRepository {
  async listPending(_cursor?: string | null, limit = 25): Promise<CursorPage<ModerationQueueItem>> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('staff_moderation_queue')
      .select('*')
      .order('submitted_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return {
      items: (data ?? []).map((row) => toQueueItem(row as QueueRowRecord)),
      nextCursor: null,
    };
  }

  async getReviewByReportId(reportId: string): Promise<ModerationReviewAggregate | null> {
    const client = getSupabaseClient();
    const { data: detailRow, error: detailError } = await client
      .from('staff_moderation_report_detail')
      .select('*')
      .eq('report_id', reportId)
      .maybeSingle();

    if (detailError) {
      throw new Error(detailError.message);
    }

    if (!detailRow) {
      return null;
    }

    const { data: mediaRows, error: mediaError } = await client
      .from('staff_moderation_report_media')
      .select('*')
      .eq('report_id', reportId)
      .order('sort_order', { ascending: true });

    if (mediaError) {
      throw new Error(mediaError.message);
    }

    const typedRow = detailRow as ReviewRowRecord;

    return {
      media: (mediaRows ?? []).map((row) => toReviewMedia(row as ReviewMediaRowRecord)),
      review: {
        ...toQueueItem(typedRow),
        accessNotes: typedRow.access_notes,
        description: typedRow.description,
      },
    };
  }

  async applyDecision(command: ModerateReportCommand): Promise<ModerationAction> {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('moderate_report', {
      decision: command.decision,
      reason_code: command.reasonCode ?? null,
      reason_note: command.reasonNote ?? null,
      target_report_id: command.reportId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return toModerationAction(data as ModerationActionRowRecord);
  }
}

export const moderationQueueRepository = new SupabaseModerationQueueRepository();
