import type { ComponentChildren } from 'preact';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { canUseStock, PAYMENTS_ENABLED } from '../entitlements';
import { isRtl, t } from '../i18n';
import { announcement, confirmReq, dismissToast, pauseToast, resumeToast, settings, toasts } from '../state/app';
import { ensurePrint, type Photo } from '../store/rolls';
import type { FilmStock } from '../film/types';
import { pushBackHandler } from '../platform/back';
import { isNative } from '../platform/share';
import { Icon } from './Icon';
import { arrowStep, centerInStrip } from '../platform/dir';

export function useObjectUrl(blob: Blob | null | undefined): string | undefined {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

/** Loads (developing on demand) the print/thumb for a photo. */
export function usePrint(photo: Photo | undefined, kind: 'thumb' | 'print'): { blob?: Blob; error: boolean } {
  const [state, setState] = useState<{ blob?: Blob; error: boolean }>({ error: false });
  // Not printKey: ensurePrint sets it once the print is cached, which would load everything twice.
  const key = photo ? `${photo.id}|${JSON.stringify(photo.develop)}` : '';
  const fmt = settings.value.dateFormat;
  useEffect(() => {
    if (!photo) return;
    let alive = true;
    const stop = new AbortController();
    setState((s) => ({ blob: s.blob, error: false }));
    // Only the viewer's print is dropped when it goes away (swiped past); thumbnails keep developing.
    ensurePrint(photo, { dateFormat: fmt, urgent: kind === 'print', signal: kind === 'print' ? stop.signal : undefined })
      .then((r) => alive && setState({ blob: r ? r[kind] : undefined, error: !r }))
      .catch((err) => {
        if ((err as Error)?.name === 'AbortError') return; // scrolled or navigated away before it started
        console.error('[silvr] develop failed', err);
        if (alive) setState({ error: true });
      });
    return () => {
      alive = false;
      stop.abort();
    };
  }, [key, kind, fmt]);
  return state;
}

export function Thumb({ photo, onClick, label, tabIndex }: { photo: Photo; onClick?: () => void; label?: string; tabIndex?: number }) {
  // Develop only thumbnails near the screen: a 500-photo roll would otherwise queue 500 develops at once.
  const ref = useRef<HTMLButtonElement>(null);
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    if (near || !ref.current) return;
    const io = new IntersectionObserver((es) => es.some((e) => e.isIntersecting) && setNear(true), { rootMargin: '800px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [near]);
  const { blob, error } = usePrint(near ? photo : undefined, 'thumb');
  const url = useObjectUrl(blob);
  return (
    <button ref={ref} class="thumb" onClick={onClick} aria-label={label ?? t('view.photoN', { n: photo.frame })} tabIndex={tabIndex} data-testid="thumb">
      {url ? <img src={url} alt="" loading="lazy" decoding="async" /> : <span class={`thumb-wait ${error ? 'err' : ''}`} />}
    </button>
  );
}

/**
 * Screen header. `wrap`: when space is tight (large text), the actions move to a row of their own
 * instead of squeezing the title, and the title is never cut.
 */
export function Header({ title, onBack, right, sub, wrap }: { title: string; onBack?: () => void; right?: ComponentChildren; sub?: string; wrap?: boolean }) {
  return (
    <header class={`hdr${wrap ? ' wrap' : ''}`}>
      {onBack ? (
        <button class="icon-btn" onClick={onBack} aria-label={t('common.back')}>
          <Icon name="back" />
        </button>
      ) : (
        <span class="hdr-spacer" />
      )}
      <div class="hdr-title">
        {/* tabIndex -1: the app moves focus here after a screen change (see useRouteFocus). */}
        <h1 tabIndex={-1}>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div class="hdr-right">{right}</div>
    </header>
  );
}

const FOCUSABLE = 'button, input, select, textarea, a[href], [tabindex]';

function focusables(box: HTMLElement): HTMLElement[] {
  return Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.tabIndex >= 0 && !el.hasAttribute('disabled') && el.getClientRects().length > 0,
  );
}

/** Usable as a focus target again (still on the page, visible, enabled, not under an inert layer). */
function canFocus(el: HTMLElement | null): el is HTMLElement {
  return !!el && el.isConnected && !el.hasAttribute('disabled') && el.getClientRects().length > 0 && !el.closest('[inert]');
}

/**
 * Open sheets, innermost last. Each remembers where focus goes back to: its opener, then
 * (when it was opened from another sheet that closes with it) that sheet's opener, and so on.
 */
interface OpenSheet {
  box: { current: HTMLElement | null };
  restore: (HTMLElement | null)[];
}
const openSheets: OpenSheet[] = [];

/** Whether a sheet or confirm is open (screens skip their own keys meanwhile). */
export function sheetOpen(): boolean {
  return openSheets.length > 0;
}

/** Long enough for a slow double tap (people double-tap at 350–700 ms). */
export const TAP_GUARD_MS = 600;
/** The tab bar stays blocked this long after the last tap that followed a sheet closing. */
export const TAB_GUARD_AFTER_UP_MS = 500;

let tapGuardHandle: ReturnType<typeof setTimeout> | undefined;
/** The tab bar ignores taps until this time (Date.now()). */
let tabGuardUntil = 0;
let lastPointerUp = 0;
/** A press that started while taps were guarded: its tap must not open a tab, however late it lifts. */
let pressedWhileGuarded = false;

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => (pressedWhileGuarded = !!tapGuardHandle), true);
  window.addEventListener(
    'pointerup',
    () => {
      lastPointerUp = Date.now();
      // A slow second tap (down at 550 ms, up at 700 ms): its click, and the tab bar for 500 ms more, stay blocked.
      if (pressedWhileGuarded) tabGuardUntil = Math.max(tabGuardUntil, lastPointerUp + TAB_GUARD_AFTER_UP_MS);
    },
    true,
  );
  // Capture phase, before the tab button's own handler: a guarded tap on the tab bar does nothing
  // (it must not fall through to the page under the bar either, so pointer-events stay on).
  window.addEventListener(
    'click',
    (e) => {
      const guarded = pressedWhileGuarded || Date.now() < tabGuardUntil;
      pressedWhileGuarded = false;
      if (!guarded || e.detail === 0) return; // keyboard / screen-reader activation (detail 0) is never blocked
      if ((e.target as Element | null)?.closest?.('.tabbar')) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );
}

/**
 * Ignores taps app-wide for a moment (html.tap-guard, styles.css). A sheet closes on the first tap of a
 * double-tap; without this the second tap lands on whatever was under it (the tab bar opened Analog).
 * The tab bar stays blocked until 500 ms after the pointerup that closed the sheet (or any tap after it).
 * Keyboard and screen-reader actions are not affected.
 */
export function guardTaps(ms = TAP_GUARD_MS): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.add('tap-guard');
  if (tapGuardHandle) clearTimeout(tapGuardHandle);
  tapGuardHandle = setTimeout(() => {
    root.classList.remove('tap-guard');
    tapGuardHandle = undefined;
  }, ms);
  // The tab bar: until 500 ms after the pointerup of the tap that closed the sheet (it came just before).
  if (Date.now() - lastPointerUp < 1000) tabGuardUntil = Math.max(tabGuardUntil, lastPointerUp + TAB_GUARD_AFTER_UP_MS);
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  testId,
  describedBy,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ComponentChildren;
  testId?: string;
  describedBy?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  // Layout effect: Escape/back and focus must work the moment the sheet is visible.
  // A plain effect waits for the next frame, which a busy camera preview can delay.
  useLayoutEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const parent = openSheets[openSheets.length - 1];
    const entry: OpenSheet = { box: ref, restore: [opener, ...(parent?.restore ?? [])] };
    openSheets.push(entry);
    const onKey = (e: KeyboardEvent) => {
      // Only the top-most sheet answers (a confirm opened over a sheet closes alone).
      if (openSheets[openSheets.length - 1] !== entry) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === 'Tab' && ref.current) trapTab(e, ref.current);
    };
    window.addEventListener('keydown', onKey);
    const offBack = pushBackHandler(() => closeRef.current());
    const box = ref.current;
    if (box) {
      // A marked control first (e.g. Cancel on a destructive confirm), then the first control, then Close.
      const items = focusables(box);
      const target = box.querySelector<HTMLElement>('[data-autofocus]') ?? items.find((el) => !el.classList.contains('sheet-close')) ?? items[0];
      target?.focus({ preventScroll: true });
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      offBack();
      const i = openSheets.indexOf(entry);
      if (i >= 0) openSheets.splice(i, 1);
      guardTaps();
      // Focus already sits in another open sheet (opened over this one as it closed): leave it there.
      const active = document.activeElement;
      if (active && openSheets.some((s) => s.box.current?.contains(active))) return;
      // Give focus back to whatever opened the sheet (or, if that went away with a parent sheet, its opener).
      entry.restore.find(canFocus)?.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        class="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : t('common.close')}
        aria-describedby={describedBy}
        ref={ref}
        data-testid={testId}
      >
        <div class="sheet-grip" />
        <div class={`sheet-head ${title ? '' : 'untitled'}`}>
          {title && (
            <h2 class="sheet-title" id={titleId}>
              {title}
            </h2>
          )}
          <button type="button" class="sheet-close" onClick={() => onClose()} aria-label={t('common.close')} data-testid={testId ? `${testId}-close` : undefined}>
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Keep Tab / Shift+Tab cycling inside a modal sheet. */
export function trapTab(e: KeyboardEvent, box: HTMLElement): void {
  const items = focusables(box);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  if (!box.contains(active)) {
    e.preventDefault();
    (e.shiftKey ? last : first).focus();
  } else if (e.shiftKey && active === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && active === last) {
    e.preventDefault();
    first.focus();
  }
}

export function Toggle({ label, checked, onChange, testId }: { label: string; checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <label class="row toggle">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.currentTarget.checked)} data-testid={testId} />
      <span class="switch" aria-hidden="true" />
    </label>
  );
}

