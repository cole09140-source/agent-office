/**
 * Locale-aware numbers, dates, sizes and durations. Every function takes the UI language
 * (defaults to the active one); unit words come from the messages (dur.*, wait.*), so
 * translators control them. Pure apart from reading the active language.
 */
import { intlLocale, translate, type ResolvedLang } from '../i18n';
import { signalLang } from '../state/lang';

const cur = () => signalLang.value;

export function formatNumber(n: number, lang: ResolvedLang = cur(), opts?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(intlLocale(lang), opts).format(n);
}

/** "2026. 11. 2." / "Nov 2, 2026" / "2 нояб. 2026 г." (with the time when asked). */
export function formatDate(ts: number, lang: ResolvedLang = cur(), withTime = false): string {
  return new Intl.DateTimeFormat(intlLocale(lang), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(ts);
}

/** Clock time, 12/24 h as the locale prefers. */
export function formatTime(ts: number, lang: ResolvedLang = cur()): string {
  return new Intl.DateTimeFormat(intlLocale(lang), { hour: '2-digit', minute: '2-digit' }).format(ts);
}

/** A storage size: "1.2 GB", "1,2 Go", "1,2 ГБ". */
export function formatBytes(n: number, lang: ResolvedLang = cur()): string {
  const [v, unit, fd] =
    n < 1024 ? [n, 'byte', 0] : n < 1024 ** 2 ? [n / 1024, 'kilobyte', 0] : n < 1024 ** 3 ? [n / 1024 ** 2, 'megabyte', 1] : [n / 1024 ** 3, 'gigabyte', 2];
  try {
    return new Intl.NumberFormat(intlLocale(lang), { style: 'unit', unit, unitDisplay: 'short', minimumFractionDigits: fd, maximumFractionDigits: fd }).format(v);
  } catch {
    // Very old engines without unit formatting.
    return `${v.toFixed(fd)} ${{ byte: 'B', kilobyte: 'KB', megabyte: 'MB', gigabyte: 'GB' }[unit]}`;
  }
}

/** Compact countdown: "2d 3h", "1h 5m", "5m 3s", "30s" / "2일 3시간". */
export function formatDuration(ms: number, lang: ResolvedLang = cur()): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const u = (key: 'dur.days' | 'dur.hours' | 'dur.minutes' | 'dur.seconds', n: number) => translate(lang, key, { n });
  const pair = (a: string, b: string) => translate(lang, 'dur.pair', { a, b });
  if (d > 0) return pair(u('dur.days', d), u('dur.hours', h));
  if (h > 0) return pair(u('dur.hours', h), u('dur.minutes', m));
  if (m > 0) return pair(u('dur.minutes', m), u('dur.seconds', sec));
  return u('dur.seconds', sec);
}

/** How long until a roll is back, for speech: "1시간", "2일 3시간", "45분" / "1 h", "2 d 3 h", "45 min". */
export function formatWait(ms: number, lang: ResolvedLang = cur()): string {
  const min = Math.max(1, Math.round(ms / 60_000));
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  const parts = (d > 0 ? [d && translate(lang, 'wait.days', { n: d }), h && translate(lang, 'wait.hours', { n: h })] : [h && translate(lang, 'wait.hours', { n: h }), m && translate(lang, 'wait.minutes', { n: m })]).filter(
    (x): x is string => !!x,
  );
  return parts.length === 2 ? translate(lang, 'dur.pair', { a: parts[0], b: parts[1] }) : parts[0];
}
