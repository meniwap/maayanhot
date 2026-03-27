import type {
  FinalizeReportMediaUploadCommand,
  MediaSlotReservation,
  SpringMedia,
  SpringReportRepository,
} from '@maayanhot/domain';
import type { ReportId, SpringId, SubmitSpringReportCommand } from '@maayanhot/contracts';

import { getSupabaseClient } from '../client';

type SpringReportRow = {
  client_submission_id: string | null;
  id: string;
  latest_moderated_at: string | null;
  location_evidence: string | null;
  location_evidence_precision_meters: number | null;
  moderation_status: 'pending' | 'approved' | 'rejected';
  note: string | null;
  observed_at: string;
  reporter_role_snapshot: 'user' | 'trusted_contributor' | 'moderator' | 'admin' | null;
  reporter_user_id: string;
  spring_id: string;
  submitted_at: string;
  water_presence: 'water' | 'no_water' | 'unknown';
};

type SpringMediaRow = {
  byte_size: number | null;
  captured_at: string | null;
  client_media_draft_id: string | null;
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
  upload_state: 'pending' | 'uploaded' | 'failed';
  width: number | null;
};

const toSpringReport = (row: SpringReportRow) => ({
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

const toSpringMedia = (row: SpringMediaRow): SpringMedia => ({
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

export class SupabaseRepositoryError extends Error {
  code: string | null;
  statusCode: number | null;

  constructor(message: string, options?: { code?: string | null; statusCode?: number | null }) {
    super(message);
    this.name = 'SupabaseRepositoryError';
    this.code = options?.code ?? null;
    this.statusCode = options?.statusCode ?? null;
  }
}

const toRepositoryError = (error: {
  code?: string | null;
  message: string;
  status?: number | null;
}) =>
  new SupabaseRepositoryError(error.message, {
    code: error.code ?? null,
    statusCode: error.status ?? null,
  });

const toMediaSlotReservation = (row: SpringMediaRow): MediaSlotReservation => ({
  capturedAt: row.captured_at,
  mediaId: row.id,
  reportId: row.report_id,
  springId: row.spring_id,
  storageBucket: row.storage_bucket,
  storagePath: row.storage_path,
  uploadState: row.upload_state,
});

export class SupabaseSpringReportRepository implements SpringReportRepository {
  async getById(reportId: ReportId) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('spring_reports')
      .select('*')
      .eq('id', reportId)
      .maybeSingle();

    if (error) {
      throw toRepositoryError(error);
    }

    return data ? toSpringReport(data as SpringReportRow) : null;
  }

  async listBySpringId(springId: SpringId) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('spring_reports')
      .select('*')
      .eq('spring_id', springId)
      .order('submitted_at', { ascending: false });

    if (error) {
      throw toRepositoryError(error);
    }

    return (data ?? []).map((row) => toSpringReport(row as SpringReportRow));
  }

  async create(command: SubmitSpringReportCommand) {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('submit_spring_report', {
      target_client_submission_id: command.clientSubmissionId,
      target_note: command.note ?? null,
      target_observed_at: command.observedAt,
      target_spring_id: command.springId,
      target_water_presence: command.waterPresence,
    });

    if (error) {
      throw toRepositoryError(error);
    }

    return toSpringReport(data as SpringReportRow);
  }

  async listMediaByReportIds(reportIds: ReportId[]) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('report_media')
      .select('*')
      .in('report_id', reportIds)
      .eq('upload_state', 'uploaded')
      .order('created_at', { ascending: true });

    if (error) {
      throw toRepositoryError(error);
    }

    return (data ?? []).reduce<Record<ReportId, SpringMedia[]>>((accumulator, row) => {
      const media = toSpringMedia(row as SpringMediaRow);
      const list = accumulator[media.reportId] ?? [];

      accumulator[media.reportId] = [...list, media];

      return accumulator;
    }, {});
  }

  async reserveMediaSlot(input: {
    reportId: ReportId;
    clientMediaDraftId: string;
    fileExtension: string | null;
    capturedAt: string | null;
  }) {
    const client = getSupabaseClient();
    const { data, error } = await client.rpc('reserve_report_media_slot', {
      captured_at: input.capturedAt,
      file_extension: input.fileExtension,
      target_client_media_draft_id: input.clientMediaDraftId,
      target_report_id: input.reportId,
    });

    if (error) {
      throw toRepositoryError(error);
    }

    return toMediaSlotReservation(data as SpringMediaRow);
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
      throw toRepositoryError(error);
    }

    return toSpringMedia(data as SpringMediaRow);
  }
}

export const springReportRepository = new SupabaseSpringReportRepository();
