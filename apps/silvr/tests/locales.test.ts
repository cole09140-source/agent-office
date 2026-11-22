/**
 * Locale validation (like Muzig's validate-locales). For every file in src/locales:
 *  - keys ⊆ ko keys (messages, camera descriptions, era words, film descriptions)
 *  - no empty strings
 *  - message syntax parses (ICU plurals), no legacy "{n:one|other}"
 *  - placeholders identical to ko (plus the extra counts in ko.ts pluralCounts, as plural selectors only)
 *  - plural blocks use only the locale's CLDR categories and cover every one of them (or exact =N)
 *  - Film Camela and camera / film names are kept as written
 * Missing keys are reported (allowed while translation is in progress). To require completeness:
 *   STRICT_I18N=1 npx vitest run tests/locales.test.ts        (all locales)
 *   STRICT_I18N=ja,ru npx vitest run tests/locales.test.ts    (just these)
 */
import { describe, expect, it } from 'vitest';
import { CAMERAS } from '../src/cameras/models';
import { STOCKS } from '../src/film/stocks';
import { INTL_LOCALE, LOCALES, type Locale } from '../src/intl/locales';
import { messageInfo, MessageSyntaxError, parseMessage, PLURAL_CATEGORIES } from '../src/intl/message';
import * as ar from '../src/locales/ar';
import * as en from '../src/locales/en';
import * as es from '../src/locales/es';
import * as fr from '../src/locales/fr';
import * as hi from '../src/locales/hi';
import * as ja from '../src/locales/ja';
import * as ko from '../src/locales/ko';
import * as pt from '../src/locales/pt';
import * as ru from '../src/locales/ru';
import * as zh from '../src/locales/zh';
import type { LocaleModule } from '../src/locales/types';

const FILES: Record<Locale, LocaleModule> = { ko, en, ja, zh, es, fr, pt, ru, hi, ar };
const strictEnv = (process.env.STRICT_I18N ?? '').trim();
const strict = (l: Locale) => strictEnv === '1' || strictEnv === 'true' || strictEnv.split(',').map((s) => s.trim()).includes(l);

const koMsgs = ko.messages as Record<string, string>;
const counts = ko.pluralCounts as Record<string, readonly string[] | undefined>;
const PROTECTED = ['Film Camela', ...CAMERAS.map((c) => c.name), ...STOCKS.map((s) => s.name)].sort((a, b) => b.length - a.length);

/** Every problem in one locale file (missing keys are returned separately). */
function validate(lang: Locale): { errors: string[]; missing: string[] } {
  const file = FILES[lang];
  const errors: string[] = [];
  const msgs = file.messages as Record<string, string | undefined>;
  const rules = new Intl.PluralRules(INTL_LOCALE[lang]);
  const categories = new Set<string>(rules.resolvedOptions().pluralCategories);

  for (const [key, value] of Object.entries(msgs)) {
    const where = `${lang} ${key}`;
    if (!(key in koMsgs)) {
      errors.push(`${where}: key is not in ko.ts`);
      continue;
    }
    if (typeof value !== 'string' || !value.trim()) {
      errors.push(`${where}: empty string (leave the key out instead; it falls back to English)`);
      continue;
    }
    let info;
    try {
      parseMessage(value);
      info = messageInfo(value);
    } catch (e) {
      errors.push(`${where}: ${e instanceof MessageSyntaxError ? e.message : String(e)}`);
      continue;
    }
    if (info.legacy) errors.push(`${where}: legacy "{n:one|other}" plural; use "{n, plural, one {…} other {…}}"`);
    const required = messageInfo(koMsgs[key]).vars;
    const extra = new Set(counts[key] ?? []);
    for (const v of required) if (!info.vars.has(v)) errors.push(`${where}: placeholder {${v}} is missing`);
    for (const v of info.vars) {
      if (required.has(v)) continue;
      if (!extra.has(v)) errors.push(`${where}: unknown placeholder {${v}} (ko has ${[...required].map((x) => `{${x}}`).join(' ') || 'none'})`);
      else if (!info.plurals.has(v)) errors.push(`${where}: {${v}} is a count for plural agreement only; use it as {${v}, plural, …}`);
    }
    // Plural categories: only the locale's own, and every one that whole numbers 0–1000 can reach.
    for (const [v, sel] of info.selectors) {
      for (const s of sel) {
        if (s[0] !== '=' && !categories.has(s)) errors.push(`${where}: plural category "${s}" never occurs in ${lang} (has: ${[...categories].join(', ')})`);
      }
      const uncovered = new Map<string, number[]>();
      for (let i = 0; i <= 1000; i++) {
        const c = rules.select(i);
        if (sel.has(`=${i}`) || sel.has(c)) continue;
        uncovered.set(c, [...(uncovered.get(c) ?? []), i]);
      }
      for (const [c, nums] of uncovered) errors.push(`${where}: {${v}, plural} has no "${c}" form (e.g. ${nums.slice(0, 4).join(', ')}…)`);
    }
    // Names stay as written (guide §3).
    const enText = (en.messages as Record<string, string>)[key] ?? '';
    for (const name of PROTECTED) {
      if (enText.includes(name) && koMsgs[key].includes(name) && !value.includes(name)) errors.push(`${where}: keep "${name}" exactly as written`);
    }
  }

  const sub = (label: string, own: Record<string, string | undefined>, source: Record<string, string>) => {
    for (const [id, v] of Object.entries(own)) {
      if (!(id in source)) errors.push(`${lang} ${label}.${id}: id is not in ko.ts`);
      else if (typeof v !== 'string' || !v.trim()) errors.push(`${lang} ${label}.${id}: empty string`);
    }
    return Object.keys(source).filter((id) => !own[id]).map((id) => `${label}.${id}`);
  };
  const missing = [
    ...Object.keys(koMsgs).filter((k) => !msgs[k]),
    ...sub('cameraText.desc', file.cameraText.desc, ko.cameraText.desc),
    ...sub('cameraText.era', file.cameraText.era, ko.cameraText.era),
    ...sub('stockText', file.stockText, ko.stockText),
  ];
  return { errors, missing };
}

