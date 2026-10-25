import { useEffect, useRef, useState } from 'preact/hooks';
import { Header, Segmented, Slider, StockCard, Toggle } from '../components/ui';
import { composePrint, scaleTo } from '../film/develop';
import { randomSeed } from '../film/random';
import { defaultDevelop } from '../film/resolve';
import { getStock, STOCKS } from '../film/stocks';
import type { BorderStyle, DevelopSettings } from '../film/types';
import { stockDescription, t } from '../i18n';
import { confirm, settings, toast } from '../state/app';
import { back } from '../state/router';
import { blobKey, getBlob, getPhoto, listPhotos, updateDevelop, type Photo } from '../store/rolls';

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
        if (alive) setSrc(scaleTo(bmp, bmp.width, bmp.height, PREVIEW_LONG));
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

  const save = async () => {
    if (!photo || !dev || saving) return;
    setSaving(true);
    try {
      await updateDevelop(photo.id, dev);
      toast(t('dr.saved'));
      back({ name: 'photo', id: photo.id });
    } finally {
      setSaving(false);
    }
  };

  const applyRoll = async () => {
    if (!photo || !dev) return;
    if (!(await confirm(t('dr.applyRoll'), t('dr.applyRoll')))) return;
    const all = await listPhotos(photo.rollId);
    for (const p of all) {
      const recipe: DevelopSettings =
        p.id === photo.id
          ? dev
          : { ...p.develop, stockId: dev.stockId, push: dev.push, expired: dev.expired, grain: dev.grain, halation: dev.halation, border: dev.border, flash: dev.flash };
      await updateDevelop(p.id, recipe);
    }
    toast(t('dr.applyRollDone'));
    back({ name: 'photo', id: photo.id });
  };

  if (!dev || !photo) {
    return (
      <div class="page">
        <Header title={t('dr.title')} onBack={() => back({ name: 'gallery' })} />
      </div>
    );
  }
  const stock = getStock(dev.stockId);

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
        {compare && <span class="dr-badge mono">NEGATIVE</span>}
      </div>
      <p class="dr-hint muted small">{t('dr.compare')}</p>
      <div class="dr-controls">
        <section>
          <h3>
            {t('dr.film')} · <span class="muted">{stockDescription(stock.id)}</span>
          </h3>
          <div class="stock-strip">
            {STOCKS.map((st) => (
              <StockCard
                key={st.id}
                stock={st}
                selected={st.id === dev.stockId}
                onClick={() => set({ stockId: st.id, border: dev.border === getStock(dev.stockId).defaultBorder ? st.defaultBorder : dev.border })}
              />
            ))}
          </div>
        </section>
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
        <Slider label={t('dr.expired')} value={dev.expired} min={0} max={1} step={0.05} onInput={(v) => set({ expired: v })} format={(v) => `${Math.round(v * 30)}y`} testId="sl-expired" />
        <Slider label={t('dr.grain')} value={dev.grain} min={0} max={2} step={0.1} onInput={(v) => set({ grain: v })} format={(v) => `${Math.round(v * 100)}%`} testId="sl-grain" />
        <Slider label={t('dr.halation')} value={dev.halation} min={0} max={2} step={0.1} onInput={(v) => set({ halation: v })} format={(v) => `${Math.round(v * 100)}%`} />
        <div class="dr-toggles">
          <Toggle label={t('dr.leak')} checked={dev.leak !== null} onChange={(on) => set({ leak: on ? randomSeed() : null })} testId="tg-leak" />
          {dev.leak !== null && (
            <button class="btn ghost small" onClick={() => set({ leak: randomSeed() })}>
              {t('dr.leak.reroll')}
            </button>
          )}
          <Toggle label={t('dr.flash')} checked={dev.flash} onChange={(v) => set({ flash: v })} />
          <Toggle label={t('dr.date')} checked={dev.dateStamp} onChange={(v) => set({ dateStamp: v })} testId="tg-date" />
        </div>
        <section>
          <h3>{t('dr.border')}</h3>
          <Segmented label={t('dr.border')} value={dev.border} onChange={(v) => set({ border: v })} options={BORDERS.map((b) => ({ value: b, label: t(`dr.border.${b}` as const) }))} />
        </section>
        <div class="btn-row">
          <button class="btn ghost" onClick={() => setDev(defaultDevelop(getStock(photo.develop.stockId), photo.develop.seed, { dateStamp: photo.develop.dateStamp, leak: photo.develop.leak, rotate: photo.develop.rotate }))}>
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
