import { Fragment } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/ui';
import { SHOW_PRO_BADGES } from '../entitlements';
import { eraText, t, type MsgKey } from '../i18n';
import { settings } from '../state/app';
import { arrowStep, centerInStrip } from '../platform/dir';
import { CameraBody } from './Body';
import { CAMERAS, ejectsPrints, type CameraModel } from './models';
import { orderByPins } from './pins';

type CameraGroup = 'film' | 'instant' | 'digital' | 'phone' | 'toy';
const GROUPS: CameraGroup[] = ['film', 'instant', 'digital', 'phone', 'toy'];
const TOY_BODIES = new Set(['disposable', 'toy', 'quad', 'double', 'pano', 'fish', 'aqua', 'super8', 'sprocket', 'flash', 'kid', 'pinhole']);
const PHONE_BODIES = new Set(['flip', 'smart', 'slab', 'qwerty']);

/** Bucket for the "All cameras" sheet: Film · Instant · Digital · Phone · Toy/Special. */
export function cameraGroup(camera: CameraModel): CameraGroup {
  if (ejectsPrints(camera)) return 'instant';
  if (PHONE_BODIES.has(camera.body)) return 'phone';
  if (camera.instant) return 'digital';
  if (TOY_BODIES.has(camera.body)) return 'toy';
  return 'film';
}

