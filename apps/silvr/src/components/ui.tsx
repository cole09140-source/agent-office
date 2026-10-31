import type { ComponentChildren } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { canUseStock, PAYMENTS_ENABLED } from '../entitlements';
import { t } from '../i18n';
import { confirmReq, settings, toasts } from '../state/app';
import { ensurePrint, type Photo } from '../store/rolls';
import type { FilmStock } from '../film/types';
import { pushBackHandler } from '../platform/back';
import { Icon } from './Icon';

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
  const key = photo ? `${photo.id}|${photo.printKey ?? ''}|${JSON.stringify(photo.develop)}` : '';
  const fmt = settings.value.dateFormat;
  useEffect(() => {
    if (!photo) return;
    let alive = true;
    setState((s) => ({ blob: s.blob, error: false }));
    ensurePrint(photo, { dateFormat: fmt, urgent: kind === 'print' })
      .then((r) => alive && setState({ blob: r ? r[kind] : undefined, error: !r }))
      .catch((err) => {
        console.error('[silvr] develop failed', err);
        if (alive) setState({ error: true });
      });
    return () => {
      alive = false;
    };
  }, [key, kind, fmt]);
  return state;
}

export function Thumb({ photo, onClick, label, tabIndex }: { photo: Photo; onClick?: () => void; label?: string; tabIndex?: number }) {
  const { blob, error } = usePrint(photo, 'thumb');
  const url = useObjectUrl(blob);
  return (
    <button class="thumb" onClick={onClick} aria-label={label ?? t('view.photoN', { n: photo.frame })} tabIndex={tabIndex} data-testid="thumb">
      {url ? <img src={url} alt="" loading="lazy" decoding="async" /> : <span class={`thumb-wait ${error ? 'err' : ''}`} />}
    </button>
  );
}

export function Header({ title, onBack, right, sub }: { title: string; onBack?: () => void; right?: ComponentChildren; sub?: string }) {
  return (
    <header class="hdr">
      {onBack ? (
        <button class="icon-btn" onClick={onBack} aria-label={t('common.back')}>
          <Icon name="back" />
        </button>
      ) : (
        <span class="hdr-spacer" />
      )}
      <div class="hdr-title">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div class="hdr-right">{right}</div>
    </header>
  );
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
  // Layout effect: Escape/back and focus must work the moment the sheet is visible.
  // A plain effect waits for the next frame, which a busy camera preview can delay.
  useLayoutEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      else if (e.key === 'Tab' && ref.current) trapTab(e, ref.current);
    };
    window.addEventListener('keydown', onKey);
    const offBack = pushBackHandler(() => closeRef.current());
    ref.current?.querySelector<HTMLElement>('button, input, select')?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      offBack();
      // Give focus back to whatever opened the sheet.
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return (
    <div class="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title} aria-describedby={describedBy} ref={ref} data-testid={testId}>
        <div class="sheet-grip" />
        {title && <h2 class="sheet-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}

/** Keep Tab / Shift+Tab cycling inside a modal sheet. */
export function trapTab(e: KeyboardEvent, box: HTMLElement): void {
  const items = Array.from(box.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]')).filter(
    (el) => el.tabIndex >= 0 && !el.hasAttribute('disabled') && el.getClientRects().length > 0,
  );
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
  const { label, value, min, max, step, onInput, format, hint, testId } = props;
  return (
    <label class="slider">
      <span class="slider-head">
        <span>{label}</span>
        <output>{format ? format(value) : value.toFixed(1)}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onInput={(e) => onInput(parseFloat(e.currentTarget.value))}
        data-testid={testId}
        style={{ '--p': `${((value - min) / (max - min)) * 100}%` }}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

export function Segmented<T extends string | number>({ options, value, onChange, label, grid }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string; grid?: boolean }) {
  return (
    <div class={`seg ${grid ? 'grid' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} role="radio" aria-checked={o.value === value} class={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
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
      <text x="16" y="29" text-anchor="middle" font-size="8" font-weight="800" fill={a} font-family="ui-monospace, monospace">
        {stock.iso}
      </text>
    </svg>
  );
}

export function StockCard({ stock, selected, onClick }: { stock: FilmStock; selected: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  // Bring the initially selected stock into view without scrolling the page vertically.
  useEffect(() => {
    const el = ref.current;
    const strip = el?.parentElement;
    if (!el || !strip || !selected) return;
    strip.scrollLeft = el.offsetLeft - strip.offsetLeft - (strip.clientWidth - el.clientWidth) / 2;
  }, []);
  return (
    <button ref={ref} class={`stock-card ${selected ? 'on' : ''}`} onClick={onClick} aria-pressed={selected} data-testid={`stock-${stock.id}`}>
      <Canister stock={stock} size={34} />
      <span class="stock-name">{stock.name}</span>
      {/* PRO badges only make sense once purchases exist (and avoid store-review confusion before). */}
      {PAYMENTS_ENABLED && stock.pro && <span class={`badge ${canUseStock(stock) ? '' : 'locked'}`}>{t('common.pro')}</span>}
    </button>
  );
}

export function Toasts() {
  return (
    <div class="toasts" role="status" aria-live="polite">
      {toasts.value.map((x) => (
        <div class="toast" key={x.id}>
          <span>{x.text}</span>
          {x.action && (
            <button
              onClick={() => {
                x.action!.run();
                toasts.value = toasts.value.filter((y) => y.id !== x.id);
              }}
            >
              {x.action.label}
            </button>
          )}
        </div>
      ))}
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
    <Sheet open onClose={() => done(false)} testId="confirm" title={req.ok} describedBy="confirm-text">
      <p class="confirm-text" id="confirm-text">
        {req.text}
      </p>
      <div class="btn-row">
        <button class="btn ghost" onClick={() => done(false)}>
          {t('common.cancel')}
        </button>
        <button class={`btn ${req.danger ? 'danger' : 'primary'}`} onClick={() => done(true)} data-testid="confirm-ok">
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

export function formatDuration(ms: number, lang: 'ko' | 'en'): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const u = lang === 'ko' ? { d: '일', h: '시간', m: '분', s: '초' } : { d: 'd', h: 'h', m: 'm', s: 's' };
  const sep = lang === 'ko' ? ' ' : ' ';
  if (d > 0) return `${d}${u.d}${sep}${h}${u.h}`;
  if (h > 0) return `${h}${u.h}${sep}${m}${u.m}`;
  if (m > 0) return `${m}${u.m}${sep}${sec}${u.s}`;
  return `${sec}${u.s}`;
}

export function formatDate(ts: number, lang: 'ko' | 'en', withTime = false): string {
  return new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(ts);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
