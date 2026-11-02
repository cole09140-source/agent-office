import { afterEach, describe, expect, it } from 'vitest';
import { formatArrival } from '../src/components/arrival';
import { cameraEra, detectLang, isolate, loadLocale, ltr, MESSAGES, translate, type MsgKey } from '../src/i18n';
import { formatBytes, formatDate, formatDuration, formatNumber, formatWait } from '../src/intl/format';
import { detectLocale, matchLocale } from '../src/intl/locales';
import { formatMessage, messageInfo, MessageSyntaxError, parseMessage } from '../src/intl/message';
import * as ja from '../src/locales/ja';
import { signalLang } from '../src/state/lang';

const RU = '{n, plural, one {# кадр} few {# кадра} many {# кадров} other {# кадра}}';
const AR = '{n, plural, zero {لا صور} one {صورة واحدة} two {صورتان} few {# صور} many {# صورة} other {# صورة}}';
const FR = '{n, plural, one {# photo} other {# photos}}';

describe('plural rules per language (CLDR via Intl.PluralRules)', () => {
  it('ru: one / few / many', () => {
    const f = (n: number) => formatMessage('ru-RU', RU, { n });
    expect(f(1)).toBe('1 кадр');
    expect(f(2)).toBe('2 кадра');
    expect(f(5)).toBe('5 кадров');
    expect(f(11)).toBe('11 кадров');
    expect(f(21)).toBe('21 кадр');
    expect(f(22)).toBe('22 кадра');
    expect(f(25)).toBe('25 кадров');
    expect(f(0)).toBe('0 кадров');
  });

  it('ar: zero / one / two / few / many / other, forms without the number', () => {
    const f = (n: number) => formatMessage('ar-u-nu-latn', AR, { n });
    expect(f(0)).toBe('لا صور');
    expect(f(1)).toBe('صورة واحدة');
    expect(f(2)).toBe('صورتان');
    expect(f(3)).toBe('3 صور');
    expect(f(10)).toBe('10 صور');
    expect(f(11)).toBe('11 صورة');
    expect(f(100)).toBe('100 صورة');
    expect(f(102)).toBe('102 صورة');
  });

  it('ar keeps Western digits', () => {
    expect(formatMessage('ar-u-nu-latn', '{n} · #', { n: 1234 })).toBe('1,234 · #');
    expect(formatNumber(36, 'ar')).toBe('36');
  });

  it('fr / pt / hi: zero takes the "one" form', () => {
    expect(formatMessage('fr-FR', FR, { n: 0 })).toBe('0 photo');
    expect(formatMessage('fr-FR', FR, { n: 1 })).toBe('1 photo');
    expect(formatMessage('fr-FR', FR, { n: 2 })).toBe('2 photos');
    expect(formatMessage('pt-BR', '{n, plural, one {# foto} other {# fotos}}', { n: 0 })).toBe('0 foto');
    expect(formatMessage('pt-BR', '{n, plural, one {# foto} other {# fotos}}', { n: 2 })).toBe('2 fotos');
    expect(formatMessage('hi-IN', '{n, plural, one {# रोल} other {# रोल्स}}', { n: 0 })).toBe('0 रोल');
    expect(formatMessage('hi-IN', '{n, plural, one {# रोल} other {# रोल्स}}', { n: 1 })).toBe('1 रोल');
    expect(formatMessage('hi-IN', '{n, plural, one {# रोल} other {# रोल्स}}', { n: 2 })).toBe('2 रोल्स');
  });

  it('en: 0 is plural (unlike fr)', () => {
    expect(formatMessage('en-US', FR, { n: 0 })).toBe('0 photos');
  });

  it('ja / zh / ko have no plural: always "other"', () => {
    const s = '{n, plural, one {ONE} other {#}}';
    for (const l of ['ja-JP', 'zh-CN', 'ko-KR']) for (const n of [0, 1, 2, 21]) expect(formatMessage(l, s, { n }), `${l} ${n}`).toBe(String(n));
    expect(translate('ko', 'gal.frames', { n: 1 })).toBe('1장');
  });

  it('=0 / =1 exact values win over categories', () => {
    const s = '{n, plural, =0 {Aucune photo} =1 {Une seule photo} one {# photo} other {# photos}}';
    expect(formatMessage('fr-FR', s, { n: 0 })).toBe('Aucune photo');
    expect(formatMessage('fr-FR', s, { n: 1 })).toBe('Une seule photo');
    expect(formatMessage('fr-FR', s, { n: 3 })).toBe('3 photos');
  });

  it('two independent counts in one string', () => {
    const s = '{rolls, plural, one {# плёнка} few {# плёнки} many {# плёнок} other {# плёнки}}, {photos, plural, one {# фото} few {# фото} many {# фото} other {# фото}}';
    expect(formatMessage('ru-RU', s, { rolls: 1, photos: 5 })).toBe('1 плёнка, 5 фото');
    expect(formatMessage('ru-RU', s, { rolls: 3, photos: 21 })).toBe('3 плёнки, 21 фото');
    expect(formatMessage('ru-RU', s, { rolls: 5, photos: 2 })).toBe('5 плёнок, 2 фото');
  });

  it('fractions select with the fraction digits shown', () => {
    const stops = '{v} {n, plural, one {ступень} few {ступени} many {ступеней} other {ступени}}';
    expect(formatMessage('ru-RU', stops, { v: '+1', n: 1 })).toBe('+1 ступень');
    expect(formatMessage('ru-RU', stops, { v: '+1.5', n: 1.5 })).toBe('+1.5 ступени');
    expect(formatMessage('ru-RU', stops, { v: '+2', n: 2 })).toBe('+2 ступени');
    expect(formatMessage('ru-RU', stops, { v: '−0.5', n: 0.5 })).toBe('−0.5 ступени');
    // "1.0" is shown with one decimal, so it is not "one" in ru.
    expect(formatMessage('ru-RU', '{n, plural, one {# кадр} other {# кадра}}', { n: '1.0' })).toBe('1.0 кадра');
    // # formats the number for the locale, with the same digits.
    expect(formatMessage('fr-FR', '{n, plural, one {# diaph} other {# diaphs}}', { n: 1.5 })).toBe('1,5 diaph');
    expect(formatMessage('fr-FR', '{n, plural, one {# diaph} other {# diaphs}}', { n: 2.5 })).toBe('2,5 diaphs');
    expect(formatMessage('en-US', '{n, plural, one {# stop} other {# stops}}', { n: 1.5 })).toBe('1.5 stops');
    expect(formatMessage('ar-u-nu-latn', '{n, plural, zero {z} one {o} two {t} few {f} many {m} other {# x}}', { n: 1.5 })).toBe('1.5 x');
  });

  it('nested placeholders and plurals inside a form; {n} works like #', () => {
    expect(formatMessage('en-US', '{n, plural, one {{stock}: one shot} other {{stock}: {n} shots}}', { n: 3, stock: 'Sunny 200' })).toBe('Sunny 200: 3 shots');
    expect(formatMessage('en-US', '{n, plural, one {# roll with {m, plural, one {# photo} other {# photos}}} other {# rolls}}', { n: 1, m: 2 })).toBe('1 roll with 2 photos');
  });

  it('legacy "{n:one|other}" still works', () => {
    expect(formatMessage('en-US', '{n} {n:year|years}', { n: 1 })).toBe('1 year');
    expect(formatMessage('en-US', '{n} {n:year|years}', { n: 4 })).toBe('4 years');
    expect(messageInfo('{n:a|b}').legacy).toBe(true);
  });

  it('bad syntax is reported by the parser, never thrown at runtime', () => {
    expect(() => parseMessage('{n, plural, one {x}}')).toThrow(MessageSyntaxError); // no "other"
    expect(() => parseMessage('{n, plural, uno {x} other {y}}')).toThrow(MessageSyntaxError);
    expect(() => parseMessage('{n, plural, other {x}')).toThrow(MessageSyntaxError);
    expect(() => parseMessage('a } b')).toThrow(MessageSyntaxError);
    expect(formatMessage('en-US', '{n, plural, other {x}', { n: 1 })).toBe('{n, plural, other {x}');
  });

  it('missing values stay visible', () => {
    expect(formatMessage('en-US', 'Hi {name}')).toBe('Hi {name}');
    expect(formatMessage('en-US', '{n, plural, one {# a} other {# b}}')).toBe('{n} b');
  });

  it('existing English strings, converted to the new syntax, read as before', () => {
    expect(translate('en', 'gal.frames', { n: 1 })).toBe('1 frame');
    expect(translate('en', 'gal.frames', { n: 3 })).toBe('3 frames');
    expect(translate('en', 'set.backup.restored', { rolls: 1, photos: 2 })).toBe('Restored · 1 roll, 2 photos added');
    expect(translate('en', 'cam.nHalves', { n: 1, f: 1 })).toBe('1 half (1 frame)');
    expect(translate('en', 'dr.stops', { v: '+1', n: 1 })).toBe('+1 stop');
    expect(translate('en', 'dr.stops', { v: '+0.5', n: 0.5 })).toBe('+0.5 stops');
    expect(translate('en', 'cam.switchConfirmFilm2', { shots: '1 shot', left: '2 shots', n: 1, m: 2 })).toContain('you took gets developed; the 2 shots left stay unused');
    for (const v of Object.values(MESSAGES.en)) expect(v).not.toMatch(/\{\w+:[^}]*\|/);
  });
});