/** Rounds away float noise (1/3 steps sum to -2e-16): what is shown, spoken and set on the input. */
export function cleanNumber(v: number): number {
  const r = Number(v.toFixed(6));
  return Math.abs(r) < 1e-9 ? 0 : r;
}

export function Slider(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onInput: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
  testId?: string;
}) {
  const { label, min, max, step, onInput, format, hint, testId } = props;
  const id = useId();
  const value = cleanNumber(props.value);
  const shown = format ? format(value) : value.toFixed(1);
  // A step like 1/3 has no exact decimal form: the browser's own stepping then yields values like -2e-16.
  // Such sliders run with step="any" and are stepped (and snapped) here instead.
  const exact = Math.abs(step * 1e6 - Math.round(step * 1e6)) < 1e-6;
  const snap = (v: number) => cleanNumber(Math.min(max, Math.max(min, min + Math.round((v - min) / step) * step)));
  const onKeyDown = exact
    ? undefined
    : (e: KeyboardEvent) => {
        const page = Math.max(step, snap(min + (max - min) / 10) - min);
        // Like the native range: in a right-to-left UI the minimum is at the right, so Right lowers the value.
        const h = isRtl() ? -step : step;
        const delta: Record<string, number> = { ArrowRight: h, ArrowUp: step, ArrowLeft: -h, ArrowDown: -step, PageUp: page, PageDown: -page };
        let next: number | undefined;
        if (e.key in delta) next = snap(value + delta[e.key]);
        else if (e.key === 'Home') next = min;
        else if (e.key === 'End') next = max;
        if (next === undefined) return;
        e.preventDefault();
        if (next !== value) onInput(next);
      };
  return (
    <div class="slider">
      <span class="slider-head">
        <label id={`${id}-l`} for={`${id}-i`}>
          {label}
        </label>
        <output for={`${id}-i`} aria-hidden="true">
          {shown}
        </output>
      </span>
      <input
        id={`${id}-i`}
        type="range"
        min={min}
        max={max}
        step={exact ? step : 'any'}
        value={value}
        onKeyDown={onKeyDown}
        aria-labelledby={`${id}-l`}
        aria-valuetext={shown}
        aria-describedby={hint ? `${id}-h` : undefined}
        onInput={(e) => {
          const el = e.currentTarget;
          if (exact) return onInput(cleanNumber(parseFloat(el.value)));
          const v = snap(parseFloat(el.value));
          el.value = String(v); // the thumb clicks into steps like a stepped slider
          onInput(v);
        }}
        data-testid={testId}
        style={{ '--p': `${((value - min) / (max - min)) * 100}%` }}
      />
      {hint && <small id={`${id}-h`}>{hint}</small>}
    </div>
  );
}

