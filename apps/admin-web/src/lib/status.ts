import type { ProjectionFreshness, WaterPresence } from '@maayanhot/contracts';

export const formatWaterPresenceLabel = (waterPresence: WaterPresence) => {
  if (waterPresence === 'water') {
    return 'יש מים';
  }

  if (waterPresence === 'no_water') {
    return 'אין מים';
  }

  return 'לא ידוע';
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

export const formatTimestamp = (value: string | null) => {
  if (!value) {
    return 'ללא תאריך זמין';
  }

  return value.slice(0, 16).replace('T', ' ');
};
