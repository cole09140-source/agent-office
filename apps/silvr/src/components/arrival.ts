import { intlLocale, translate, type ResolvedLang } from '../i18n';

/** CJK writes the month as a number with a counter (11월 / 11月) either way; others get "Nov 4". */
const LONG_MONTH = new Set<ResolvedLang>(['ko', 'ja', 'zh']);
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * When a roll arrives from the lab, in words: "오늘 오후 3:20 도착", "내일 오전 9:00 도착",
 * "11월 4일 도착". Pure, so the speed sheet and the lab show the same wording.
 */
export function formatArrival(readyAt: number, now: number, lang: ResolvedLang): string {
  if (readyAt <= now) return translate(lang, 'speed.at.now');
  const locale = intlLocale(lang);
  const at = new Date(readyAt);
  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(at);
  if (sameDay(at, today)) return translate(lang, 'speed.at.today', { time });
  if (sameDay(at, tomorrow)) return translate(lang, 'speed.at.tomorrow', { time });
  const date = new Intl.DateTimeFormat(locale, { month: LONG_MONTH.has(lang) ? 'long' : 'short', day: 'numeric' }).format(at);
  return translate(lang, 'speed.at.date', { date });
}
