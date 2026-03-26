import type {
  IsoTimestampString,
  ProjectionConfidence,
  ProjectionFreshness,
  WaterPresence,
} from '@maayanhot/contracts';

export const toStatusBadgeStatus = (waterPresence: WaterPresence) => {
  if (waterPresence === 'water') {
    return 'water' as const;
  }

  if (waterPresence === 'no_water') {
    return 'noWater' as const;
  }

  return 'unknown' as const;
};

export const formatPublicStatusLabel = (
  waterPresence: WaterPresence,
  freshness: ProjectionFreshness,
) => {
  if (waterPresence === 'water' && freshness === 'recent') {
    return 'יש מים לפי דיווח מאושר עדכני';
  }

  if (waterPresence === 'water' && freshness === 'stale') {
    return 'יש מים, אך הדיווח המאושר כבר ישן';
  }

  if (waterPresence === 'no_water' && freshness === 'recent') {
    return 'אין מים לפי דיווח מאושר עדכני';
  }

  if (waterPresence === 'no_water' && freshness === 'stale') {
    return 'אין מים, אך הדיווח המאושר כבר ישן';
  }

  if (freshness === 'none') {
    return 'עדיין אין דיווח מאושר זמין';
  }

  return 'מצב המים אינו ידוע כרגע';
};

export const formatObservationDate = (value: IsoTimestampString | null) => {
  if (!value) {
    return 'עדיין אין דיווח מאושר להצגה';
  }

  return `דיווח מאושר אחרון: ${value.slice(0, 10)}`;
};

export const formatConfidenceLabel = (confidence: ProjectionConfidence) => {
  if (confidence === 'high') {
    return 'ביטחון גבוה';
  }

  if (confidence === 'medium') {
    return 'ביטחון בינוני';
  }

  return 'ביטחון נמוך';
};

export const formatFreshnessLabel = (freshness: ProjectionFreshness) => {
  if (freshness === 'recent') {
    return 'מעודכן';
  }

  if (freshness === 'stale') {
    return 'מיושן';
  }

  return 'ללא דיווח מאושר';
};

export const formatWaterPresenceLabel = (waterPresence: WaterPresence) => {
  if (waterPresence === 'water') {
    return 'יש מים';
  }

  if (waterPresence === 'no_water') {
    return 'אין מים';
  }

  return 'לא ידוע';
};