/** Radio group: one Tab stop; arrow keys / Home / End move and select (WAI-ARIA radio pattern). */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  grid,
  list,
  testId,
}: {
  /** `lang`/`dir` mark an option written in another language (e.g. language names in the picker). */
  options: { value: T; label: string; lang?: string; dir?: 'ltr' | 'rtl' }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  grid?: boolean;
  /** Stacked rows with a check mark (long option lists such as languages). */
  list?: boolean;
  testId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const current = options.findIndex((o) => o.value === value);
  const onKeyDown = (e: KeyboardEvent) => {
    const n = options.length;
    if (!n) return;
    const at = Math.max(0, current);
    let next = -1;
    const step = arrowStep(e.key);
    if (step) next = (at + step + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation();
    onChange(options[next].value);
    ref.current?.querySelectorAll<HTMLElement>('[role=radio]')[next]?.focus();
  };
  return (
    <div class={`seg ${grid ? 'grid' : ''} ${list ? 'list' : ''}`} role="radiogroup" aria-label={label} ref={ref} onKeyDown={onKeyDown} data-testid={testId}>
      {options.map((o, i) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={i === current || (current < 0 && i === 0) ? 0 : -1}
          class={o.value === value ? 'on' : ''}
          onClick={() => onChange(o.value)}
          lang={list ? undefined : o.lang}
          dir={list ? undefined : o.dir}
          data-value={String(o.value)}
        >
          {list ? (
            <span class="seg-label" lang={o.lang} dir={o.dir}>
              {o.label}
            </span>
          ) : (
            o.label
          )}
          {list && o.value === value && <Icon name="check" size={18} />}
        </button>
      ))}
    </div>
  );
}

