const hebrewTransliteration: Record<string, string> = {
  א: 'a',
  ב: 'b',
  ג: 'g',
  ד: 'd',
  ה: 'h',
  ו: 'v',
  ז: 'z',
  ח: 'h',
  ט: 't',
  י: 'y',
  כ: 'k',
  ך: 'k',
  ל: 'l',
  מ: 'm',
  ם: 'm',
  נ: 'n',
  ן: 'n',
  ס: 's',
  ע: 'a',
  פ: 'p',
  ף: 'p',
  צ: 'ts',
  ץ: 'ts',
  ק: 'k',
  ר: 'r',
  ש: 'sh',
  ת: 't',
};

const transliterateHebrew = (input: string) =>
  input
    .split('')
    .map((character) => hebrewTransliteration[character] ?? character)
    .join('');

export const normalizeSpringSlug = (input: string) => {
  const transliterated = transliterateHebrew(input.normalize('NFKD'))
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const normalized = transliterated
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || 'spring';
};

export const generateSpringSlugFromTitle = (title: string) => normalizeSpringSlug(title);

export const resolveSpringSlugConflict = (baseSlug: string, existingSlugs: string[]) => {
  const normalizedBase = normalizeSpringSlug(baseSlug);
  const taken = new Set(existingSlugs.map((value) => normalizeSpringSlug(value)));

  if (!taken.has(normalizedBase)) {
    return normalizedBase;
  }

  let suffix = 2;

  while (taken.has(`${normalizedBase}-${suffix}`)) {
    suffix += 1;
  }

  return `${normalizedBase}-${suffix}`;
};