describe('language detection', () => {
  it('maps device languages to the 10 UI languages, else English', () => {
    expect(detectLocale(['zh-TW'])).toBe('zh');
    expect(detectLocale(['zh-Hans-CN'])).toBe('zh');
    expect(detectLocale(['pt-PT'])).toBe('pt');
    expect(detectLocale(['es-419'])).toBe('es');
    expect(detectLocale(['ar-EG'])).toBe('ar');
    expect(detectLocale(['hi-IN'])).toBe('hi');
    expect(detectLocale(['fr-CA'])).toBe('fr');
    expect(detectLocale(['ru'])).toBe('ru');
    expect(detectLocale(['ja-JP'])).toBe('ja');
    expect(detectLocale(['ko-KR', 'en-US'])).toBe('ko');
    expect(detectLocale(['de-DE', 'it', 'ru-RU'])).toBe('ru'); // first supported one
    expect(detectLocale(['de-DE', 'nl'])).toBe('en');
    expect(detectLocale([])).toBe('en');
    expect(matchLocale('EN_gb')).toBe('en');
    expect(typeof detectLang()).toBe('string');
  });
});

describe('lazy locales and fallback', () => {
  afterEach(() => {
    signalLang.value = 'ko';
  });

  it('a lazy locale loads; missing keys fall back to English with English plural rules', async () => {
    await loadLocale('ja');
    expect(translate('ja', 'tab.camera')).toBe(ja.messages['tab.camera'] ?? 'Camera');
    // Untranslated so far → English text.
    const key: MsgKey = 'gal.frames';
    if (!ja.messages[key]) expect(translate('ja', key, { n: 1 })).toBe('1 frame');
    await loadLocale('ar');
    expect(cameraEra('1979 · SLR', 'ar')).toBe('1979 · SLR');
    expect(cameraEra('1996 · Disposable', 'ja')).toMatch(/^1996 · /);
  });

  it('Arabic isolates Latin placeholders and signed numbers', async () => {
    await loadLocale('ar');
    const s = translate('ar', 'a11y.rollLoaded', { stock: 'Sunny 200', n: 3 });
    expect(s).toContain('⁨Sunny 200⁩');
    expect(translate('ar', 'dr.stops', { v: '+1', n: 1 })).toContain('⁦+1⁩');
    expect(isolate('Pro 35', 'ar')).toBe('⁨Pro 35⁩');
    expect(isolate('Pro 35', 'en')).toBe('Pro 35');
    expect(ltr('−0.5 EV', 'ar')).toBe('⁦−0.5 EV⁩');
  });
});

