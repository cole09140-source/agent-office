import { useEffect, useRef, useState } from 'preact/hooks';
import { Empty, Header, Segmented, Slider, StockCard, Toggle } from '../components/ui';
import { composePrint, gpuDevelopAvailable, scaleTo } from '../film/develop';
import { randomSeed } from '../film/random';
import { defaultBorderFor, defaultDevelop, developKey } from '../film/resolve';
import { filmsFor, getCamera, hasCamera, PALETTE_IDS } from '../cameras/models';
import { getStock, STOCKS } from '../film/stocks';
import { DIGITAL_TONES, type BorderStyle, type DevelopSettings, type DigitalTone } from '../film/types';
import { stockDescription, t, type MsgKey } from '../i18n';
import { confirm, confirmReq, settings, toast } from '../state/app';
import { pushBackHandler } from '../platform/back';
import { back, depth, go, goTab, isCurrent, route, routeToHash, type Route } from '../state/router';
import { applyDevelops, blobKey, duplicatePhoto, getBlob, getPhoto, listPhotos, restoreDevelops, updateDevelop, type DevelopUndo, type Photo } from '../store/rolls';

const PREVIEW_LONG = 1400;
const BORDERS: BorderStyle[] = ['none', 'film35', 'instant', 'print', 'slide', 'gate', 'sprocket'];

