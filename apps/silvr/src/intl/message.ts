/**
 * Message format: a small, dependency-free subset of ICU MessageFormat.
 *
 *   Plain placeholder   'Saved {stock}'
 *   Plural              '{n, plural, one {# photo} other {# photos}}'
 *   Exact value         '{n, plural, =0 {No photos yet} one {# photo} other {# photos}}'
 *   Two counts          '{rolls, plural, one {# roll} other {# rolls}}, {photos, plural, one {# photo} other {# photos}}'
 *   No number in a form '{n, plural, one {صورة واحدة} two {صورتان} few {# صور} many {# صورة} other {# صورة}}'
 *
 * - Selectors: CLDR categories zero/one/two/few/many/other (from Intl.PluralRules for the locale) and
 *   exact values =0, =1, =2.5 … (checked first). `other` is required; a missing category falls back to it.
 * - `#` inside a plural form prints the selector's number formatted for the locale; `{n}` also works.
 * - Fractions: a value passed as the string "1.5" or the number 1.5 selects with 1 fraction digit, so
 *   ru/ar/fr/pt pick their fraction forms; "1.0" selects with one fraction digit too (ru "1,0 кадра").
 * - Plurals may nest and may contain other placeholders. No apostrophe escaping: text is literal
 *   except `{`, `}` (and `#` inside a plural form).
 * - Legacy `{n:one|other}` (the pre-2026-11 English-only syntax) still parses as `=1`/`other`, so old
 *   strings keep working; the locale validator rejects it in locale files.
 */

export type Vars = Record<string, string | number>;

type Part =
  | { k: 'text'; v: string }
  | { k: 'var'; name: string }
  | { k: 'pound' }
  | { k: 'plural'; name: string; forms: Map<string, Part[]>; legacy?: boolean };

export class MessageSyntaxError extends Error {}

export const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;
const NAME = /[A-Za-z_][A-Za-z0-9_]*/y;
const SELECTOR = /(?:zero|one|two|few|many|other|=-?\d+(?:\.\d+)?)/y;

function parseAt(src: string, i: number, inPlural: boolean, closeAtBrace: boolean): [Part[], number] {
  const parts: Part[] = [];
  let text = '';
  const flush = () => {
    if (text) parts.push({ k: 'text', v: text });
    text = '';
  };
  while (i < src.length) {
    const c = src[i];
    if (c === '}') {
      if (!closeAtBrace) throw new MessageSyntaxError(`Unmatched "}" at ${i}`);
      flush();
      return [parts, i];
    }
    if (c === '#' && inPlural) {
      flush();
      parts.push({ k: 'pound' });
      i++;
      continue;
    }
    if (c !== '{') {
      text += c;
      i++;
      continue;
    }
    flush();
    const [part, next] = parseArg(src, i + 1);
    parts.push(part);
    i = next;
  }
  if (closeAtBrace) throw new MessageSyntaxError('Unclosed "{"');
  flush();
  return [parts, i];
}

const skipWs = (src: string, i: number) => {
  while (i < src.length && /\s/.test(src[i])) i++;
  return i;
};

/** Parses what follows a "{": a placeholder, a plural or a legacy plural. Returns the index after its "}". */
function parseArg(src: string, i: number): [Part, number] {
  i = skipWs(src, i);
  NAME.lastIndex = i;
  const m = NAME.exec(src);
  if (!m) throw new MessageSyntaxError(`Expected a placeholder name at ${i}`);
  const name = m[0];
  i = skipWs(src, i + name.length);
  if (src[i] === '}') return [{ k: 'var', name }, i + 1];
  if (src[i] === ':') {
    // Legacy "{n:one|other}".
    const end = src.indexOf('}', i);
    const bar = src.indexOf('|', i);
    if (end < 0 || bar < 0 || bar > end) throw new MessageSyntaxError(`Bad legacy plural at ${i}`);
    const one = src.slice(i + 1, bar);
    const other = src.slice(bar + 1, end);
    const forms = new Map<string, Part[]>([
      ['=1', [{ k: 'text', v: one }]],
      ['other', [{ k: 'text', v: other }]],
    ]);
    return [{ k: 'plural', name, forms, legacy: true }, end + 1];
  }
  if (src[i] !== ',') throw new MessageSyntaxError(`Expected "}" or ", plural," after {${name} at ${i}`);
  i = skipWs(src, i + 1);
  if (!src.startsWith('plural', i)) throw new MessageSyntaxError(`Only "plural" is supported (at ${i})`);
  i = skipWs(src, i + 'plural'.length);
  if (src[i] !== ',') throw new MessageSyntaxError(`Expected "," after "plural" at ${i}`);
  i = skipWs(src, i + 1);
  const forms = new Map<string, Part[]>();
  while (src[i] !== '}') {
    if (i >= src.length) throw new MessageSyntaxError(`Unclosed plural {${name}}`);
    SELECTOR.lastIndex = i;
    const s = SELECTOR.exec(src);
    if (!s) throw new MessageSyntaxError(`Unknown plural selector at ${i}: "${src.slice(i, i + 8)}" (use zero, one, two, few, many, other or =N)`);
    if (forms.has(s[0])) throw new MessageSyntaxError(`Duplicate plural selector "${s[0]}" in {${name}}`);
    i = skipWs(src, i + s[0].length);
    if (src[i] !== '{') throw new MessageSyntaxError(`Expected "{" after selector "${s[0]}" at ${i}`);
    const [body, end] = parseAt(src, i + 1, true, true);
    forms.set(s[0], body);
    i = skipWs(src, end + 1);
  }
  if (!forms.has('other')) throw new MessageSyntaxError(`Plural {${name}} needs an "other" form`);
  return [{ k: 'plural', name, forms }, i + 1];
}

