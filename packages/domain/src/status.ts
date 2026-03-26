import type {
  IsoTimestampString,
  ProjectionConfidence,
  ProjectionFreshness,
  ReportId,
  SpringId,
  UserId,
  UserRole,
  WaterPresence,
} from '@maayanhot/contracts';

import type { SpringMedia, SpringReport, SpringStatusProjection } from './entities';

export type StatusDerivationPolicy = {
  recentThresholdHours: number;
  staleThresholdHours: number;
  maxReportsConsidered: number;
  uncertaintyMargin: number;
  preciseLocationThresholdMeters: number;
  roleWeights: Record<UserRole, number>;
  evidenceBonuses: {
    media: number;
    preciseLocation: number;
    note: number;
  };
  confidenceThresholds: {
    medium: number;
    high: number;
  };
};

export type StatusDerivationInput = {
  springId: SpringId;
  reports: SpringReport[];
  mediaByReportId?: Partial<Record<ReportId, SpringMedia[]>>;
  reporterRolesByUserId?: Partial<Record<UserId, UserRole>>;
  now?: Date | IsoTimestampString;
  policy?: StatusDerivationPolicy;
};

type Scoreboard = Record<WaterPresence, number>;

export const defaultStatusDerivationPolicy = {
  recentThresholdHours: 72,
  staleThresholdHours: 336,
  maxReportsConsidered: 12,
  uncertaintyMargin: 0.25,
  preciseLocationThresholdMeters: 150,
  roleWeights: {
    user: 1,
    trusted_contributor: 1.35,
    moderator: 1.5,
    admin: 1.65,
  },
  evidenceBonuses: {
    media: 0.35,
    preciseLocation: 0.15,
    note: 0.05,
  },
  confidenceThresholds: {
    medium: 1.1,
    high: 2.5,
  },
} satisfies StatusDerivationPolicy;

const toDate = (value: Date | IsoTimestampString) =>
  value instanceof Date ? value : new Date(value);

const getFreshness = (
  latestApprovedReportAt: IsoTimestampString | null,
  now: Date,
  policy: StatusDerivationPolicy,
): ProjectionFreshness => {
  if (!latestApprovedReportAt) {
    return 'none';
  }

  const ageHours =
    Math.max(0, toDate(now).getTime() - new Date(latestApprovedReportAt).getTime()) / 36e5;

  return ageHours <= policy.recentThresholdHours ? 'recent' : 'stale';
};

const getReporterRole = (
  report: SpringReport,
  reporterRolesByUserId: Partial<Record<UserId, UserRole>>,
): UserRole =>
  report.reporterRoleSnapshot ?? reporterRolesByUserId[report.reporterUserId] ?? 'user';

const getRecencyWeight = (ageHours: number, policy: StatusDerivationPolicy) => {
  if (ageHours <= policy.recentThresholdHours) {
    return 1;
  }

  if (ageHours >= policy.staleThresholdHours) {
    return 0.35;
  }

  const elapsed = ageHours - policy.recentThresholdHours;
  const window = policy.staleThresholdHours - policy.recentThresholdHours;

  return 1 - (elapsed / window) * 0.65;
};

const getEvidenceMultiplier = (
  report: SpringReport,
  mediaByReportId: Partial<Record<ReportId, SpringMedia[]>>,
  policy: StatusDerivationPolicy,
) => {
  let multiplier = 1;

  if ((mediaByReportId[report.id] ?? []).length > 0) {
    multiplier += policy.evidenceBonuses.media;
  }

  if (
    report.locationEvidence.precisionMeters !== null &&
    report.locationEvidence.precisionMeters <= policy.preciseLocationThresholdMeters
  ) {
    multiplier += policy.evidenceBonuses.preciseLocation;
  }

  if (report.note && report.note.trim().length > 0) {
    multiplier += policy.evidenceBonuses.note;
  }

  return multiplier;
};

const getConfidence = (
  winningScore: number,
  runnerUpScore: number,
  policy: StatusDerivationPolicy,
): ProjectionConfidence => {
  const confidenceScore = winningScore - runnerUpScore * 0.25;

  if (confidenceScore >= policy.confidenceThresholds.high) {
    return 'high';
  }

  if (confidenceScore >= policy.confidenceThresholds.medium) {
    return 'medium';
  }

  return 'low';
};

export const filterApprovedReportsForPublicStatus = (reports: SpringReport[]) =>
  reports
    .filter((report) => report.moderationStatus === 'approved')
    .sort(
      (left, right) => new Date(right.observedAt).getTime() - new Date(left.observedAt).getTime(),
    );

export const deriveSpringStatusProjection = ({
  springId,
  reports,
  mediaByReportId = {},
  reporterRolesByUserId = {},
  now = new Date(),
  policy = defaultStatusDerivationPolicy,
}: StatusDerivationInput): SpringStatusProjection => {
  const approvedReports = filterApprovedReportsForPublicStatus(reports);
  const nowDate = toDate(now);

  if (approvedReports.length === 0) {
    return {
      springId,
      waterPresence: 'unknown',
      freshness: 'none',
      confidence: 'low',
      latestApprovedReportAt: null,
      derivedFromReportIds: [],
      approvedReportCountConsidered: 0,
      recalculatedAt: nowDate.toISOString(),
    };
  }

  const consideredReports = approvedReports.slice(0, policy.maxReportsConsidered);
  const scoreboard: Scoreboard = {
    water: 0,
    no_water: 0,
    unknown: 0,
  };

  for (const report of consideredReports) {
    const ageHours = Math.max(0, nowDate.getTime() - new Date(report.observedAt).getTime()) / 36e5;
    const role = getReporterRole(report, reporterRolesByUserId);
    const weightedScore =
      policy.roleWeights[role] *
      getRecencyWeight(ageHours, policy) *
      getEvidenceMultiplier(report, mediaByReportId, policy);

    scoreboard[report.waterPresence] += weightedScore;
  }

  const rankedStates = (Object.entries(scoreboard) as Array<[WaterPresence, number]>).sort(
    (left, right) => right[1] - left[1],
  );

  const [topState, topScore] = rankedStates[0] ?? ['unknown', 0];
  const [, runnerUpScore = 0] = rankedStates[1] ?? [];
  const latestApprovedReportAt = consideredReports[0]?.observedAt ?? null;
  const freshness = getFreshness(latestApprovedReportAt, nowDate, policy);
  const waterPresence =
    topScore <= 0 || Math.abs(scoreboard.water - scoreboard.no_water) <= policy.uncertaintyMargin
      ? 'unknown'
      : topState;
  const confidence = getConfidence(topScore, runnerUpScore, policy);

  return {
    springId,
    waterPresence,
    freshness,
    confidence,
    latestApprovedReportAt,
    derivedFromReportIds: consideredReports.map((report) => report.id),
    approvedReportCountConsidered: consideredReports.length,
    recalculatedAt: nowDate.toISOString(),
  };
};
