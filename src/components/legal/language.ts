export type LegalLang = 'en' | 'de';

export function defaultLegalLang(locale: string = navigator.language): LegalLang {
  return locale.toLowerCase().startsWith('de') ? 'de' : 'en';
}
