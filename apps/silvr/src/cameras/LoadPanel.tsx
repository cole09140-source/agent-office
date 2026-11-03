import { Fragment } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { Segmented, Sheet, StockStrip } from '../components/ui';
import { SHOW_PRO_BADGES } from '../entitlements';
import { getStock } from '../film/stocks';
import { cameraDescription, eraText, stockDescription, t, type MsgKey } from '../i18n';
import { rolls, setCameraPinned, settings, toast } from '../state/app';
import { get } from '../store/db';
import { CameraBody } from './Body';
import { CAMERAS, ejectsPrints, filmsFor, getCamera, type CameraModel } from './models';
import { orderByPins } from './pins';
import { arrowStep, centerInStrip } from '../platform/dir';

export function capacityLabel(camera: CameraModel, n: number): string {
  if (camera.capture === 'half') return t('cam.halves', { n });
  if (ejectsPrints(camera)) return t('cam.pack', { n });
  if (camera.instant) return t('cam.card', { n });
  return t('cam.exposures', { n });
}

/**
 * What the load button says for this body: a digicam takes a memory card, an instant camera a pack,
 * a camera with its film built in (disposable, waterproof) is simply used; others load the chosen film.
 */
export function loadLabel(camera: CameraModel): string {
  if (ejectsPrints(camera)) return t('cam.loadPack');
  if (camera.instant) return t('cam.loadCard');
  if (filmsFor(camera).length <= 1) return t('cam.useCamera');
  return t('cam.load');
}

/** kv flag: the first roll was loaded, so the "Quick start" row is no longer shown. */
export const QUICK_START_KEY = 'quickStartDone';
/** First-run shortcuts: one plain choice per kind of camera (selects the body, does not load it). */
const QUICK_START: { id: string; label: MsgKey }[] = [
  { id: 'pro35', label: 'cam.quick.film' },
  { id: 'instasq', label: 'cam.quick.instant' },
  { id: 'snap27', label: 'cam.quick.disposable' },
];

type CameraGroup = 'film' | 'instant' | 'digital' | 'phone' | 'toy';
const GROUPS: CameraGroup[] = ['film', 'instant', 'digital', 'phone', 'toy'];
const TOY_BODIES = new Set(['disposable', 'toy', 'quad', 'double', 'pano', 'fish', 'aqua', 'super8', 'sprocket', 'flash', 'kid', 'pinhole']);
const PHONE_BODIES = new Set(['flip', 'smart', 'slab']);

/** Bucket for the "All cameras" sheet: Film · Instant · Digital · Phone · Toy/Special. */
export function cameraGroup(camera: CameraModel): CameraGroup {
  if (ejectsPrints(camera)) return 'instant';
  if (PHONE_BODIES.has(camera.body)) return 'phone';
  if (camera.instant) return 'digital';
  if (TOY_BODIES.has(camera.body)) return 'toy';
  return 'film';
}

