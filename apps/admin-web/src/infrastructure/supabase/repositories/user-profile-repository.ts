'use client';

import type { UserProfileRepository } from '@maayanhot/domain';
import type { UserRole } from '@maayanhot/contracts';

import { getSupabaseClient } from '../client';

type UserProfileSummaryRow = {
  approved_report_count: number;
  avatar_url: string | null;
  created_at: string;
  display_name: string | null;
  id: string;
  last_active_at: string | null;
  pending_report_count: number;
  primary_role: UserRole;
  rejected_report_count: number;
  role_set: UserRole[];
  trust_score: number | null;
};

const toUserProfile = (row: UserProfileSummaryRow) => ({
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
  displayName: row.display_name,
  id: row.id,
  lastActiveAt: row.last_active_at,
  primaryRole: row.primary_role,
  roleSet: row.role_set,
  trustSnapshot: {
    approvedReportCount: row.approved_report_count,
    pendingReportCount: row.pending_report_count,
    rejectedReportCount: row.rejected_report_count,
    trustScore: row.trust_score,
  },
});

export class SupabaseUserProfileRepository implements UserProfileRepository {
  async getById(userId: string) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('user_profile_role_summary')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? toUserProfile(data as UserProfileSummaryRow) : null;
  }

  async listByIds(userIds: string[]) {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('user_profile_role_summary')
      .select('*')
      .in('id', userIds);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row) => toUserProfile(row as UserProfileSummaryRow));
  }
}

export const userProfileRepository = new SupabaseUserProfileRepository();
