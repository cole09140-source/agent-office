import { Fragment } from 'preact';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { Segmented, StockCard } from '../components/ui';
import { PAYMENTS_ENABLED } from '../entitlements';
import { getStock } from '../film/stocks';
import { cameraDescription, cameraEra, stockDescription, t } from '../i18n';
import { setCameraPinned, settings } from '../state/app';
import { CameraBody } from './Body';
import { CAMERAS, ejectsPrints, filmsFor, getCamera, type CameraModel } from './models';
import { orderByPins } from './pins';

export function capacityLabel(camera: CameraModel, n: number): string {
  if (camera.capture === 'half') return t('cam.halves', { n });
  if (ejectsPrints(camera)) return t('cam.pack', { n });
  if (camera.instant) return t('cam.card', { n });
  return t('cam.exposures', { n });
}

function CameraCard({ camera, selected, pinned, onClick, onPin }: { camera: CameraModel; selected: boolean; pinned: boolean; onClick: () => void; onPin: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLButtonElement>(null);
  const followPin = useRef(false);
  useEffect(() => {
    const el = ref.current;
    const strip = el?.parentElement;
    if (!el || !strip || !selected) return;
    strip.scrollLeft = el.offsetLeft - strip.offsetLeft - (strip.clientWidth - el.clientWidth) / 2;
  }, []);
  // Pinning moves the card; keep focus on its toggle and bring it into view where it landed.
  useLayoutEffect(() => {
    if (!followPin.current) return;
    followPin.current = false;
    pinRef.current?.focus({ preventScroll: true });
    ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [pinned]);
  return (
    <div ref={ref} class={`camera-cell ${pinned ? 'pinned' : ''}`}>
      <button class={`camera-card ${selected ? 'on' : ''}`} onClick={onClick} aria-pressed={selected} data-testid={`camera-${camera.id}`}>
        <CameraBody camera={camera} width={72} />
        <span class="camera-name">{camera.name}</span>
        <span class="camera-era">{cameraEra(camera.era)}</span>
        {PAYMENTS_ENABLED && camera.pro && <span class="badge">{t('common.pro')}</span>}
        {pinned && <span class="sr-only">{t('cam.pinned')}</span>}
      </button>
      <button
        ref={pinRef}
        type="button"
        class={`camera-pin ${pinned ? 'on' : ''}`}
        onClick={() => {
          followPin.current = true;
          onPin();
        }}
        aria-pressed={pinned}
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
  // Announced to screen readers only: the card visibly jumps to the front, and a toast would cover the strip.
  const [announce, setAnnounce] = useState('');
  const togglePin = (c: CameraModel) => {
    const pin = !pins.includes(c.id);
    void setCameraPinned(c.id, pin);
    setAnnounce(t(pin ? 'cam.pinnedSay' : 'cam.unpinnedSay', { name: c.name }));
  };
  return (
    <div class="load-panel" data-testid="load-panel">
      <div class="load-head">
        <strong>{t('cam.chooseCamera')}</strong>
        <span class="muted">{cameraDescription(camera.id)}</span>
      </div>
      <div class="camera-strip" role="group" aria-label={t('cam.chooseCamera')}>
        {ordered.items.map((c, i) => (
          <Fragment key={c.id}>
            {i === ordered.pinnedCount && i > 0 && <div class="camera-divider" aria-hidden="true" />}
            <CameraCard camera={c} selected={c.id === camera.id} pinned={i < ordered.pinnedCount} onClick={() => props.onCamera(c.id)} onPin={() => togglePin(c)} />
          </Fragment>
        ))}
      </div>
      <div class="sr-only" aria-live="polite" data-testid="pin-announcer">
        {announce}
      </div>
      {films.length > 1 ? (
        <>
          <div class="load-sub">
            <span>{t('cam.film')}</span>
            <span class="muted small">{stockDescription(stock.id)}</span>
          </div>
          <div class="stock-strip" role="group" aria-label={t('cam.chooseFilm')} key={camera.id}>
            {films.map((st) => (
              <StockCard key={st.id} stock={st} selected={st.id === stock.id} onClick={() => props.onStock(st.id)} />
            ))}
          </div>
        </>
      ) : (
        <div class="load-sub">
          <span>{t('cam.fixedFilm')}</span>
          <span class="muted small">
            {stock.name} · {stockDescription(stock.id)}
          </span>
        </div>
      )}
      <div class="load-row">
        {camera.capacities.length > 1 ? (
          <Segmented label={t('cam.rollSize')} value={props.size} onChange={props.onSize} options={camera.capacities.map((n) => ({ value: n, label: capacityLabel(camera, n) }))} />
        ) : (
          <span class="fixed-cap mono">{capacityLabel(camera, camera.capacities[0])}</span>
        )}
        <button class="btn primary" onClick={props.onLoad} disabled={props.loading} data-testid="btn-load">
          {t('cam.load')}
        </button>
      </div>
    </div>
  );
}