export function Canister({ stock, size = 44 }: { stock: FilmStock; size?: number }) {
  const [a, b] = stock.canister;
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 40 50" aria-hidden="true" class="canister">
      <rect x="6" y="2" width="20" height="5" rx="1.5" fill="#2a2a2a" />
      <rect x="4" y="6" width="24" height="40" rx="4" fill={a} />
      <rect x="4" y="20" width="24" height="12" fill={b} />
      <rect x="6" y="44" width="20" height="4" rx="1.5" fill="#2a2a2a" />
      <rect x="28" y="12" width="10" height="26" fill="#3a2a1e" />
      <text x="16" y="29.5" text-anchor="middle" font-size="10" font-weight="800" fill={a} font-family="ui-monospace, monospace">
        {stock.iso}
      </text>
    </svg>
  );
}

const stockCards = (strip: Element): HTMLElement[] => Array.from(strip.querySelectorAll<HTMLElement>(':scope > .stock-card'));

/** The strip's single Tab stop goes back to the chosen film (or the first one when none is chosen). */
function resetStockTabStop(strip: Element): void {
  const cards = stockCards(strip);
  const on = cards.findIndex((c) => c.getAttribute('aria-checked') === 'true');
  cards.forEach((c, i) => (c.tabIndex = i === Math.max(0, on) ? 0 : -1));
}

/**
 * One film in a film strip. The strip is a radio group with one Tab stop (roving tabindex):
 * ← → / Home / End move between films, Enter / Space picks one (like the camera strip).
 * Works inside any `.stock-strip` parent; <StockStrip> also labels the group.
 */
