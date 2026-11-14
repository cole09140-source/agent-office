/**
 * The 10 UI languages: codes, endonyms, Intl tags, direction, and device-language detection.
 * No imports, so settings/state can use the types without pulling in any messages.
 */

export const LOCALES = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'pt', 'ru', 'hi', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];

/** Shown in the language picker in their own language (guide §2.11); never translated. */
export const ENDONYMS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '简体中文',
  es: 'Español',
  fr: 'Français',
  pt: 'Português (Brasil)',
  ru: 'Русский',
  hi: 'हिन्दी',
  ar: 'العربية',
};

/** BCP 47 tag for <html lang> and lang attributes. */
export const HTML_LANG: Record<Locale, string> = {
  ko: 'ko',
  en: 'en',
  ja: 'ja',
  zh: 'zh-CN',
  es: 'es',
  fr: 'fr',
  pt: 'pt-BR',
  ru: 'ru',
  hi: 'hi',
  ar: 'ar',
};

/**
 * Tag for Intl (dates, numbers, plural rules). Arabic uses Western digits everywhere (guide §7.2),
 * so camera/film names like "Pro 35" never sit next to Arabic-Indic digits.
 */
export const INTL_LOCALE: Record<Locale, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
  es: 'es',
  fr: 'fr-FR',
  pt: 'pt-BR',
  ru: 'ru-RU',
  hi: 'hi-IN',
  ar: 'ar-u-nu-latn',
};

export const RTL_LOCALES: ReadonlySet<Locale> = new Set<Locale>(['ar']);

export const isLocale = (v: unknown): v is Locale => typeof v === 'string' && (LOCALES as readonly string[]).includes(v);

/** Maps one BCP 47 tag ("pt-PT", "zh-Hant-TW", "es-419", "ar-EG") to a UI language, or null. */
export function matchLocale(tag: string | undefined | null): Locale | null {
  if (!tag) return null;
  const primary = tag.toLowerCase().split(/[-_]/)[0];
  return isLocale(primary) ? primary : null;
}

/** The first of the device's preferred languages we support, else English. */
export function detectLocale(langs?: readonly string[]): Locale {
  const list = langs ?? (typeof navigator !== 'undefined' ? (navigator.languages?.length ? navigator.languages : [navigator.language]) : []);
  for (const l of list) {
    const m = matchLocale(l);
    if (m) return m;
  }
  return 'en';
}