/** Every body at once, grouped, for picking without dragging the strip through every card. */
export function AllCameras({ open, onClose, items, selected, onPick }: { open: boolean; onClose: () => void; items: CameraModel[]; selected: string; onPick: (id: string) => void }) {
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

/** How long the strip must be still after a drag before the centred camera is taken. */
const SETTLE_MS = 160;

const reduceMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * The camera strip under the viewfinder: drag it sideways and the camera that comes to rest in the
 * middle is the one you shoot with (like a camera-mode dial). A tap picks a camera directly.
 * Pinned cameras come first. The last item opens every camera at once, grouped.
 */
export function CameraRail({ selected, onPick, locked }: { selected: string; onPick: (id: string) => void; locked?: boolean }) {
  const ordered = orderByPins(CAMERAS, settings.value.pinnedCameras);
  const stripRef = useRef<HTMLDivElement>(null);
  const [allOpen, setAllOpen] = useState(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>();
  /** Picks are refused while shooting: the strip glides back to the camera in use. */
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  /** The finger is on the strip: never take a camera mid-drag. */
  const touching = useRef(false);
  /**
   * The user moved the strip (finger, mouse or wheel). Only then does the camera that comes to rest in
   * the middle get picked: the strip's own glides (a tap, a pick elsewhere) never pick by themselves.
   */
  const dragged = useRef(false);
  /** A camera picked while a shot was being saved: taken as soon as the camera is free. */
  const waiting = useRef<string | null>(null);
  useEffect(() => {
    if (locked || !waiting.current) return;
    const id = waiting.current;
    waiting.current = null;
    if (id !== selectedRef.current) onPickRef.current(id);
  }, [locked]);

  const cardOf = (id: string) => stripRef.current?.querySelector<HTMLElement>(`[data-camera="${CSS.escape(id)}"]`) ?? null;
  const glideTo = (id: string, smooth: boolean) => {
    const strip = stripRef.current;
    const card = cardOf(id);
    if (!strip || !card) return;
    if (!smooth || reduceMotion()) {
      centerInStrip(strip, card);
      return;
    }
    // An absolute target (not a relative step): a glide started mid-glide still ends on this card.
    const s = strip.getBoundingClientRect();
    const r = card.getBoundingClientRect();
    strip.scrollTo({ left: strip.scrollLeft + r.left + r.width / 2 - (s.left + s.width / 2), behavior: 'smooth' });
  };

  // The camera in use sits in the middle: at first, and whenever it changes from elsewhere.
  const first = useRef(true);
  const reglides = useRef(0);
  useLayoutEffect(() => {
    reglides.current = 0;
    glideTo(selected, !first.current);
    first.current = false;
  }, [selected]);
  // Pinning reorders the cards: the camera in use goes straight back under the ring.
  const orderKey = ordered.items.map((c) => c.id).join(',');
  const firstOrder = useRef(true);
  useLayoutEffect(() => {
    if (firstOrder.current) {
      firstOrder.current = false;
      return;
    }
    glideTo(selectedRef.current, false);
  }, [orderKey]);

  /** The card nearest the middle of the strip. */
  const centred = (): string | null => {
    const strip = stripRef.current;
    if (!strip) return null;
    const s = strip.getBoundingClientRect();
    const mid = s.left + s.width / 2;
    let best: string | null = null;
    let dist = Infinity;
    for (const el of Array.from(strip.querySelectorAll<HTMLElement>('[data-camera]'))) {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < dist) {
        dist = d;
        best = el.dataset.camera ?? null;
      }
    }
    return best;
  };

  const settle = () => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      if (touching.current) return;
      if (!dragged.current) {
        // The strip came to rest by itself (a glide, a resize, a layout change): keep the camera in use
        // under the ring.
        if (centred() !== selectedRef.current && reglides.current < 2) {
          reglides.current++; // never a glide loop if the snap point cannot be reached
          glideTo(selectedRef.current, true);
        }
        return;
      }
      dragged.current = false;
      const id = centred();
      if (!id || id === selectedRef.current) return;
      if (lockedRef.current) waiting.current = id;
      else onPickRef.current(id);
    }, SETTLE_MS);
  };
  useEffect(() => () => clearTimeout(settleTimer.current), []);

  const pick = (id: string) => {
    dragged.current = false; // a tap, not a drag: the glide that follows picks nothing else
    glideTo(id, true);
    if (id === selected) return;
    if (locked) waiting.current = id;
    else onPick(id);
  };

  const onKey = (e: KeyboardEvent) => {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    const ids = ordered.items.map((c) => c.id);
    const at = Math.max(0, ids.indexOf(selected));
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? ids.length - 1 : Math.min(ids.length - 1, Math.max(0, at + arrowStep(e.key)));
    const id = ids[next];
    pick(id);
    // Focus follows the picked camera (one Tab stop for the whole strip).
    requestAnimationFrame(() => cardOf(id)?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true }));
  };

  return (
    <div class={`cam-rail ${locked ? 'locked' : ''}`} data-testid="camera-rail">
      <p id="camera-rail-keys" class="sr-only">
        {t('a11y.cameraKeys')}
      </p>
      <div class="cam-rail-track">
      <div
        class="cam-rail-strip"
        role="group"
        aria-label={t('cam.chooseCamera')}
        ref={stripRef}
        onScroll={settle}
        onKeyDown={onKey}
        onPointerDown={() => {
          touching.current = true;
          dragged.current = true;
        }}
        onWheel={() => (dragged.current = true)}
        onTouchStart={() => {
          touching.current = true;
          dragged.current = true;
        }}
        onPointerUp={() => {
          touching.current = false;
          settle();
        }}
        onPointerCancel={(e) => {
          // A touch pointer is cancelled the moment the browser starts scrolling: the finger is still down
          // (touchend / touchcancel say when it lifts).
          if (e.pointerType === 'touch') return;
          touching.current = false;
          settle();
        }}
        onTouchEnd={() => {
          touching.current = false;
          settle();
        }}
        onTouchCancel={() => {
          touching.current = false;
          settle();
        }}
      >
        {ordered.items.map((c, i) => (
          <Fragment key={c.id}>
            {i === ordered.pinnedCount && i > 0 && <div class="cam-rail-divider" aria-hidden="true" />}
            <div class={`cam-rail-cell ${c.id === selected ? 'on' : ''}`} data-camera={c.id}>
              <button
                type="button"
                class="cam-rail-card"
                onClick={() => pick(c.id)}
                aria-pressed={c.id === selected}
                aria-describedby="camera-rail-keys"
                tabIndex={c.id === selected ? 0 : -1}
                data-testid={`camera-${c.id}`}
              >
                <CameraBody camera={c} width={40} />
                <span class="cam-rail-name">
                  <bdi>{c.name}</bdi>
                </span>
                {SHOW_PRO_BADGES && c.pro && <span class="badge">{t('common.pro')}</span>}
                {i < ordered.pinnedCount && <span class="sr-only">{t('cam.pinned')}</span>}
              </button>
            </div>
          </Fragment>
        ))}
      </div>
      </div>
      <button type="button" class="cam-rail-all" onClick={() => setAllOpen(true)} aria-haspopup="dialog" aria-label={`${t('cam.allCameras')} (${CAMERAS.length})`} data-testid="btn-all-cameras">
        <Icon name="models" size={20} />
        <small class="mono" aria-hidden="true">
          {CAMERAS.length}
        </small>
      </button>
      <AllCameras
        open={allOpen}
        onClose={() => setAllOpen(false)}
        items={ordered.items}
        selected={selected}
        onPick={(id) => {
          setAllOpen(false);
          pick(id);
        }}
      />
    </div>
  );
}