export function StockCard({ stock, selected, onClick }: { stock: FilmStock; selected: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  // Bring the initially selected stock into view without scrolling the page vertically.
  useEffect(() => {
    const el = ref.current;
    const strip = el?.parentElement;
    if (!el || !strip) return;
    // A strip rendered without <StockStrip> still becomes a labelled radio group.
    if (!strip.getAttribute('role') || strip.getAttribute('role') === 'group') strip.setAttribute('role', 'radiogroup');
    if (!strip.hasAttribute('aria-label') && !strip.hasAttribute('aria-labelledby')) strip.setAttribute('aria-label', t('cam.chooseFilm'));
    if (!selected) return;
    centerInStrip(strip, el);
  }, []);
  // No film chosen in this strip (e.g. a stock this body can't take): the first card holds the Tab stop.
  useLayoutEffect(() => {
    const strip = ref.current?.parentElement;
    if (strip && !strip.contains(document.activeElement)) resetStockTabStop(strip);
  }, [selected]);
  const onKeyDown = (e: KeyboardEvent) => {
    const el = ref.current;
    const strip = el?.parentElement;
    if (!el || !strip) return;
    const cards = stockCards(strip);
    const at = cards.indexOf(el);
    const last = cards.length - 1;
    const step = arrowStep(e.key);
    const next = step ? Math.min(last, Math.max(0, at + step)) : e.key === 'Home' ? 0 : e.key === 'End' ? last : -1;
    if (next < 0 || at < 0) return;
    e.preventDefault();
    e.stopPropagation();
    cards.forEach((c, i) => (c.tabIndex = i === next ? 0 : -1));
    cards[next].focus({ preventScroll: true });
    cards[next].scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const onFocusOut = (e: FocusEvent) => {
    const strip = ref.current?.parentElement;
    const to = e.relatedTarget as Node | null;
    if (strip && !(to && strip.contains(to))) resetStockTabStop(strip);
  };
  return (
    <button
      ref={ref}
      type="button"
      role="radio"
      class={`stock-card ${selected ? 'on' : ''}`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onFocusOut={onFocusOut}
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      data-testid={`stock-${stock.id}`}
    >
      <Canister stock={stock} size={34} />
      <span class="stock-name">{stock.name}</span>
      {/* PRO badges only make sense once purchases exist (and avoid store-review confusion before). */}
      {PAYMENTS_ENABLED && stock.pro && <span class={`badge ${canUseStock(stock) ? '' : 'locked'}`}>{t('common.pro')}</span>}
    </button>
  );
}

/** A labelled film strip (radio group, one Tab stop). */
export function StockStrip({ stocks, value, onChange, label }: { stocks: FilmStock[]; value: string; onChange: (id: string) => void; label?: string }) {
  const hint = useId();
  return (
    <>
      <p id={hint} class="sr-only">
        {t('a11y.stockKeys')}
      </p>
      <div class="stock-strip" role="radiogroup" aria-label={label ?? t('cam.chooseFilm')} aria-describedby={hint}>
        {stocks.map((st) => (
          <StockCard key={st.id} stock={st} selected={st.id === value} onClick={() => onChange(st.id)} />
        ))}
      </div>
    </>
  );
}

export function Toasts() {
  return (
    <div class="toasts" role="status" aria-live="polite">
      {toasts.value.map((x) => (
        <div
          class="toast"
          key={x.id}
          // A toast with a button holds still while the pointer or focus is on it.
          onMouseEnter={x.action ? () => pauseToast(x.id) : undefined}
          onMouseLeave={x.action ? () => resumeToast(x.id) : undefined}
          onFocusIn={x.action ? () => pauseToast(x.id) : undefined}
          onFocusOut={x.action ? () => resumeToast(x.id) : undefined}
          data-testid="toast"
        >
          <span>{x.text}</span>
          {x.action && (
            <button
              type="button"
              onClick={() => {
                const run = x.action!.run;
                dismissToast(x.id);
                run();
              }}
              data-testid="toast-action"
            >
              {x.action.label}
            </button>
          )}
          <button type="button" class="toast-close" onClick={() => dismissToast(x.id, true)} aria-label={t('toast.close')} data-testid="toast-close">
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

/** App-wide screen-reader live region for announce() (state/app.ts). */
export function Announcer() {
  return (
    <div class="sr-only" aria-live="polite" aria-atomic="true" data-testid="app-announcer">
      {announcement.value}
    </div>
  );
}

export function ConfirmDialog() {
  const req = confirmReq.value;
  if (!req) return null;
  const done = (v: boolean) => {
    confirmReq.value = null;
    req.resolve(v);
  };
  return (
    <Sheet open onClose={() => done(false)} testId="confirm" title={req.title ?? req.ok} describedBy="confirm-text">
      <p class="confirm-text" id="confirm-text">
        {req.text}
      </p>
      <div class="btn-row">
        {/* Focus starts on the safe choice for destructive confirms (Enter must not delete anything);
            otherwise on the action itself, so Enter goes ahead (rewind, send to lab, rush, apply). */}
        <button class="btn ghost" onClick={() => done(false)} data-autofocus={req.danger ? '' : undefined} data-testid="confirm-cancel">
          {t('common.cancel')}
        </button>
        <button class={`btn ${req.danger ? 'danger' : 'primary'}`} onClick={() => done(true)} data-autofocus={req.danger ? undefined : ''} data-testid="confirm-ok">
          {req.ok}
        </button>
      </div>
    </Sheet>
  );
}

export function Empty({ title, hint, children }: { title: string; hint?: string; children?: ComponentChildren }) {
  return (
    <div class="empty">
      <div class="empty-art" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p class="empty-title">{title}</p>
      {hint && <p class="empty-hint">{hint}</p>}
      {children}
    </div>
  );
}

/** Where a Save put the file: the Android app's gallery album, else the browser's downloads. */
export function savedToastText(): string {
  const cap = typeof window !== 'undefined' ? (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor : undefined;
  if (isNative()) return cap?.getPlatform?.() === 'android' ? t('view.savedAndroid') : t('view.savedToast');
  return t('view.savedWeb');
}

// Locale-aware formatting lives in intl/format; re-exported here for existing imports.
export { formatBytes, formatDate, formatDuration } from '../intl/format';
