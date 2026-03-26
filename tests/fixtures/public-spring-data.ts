import type { PublicSpringCatalogRow } from '../../apps/mobile/src/features/map-browse/public-spring-catalog';
import type { PublicSpringDetailRow } from '../../apps/mobile/src/features/spring-detail/public-spring-detail';

export const publicSpringCatalogFixture: PublicSpringCatalogRow[] = [
  {
    accessNotes: 'הליכה קצרה בשביל מוצל',
    confidence: 'high',
    coordinates: {
      latitude: 31.7454,
      longitude: 35.1691,
    },
    coverImageUrl: null,
    description: 'נביעה רחבה ליד טרסות, עם גישה נוחה יחסית.',
    freshness: 'recent',
    id: 'spring-ein-haniya',
    isAccessibleByCurrentUser: true,
    latestApprovedReportAt: '2026-03-21T08:10:00.000Z',
    regionLabel: 'הרי ירושלים',
    slug: 'ein-haniya',
    title: 'עין חניה',
    updatedAt: '2026-03-22T09:00:00.000Z',
    waterPresence: 'water',
  },
  {
    accessNotes: 'ירידה תלולה יחסית בערוץ',
    confidence: 'medium',
    coordinates: {
      latitude: 31.8515,
      longitude: 35.3342,
    },
    coverImageUrl: null,
    description: 'בריכת שכשוך קטנה בתוך ערוץ נחל סלעי.',
    freshness: 'stale',
    id: 'spring-ein-fara',
    isAccessibleByCurrentUser: true,
    latestApprovedReportAt: '2025-12-18T13:40:00.000Z',
    regionLabel: 'בנימין',
    slug: 'ein-fara',
    title: 'עין פרא',
    updatedAt: '2026-03-10T11:00:00.000Z',
    waterPresence: 'no_water',
  },
  {
    accessNotes: 'גישה ברכב ולאחר מכן הליכה קצרה',
    confidence: 'high',
    coordinates: {
      latitude: 33.0414,
      longitude: 35.6259,
    },
    coverImageUrl: null,
    description: 'מעיין צפוני עם בריכה רדודה וצל חלקי.',
    freshness: 'recent',
    id: 'spring-ein-tina',
    isAccessibleByCurrentUser: true,
    latestApprovedReportAt: '2026-03-24T06:35:00.000Z',
    regionLabel: 'אצבע הגליל',
    slug: 'ein-tina',
    title: 'עין תינה',
    updatedAt: '2026-03-24T06:35:00.000Z',
    waterPresence: 'water',
  },
  {
    accessNotes: 'מסלול מדברי ארוך יותר, ללא קליטה יציבה',
    confidence: 'low',
    coordinates: {
      latitude: 30.8253,
      longitude: 34.7699,
    },
    coverImageUrl: null,
    description: 'נביעה מדברית מרוחקת שבה המצב אינו ודאי כרגע.',
    freshness: 'none',
    id: 'spring-ein-akev',
    isAccessibleByCurrentUser: false,
    latestApprovedReportAt: null,
    regionLabel: 'הנגב',
    slug: 'ein-akev',
    title: 'עין עקב',
    updatedAt: '2026-03-05T15:20:00.000Z',
    waterPresence: 'unknown',
  },
];

export const publicSpringDetailFixture: PublicSpringDetailRow[] = [
  {
    ...publicSpringCatalogFixture[0]!,
    alternateNames: ['Ein Haniya'],
    gallery: [
      {
        alt: 'בריכת אבן עם מים צלולים',
        capturedAt: '2026-03-21T08:05:00.000Z',
        id: 'media-ein-haniya-1',
        url: 'https://picsum.photos/seed/ein-haniya-1/960/720',
      },
      {
        alt: 'ערוץ מוצל ליד הנביעה',
        capturedAt: '2026-03-21T08:08:00.000Z',
        id: 'media-ein-haniya-2',
        url: 'https://picsum.photos/seed/ein-haniya-2/960/720',
      },
    ],
    historySummary: [
      {
        observedAt: '2026-03-21T08:10:00.000Z',
        photoCount: 2,
        reportId: 'report-ein-haniya-2',
        waterPresence: 'water',
      },
      {
        observedAt: '2026-02-28T09:20:00.000Z',
        photoCount: 1,
        reportId: 'report-ein-haniya-1',
        waterPresence: 'water',
      },
    ],
    locationLabel: 'עמק רפאים, ירושלים',
  },
  {
    ...publicSpringCatalogFixture[1]!,
    alternateNames: ['Ein Prat'],
    gallery: [
      {
        alt: 'בריכה ריקה יחסית לצד קיר סלע',
        capturedAt: '2025-12-18T13:35:00.000Z',
        id: 'media-ein-fara-1',
        url: 'https://picsum.photos/seed/ein-fara-1/960/720',
      },
    ],
    historySummary: [
      {
        observedAt: '2025-12-18T13:30:00.000Z',
        photoCount: 1,
        reportId: 'report-ein-fara-1',
        waterPresence: 'no_water',
      },
    ],
    locationLabel: 'נחל פרת עליון',
  },
];

export const getPublicSpringDetailFixtureById = (springId: string) =>
  publicSpringDetailFixture.find((spring) => spring.id === springId) ?? null;