/** Every body at once, grouped, for picking without scrolling the strip through every card. */
function AllCameras({ open, onClose, items, selected, onPick }: { open: boolean; onClose: () => void; items: CameraModel[]; selected: string; onPick: (id: string) => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={t('cam.allCamerasTitle')} testId="all-cameras">
      <div class="all-cams">
        {GROUPS.map((g) => {
          const list = items.filter((c) => cameraGroup(c) === g);
          if (!list.length) return null;
          return (
            <section key={g} aria-labelledby={`allcam-${g}`}>
              <h3 id={`allcam-${g}`}>{t(`cam.group.${g}` as MsgKey)}</h3>
              <ul>
                {list.map((c) => (
                  <li key={c.id}>
                    <button type="button" class={`all-cam ${c.id === selected ? 'on' : ''}`} aria-pressed={c.id === selected} onClick={() => onPick(c.id)} data-testid={`allcam-${c.id}`}>
                      <strong><bdi>{c.name}</bdi></strong>
                      <span>{eraText(c.era)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </Sheet>
  );
}

function CameraCard({
  camera,
  selected,
  pinned,
  current,
  onClick,
  onPin,
  onFocus,
}: {
  camera: CameraModel;
  selected: boolean;
  pinned: boolean;
  /** The strip's single Tab stop (roving tabindex): this card and its pin toggle are reachable by Tab. */
  current: boolean;
  onClick: () => void;
  onPin: () => void;
  onFocus: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLButtonElement>(null);
  /** Set by a pin tap: how it was pressed and where the strip was scrolled. */
  const followPin = useRef<{ keyboard: boolean; scroll: number } | null>(null);
  useEffect(() => {
    const el = ref.current;
    const strip = el?.parentElement;
    if (!el || !strip || !selected) return;
    centerInStrip(strip, el);
  }, []);
  // Pinning moves the card. Focus stays on its toggle. A tap keeps the strip where it was (browsing
  // goes on from there); from the keyboard the card glides into view so the focus stays visible.
  useLayoutEffect(() => {
    const follow = followPin.current;
    if (!follow) return;
    followPin.current = null;
    pinRef.current?.focus({ preventScroll: true });
    const strip = ref.current?.parentElement;
    if (!follow.keyboard) {
      if (strip) strip.scrollLeft = follow.scroll;
      return;
    }
    const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: still ? 'auto' : 'smooth' });
  }, [pinned]);
  return (
    <div ref={ref} class={`camera-cell ${pinned ? 'pinned' : ''}`} data-camera={camera.id} onFocusIn={onFocus}>
      <button
        class={`camera-card ${selected ? 'on' : ''}`}
        onClick={onClick}
        aria-pressed={selected}
        tabIndex={current ? 0 : -1}
        aria-describedby="camera-strip-keys"
        data-testid={`camera-${camera.id}`}
      >
        <CameraBody camera={camera} width={72} />
        <span class="camera-name"><bdi>{camera.name}</bdi></span>
        <span class="camera-era">{eraText(camera.era)}</span>
        {SHOW_PRO_BADGES && camera.pro && <span class="badge">{t('common.pro')}</span>}
        {pinned && <span class="sr-only">{t('cam.pinned')}</span>}
      </button>
      <button
        ref={pinRef}
        type="button"
        class={`camera-pin ${pinned ? 'on' : ''}`}
        onClick={(e) => {
          // detail 0: Enter / Space (or a screen reader) rather than a pointer.
          followPin.current = { keyboard: e.detail === 0, scroll: ref.current?.parentElement?.scrollLeft ?? 0 };
          onPin();
        }}
        aria-pressed={pinned}
        tabIndex={current ? 0 : -1}
        aria-label={t('cam.pin', { name: camera.name })}
        title={t('cam.pinHint')}
        data-testid={`pin-${camera.id}`}
      >
        <span class="camera-pin-dot">
          <Icon name="pin" size={14} />
        </span>
      </button>
    </div>
  );
}

export function LoadPanel(props: {
  cameraId: string;
  stockId: string;
  size: number;
  onCamera: (id: string) => void;
  onStock: (id: string) => void;
  onSize: (n: number) => void;
  onLoad: () => void;
  loading?: boolean;
}) {
  const camera = getCamera(props.cameraId);
  const films = filmsFor(camera);
  const stock = getStock(props.stockId);
  const pins = settings.value.pinnedCameras;
  const ordered = orderByPins(CAMERAS, pins);
  // Roving tabindex: the strip is one Tab stop (the selected card at first), arrows move between cards.
  // While focus is elsewhere the stop is the selected camera; inside the strip it follows focus.
  const [focusId, setFocusId] = useState<string | null>(null);
  const current = focusId && ordered.items.some((c) => c.id === focusId) ? focusId : camera.id;
  const stripRef = useRef<HTMLDivElement>(null);
  const onStripKey = (e: KeyboardEvent) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const ids = ordered.items.map((c) => c.id);
    const at = Math.max(0, ids.indexOf(current));
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : Math.min(ids.length - 1, Math.max(0, at + arrowStep(e.key)));
    e.preventDefault();
    e.stopPropagation();
    const id = ids[next];
    setFocusId(id);
    const card = stripRef.current?.querySelector<HTMLElement>(`[data-testid="camera-${CSS.escape(id)}"]`);
    if (!card) return;
    card.tabIndex = 0; // focusable now, before the re-render moves the tab stop
    card.focus({ preventScroll: true });
    card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  /** Brings a card into view (the toast's "Show" after pinning: the card jumped to the front). */
  const showCard = (id: string) => {
    const card = stripRef.current?.querySelector<HTMLElement>(`[data-camera="${CSS.escape(id)}"]`);
    if (!card) return;
    const still = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    card.scrollIntoView({ block: 'nearest', inline: 'center', behavior: still ? 'auto' : 'smooth' });
    card.querySelector<HTMLElement>('.camera-card')?.focus({ preventScroll: true });
  };
  const togglePin = (c: CameraModel) => {
    const pin = !pins.includes(c.id);
    void setCameraPinned(c.id, pin);
    // Visible (and read out by the toast region): the card moves away from under the finger.
    // One toast for a run of pins: the newest replaces the text and its "Show".
    toast(
      t(pin ? 'cam.pinnedToast' : 'cam.unpinnedSay', { name: c.name }),
      pin ? { label: t('cam.pinShow'), run: () => showCard(c.id) } : undefined,
      3200,
      undefined,
      { group: 'camera-pin' },
    );
  };
  // First run only: hidden once a roll was ever loaded (kv flag), or when rolls already exist.
  const [quickDone, setQuickDone] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    get<boolean>('kv', QUICK_START_KEY)
      .then((v) => alive && setQuickDone(!!v))
      .catch(() => alive && setQuickDone(true));
    return () => {
      alive = false;
    };
  }, []);
  const showQuick = quickDone === false && rolls.value.length === 0;
  const [allOpen, setAllOpen] = useState(false);
  // A body picked in the "All cameras" sheet is brought into view in the strip.
  const reveal = useRef<string | null>(null);
  useEffect(() => {
    if (reveal.current !== camera.id) return;
    reveal.current = null;
    const card = stripRef.current?.querySelector<HTMLElement>(`[data-camera="${CSS.escape(camera.id)}"]`);
    const strip = stripRef.current;
    if (card && strip) centerInStrip(strip, card);
  }, [camera.id]);
  return (
    <div class="load-panel" data-testid="load-panel">
      <div class="load-head">
        <div class="load-head-row">
          <strong>{t('cam.chooseCamera')}</strong>
          <button type="button" class="all-cams-btn" onClick={() => setAllOpen(true)} aria-haspopup="dialog" data-testid="btn-all-cameras">
            {t('cam.allCameras')} ({CAMERAS.length})
          </button>
        </div>
        <span class="muted">{cameraDescription(camera.id)}</span>
      </div>
      {showQuick && (
        <div class="quick-start" role="group" aria-labelledby="quick-start-label" data-testid="quick-start">
          <span id="quick-start-label" class="quick-start-label">
            {t('cam.quickStart')}
          </span>
          {QUICK_START.map((q) => (
            <button
              key={q.id}
              type="button"
              class={`quick-chip ${camera.id === q.id ? 'on' : ''}`}
              aria-pressed={camera.id === q.id}
              onClick={() => {
                reveal.current = q.id;
                props.onCamera(q.id);
              }}
              data-testid={`quick-${q.id}`}
            >
              {t(q.label)}
            </button>
          ))}
        </div>
      )}
      <AllCameras
        open={allOpen}
        onClose={() => setAllOpen(false)}
        items={ordered.items}
        selected={camera.id}
        onPick={(id) => {
          reveal.current = id;
          setAllOpen(false);
          props.onCamera(id);
        }}
      />
      <p id="camera-strip-keys" class="sr-only">
        {t('a11y.cameraKeys')}
      </p>
      <div class="camera-strip" role="group" aria-label={t('cam.chooseCamera')} ref={stripRef}
        onKeyDown={onStripKey}
        onFocusOut={(e) => {
          const to = e.relatedTarget as Node | null;
          if (!to || !e.currentTarget.contains(to)) setFocusId(null);
        }}
      >
        {ordered.items.map((c, i) => (
          <Fragment key={c.id}>
            {i === ordered.pinnedCount && i > 0 && <div class="camera-divider" aria-hidden="true" />}
            <CameraCard
              camera={c}
              selected={c.id === camera.id}
              pinned={i < ordered.pinnedCount}
              current={c.id === current}
              onClick={() => props.onCamera(c.id)}
              onPin={() => togglePin(c)}
              onFocus={() => setFocusId(c.id)}
            />
          </Fragment>
        ))}
      </div>
      {films.length > 1 ? (
        <>
          <div class="load-sub">
            <span>{t('cam.film')}</span>
            <span class="muted small">{stockDescription(stock.id)}</span>
          </div>
          <StockStrip key={camera.id} stocks={films} value={stock.id} onChange={props.onStock} label={t('cam.chooseFilm')} />
        </>
      ) : (
        <div class="load-sub">
          <span>{t('cam.fixedFilm')}</span>
          <span class="muted small">
            <bdi>{stock.name}</bdi> · {stockDescription(stock.id)}
          </span>
        </div>
      )}
      {/* Sticky just above the tab bar: the load button never scrolls out of reach. */}
      <div class="load-row" data-testid="load-row">
        {camera.capacities.length > 1 ? (
          <Segmented label={t('cam.rollSize')} value={props.size} onChange={props.onSize} options={camera.capacities.map((n) => ({ value: n, label: capacityLabel(camera, n) }))} />
        ) : (
          <span class="fixed-cap mono">{capacityLabel(camera, camera.capacities[0])}</span>
        )}
        <button class="btn primary" onClick={props.onLoad} disabled={props.loading} data-testid="btn-load">
          {loadLabel(camera)}
        </button>
      </div>
    </div>
  );
}
