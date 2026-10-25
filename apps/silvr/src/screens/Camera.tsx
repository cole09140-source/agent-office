import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CameraController, classifyError, type CameraError } from '../camera/camera';
import { captureVideoFrame } from '../camera/capture';
import { captureRotation, requestOrientationPermission, startOrientation } from '../camera/orientation';
import { Icon } from '../components/Icon';
import { Canister, Segmented, Sheet, StockCard } from '../components/ui';
import { aspectRatio, cropForAspect, fitContain } from '../film/geometry';
import { GlFilmRenderer } from '../film/glRenderer';
import { defaultDevelop, resolveLook } from '../film/resolve';
import { randomSeed } from '../film/random';
import { DEFAULT_STOCK_ID, getStock, STOCKS } from '../film/stocks';
import type { Aspect, DevelopSettings } from '../film/types';
import { stockDescription, t } from '../i18n';
import { haptic, shutterSound, windSound } from '../platform/feedback';
import { activeRoll, confirm, refreshRolls, settings, toast, updateSettings } from '../state/app';
import { go } from '../state/router';
import { addShot, finishRoll, framesLeft, loadRoll, ROLL_SIZES, type DevelopSpeed } from '../store/rolls';
import { get, put } from '../store/db';

let controller: CameraController | null = null;
const cam = () => (controller ??= new CameraController());

const ASPECTS: Aspect[] = ['3:2', '4:3', '1:1'];
const TIMERS = [0, 3, 10];
const LAST_STOCK_KEY = 'lastStock';

