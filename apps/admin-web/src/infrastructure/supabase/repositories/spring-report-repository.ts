'use client';

import type {
  FinalizeReportMediaUploadCommand,
  MediaSlotReservation,
  SpringMedia,
  SpringReport,
  SpringReportRepository,
} from '@maayanhot/domain';
import type {
  SubmitSpringReportCommand,
  UploadLifecycleState,
  UserRole,
  WaterPresence,
} from '@maayanhot/contracts';

import { getSupabaseClient } from '../client';

type SpringReportRowRecord = {
  client_submission_id: string | null;
  id: string;
  latest_moderated_at: string | null;
  location_evidence: string | null;
  location_evidence_precision_meters: number | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  note: string | null;
  observed_at: string;
  reporter_role_snapshot: UserRole | null;
  reporter_user_id: string;
  spring_id: string;
  submitted_at: string;
  water_presence: WaterPresence;
};

type SpringMediaRowRecord = {
  byte_size: number | null;
  captured_at: string | null;
  created_at: string;
  exif_stripped: boolean;
  height: number | null;
  id: string;
  media_type: 'image';
  public_url: string | null;
  report_id: string;
  spring_id: string;
  storage_bucket: string;
  storage_path: string;
  upload_state: UploadLifecycleState;
  width: number | null;
};

type MediaSlotRowRecord = {
  captured_at: string | null;
  id: string;
  report_id: string;
  spring_id: string;
  storage_bucket: string;
  storage_path: string;
  upload_state: UploadLifecycleState;
};

const toReport = (row: SpringReportRowRecord): SpringReport => ({
  id: row.id,
  locationEvidence: {
    latitude: null,
    longitude: null,
    precisionMeters: row.location_evidence_precision_meters,
  },
  mediaIds: [],
  moderationStatus: row.moderation_status,
  note: row.note,
  observedAt: row.observed_at,
  reporterRoleSnapshot: row.reporter_role_snapshot,
  reporterUserId: row.reporter_user_id,
  springId: row.spring_id,
  submittedAt: row.submitted_at,
  waterPresence: row.water_presence,
});

const toMedia = (row: SpringMediaRowRecord): SpringMedia => ({
  byteSize: row.byte_size,
  capturedAt: row.captured_at,
  createdAt: row.created_at,
  exifStripped: row.exif_stripped,
  height: row.height,
  id: row.id,
  mediaType: row.media_type,
  publicUrl: row.public_url,
  reportId: row.report_id,
  springId: row.spring_id,
  storageBucket: row.storage_bucket,
  storagePath: row.storage_path,
  uploadState: row.upload_state,
  width: row.width,
});

export class SupabaseSpringReportRepository implements SpringReportRepository {
  async getById(reportId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('spring_reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toReport(data as SpringReportRowRecord) : null;
  }

  async listBySpringId(springId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('spring_reports')
      .select('*')
      .eq('spring_id', springId)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => toReport(row as SpringReportRowRecord));
  }

  async create(command: SubmitSpringReportCommand): Promise<SpringReport> {
    void command;

    throw new Error('Report submission remains outside the admin web phase.');
  }

  async listMediaByReportIds(reportIds: string[]) {
    if (reportIds.length === 0) {
      return {};
    }

    const client = getSupabaseClient();
    const { data, error } = await client
      .from('report_media')
      .select(
        `
        byte_size,
        captured_at,
        created_at,
        exif_stripped,
        height,
        id,
        media_type,
        public_url,
        report_id,
        spring_id,
        storage_bucket,
        storage_path,
        upload_state,
        width
      `,
      )
      .in('report_id', reportIds);

    if (error) {
      throw new Error(error.message);
    }

    const grouped: Record<string, SpringMedia[]> = {};

    for (const row of data ?? []) {
      const typedRow = row as SpringMediaRowRecord;
      const current = grouped[typedRow.report_id] ?? [];

      current.push(toMedia(typedRow));
      grouped[typedRow.report_id] = current;
    }

    return grouped;
  }

  async reserveMediaSlot(input: {
    reportId: string;
    clientMediaDraftId: string;
    fileExtension: string | null;
    capturedAt: string | null;
  }): Promise<MediaSlotReservation> {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('reserve_report_media_slot', {
      captured_at: input.capturedAt,
      file_extension: input.fileExtension,
      target_client_media_draft_id: input.clientMediaDraftId,
      target_report_id: input.reportId,
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = data as MediaSlotRowRecord;

    return {
      capturedAt: row.captured_at,
      mediaId: row.id,
      reportId: row.report_id,
      springId: row.spring_id,
      storageBucket: row.storage_bucket,
      storagePath: row.storage_path,
      uploadState: row.upload_state,
    };
  }

  async finalizeMediaUpload(command: FinalizeReportMediaUploadCommand) {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('finalize_report_media_upload', {
      byte_size: command.byteSize,
      captured_at: command.capturedAt,
      exif_stripped: command.exifStripped,
      height: command.height,
      target_media_id: command.mediaId,
      width: command.width,
    });

    if (error) {
      throw new Error(error.message);
    }

    return toMedia(data as SpringMediaRowRecord);
  }
}

export const springReportRepository = new SupabaseSpringReportRepository();
