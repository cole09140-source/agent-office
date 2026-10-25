import { useEffect, useRef } from 'preact/hooks';
import { Segmented, StockCard } from '../components/ui';
import { PAYMENTS_ENABLED } from '../entitlements';
import { getStock } from '../film/stocks';
import { cameraDescription, cameraEra, stockDescription, t } from '../i18n';
import { CameraBody } from './Body';
import { CAMERAS, filmsFor, getCamera, type CameraModel } from './models';

export function capacityLabel(camera: CameraModel, n: number): string {
  if (camera.capture === 'half') return t('cam.halves', { n });
  if (camera.id === 'instasq') return t('cam.pack', { n });
  if (camera.instant) return t('cam.card', { n });
  return t('cam.exposures', { n });
}

function CameraCard({ camera, selected, onClick }: { camera: CameraModel; selected: boolean; onClick: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    const strip = el?.parentElement;
    if (!el || !strip || !selected) return;
    strip.scrollLeft = el.offsetLeft - strip.offsetLeft - (strip.clientWidth - el.clientWidth) / 2;
  }, []);
  return (
    <button ref={ref} class={`camera-card ${selected ? 'on' : ''}`} onClick={onClick} aria-pressed={selected} data-testid={`camera-${camera.id}`}>
      <CameraBody camera={camera} width={72} />
      <span class="camera-name">{camera.name}</span>
      <span class="camera-era">{cameraEra(camera.era)}</span>
      {PAYMENTS_ENABLED && camera.pro && <span class="badge">{t('common.pro')}</span>}
    </button>
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
  return (
    <div class="load-panel" data-testid="load-panel">
      <div class="load-head">
        <strong>{t('cam.chooseCamera')}</strong>
        <span class="muted">{cameraDescription(camera.id)}</span>
      </div>
      <div class="camera-strip" role="group" aria-label={t('cam.chooseCamera')}>
        {CAMERAS.map((c) => (
          <CameraCard key={c.id} camera={c} selected={c.id === camera.id} onClick={() => props.onCamera(c.id)} />
        ))}
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