export function DarkroomScreen({ id }: { id: string }) {
  const [photo, setPhoto] = useState<Photo>();
  const [missing, setMissing] = useState(false);
  const [dev, setDev] = useState<DevelopSettings>();
  const [src, setSrc] = useState<HTMLCanvasElement>();
  const [compare, setCompare] = useState(false);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);
  /** Unsaved edits (read by the leave guards below, which outlive a render). */
  const dirty = !!photo && !!dev && developKey(dev) !== developKey(photo.develop);
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  /** Set once the user chose to leave (saved, or discarded): the guards stand down. */
  const leaving = useRef(false);
  const here: Route = { name: 'darkroom', id };

  /** Runs `to` now, or after "Discard changes?" when there are unsaved edits. */
  const leave = async (to: () => void) => {
    if (leaving.current) return;
    if (dirtyRef.current && !(await confirm(t('dr.discardConfirm'), t('dr.discard'), true))) return;
    if (!isCurrent(here) || leaving.current) return; // went somewhere else meanwhile
    leaving.current = true;
    to();
  };
  const goBack = () => void leave(() => back({ name: 'photo', id }));

  useEffect(() => {
    let alive = true;
    (async () => {
      const p = await getPhoto(id);
      if (!alive) return;
      if (!p) return setMissing(true);
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
      const out = compare ? src : composePrint(src, dev, { takenAt: photo.takenAt, frame: photo.frame, dateFormat: settings.value.dateFormat, undated: photo.undated });
      c.width = out.width;
      c.height = out.height;
      c.getContext('2d')!.drawImage(out, 0, 0);
    });
    return () => cancelAnimationFrame(raf.current);
  }, [src, dev, compare, photo]);

  // Escape acts as Back (sheets and the confirm dialog handle their own Escape first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || confirmReq.value || document.querySelector('.sheet-backdrop')) return;
      e.preventDefault();
      goBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [id]);

  // While there are unsaved edits, every way out asks first. Installed once at mount and gated on
  // dirtyRef, so an edit made a moment before leaving is already guarded.
  useEffect(() => {
    // Android back button (the confirm sheet, once open, sits above this handler).
    const offBack = pushBackHandler(goBack);
    // Browser back/forward (or any other route change): the router has already moved, so put the
    // darkroom straight back — synchronously, before the screen re-renders — then step the URL
    // back to it and ask. (Event listeners can't get ahead of the router's own popstate handler.)
    const hash = routeToHash(here);
    const myDepth = depth();
    let asking = false;
    let restoring = false;
    const offRoute = route.subscribe((r) => {
      if (routeToHash(r) === hash) {
        if (location.hash === hash) restoring = false;
        return;
      }
      if (leaving.current || (!dirtyRef.current && !restoring && !asking)) return;
      const target = r;
      route.value = here;
      if (restoring || asking) return;
      const d = depth();
      const wentBack = d < myDepth;
      if (location.hash !== hash) {
        if (d !== myDepth) {
          restoring = true; // until the URL is back on the darkroom (history.go is async)
          history.go(myDepth - d);
        } else history.replaceState(history.state, '', hash);
      }
      asking = true;
      void confirm(t('dr.discardConfirm'), t('dr.discard'), true).then((ok) => {
        asking = false;
        if (!ok || leaving.current || !isCurrent(here)) return;
        leaving.current = true;
        if (wentBack) back({ name: 'photo', id });
        else go(target, d === myDepth);
      });
    });
    // Tab bar: catch the tap before the tab switches.
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest?.('.tabbar button[data-testid^="tab-"]');
      if (!btn || leaving.current || !dirtyRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const name = btn.getAttribute('data-testid')!.slice(4) as Route['name'];
      void leave(() => goTab({ name } as Route));
    };
    const onUnload = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current || leaving.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('click', onClick, true);
    window.addEventListener('beforeunload', onUnload);
    return () => {
      offBack();
      offRoute();
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('beforeunload', onUnload);
    };
  }, [id]);

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
        border: defaultBorderFor(cam, st),
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
      leaving.current = true;
      if (isCurrent(here)) back({ name: 'photo', id: photo.id });
    } catch (err) {
      // Stay in the darkroom with the edit intact, and say why nothing happened.
      console.error('[silvr] darkroom save failed', err);
      toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  /** Keeps the original frame and adds a copy with these settings at the end of the roll. */
  const saveNew = async () => {
    if (!photo || !dev || saving) return;
    setSaving(true);
    try {
      const copy = await duplicatePhoto(photo.id, dev);
      if (!copy) {
        toast(t('common.notFound'));
        return;
      }
      toast(t('dr.savedNew', { n: copy.frame }));
      leaving.current = true;
      // Replaces the darkroom: back from the copy returns to the original.
      if (isCurrent(here)) go({ name: 'photo', id: copy.id }, true);
    } catch (err) {
      console.error('[silvr] save as new failed', err);
      toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const applyRoll = async () => {
    if (!photo || !dev) return;
    if (!(await confirm(t('dr.applyRollConfirm'), t('dr.applyRoll')))) return;
    let undo: DevelopUndo;
    try {
      const all = await listPhotos(photo.rollId);
      // Look settings carry over; per-frame facts (flash fired, seed, leak, date, rotation) stay with each frame.
      undo = await applyDevelops(
        all.map((p) => [
          p.id,
          p.id === photo.id
            ? dev
            : { ...p.develop, stockId: dev.stockId, push: dev.push, expired: dev.expired, grain: dev.grain, halation: dev.halation, border: dev.border, ev: dev.ev, palette: dev.palette, tone: dev.tone },
        ]),
        { id: photo.rollId, stockId: dev.stockId },
      );
    } catch (err) {
      console.error('[silvr] apply to roll failed', err);
      toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'));
      return;
    }
    // Every frame's previous settings stay in memory while the toast offers an undo (≥ 10 s).
    const restore = () =>
      restoreDevelops(undo).then(
        () => toast(t('dr.applyRollUndone')),
        (err) => {
          console.error('[silvr] undo apply to roll failed', err);
          toast(t('common.error'));
        },
      );
    toast(t('dr.applyRollDone'), { label: t('common.undo'), run: () => void restore() }, 10_000);
    leaving.current = true;
    if (isCurrent(here)) back({ name: 'photo', id: photo.id });
  };

  if (!dev || !photo) {
    return (
      <div class="page">
        <Header title={t('dr.title')} onBack={() => back({ name: 'photo', id })} />
        {missing && <Empty title={t('common.notFound')} />}
      </div>
    );
  }
  const stock = getStock(dev.stockId);
  const camera = hasCamera(dev.cameraId) ? getCamera(dev.cameraId) : null;
  // Re-develop within what the camera can load (the CCD/pixel sensors are camera-specific).
  const allowed = camera ? filmsFor(camera) : STOCKS.filter((st) => !st.exclusive);
  // A frame shot before the format rules (e.g. an instant pack in an SLR) keeps showing its film.
  const films = allowed.some((st) => st.id === photo.develop.stockId) ? allowed : [getStock(photo.develop.stockId), ...allowed];
  const isPixel = stock.kind === 'pixel';
  const isDigital = stock.kind === 'digital' || isPixel;
  // Digicams re-develop with tone presets; so do bodies with one fixed film (disposables, instant
  // packs), which otherwise would have no look to change. Same presets, same renderer path.
  const fixedFilm = !isPixel && stock.kind !== 'digital' && films.length <= 1;
  const showTone = stock.kind === 'digital' || fixedFilm;
  const tones: { value: DigitalTone | 'none'; label: string }[] = [
    { value: 'none', label: t('dr.tone.none') },
    ...DIGITAL_TONES.map((v) => ({ value: v, label: t(`dr.tone.${v}` as MsgKey) })),
  ];

  return (
    <div class="darkroom" data-testid="darkroom-screen">
      {/* Header and print stay on screen while the controls scroll underneath. */}
      <div class="dr-top">
        <Header
          title={t('dr.title')}
          onBack={goBack}
          right={
            <button class="btn primary small" onClick={save} disabled={saving} data-testid="btn-dr-save">
              {t('dr.redevelop')}
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
      </div>
      <div class="dr-controls">
        {camera && (
          <p class="dr-camera muted small">
            {t('dr.camera')} · <strong>{camera.name}</strong>
          </p>
        )}
        {films.length > 1 && (
          <section>
            <h2>
              {t('dr.film')} · <span class="muted">{stockDescription(stock.id)}</span>
            </h2>
            <div class="stock-strip">
              {films.map((st) => (
                <StockCard
                  key={st.id}
                  stock={st}
                  selected={st.id === dev.stockId}
                  // The border stays as it is: only the border control changes it.
                  onClick={() => set({ stockId: st.id })}
                />
              ))}
            </div>
          </section>
        )}
        {showTone && (
          <section data-testid="dr-look">
            <h2>
              {fixedFilm ? t('dr.look') : t('dr.tone')}
              {fixedFilm && (
                <>
                  {' '}
                  · <span class="muted">{stock.name}</span>
                </>
              )}
            </h2>
            <div class="tone-seg">
              <Segmented label={fixedFilm ? t('dr.look') : t('dr.tone')} value={dev.tone ?? 'none'} onChange={(v) => set({ tone: v === 'none' ? undefined : v })} options={tones} grid />
            </div>
          </section>
        )}
        {isPixel && (
          <section>
            <h2>{t('dr.palette')}</h2>
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
              format={(v) => (v === 0 ? t('dr.normal') : t('dr.stops', { v: `${v > 0 ? '+' : '−'}${Math.abs(v)}`, n: Math.abs(v) }))}
              testId="sl-push"
            />
            <Slider label={t('dr.expired')} value={dev.expired} min={0} max={1} step={0.05} onInput={(v) => set({ expired: v })} format={(v) => { const n = Math.round(v * 30); return n ? t('view.expiredYears', { n }) : t('view.expiredNone'); }} testId="sl-expired" />
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
          {camera?.stamp !== 'none' && !photo.undated && <Toggle label={t('dr.date')} checked={dev.dateStamp} onChange={(v) => set({ dateStamp: v })} testId="tg-date" />}
        </div>
        {!isPixel && (
          <section>
            <h2>{t('dr.border')}</h2>
            <div class="border-seg">
              <Segmented label={t('dr.border')} value={dev.border} onChange={(v) => set({ border: v })} options={BORDERS.map((b) => ({ value: b, label: t(`dr.border.${b}` as const) }))} grid />
            </div>
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
          <button class="btn ghost" onClick={saveNew} disabled={saving} data-testid="btn-dr-save-new">
            {t('dr.saveNew')}
          </button>
        </div>
      </div>
    </div>
  );
}
