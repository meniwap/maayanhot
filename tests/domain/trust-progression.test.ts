import {
  defaultTrustedContributorProgressionPolicy,
  evaluateTrustedContributorProgression,
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
    pendingReportCount: 0,
    rejectedReportCount: 0,
    trustScore: null,
  },
});

describe('trusted contributor progression', () => {
  it('grants trusted contributor when the explicit thresholds are met', () => {
    const evaluation = evaluateTrustedContributorProgression(
      makeProfile({
        id: 'user-grant',
        trustSnapshot: {
          approvedReportCount:
            defaultTrustedContributorProgressionPolicy.minimumApprovedReportsToGrant,
          pendingReportCount: 0,
          rejectedReportCount: 1,
          trustScore: defaultTrustedContributorProgressionPolicy.minimumTrustScoreToGrant,
        },
      }),
    );

    expect(evaluation).toEqual({
      decision: 'grant',
      reason: 'meets_grant_thresholds',
      shouldHaveTrustedContributorRole: true,
    });
  });

  it('does not grant trusted contributor while pending moderation work still exists', () => {
    const evaluation = evaluateTrustedContributorProgression(
      makeProfile({
        id: 'user-pending',
        trustSnapshot: {
          approvedReportCount: 8,
          pendingReportCount: 1,
          rejectedReportCount: 0,
          trustScore: 0.95,
        },
      }),
    );

    expect(evaluation.decision).toBe('none');
    expect(evaluation.reason).toBe('below_grant_thresholds');
    expect(evaluation.shouldHaveTrustedContributorRole).toBe(false);
  });

  it('retains an existing trusted contributor role under the softer retention threshold', () => {
    const evaluation = evaluateTrustedContributorProgression(
      makeProfile({
        id: 'user-retain',
        primaryRole: 'trusted_contributor',
        roleSet: ['trusted_contributor'],
        trustSnapshot: {
          approvedReportCount:
            defaultTrustedContributorProgressionPolicy.minimumApprovedReportsToRetain,
          pendingReportCount:
            defaultTrustedContributorProgressionPolicy.maximumPendingReportsToRetain,
          rejectedReportCount: 1,
          trustScore: defaultTrustedContributorProgressionPolicy.minimumTrustScoreToRetain,
        },
      }),
    );

    expect(evaluation).toEqual({
      decision: 'retain',
      reason: 'meets_retain_thresholds',
      shouldHaveTrustedContributorRole: true,
    });
  });

  it('revokes an existing trusted contributor role after quality drops below retention thresholds', () => {
    const evaluation = evaluateTrustedContributorProgression(
      makeProfile({
        id: 'user-revoke',
        primaryRole: 'trusted_contributor',
        roleSet: ['trusted_contributor'],
        trustSnapshot: {
          approvedReportCount: 4,
          pendingReportCount: 2,
          rejectedReportCount: 3,
          trustScore: 0.6,
        },
      }),
    );

    expect(evaluation).toEqual({
      decision: 'revoke',
      reason: 'below_retain_thresholds',
      shouldHaveTrustedContributorRole: false,
    });
  });

  it('does not let the trusted contributor sync logic manage moderator or admin roles', () => {
    const moderatorEvaluation = evaluateTrustedContributorProgression(
      makeProfile({
        id: 'moderator-1',
        primaryRole: 'moderator',
        roleSet: ['moderator'],
        trustSnapshot: {
          approvedReportCount: 10,
          pendingReportCount: 0,
          rejectedReportCount: 0,
          trustScore: 1,
        },
      }),
    );

    expect(moderatorEvaluation).toEqual({
      decision: 'none',
      reason: 'staff_roles_managed_separately',
      shouldHaveTrustedContributorRole: false,
    });
  });
});
