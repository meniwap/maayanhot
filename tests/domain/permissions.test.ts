import {
  canCreateSpring,
  canModerateReports,
  canSubmitReports,
  type UserProfile,
} from '@maayanhot/domain';
import { describe, expect, it } from 'vitest';

const makeProfile = (overrides: Partial<UserProfile> & Pick<UserProfile, 'id'>): UserProfile => ({
  id: overrides.id,
  displayName: overrides.displayName ?? null,
  avatarUrl: overrides.avatarUrl ?? null,
  primaryRole: overrides.primaryRole ?? 'user',
  roleSet: overrides.roleSet ?? [overrides.primaryRole ?? 'user'],
  createdAt: overrides.createdAt ?? '2026-03-01T08:00:00.000Z',
  lastActiveAt: overrides.lastActiveAt ?? '2026-03-26T08:00:00.000Z',
  trustSnapshot: overrides.trustSnapshot ?? {
    approvedReportCount: 0,
    rejectedReportCount: 0,
    pendingReportCount: 0,
    trustScore: null,
  },
});

describe('domain permission guards', () => {
  it('allows only admins to create springs', () => {
    expect(canCreateSpring('admin')).toBe(true);
    expect(canCreateSpring('moderator')).toBe(false);
    expect(canCreateSpring('trusted_contributor')).toBe(false);
    expect(canCreateSpring('user')).toBe(false);
  });

  it('allows moderators and admins to moderate reports', () => {
    expect(canModerateReports('moderator')).toBe(true);
    expect(canModerateReports('admin')).toBe(true);
    expect(canModerateReports('trusted_contributor')).toBe(false);
  });

  it('keeps trusted contributors on the same submit boundary as regular users', () => {
    expect(canSubmitReports('user')).toBe(true);
    expect(canSubmitReports('trusted_contributor')).toBe(true);
    expect(canSubmitReports('moderator')).toBe(true);
    expect(canSubmitReports('admin')).toBe(true);
  });

  it('respects the full role set on a user profile', () => {
    const profile = makeProfile({
      id: 'user-42',
      primaryRole: 'user',
      roleSet: ['user', 'moderator'],
    });

    expect(canModerateReports(profile)).toBe(true);
    expect(canCreateSpring(profile)).toBe(false);
  });
});
