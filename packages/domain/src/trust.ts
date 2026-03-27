import type { UserRole } from '@maayanhot/contracts';

import type { UserProfile } from './entities';

export type TrustedContributorProgressionDecision = 'grant' | 'retain' | 'revoke' | 'none';

export type TrustedContributorProgressionReason =
  | 'meets_grant_thresholds'
  | 'meets_retain_thresholds'
  | 'below_grant_thresholds'
  | 'below_retain_thresholds'
  | 'staff_roles_managed_separately';

export type TrustedContributorProgressionPolicy = {
  minimumApprovedReportsToGrant: number;
  minimumApprovedReportsToRetain: number;
  minimumTrustScoreToGrant: number;
  minimumTrustScoreToRetain: number;
  maximumPendingReportsToGrant: number;
  maximumPendingReportsToRetain: number;
};

export type TrustedContributorProgressionEvaluation = {
  decision: TrustedContributorProgressionDecision;
  reason: TrustedContributorProgressionReason;
  shouldHaveTrustedContributorRole: boolean;
};

const hasAnyRole = (roleSet: UserRole[], roles: UserRole[]) =>
  roles.some((role) => roleSet.includes(role));

export const defaultTrustedContributorProgressionPolicy = {
  minimumApprovedReportsToGrant: 5,
  minimumApprovedReportsToRetain: 4,
  minimumTrustScoreToGrant: 0.85,
  minimumTrustScoreToRetain: 0.72,
  maximumPendingReportsToGrant: 0,
  maximumPendingReportsToRetain: 1,
} satisfies TrustedContributorProgressionPolicy;

const meetsGrantThresholds = (profile: UserProfile, policy: TrustedContributorProgressionPolicy) =>
  profile.trustSnapshot.approvedReportCount >= policy.minimumApprovedReportsToGrant &&
  profile.trustSnapshot.pendingReportCount <= policy.maximumPendingReportsToGrant &&
  (profile.trustSnapshot.trustScore ?? 0) >= policy.minimumTrustScoreToGrant;

const meetsRetainThresholds = (profile: UserProfile, policy: TrustedContributorProgressionPolicy) =>
  profile.trustSnapshot.approvedReportCount >= policy.minimumApprovedReportsToRetain &&
  profile.trustSnapshot.pendingReportCount <= policy.maximumPendingReportsToRetain &&
  (profile.trustSnapshot.trustScore ?? 0) >= policy.minimumTrustScoreToRetain;

export const evaluateTrustedContributorProgression = (
  profile: UserProfile,
  policy: TrustedContributorProgressionPolicy = defaultTrustedContributorProgressionPolicy,
): TrustedContributorProgressionEvaluation => {
  const hasTrustedContributorRole = profile.roleSet.includes('trusted_contributor');

  if (hasAnyRole(profile.roleSet, ['moderator', 'admin'])) {
    return {
      decision: 'none',
      reason: 'staff_roles_managed_separately',
      shouldHaveTrustedContributorRole: hasTrustedContributorRole,
    };
  }

  if (hasTrustedContributorRole) {
    const shouldRetain = meetsRetainThresholds(profile, policy);

    return {
      decision: shouldRetain ? 'retain' : 'revoke',
      reason: shouldRetain ? 'meets_retain_thresholds' : 'below_retain_thresholds',
      shouldHaveTrustedContributorRole: shouldRetain,
    };
  }

  const shouldGrant = meetsGrantThresholds(profile, policy);

  return {
    decision: shouldGrant ? 'grant' : 'none',
    reason: shouldGrant ? 'meets_grant_thresholds' : 'below_grant_thresholds',
    shouldHaveTrustedContributorRole: shouldGrant,
  };
};