describe('Intl formatting follows the language', () => {
  const t0 = new Date(2026, 10, 1, 14, 20).getTime();

  it('durations come from the messages (ko/en unchanged)', () => {
    expect(formatDuration(2 * 86400_000 + 3 * 3600_000, 'ko')).toBe('2일 3시간');
    expect(formatDuration(3600_000 + 5 * 60_000, 'en')).toBe('1h 5m');
    expect(formatDuration(5 * 60_000 + 3000, 'en')).toBe('5m 3s');
    expect(formatDuration(30_000, 'ko')).toBe('30초');
    expect(formatWait(2 * 86400_000, 'ko')).toBe('2일');
    expect(formatWait(2 * 86400_000 + 3 * 3600_000, 'en')).toBe('2 d 3 h');
    expect(formatWait(45 * 60_000, 'en')).toBe('45 min');
    expect(formatWait(60 * 60_000, 'ko')).toBe('1시간');
  });

  it('file sizes and dates use the locale', () => {
    expect(formatBytes(1.2 * 1024 ** 3, 'en')).toBe('1.20 GB');
    expect(formatBytes(1.2 * 1024 ** 3, 'fr')).toMatch(/^1,20\s?Go$/);
    expect(formatBytes(5 * 1024 ** 2, 'ru')).toMatch(/^5,0\s?МБ$/);
    expect(formatDate(t0, 'ja')).toBe('2026年11月1日');
    expect(formatDate(t0, 'ar')).toMatch(/^1\s.+\s2026$/); // non-breaking spaces: a date never wraps inside
    expect(formatDate(t0, 'en')).toBe('Nov\u00A01,\u00A02026'); // a date never wraps inside
  });

  it('arrival times in every language (24h where the locale wants it)', async () => {
    for (const l of ['ja', 'zh', 'es', 'fr', 'pt', 'ru', 'hi', 'ar'] as const) await loadLocale(l);
    const in1h = t0 + 3600_000;
    expect(formatArrival(in1h, t0, 'fr')).toContain('15:20');
    expect(formatArrival(in1h, t0, 'ru')).toContain('15:20');
    expect(formatArrival(in1h, t0, 'ar')).toMatch(/3:20/);
    expect(formatArrival(t0 + 3 * 86400_000, t0, 'ja')).toContain('11月4日');
    expect(formatArrival(t0 + 3 * 86400_000, t0, 'ko').replace(/ /g, ' ')).toBe('11월 4일 도착');
  });
});
