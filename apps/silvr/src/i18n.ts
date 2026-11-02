/**
 * UI text. Locale files live in src/locales/ (one per language, ko.ts is the source of truth);
 * the message format (ICU-style plurals) is in src/intl/message.ts.
 *
 * ko and en are bundled; the other eight load on demand (separate chunks, precached by the
 * service worker so every language works offline). Until a locale has loaded, the UI keeps its
 * previous language; a key a locale has not translated falls back to English.
 */
import { signal } from '@preact/signals';
import * as enLocale from './locales/en';
import * as koLocale from './locales/ko';
import type { LocaleModule, MsgKey } from './locales/types';
import { formatMessage, type Vars } from './intl/message';
import { detectLocale, HTML_LANG, INTL_LOCALE, RTL_LOCALES, type Locale } from './intl/locales';
import { signalLang } from './state/lang';

export type { MsgKey };
export type { Locale };
/** One of the 10 UI languages (never 'auto'). */
export type ResolvedLang = Locale;

const loaded = new Map<Locale, LocaleModule>([
  ['ko', koLocale],
  ['en', enLocale],
]);
/** Bumped when a locale finishes loading, so text read during render refreshes. */
const revision = signal(0);

const LOADERS: Record<Exclude<Locale, 'ko' | 'en'>, () => Promise<LocaleModule>> = {
  ja: () => import('./locales/ja'),
  zh: () => import('./locales/zh'),
  es: () => import('./locales/es'),
  fr: () => import('./locales/fr'),
  pt: () => import('./locales/pt'),
  ru: () => import('./locales/ru'),
  hi: () => import('./locales/hi'),
  ar: () => import('./locales/ar'),
};

const pending = new Map<Locale, Promise<LocaleModule>>();

export function isLocaleLoaded(lang: Locale): boolean {
  return loaded.has(lang);
}

/** Loads a locale's chunk once (resolves immediately for ko/en). */
export function loadLocale(lang: Locale): Promise<LocaleModule> {
  const have = loaded.get(lang);
  if (have) return Promise.resolve(have);
  let p = pending.get(lang);
  if (!p) {
    p = LOADERS[lang as keyof typeof LOADERS]().then(
      (m) => {
        loaded.set(lang, m);
        pending.delete(lang);
        revision.value++;
        return m;
      },
      (err) => {
        pending.delete(lang); // a later switch may retry (e.g. back online)
        throw err;
      },
    );
    pending.set(lang, p);
  }
  return p;
}

function data(lang: Locale): LocaleModule | undefined {
  void revision.value;
  return loaded.get(lang);
}

export const detectLang = (): ResolvedLang => detectLocale();

/** Intl locale tag for dates, numbers and plural rules ("ar" → "ar-u-nu-latn": Western digits). */
export function intlLocale(lang: Locale = signalLang.value): string {
  return INTL_LOCALE[lang];
}

export function isRtl(lang: Locale = signalLang.value): boolean {
  return RTL_LOCALES.has(lang);
}

const FSI = '⁨';
const LRI = '⁦';
const PDI = '⁩';

/** Isolates Latin text (names, sizes, times) inside a right-to-left sentence; unchanged in LTR UIs. */
export function isolate(s: string, lang: Locale = signalLang.value): string {
  return RTL_LOCALES.has(lang) ? FSI + s + PDI : s;
}

/** Keeps a signed number or unit run ("+1.0 EV", "−0.5") left-to-right in an RTL UI. */
export function ltr(s: string, lang: Locale = signalLang.value): string {
  return RTL_LOCALES.has(lang) ? LRI + s + PDI : s;
}

/** Sets <html lang> and dir for the active language. */
export function setDocumentLang(lang: Locale): void {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.lang = HTML_LANG[lang];
  html.dir = RTL_LOCALES.has(lang) ? 'rtl' : 'ltr';
}

export function translate(lang: ResolvedLang, key: MsgKey, vars?: Vars): string {
  const own = data(lang)?.messages[key];
  // A fallback string is English, so it takes English plural rules.
  const [src, locale] = own !== undefined && own !== '' ? [own, lang] : [enLocale.messages[key] ?? key, 'en' as Locale];
  if (!vars) return formatMessage(INTL_LOCALE[locale], src);
  return formatMessage(
    INTL_LOCALE[locale],
    src,
    vars,
    // Guide §7: Latin placeholders get first-strong isolation; signed numbers ({v}) stay LTR.
    RTL_LOCALES.has(lang) ? { wrapString: (name, v) => (name === 'v' ? LRI : FSI) + v + PDI } : undefined,
  );
}

/** Translate using the current UI language. */
export function t(key: MsgKey, vars?: Vars): string {
  return translate(signalLang.value, key, vars);
}

type Lookup = Partial<Record<string, string>>;
const pick = (own: Lookup | undefined, fallback: Lookup, id: string) => own?.[id] || fallback[id];

/** "1996 · Disposable" → "1996 · 일회용": the year stays, the type word is translated. */
export function cameraEra(era: string, lang: Locale = signalLang.value): string {
  const [year, kind] = era.split(' · ');
  if (!kind) return era;
  return `${year} · ${pick(data(lang)?.cameraText.era, enLocale.cameraText.era, kind) ?? kind}`;
}

export function cameraDescription(id: string, lang: Locale = signalLang.value): string {
  return pick(data(lang)?.cameraText.desc, enLocale.cameraText.desc, id) ?? '';
}

export function stockDescription(id: string, lang: Locale = signalLang.value): string {
  return pick(data(lang)?.stockText, enLocale.stockText, id) ?? '';
}

export const MESSAGES = { ko: koLocale.messages, en: enLocale.messages };

/** The legal / support pages exist in Korean and English only (for now): everyone else gets English. */
export function legalLang(lang: Locale = signalLang.value): 'ko' | 'en' {
  return lang === 'ko' ? 'ko' : 'en';
}
