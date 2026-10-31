import { useEffect, useRef, useState } from 'preact/hooks';
import { Header, Segmented, Slider, StockCard, Toggle } from '../components/ui';
import { composePrint, gpuDevelopAvailable, scaleTo } from '../film/develop';
import { randomSeed } from '../film/random';
import { defaultDevelop } from '../film/resolve';
import { filmsFor, getCamera, hasCamera, PALETTE_IDS } from '../cameras/models';
import { getStock, STOCKS } from '../film/stocks';
import type { BorderStyle, DevelopSettings } from '../film/types';
import { stockDescription, t, type MsgKey } from '../i18n';
import { confirm, settings, toast } from '../state/app';
import { back, isCurrent } from '../state/router';
import { blobKey, getBlob, getPhoto, listPhotos, updateDevelop, updateDevelopMany, type Photo } from '../store/rolls';

const PREVIEW_LONG = 1400;
const BORDERS: BorderStyle[] = ['none', 'film35', 'instant', 'print'];

export function DarkroomScreen({ id }: { id: string }) {
  const [photo, setPhoto] = useState<Photo>();
  const [dev, setDev] = useState<DevelopSettings>();
  const [src, setSrc] = useState<HTMLCanvasElement>();
  const [compare, setCompare] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await getPhoto(id);
      if (!p || !alive) return;
      setPhoto(p);
      setDev({ ...p.develop });
      const neg = await getBlob(blobKey.neg(p.id));
      if (!neg) return;
      const bmp = await createImageBitmap(neg);
      try {
        // Without WebGL every slider move re-develops on the CPU: keep that preview small.
        if (alive) setSrc(scaleTo(bmp, bmp.width, bmp.height, gpuDevelopAvailable() ? PREVIEW_LONG : 700));
      } finally {
        bmp.close?.();
      }
    })().catch((err) => {
      console.error(err);
      toast(t('common.error'));
    });
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!src || !dev || !photo) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const c = canvasRef.current;
      if (!c) return;
      const out = compare ? src : composePrint(src, dev, { takenAt: photo.takenAt, frame: photo.frame, dateFormat: settings.value.dateFormat });
      c.width = out.width;
      c.height = out.height;
      c.getContext('2d')!.drawImage(out, 0, 0);
    });
    return () => cancelAnimationFrame(raf.current);
  }, [src, dev, compare, photo]);

  const set = (patch: Partial<DevelopSettings>) => setDev((d) => (d ? { ...d, ...patch } : d));

  /** Back to the camera's defaults for this frame (keeps seed, leak, rotation and date choice). */
  const reset = () => {
    if (!photo) return;
    const st = getStock(photo.develop.stockId);
    const cam = hasCamera(photo.develop.cameraId) ? getCamera(photo.develop.cameraId) : null;
    setDev(
      defaultDevelop(st, photo.develop.seed, {
        dateStamp: photo.develop.dateStamp,
        leak: photo.develop.leak,
        rotate: photo.develop.rotate,
        cameraId: photo.develop.cameraId,
        border: cam?.border ?? st.defaultBorder,
        palette: photo.develop.palette,
        flash: photo.develop.flash, // whether the flash fired is a fact of the frame
        ev: photo.develop.ev,
      }),
    );
  };

  const save = async () => {
    if (!photo || !dev || saving) return;
    setSaving(true);
    try {
      await updateDevelop(photo.id, dev);
      toast(t('dr.saved'));
      if (isCurrent({ name: 'darkroom', id: photo.id })) back({ name: 'photo', id: photo.id });
    } catch (err) {
      // Stay in the darkroom with the edit intact, and say why nothing happened.
      console.error('[silvr] darkroom save failed', err);
      toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const applyRoll = async () => {
    if (!photo || !dev) return;
    if (!(await confirm(t('dr.applyRollConfirm'), t('dr.applyRoll')))) return;
    try {
      const all = await listPhotos(photo.rollId);
      // Look settings carry over; per-frame facts (flash fired, seed, leak, date, rotation) stay with each frame.
      await updateDevelopMany(
        all.map((p) => [
          p.id,
          p.id === photo.id
            ? dev
            : { ...p.develop, stockId: dev.stockId, push: dev.push, expired: dev.expired, grain: dev.grain, halation: dev.halation, border: dev.border, ev: dev.ev, palette: dev.palette },
        ]),
      );
    } catch (err) {
      console.error('[silvr] apply to roll failed', err);
      toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'));
      return;
    }
    toast(t('dr.applyRollDone'));
    if (isCurrent({ name: 'darkroom', id: photo.id })) back({ name: 'photo', id: photo.id });
  };

  if (!dev || !photo) {
    return (
      <div class="page">
        <Header title={t('dr.title')} onBack={() => back({ name: 'gallery' })} />
      </div>
    );
  }
  const stock = getStock(dev.stockId);
  const camera = hasCamera(dev.cameraId) ? getCamera(dev.cameraId) : null;
  // Re-develop within what the camera can load (the CCD/pixel sensors are camera-specific).
  const films = camera ? filmsFor(camera) : STOCKS.filter((st) => !st.exclusive);
  const isPixel = stock.kind === 'pixel';
  const isDigital = stock.kind === 'digital' || isPixel;

  return (
    <div class="darkroom" data-testid="darkroom-screen">
      <Header
        title={t('dr.title')}
        onBack={() => back({ name: 'photo', id: photo.id })}
        right={
          <button class="btn primary small" onClick={save} disabled={saving} data-testid="btn-dr-save">
            {t('common.save')}
          </button>
        }
      />
      <div
        class="dr-stage"
        onPointerDown={() => setCompare(true)}
        onPointerUp={() => setCompare(false)}
        onPointerLeave={() => setCompare(false)}
        onPointerCancel={() => setCompare(false)}
        title={t('dr.compare')}
      >
        <canvas ref={canvasRef} data-testid="dr-canvas" />
        {compare && <span class="dr-badge mono">{t('dr.original')}</span>}
      </div>
      <p class="dr-hint muted small">
        {t('dr.compare')} ·{' '}
        <button class="link-btn" aria-pressed={compare} onClick={() => setCompare(!compare)} data-testid="btn-compare">
          {t('dr.showOriginal')}
        </button>
      </p>
      <div class="dr-controls">
        {camera && (
          <p class="dr-camera muted small">
            {t('dr.camera')} · <strong>{camera.name}</strong>
          </p>
        )}
        {films.length > 1 && (
          <section>
            <h3>
              {t('dr.film')} · <span class="muted">{stockDescription(stock.id)}</span>
            </h3>
            <div class="stock-strip">
              {films.map((st) => (
                <StockCard
                  key={st.id}
                  stock={st}
                  selected={st.id === dev.stockId}
                  onClick={() => set({ stockId: st.id, border: dev.border === getStock(dev.stockId).defaultBorder ? st.defaultBorder : dev.border })}
                />
              ))}
            </div>
          </section>
        )}
        {isPixel && (
          <section>
            <h3>{t('dr.palette')}</h3>
            <Segmented label={t('dr.palette')} value={dev.palette ?? PALETTE_IDS[0]} onChange={(v) => set({ palette: v })} options={PALETTE_IDS.map((p) => ({ value: p, label: t(`palette.${p}` as MsgKey) }))} />
          </section>
        )}
        <Slider
          label={t('dr.ev')}
          value={dev.ev ?? 0}
          min={-2}
          max={2}
          step={1 / 3}
          onInput={(v) => set({ ev: Math.round(v * 3) / 3 })}
          format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} EV`}
          testId="sl-dr-ev"
        />
        {!isDigital && (
          <>
            <Slider
              label={t('dr.push')}
              hint={t('dr.push.hint')}
              value={dev.push}
              min={-2}
              max={2}
              step={0.5}
              onInput={(v) => set({ push: v })}
              format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} EV`}
              testId="sl-push"
            />
            <Slider label={t('dr.expired')} value={dev.expired} min={0} max={1} step={0.05} onInput={(v) => set({ expired: v })} format={(v) => t('dr.years', { n: Math.round(v * 30) })} testId="sl-expired" />
            <Slider label={t('dr.grain')} value={dev.grain} min={0} max={2} step={0.1} onInput={(v) => set({ grain: v })} format={(v) => `${Math.round(v * 100)}%`} testId="sl-grain" />
            <Slider label={t('dr.halation')} value={dev.halation} min={0} max={2} step={0.1} onInput={(v) => set({ halation: v })} format={(v) => `${Math.round(v * 100)}%`} />
          </>
        )}
        <div class="dr-toggles">
          {!isDigital && <Toggle label={t('dr.leak')} checked={dev.leak !== null} onChange={(on) => set({ leak: on ? randomSeed() : null })} testId="tg-leak" />}
          {!isDigital && dev.leak !== null && (
            <button class="btn ghost small" onClick={() => set({ leak: randomSeed() })}>
              {t('dr.leak.reroll')}
            </button>
          )}
          {!isPixel && camera?.flash !== 'none' && <Toggle label={t('dr.flash')} checked={dev.flash} onChange={(v) => set({ flash: v })} />}
          {camera?.stamp !== 'none' && <Toggle label={t('dr.date')} checked={dev.dateStamp} onChange={(v) => set({ dateStamp: v })} testId="tg-date" />}
        </div>
        {!isPixel && (
          <section>
            <h3>{t('dr.border')}</h3>
            <Segmented label={t('dr.border')} value={dev.border} onChange={(v) => set({ border: v })} options={BORDERS.map((b) => ({ value: b, label: t(`dr.border.${b}` as const) }))} />
          </section>
        )}
        <div class="btn-row">
          <button class="btn ghost" onClick={reset}>
            {t('dr.reset')}
          </button>
          <button class="btn ghost" onClick={() => set({ rotate: (((dev.rotate ?? 0) + 1) % 4) })} data-testid="btn-rotate">
            {t('dr.rotate')}
          </button>
          <button class="btn ghost" onClick={applyRoll} data-testid="btn-apply-roll">
            {t('dr.applyRoll')}
          </button>
        </div>
      </div>
    </div>
  );
}
