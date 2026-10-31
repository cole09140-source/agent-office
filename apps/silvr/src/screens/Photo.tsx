import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { formatDate, Header, Sheet, useObjectUrl, usePrint } from '../components/ui';
import { getStock } from '../film/stocks';
import { t } from '../i18n';
import { fileName, shareImages } from '../platform/share';
import { confirm, rolls, toast } from '../state/app';
import { signalLang } from '../state/lang';
import { back, go, goTab, isCurrent } from '../state/router';
import { getCamera, hasCamera } from '../cameras/models';
import { deletePhoto, getPhoto, listPhotos, subscribe, viewable, type Photo } from '../store/rolls';

const INSTANT_DEV_S = 45;

export function PhotoScreen({ id }: { id: string }) {
  const [photo, setPhoto] = useState<Photo | null | undefined>(undefined);
  const [siblings, setSiblings] = useState<Photo[]>([]);
  const [info, setInfo] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const p = await getPhoto(id);
      if (!alive) return;
      setPhoto(p ?? null);
      if (p) setSiblings(await listPhotos(p.rollId));
    };
    void load();
    const off = subscribe(load);
    return () => {
      alive = false;
      off();
    };
  }, [id]);

  const { blob, error } = usePrint(photo ?? undefined, 'print');
  const url = useObjectUrl(blob);
  const roll = photo ? rolls.value.find((r) => r.id === photo.rollId) : undefined;
  const idx = photo ? siblings.findIndex((p) => p.id === photo.id) : -1;
  const goSibling = (d: number) => {
    const next = siblings[idx + d];
    if (next) go({ name: 'photo', id: next.id }, true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goSibling(1);
      if (e.key === 'ArrowLeft') goSibling(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const undeveloped = !!roll && !viewable(roll);
  useEffect(() => {
    if (undeveloped) go({ name: 'lab' }, true);
  }, [undeveloped]);

  if (photo === null) {
    return (
      <div class="page">
        <Header title="" onBack={() => back({ name: 'gallery' })} />
      </div>
    );
  }
  if (undeveloped) return null;
  const stock = photo ? getStock(photo.develop.stockId) : undefined;
  const camera = photo && hasCamera(photo.develop.cameraId) ? getCamera(photo.develop.cameraId) : undefined;
  // Instant prints keep developing for a while after they eject.
  const instantDev = photo && camera?.id === 'instasq' ? Math.max(0, INSTANT_DEV_S - (Date.now() - photo.takenAt) / 1000) : 0;

  // One share/save at a time: a double tap saved the print twice, or the second share
  // was refused and its cleanup deleted the file the first share sheet was still reading.
  const [sharing, setSharing] = useState(false);
  const sharingRef = useRef(false);
  const share = async (download: boolean) => {
    if (!blob || !photo || sharingRef.current) return;
    sharingRef.current = true;
    setSharing(true);
    try {
      const res = await shareImages([{ blob, name: fileName('SILVR', photo.takenAt, blob.type === 'image/png' ? 'png' : 'jpg') }], download);
      if (res === 'downloaded') toast(t('view.savedToast'));
    } catch (err) {
      console.error('[silvr] share failed', err);
      toast(t('common.error'));
    } finally {
      sharingRef.current = false;
      setSharing(false);
    }
  };

  const remove = async () => {
    if (!photo) return;
    if (!(await confirm(t('view.deleteConfirm'), t('common.delete'), true))) return;
    const next = siblings[idx + 1] ?? siblings[idx - 1];
    await deletePhoto(photo.id);
    if (!isCurrent({ name: 'photo', id: photo.id })) return;
    if (next) go({ name: 'photo', id: next.id }, true);
    else goTab({ name: 'gallery' }); // the emptied roll is gone too: unwind so back can't reach it
  };

  return (
    <div class="viewer" data-testid="photo-screen">
      <Header
        title={stock?.name ?? ''}
        sub={photo && idx >= 0 ? `${idx + 1} / ${siblings.length}` : undefined}
        onBack={() => back(roll ? { name: 'roll', id: roll.id } : { name: 'gallery' })}
        right={
          <button class="icon-btn" onClick={() => setInfo(true)} aria-label={t('view.info')}>
            <Icon name="info" />
          </button>
        }
      />
      <div
        class="viewer-stage"
        onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          const s = touch.current;
          touch.current = null;
          if (!s) return;
          const dx = e.changedTouches[0].clientX - s.x;
          const dy = e.changedTouches[0].clientY - s.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) goSibling(dx < 0 ? 1 : -1);
        }}
      >
        {url ? (
          <img
            src={url}
            alt={photo && stock ? `${stock.name} · ${t('view.photoN', { n: photo.frame })} · ${formatDate(photo.takenAt, signalLang.value)}` : ''}
            class={`print ${instantDev > 0 ? 'instant-dev' : ''}`}
            style={instantDev > 0 ? { animationDelay: `-${INSTANT_DEV_S - instantDev}s` } : undefined}
            data-testid="print"
          />
        ) : (
          <div class="developing-tray mono" aria-live="polite">
            {error ? t('common.error') : t('view.developing')}
          </div>
        )}
        {idx > 0 && (
          <button class="nav prev" onClick={() => goSibling(-1)} aria-label={t('view.prev')}>
            <Icon name="back" />
          </button>
        )}
        {idx >= 0 && idx < siblings.length - 1 && (
          <button class="nav next" onClick={() => goSibling(1)} aria-label={t('view.next')} data-testid="btn-next">
            <Icon name="chevron" />
          </button>
        )}
      </div>
      <div class="viewer-actions">
        <button onClick={() => share(false)} disabled={!blob || sharing} data-testid="btn-share">
          <Icon name="share" />
          <span>{t('view.share')}</span>
        </button>
        <button onClick={() => share(true)} disabled={!blob || sharing} data-testid="btn-save">
          <Icon name="download" />
          <span>{t('view.saveImage')}</span>
        </button>
        <button onClick={() => photo && go({ name: 'darkroom', id: photo.id })} disabled={!photo} data-testid="btn-darkroom">
          <Icon name="sliders" />
          <span>{t('view.darkroom')}</span>
        </button>
        <button onClick={remove} disabled={!photo} data-testid="btn-delete">
          <Icon name="trash" />
          <span>{t('common.delete')}</span>
        </button>
      </div>
      <Sheet open={info} onClose={() => setInfo(false)} title={t('view.info')}>
        {photo && stock && (
          <dl class="info">
            <dt>{t('view.film')}</dt>
            <dd>
              {stock.name} · ISO {stock.iso}
            </dd>
            {camera && (
              <>
                <dt>{t('dr.camera')}</dt>
                <dd>{camera.name}</dd>
              </>
            )}
            <dt>{t('view.taken')}</dt>
            <dd>{formatDate(photo.takenAt, signalLang.value, true)}</dd>
            <dt>{t('view.frame')}</dt>
            <dd>#{photo.frame}</dd>
            <dt>{t('view.size')}</dt>
            <dd class="mono">{photo.printW ? `${photo.printW}×${photo.printH}` : `${photo.width}×${photo.height}`}</dd>
            <dt>{t('dr.push')}</dt>
            <dd class="mono">
              {photo.develop.push > 0 ? '+' : ''}
              {photo.develop.push}
            </dd>
          </dl>
        )}
      </Sheet>
    </div>
  );
}
