export type LegalLang = 'en' | 'de';

export function defaultLegalLang(locale: string = navigator.language): LegalLang {
  return locale.toLowerCase().startsWith('de') ? 'de' : 'en';
}

/** When the legal texts were last revised. Bump it whenever their wording changes. */
export const LEGAL_TEXTS_UPDATED = new Date('2026-10-23T00:00:00Z');

export function formatLegalDate(lang: LegalLang): string {
  return LEGAL_TEXTS_UPDATED.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { timeZone: 'UTC' });
}