export function CameraScreen({ onImport }: { onImport: () => void }) {
  const roll = activeRoll.value;
  const s = settings.value;
  const [pickStock, setPickStock] = useState(DEFAULT_STOCK_ID);
  const [rollSize, setRollSize] = useState(s.defaultRollSize);
  const stock = getStock(roll?.stockId ?? pickStock);
  const [state, setState] = useState<'starting' | 'live' | 'error'>('starting');
  const [error, setError] = useState<CameraError>('unknown');
  const [flash, setFlash] = useState(stock.defaultFlash);
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [aspectPick, setAspectPick] = useState<Aspect | null>(null);
  const [busy, setBusy] = useState(false);
  const [blink, setBlink] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [rollInfoOpen, setRollInfoOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [facing, setFacing] = useState(cam().facing);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });
  const [gpu, setGpu] = useState(true);
  const [glKey, setGlKey] = useState(0);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoHostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GlFilmRenderer | null>(null);
  const shootingRef = useRef(false);
  const mountedRef = useRef(true);

  const aspect: Aspect = aspectPick ?? (s.aspect !== 'auto' ? s.aspect : roll?.aspect ?? stock.defaultAspect);

  useEffect(() => {
    get<string>('kv', LAST_STOCK_KEY).then((id) => id && setPickStock(getStock(id).id)).catch(() => undefined);
  }, []);
  useEffect(() => setFlash(stock.defaultFlash), [stock.id]);
  useEffect(() => setRollSize(s.defaultRollSize), [s.defaultRollSize]);

  // ----- camera lifecycle -----
  const startCamera = async (facingMode = cam().facing) => {
    setState('starting');
    try {
      await cam().start(facingMode);
      setFacing(cam().facing);
      setVideoSize({ w: cam().width, h: cam().height });
      setState('live');
    } catch (err) {
      const name = (err as { name?: string }).name;
      setError(name === 'InsecureContext' ? 'insecure' : name === 'Unsupported' ? 'unsupported' : classifyError(err));
      setState('error');
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    startOrientation();
    void startCamera();
    const onVis = () => {
      if (document.hidden) cam().stop();
      else void startCamera();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      mountedRef.current = false;
      cam().stop();
    };
  }, []);

  // Fallback <video> when WebGL2 is unavailable.
  useEffect(() => {
    if (gpu || !videoHostRef.current) return;
    const v = cam().video;
    v.className = 'fallback-video';
    videoHostRef.current.appendChild(v);
    return () => v.remove();
  }, [gpu]);

  // ----- layout -----
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const portraitSrc = videoSize.h > videoSize.w;
  const frameRatio = portraitSrc ? 1 / aspectRatio(aspect) : aspectRatio(aspect);
  const frame = box.w && box.h ? fitContain(box.w, box.h, frameRatio) : { width: 0, height: 0 };

  // ----- preview rendering -----
  const previewDev: DevelopSettings = useMemo(() => defaultDevelop(stock, 1, { flash }), [stock.id, flash]);
  const look = useMemo(() => resolveLook(previewDev), [previewDev]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gpu) return;
    let r = rendererRef.current;
    if (!r) {
      try {
        r = GlFilmRenderer.create(canvas);
      } catch (err) {
        console.warn(err);
        r = null;
      }
      if (!r) {
        setGpu(false);
        return;
      }
      rendererRef.current = r;
    }
    let raf = 0;
    let n = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const v = cam().video;
      const rr = rendererRef.current;
      if (rr?.isLost) {
        // iOS drops GL contexts when backgrounded: rebuild on a fresh canvas.
        cancelAnimationFrame(raf);
        rendererRef.current = null;
        setGlKey((k) => k + 1);
        return;
      }
      if (!rr || v.readyState < 2 || !v.videoWidth || !frame.width) return;
      if (v.videoWidth !== videoSize.w || v.videoHeight !== videoSize.h) setVideoSize({ w: v.videoWidth, h: v.videoHeight });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = Math.round(frame.width * dpr);
      let h = Math.round(frame.height * dpr);
      const k = Math.min(1, 1600 / Math.max(w, h));
      w = Math.round(w * k);
      h = Math.round(h * k);
      try {
        rr.setLook(look);
        rr.setSource(v, v.videoWidth, v.videoHeight);
        rr.render(w, h, {
          crop: cropForAspect(v.videoWidth, v.videoHeight, aspect, zoom),
          mirror: cam().facing === 'user',
          seed: (n++ % 240) * 1.37,
        });
      } catch (err) {
        console.warn('[silvr] preview render failed', err);
        setGpu(false);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [look, aspect, zoom, frame.width, frame.height, gpu, videoSize.w, videoSize.h, glKey]);

  useEffect(
    () => () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    },
    [],
  );

  // ----- shooting -----
  const doCapture = async () => {
    const r = activeRoll.value;
    if (!r || shootingRef.current) return;
    if (framesLeft(r) <= 0) {
      setSpeedOpen(true);
      return;
    }
    shootingRef.current = true;
    setBusy(true);
    let torchOn = false;
    const aborted = () => !mountedRef.current || document.hidden;
    try {
      if (timer > 0) {
        for (let i = timer; i > 0; i--) {
          setCountdown(i);
          haptic(8);
          await new Promise((res) => setTimeout(res, 1000));
          if (aborted()) return;
        }
        setCountdown(0);
      }
      const c = cam();
      const useTorch = flash && c.facing === 'environment' && c.hasTorch;
      const useScreen = flash && !useTorch && c.facing === 'user';
      if (useTorch) {
        torchOn = true;
        await c.setTorch(true);
        await new Promise((res) => setTimeout(res, 350));
      }
      if (useScreen) {
        setScreenFlash(true);
        await new Promise((res) => setTimeout(res, 180));
      }
      if (s.sound) shutterSound();
      if (s.haptics) haptic(18);
      if (aborted()) return;
      const neg = await captureVideoFrame(c.video, aspect, zoom, c.facing === 'user' && s.mirrorFront);
      const rotate = captureRotation(c.width, c.height);
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
      setScreenFlash(false);

      const st = getStock(r.stockId);
      const seed = randomSeed();
      const dev = defaultDevelop(st, seed, {
        flash,
        dateStamp: s.dateStamp,
        leak: Math.random() < st.leakChance ? randomSeed() : null,
        rotate,
      });
      const res = await addShot(r.id, neg.blob, dev, { width: neg.width, height: neg.height });
      if (s.sound) windSound();
      if (res.finished) {
        haptic([20, 60, 20]);
        setSpeedOpen(true);
      }
    } catch (err) {
      console.error('[silvr] capture failed', err);
      const quota = (err as Error)?.name === 'QuotaExceededError';
      toast(quota ? t('err.storage') : t('common.error'));
      setScreenFlash(false);
    } finally {
      if (torchOn) void cam().setTorch(false);
      shootingRef.current = false;
      if (mountedRef.current) {
        setBusy(false);
        setCountdown(0);
        setScreenFlash(false);
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && (e.target as HTMLElement)?.tagName !== 'BUTTON' && !speedOpen) {
        e.preventDefault();
        void doCapture();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onLoad = async () => {
    // Runs inside the tap gesture: iOS motion permission (for sideways shots) and durable storage.
    void requestOrientationPermission();
    void navigator.storage?.persist?.().catch(() => undefined);
    try {
      await loadRoll(stock.id, rollSize, aspect);
      await put('kv', stock.id, LAST_STOCK_KEY);
      if (s.haptics) haptic(25);
      windSound();
    } catch (err) {
      console.error(err);
      // Most likely a roll was loaded in another tab meanwhile; show it.
      await refreshRolls();
      if (!activeRoll.value) toast(t('common.error'));
    }
  };

  const onRewind = async () => {
    const r = activeRoll.value;
    if (!r) return;
    setRollInfoOpen(false);
    if (r.shots === 0) {
      if (await confirm(t('cam.emptyRewind'), t('cam.unload'), true)) await finishRoll(r.id, 'instant');
      return;
    }
    if (r.shots < r.capacity && !(await confirm(t('cam.rewindConfirm', { n: r.shots }), t('cam.rewind')))) return;
    setSpeedOpen(true);
  };

  const onSpeed = async (speed: DevelopSpeed) => {
    const r = activeRoll.value;
    setSpeedOpen(false);
    if (!r) return;
    const done = await finishRoll(r.id, speed);
    if (!done) return;
    if (done.status === 'developed') go({ name: 'roll', id: done.id });
    else go({ name: 'lab' });
  };

  const flip = async () => {
    if (busy) return;
    if (s.haptics) haptic(8);
    await startCamera(cam().facing === 'environment' ? 'user' : 'environment');
  };

  const left = roll ? framesLeft(roll) : 0;

  return (
    <div class="camera" data-testid="camera-screen">
      <div class="cam-top">
        <button class={`chip ${flash ? 'on' : ''}`} onClick={() => setFlash(!flash)} aria-pressed={flash} aria-label={t('cam.flash')} data-testid="btn-flash">
          <Icon name={flash ? 'flash' : 'flashOff'} size={20} />
        </button>
        <button class={`chip ${timer ? 'on' : ''}`} onClick={() => setTimer(TIMERS[(TIMERS.indexOf(timer) + 1) % TIMERS.length])} aria-label={t('cam.timer')} data-testid="btn-timer">
          <Icon name="timer" size={20} />
          {timer > 0 && <span class="chip-txt">{timer}s</span>}
        </button>
        <button class="chip" onClick={() => setAspectPick(ASPECTS[(ASPECTS.indexOf(aspect) + 1) % ASPECTS.length])} aria-label={t('cam.aspect')} data-testid="btn-aspect">
          <span class="chip-txt mono">{aspect}</span>
        </button>
        <button class={`chip ${zoom > 1 ? 'on' : ''}`} onClick={() => setZoom(zoom > 1 ? 1 : 2)} aria-label={t('cam.zoom')} data-testid="btn-zoom">
          <span class="chip-txt mono">{zoom}×</span>
        </button>
        <button class={`chip ${s.dateStamp ? 'on' : ''}`} onClick={() => updateSettings({ dateStamp: !s.dateStamp })} aria-pressed={s.dateStamp} aria-label={t('cam.date')} data-testid="btn-date">
          <Icon name="calendar" size={20} />
        </button>
        <button class={`chip ${s.grid ? 'on' : ''}`} onClick={() => updateSettings({ grid: !s.grid })} aria-pressed={s.grid} aria-label={t('cam.grid')}>
          <Icon name="grid" size={20} />
        </button>
      </div>

      <div class="cam-stage" ref={stageRef}>
        <div class="viewfinder" style={{ width: `${frame.width}px`, height: `${frame.height}px` }}>
          {gpu ? <canvas key={glKey} ref={canvasRef} class="preview" data-testid="preview" /> : <div class="preview" ref={videoHostRef} />}
          {s.grid && <div class="grid-overlay" aria-hidden="true" />}
          {state === 'starting' && <div class="vf-msg">{t('cam.starting')}</div>}
          {countdown > 0 && <div class="countdown" aria-live="assertive">{countdown}</div>}
          {blink && <div class="blink" />}
          {roll && (
            <div class="counter mono" data-testid="counter" aria-label={t('cam.left', { n: left })}>
              <span>{String(roll.shots).padStart(2, '0')}</span>
              <small>/{roll.capacity}</small>
            </div>
          )}
          {s.dateStamp && <div class="vf-date mono" aria-hidden="true">DATE</div>}
        </div>
        {state === 'error' && (
          <div class="cam-error" data-testid="camera-error">
            <h2>{t('cam.noCamera.title')}</h2>
            <p>{t('cam.noCamera.body')}</p>
            <div class="btn-row">
              <button class="btn ghost" onClick={() => startCamera()}>
                {t('common.retry')}
              </button>
              <button class="btn primary" onClick={onImport}>
                {t('cam.noCamera.import')}
              </button>
            </div>
            <small class="mono">{error}</small>
          </div>
        )}
      </div>

      {roll ? (
        <div class="cam-bottom">
          <button class="roll-btn" onClick={() => setRollInfoOpen(true)} aria-label={`${stock.name} · ${t('cam.left', { n: left })}`} data-testid="roll-btn">
            <Canister stock={stock} size={30} />
            <span class="mono">{t('cam.left', { n: left })}</span>
          </button>
          <button
            class={`shutter ${busy ? 'busy' : ''}`}
            onClick={doCapture}
            disabled={state !== 'live' || busy}
            aria-label={t('cam.shutter')}
            data-testid="shutter"
          >
            <span />
          </button>
          <button class="icon-btn big" onClick={flip} aria-label={t('cam.flip')} data-testid="btn-flip" data-facing={facing}>
            <Icon name="flip" size={26} />
          </button>
        </div>
      ) : (
        <div class="load-panel" data-testid="load-panel">
          <div class="load-head">
            <strong>{t('cam.chooseFilm')}</strong>
            <span class="muted">{stockDescription(stock.id)}</span>
          </div>
          <div class="stock-strip" role="group" aria-label={t('cam.chooseFilm')}>
            {STOCKS.map((st) => (
              <StockCard key={st.id} stock={st} selected={st.id === stock.id} onClick={() => setPickStock(st.id)} />
            ))}
          </div>
          <div class="load-row">
            <Segmented
              label={t('set.rollSize')}
              value={rollSize}
              onChange={setRollSize}
              options={ROLL_SIZES.map((n) => ({ value: n, label: t('cam.exposures', { n }) }))}
            />
            <button class="btn primary" onClick={onLoad} data-testid="btn-load">
              {t('cam.load')}
            </button>
          </div>
        </div>
      )}

      {screenFlash && <div class="screen-flash" />}

      <Sheet open={rollInfoOpen} onClose={() => setRollInfoOpen(false)} title={stock.name} testId="roll-sheet">
        <p class="muted">{stockDescription(stock.id)}</p>
        <p class="mono big-num">
          {roll?.shots ?? 0} / {roll?.capacity ?? 0}
        </p>
        <button class="btn primary wide" onClick={onRewind} data-testid="btn-rewind">
          <Icon name="rewind" size={18} /> {roll && roll.shots === 0 ? t('cam.unload') : t('cam.rewind')}
        </button>
      </Sheet>

      <SpeedSheet open={speedOpen} onClose={() => setSpeedOpen(false)} onPick={onSpeed} full={!!roll && framesLeft(roll) === 0} />
    </div>
  );
}

const SPEEDS: DevelopSpeed[] = ['instant', '1h', 'morning', '3d'];

export function SpeedSheet({ open, onClose, onPick, full }: { open: boolean; onClose: () => void; onPick: (s: DevelopSpeed) => void; full: boolean }) {
  const def = settings.value.defaultSpeed;
  return (
    <Sheet open={open} onClose={onClose} title={full ? t('cam.rollFull') : t('speed.title')} testId="speed-sheet">
      {full && <p class="muted">{t('speed.title')}</p>}
      <div class="speed-list">
        {SPEEDS.map((sp) => (
          <button key={sp} class={`speed ${sp === def ? 'def' : ''}`} onClick={() => onPick(sp)} data-testid={`speed-${sp}`}>
            <strong>{t(`speed.${sp}` as const)}</strong>
            <span>{t(`speed.${sp}.d` as const)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