const cache = new Map<string, Part[]>();

/** Parses a message (cached). Throws MessageSyntaxError. */
export function parseMessage(src: string): Part[] {
  let parts = cache.get(src);
  if (!parts) {
    parts = parseAt(src, 0, false, false)[0];
    cache.set(src, parts);
  }
  return parts;
}

export interface MessageInfo {
  /** Every variable used: plain placeholders and plural selectors. */
  vars: Set<string>;
  /** Variables used as plural selectors. */
  plurals: Set<string>;
  /** Uses the legacy "{n:one|other}" syntax. */
  legacy: boolean;
  /** Selectors used per plural variable (e.g. n → one, few, many, other). */
  selectors: Map<string, Set<string>>;
}

export function messageInfo(src: string): MessageInfo {
  const info: MessageInfo = { vars: new Set(), plurals: new Set(), legacy: false, selectors: new Map() };
  const walk = (parts: Part[]) => {
    for (const p of parts) {
      if (p.k === 'var') info.vars.add(p.name);
      else if (p.k === 'plural') {
        info.vars.add(p.name);
        info.plurals.add(p.name);
        if (p.legacy) info.legacy = true;
        const sel = info.selectors.get(p.name) ?? new Set<string>();
        for (const [k, body] of p.forms) {
          sel.add(k);
          walk(body);
        }
        info.selectors.set(p.name, sel);
      }
    }
  };
  walk(parseMessage(src));
  return info;
}

// ---- formatting ----

const nfCache = new Map<string, Intl.NumberFormat>();
const prCache = new Map<string, Intl.PluralRules>();

function numberFormat(locale: string, fd: number | undefined): Intl.NumberFormat {
  const key = `${locale}|${fd ?? ''}`;
  let f = nfCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, fd === undefined ? { maximumFractionDigits: 3 } : { minimumFractionDigits: fd, maximumFractionDigits: fd });
    nfCache.set(key, f);
  }
  return f;
}

function pluralRules(locale: string, fd: number): Intl.PluralRules {
  const key = `${locale}|${fd}`;
  let r = prCache.get(key);
  if (!r) {
    r = new Intl.PluralRules(locale, { minimumFractionDigits: fd, maximumFractionDigits: fd });
    prCache.set(key, r);
  }
  return r;
}

/** Fraction digits as written: 1 → 0, 1.5 → 1, "1.50" → 2, "+1,5" → 1. */
function fractionDigits(v: string | number): number {
  const s = typeof v === 'number' ? (Number.isFinite(v) ? String(v) : '0') : v;
  const m = /[.,](\d+)\s*$/.exec(s.replace(/[^\d.,]+$/, ''));
  return m ? Math.min(m[1].length, 6) : 0;
}

/** The numeric value of a count: numbers as is; strings like "+1.5", "−0.5", "3" parsed. */
function numeric(v: string | number): number {
  if (typeof v === 'number') return v;
  const n = parseFloat(v.replace('−', '-').replace(',', '.').replace(/[^\d.+-]/g, ''));
  return Number.isFinite(n) ? n : NaN;
}

export function selectForm(locale: string, forms: Map<string, unknown>, value: string | number): string {
  const n = numeric(value);
  if (!Number.isNaN(n)) {
    for (const k of forms.keys()) if (k[0] === '=' && Number(k.slice(1)) === n) return k;
    const cat = pluralRules(locale, fractionDigits(value)).select(Math.abs(n));
    if (forms.has(cat)) return cat;
  }
  return 'other';
}

export interface FormatOptions {
  /** Wraps each substituted string value (e.g. FSI…PDI for right-to-left UIs). */
  wrapString?: (name: string, value: string) => string;
}

function formatValue(locale: string, v: string | number, fd?: number): string {
  return typeof v === 'number' ? numberFormat(locale, fd).format(v) : v;
}

function render(parts: Part[], locale: string, vars: Vars | undefined, pound: { name: string; value: string | number } | null, opts: FormatOptions): string {
  let out = '';
  for (const p of parts) {
    if (p.k === 'text') out += p.v;
    else if (p.k === 'var') {
      const v = vars?.[p.name];
      if (v === undefined) out += `{${p.name}}`;
      else if (typeof v === 'number') out += formatValue(locale, v);
      else out += opts.wrapString ? opts.wrapString(p.name, v) : v;
    } else if (p.k === 'pound') {
      out += pound ? (typeof pound.value === 'number' ? formatValue(locale, pound.value, fractionDigits(pound.value)) : pound.value) : '#';
    } else {
      const v = vars?.[p.name];
      const key = v === undefined ? 'other' : p.legacy ? (numeric(v) === 1 ? '=1' : 'other') : selectForm(locale, p.forms, v);
      out += render(p.forms.get(key) ?? p.forms.get('other')!, locale, vars, { name: p.name, value: v ?? `{${p.name}}` }, opts);
    }
  }
  return out;
}

/**
 * Formats a message for an Intl locale tag. A message that fails to parse is returned with plain
 * placeholders substituted (never throws at runtime: a translator's typo must not blank the screen).
 */
export function formatMessage(locale: string, src: string, vars?: Vars, opts: FormatOptions = {}): string {
  let parts: Part[];
  try {
    parts = parseMessage(src);
  } catch {
    let s = src;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  }
  return render(parts, locale, vars, null, opts);
}