describe('locale files', () => {
  it('ko is the source: every message parses and no plural syntax is needed', () => {
    for (const [k, v] of Object.entries(koMsgs)) {
      expect(() => parseMessage(v), k).not.toThrow();
      expect(v.trim(), k).not.toBe('');
    }
  });

  it('every app camera and film has a Korean and English text', () => {
    for (const c of CAMERAS) {
      expect(ko.cameraText.desc, c.id).toHaveProperty(c.id);
      const kind = c.era.split(' · ')[1];
      expect(ko.cameraText.era, c.era).toHaveProperty(kind);
    }
    for (const s of STOCKS) expect(ko.stockText, s.id).toHaveProperty(s.id);
  });

  it('pluralCounts only names keys that exist', () => {
    for (const k of Object.keys(counts)) expect(koMsgs, k).toHaveProperty(k);
  });

  for (const lang of LOCALES) {
    it(`${lang}: keys, placeholders, plural syntax, names`, () => {
      const { errors, missing } = validate(lang);
      if (missing.length) {
        console.info(`[i18n] ${lang}: ${missing.length} missing (fall back to English)${strict(lang) ? `:\n  ${missing.join('\n  ')}` : ''}`);
      }
      expect(errors, errors.join('\n')).toEqual([]);
      if (lang === 'en' || lang === 'ko' || strict(lang)) expect(missing, `${lang} is incomplete`).toEqual([]);
    });
  }

  it('the validator catches mistakes', () => {
    const saved = { ...ja.messages };
    const m = ja.messages as Record<string, string>;
    try {
      m['cam.left'] = '{count}枚';
      m['gal.frames'] = '{n, plural, one {#枚} other {#枚}}';
      m['common.cancel'] = '';
      m['cam.exposures'] = '{n, plural, other {#枚}';
      m['set.backup.done'] = '{rolls:roll|rolls} {photos}';
      const { errors } = validate('ja');
      const text = errors.join('\n');
      expect(text).toContain('cam.left: placeholder {n} is missing');
      expect(text).toContain('cam.left: unknown placeholder {count}');
      expect(text).toContain('gal.frames: plural category "one" never occurs in ja');
      expect(text).toContain('common.cancel: empty string');
      expect(text).toContain('cam.exposures: Unclosed');
      expect(text).toContain('set.backup.done: legacy');
    } finally {
      for (const k of Object.keys(m)) delete m[k];
      Object.assign(m, saved);
    }
    expect(PLURAL_CATEGORIES).toContain('few');
  });
});
