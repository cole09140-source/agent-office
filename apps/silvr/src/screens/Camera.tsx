import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CameraController, classifyError, type CameraError } from '../camera/camera';
import { snapshotVideo } from '../camera/capture';
import { captureRotation, requestOrientationPermission, startOrientation } from '../camera/orientation';
import { blankLike, blobToCanvas, composeDouble, composeHalf, composeQuad, cropExposure, exposureSpec, toNegative } from '../cameras/compose';
import { capacityLabel, LoadPanel } from '../cameras/LoadPanel';
import { canLoad, DEFAULT_CAMERA_ID, getCamera, PALETTE_IDS, type CameraModel } from '../cameras/models';
import { playAdvance, playBeep, playFlashCharge, playShutter } from '../cameras/sound';
import { ViewfinderOverlay } from '../cameras/Viewfinder';
import { Icon } from '../components/Icon';
import { Canister, Sheet, Slider, Thumb, useObjectUrl } from '../components/ui';
import { aspectRatio, cropForAspect, fitContain } from '../film/geometry';
import { GlFilmRenderer } from '../film/glRenderer';
import { formatDigitalStamp } from '../film/overlays';
import { randomSeed } from '../film/random';
import { defaultDevelop, resolveLook } from '../film/resolve';
import { getStock } from '../film/stocks';
import type { Aspect, DevelopSettings, FilmStock } from '../film/types';
import { cameraDescription, t, type MsgKey } from '../i18n';
import { haptic } from '../platform/feedback';
import { activeRoll, confirm, confirmReq, refreshRolls, settings, toast, updateSettings } from '../state/app';
import { go } from '../state/router';
import { get, put } from '../store/db';
import { addShot, dropPending, finishRoll, framesLeft, getPending, getRoll, listPhotos, loadRoll, markSeen, savePending, type DevelopSpeed, type Photo, type Roll } from '../store/rolls';

let controller: CameraController | null = null;
const cam = () => (controller ??= new CameraController());

const TIMERS = [0, 3, 10];
const LAST_STOCK_KEY = 'lastStock';
const LAST_CAMERA_KEY = 'lastCamera';
const FLASH_CHARGE_MS = 2800;
const QUAD_GAP_MS = 200;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

type Charge = 'empty' | 'charging' | 'ready';

function defaultAspect(camera: CameraModel, stock: FilmStock, rollAspect?: Aspect): Aspect {
  if (rollAspect && camera.formats.includes(rollAspect)) return rollAspect;
  return camera.formats.includes(stock.defaultAspect) ? stock.defaultAspect : camera.formats[0];
}

export function CameraScreen({ onImport }: { onImport: () => void }) {
  const roll = activeRoll.value;
  const s = settings.value;
  const [pickCamera, setPickCamera] = useState(DEFAULT_CAMERA_ID);
  const [pickStock, setPickStock] = useState(getCamera(DEFAULT_CAMERA_ID).defaultStock);
  const camera = getCamera(roll ? roll.cameraId : pickCamera);
  const stock = getStock(roll?.stockId ?? (canLoad(camera, pickStock) ? pickStock : camera.defaultStock));
  // The "default roll size" setting is a 35mm film habit; packs, cards and half-frame rolls keep their own default.
  const sizeFor = (c: CameraModel) =>
    !c.instant && c.capture !== 'half' && c.capacities.includes(settings.value.defaultRollSize) ? settings.value.defaultRollSize : c.capacities[0];
  const [rollSize, setRollSize] = useState(sizeFor(camera));

  const [state, setState] = useState<'starting' | 'live' | 'error'>('starting');
  const [error, setError] = useState<CameraError>('unknown');
  const [flashOn, setFlashOn] = useState(camera.defaultFlash);
  const [charge, setCharge] = useState<Charge>('empty');
  const [dateOn, setDateOn] = useState(camera.defaultDate || s.dateStamp);
  const [ev, setEv] = useState(0);
  const [evOpen, setEvOpen] = useState(false);
  const [palette, setPalette] = useState(PALETTE_IDS[0]);
  const [timer, setTimer] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [formatPick, setFormatPick] = useState<Aspect | null>(null);
  const [busy, setBusy] = useState(false);
  const [blink, setBlink] = useState(false);
  const [ejecting, setEjecting] = useState(false);
  const [quadIndex, setQuadIndex] = useState<number | undefined>(undefined);
  const [screenFlash, setScreenFlash] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [rollInfoOpen, setRollInfoOpen] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [facing, setFacing] = useState(cam().facing);
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });
  const [gpu, setGpu] = useState(true);
  const [glKey, setGlKey] = useState(0);
  const [lastPhoto, setLastPhoto] = useState<Photo>();
  const [ghostBlob, setGhostBlob] = useState<Blob>();
  /** Screen-reader announcements (countdown, lens progress, flash state, saved frames). */
  const [announce, setAnnounce] = useState('');
  const ghostUrl = useObjectUrl(ghostBlob);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoHostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<GlFilmRenderer | null>(null);
  const shootingRef = useRef(false);
  const mountedRef = useRef(true);

  const aspect: Aspect = formatPick && camera.formats.includes(formatPick) ? formatPick : defaultAspect(camera, stock, roll?.aspect);
  const spec = exposureSpec(camera, aspect);

  // Keep the digicam LCD clock current.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (camera.stamp !== 'digital') return;
    const id = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, [camera.stamp]);

  // Restore the last camera/film the user loaded.
  useEffect(() => {
    Promise.all([get<string>('kv', LAST_CAMERA_KEY), get<string>('kv', LAST_STOCK_KEY)])
      .then(([c, st]) => {
        if (c) setPickCamera(getCamera(c).id);
        if (st) setPickStock(st);
      })
      .catch(() => undefined);
  }, []);

  // Per-camera defaults whenever the body changes.
  useEffect(() => {
    setFlashOn(camera.defaultFlash);
    setCharge('empty');
    setDateOn(camera.defaultDate || settings.value.dateStamp);
    setZoom(1);
    setFormatPick(null);
    setEv(0);
    setEvOpen(false);
    setRollSize(sizeFor(camera));
  }, [camera.id]);

  // Last shot (instant/digital review) and the pending first exposure (double exposure ghost).
  useEffect(() => {
    let alive = true;
    if (roll && camera.instant) {
      listPhotos(roll.id)
        .then((ps) => alive && setLastPhoto(ps[ps.length - 1]))
        .catch(() => undefined);
    } else setLastPhoto(undefined);
    if (roll?.pending?.kind === 'double') {
      getPending(roll.id)
        .then((b) => alive && setGhostBlob(b))
        .catch(() => undefined);
    } else setGhostBlob(undefined);
    return () => {
      alive = false;
    };
  }, [roll?.id, roll?.shots, roll?.negatives, roll?.pending?.takenAt, camera.instant]);

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

  const portraitFrame = spec.orient === 'auto' ? videoSize.h > videoSize.w : spec.orient === 'portrait';
  const frameRatio = portraitFrame ? 1 / aspectRatio(spec.aspect) : aspectRatio(spec.aspect);
  const frame = box.w && box.h ? fitContain(box.w, box.h, frameRatio) : { width: 0, height: 0 };

  // ----- preview rendering -----
  const flashLook = camera.flash === 'charge' ? flashOn && charge === 'ready' : camera.flash === 'standard' && flashOn;
  const previewDev: DevelopSettings = useMemo(
    () => defaultDevelop(stock, 1, { flash: flashLook, cameraId: camera.id, ev, palette }),
    [stock.id, camera.id, flashLook, ev, palette],
  );
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
          crop: cropForAspect(v.videoWidth, v.videoHeight, spec.aspect, zoom, spec.orient),
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
  }, [look, spec.aspect, spec.orient, zoom, frame.width, frame.height, gpu, videoSize.w, videoSize.h, glKey]);

  useEffect(
    () => () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
    },
    [],
  );

  // ----- flash charging (disposable) -----
  const chargeFlash = async () => {
    if (charge !== 'empty') return;
    setFlashOn(true);
    setCharge('charging');
    setAnnounce(t('cam.flashCharging'));
    if (s.sound) playFlashCharge(FLASH_CHARGE_MS / 1000);
    await sleep(FLASH_CHARGE_MS);
    if (!mountedRef.current) return;
    setCharge('ready');
    setAnnounce(t('cam.flashReady'));
    if (s.haptics) haptic(10);
  };

  // ----- shooting -----
  const developFor = (r: Roll, extra: Partial<DevelopSettings> = {}): DevelopSettings => {
    const st = getStock(r.stockId);
    const fired = !!extra.flash;
    return defaultDevelop(st, randomSeed(), {
      dateStamp: dateOn && camera.stamp !== 'none',
      leak: Math.random() < (camera.leakChance ?? st.leakChance) ? randomSeed() : null,
      border: camera.border ?? st.defaultBorder,
      cameraId: camera.id,
      ev,
      palette: st.kind === 'pixel' ? palette : undefined,
      ...extra,
      flash: fired,
    });
  };

  /** Turns a pending first half / first exposure into a negative on its own (rewind mid-pair). */
  const flushPending = async (r: Roll) => {
    if (!r.pending) return;
    const blob = await getPending(r.id);
    if (!blob) {
      await dropPending(r.id);
      return;
    }
    const first = await blobToCanvas(blob);
    const half = r.pending.kind === 'half';
    const neg = await toNegative(half ? composeHalf(first, blankLike(first)) : first);
    await addShot(r.id, neg.blob, developFor(r), { width: neg.width, height: neg.height }, r.pending.takenAt, half ? 0 : 1);
  };

  const afterRollFull = async (r: Roll) => {
    haptic([20, 60, 20]);
    if (camera.instant) {
      const done = await finishRoll(r.id, 'instant');
      toast(t('cam.packDone'));
      if (done) {
        await markSeen(done.id);
        go({ name: 'roll', id: done.id });
      }
    } else {
      setSpeedOpen(true);
    }
  };

  const doCapture = async () => {
    if (!activeRoll.value || shootingRef.current) return;
    void requestOrientationPermission(); // inside the tap gesture; no-op once answered
    shootingRef.current = true;
    // Fresh read: the signal lags IndexedDB, and a stale copy could miss a pending exposure.
    const r = await getRoll(activeRoll.value.id);
    if (!r || r.status !== 'loaded') {
      shootingRef.current = false;
      return;
    }
    if (framesLeft(r) <= 0 && !r.pending) {
      shootingRef.current = false;
      await afterRollFull(r);
      return;
    }
    setBusy(true);
    let torchOn = false;
    const aborted = () => !mountedRef.current || document.hidden;
    try {
      if (timer > 0) {
        for (let i = timer; i > 0; i--) {
          setCountdown(i);
          setAnnounce(String(i));
          haptic(8);
          await sleep(1000);
          if (aborted()) return;
        }
        setCountdown(0);
      }
      const c = cam();
      const fire = camera.flash === 'charge' ? flashOn && charge === 'ready' : camera.flash === 'standard' && flashOn;
      const useTorch = fire && c.facing === 'environment' && c.hasTorch;
      const useScreen = fire && !useTorch && c.facing === 'user';
      if (useTorch) {
        torchOn = true;
        await c.setTorch(true);
        await sleep(350);
      }
      if (useScreen) {
        setScreenFlash(true);
        await sleep(180);
      }
      if (aborted()) return;
      if (s.sound) playShutter(camera.sound);
      if (s.haptics) haptic(camera.capture === 'quad' ? [12, 190, 12, 190, 12, 190, 12] : 18);

      const mirror = c.facing === 'user' && s.mirrorFront;
      const expose = () => {
        const snap = snapshotVideo(c.video);
        return cropExposure(snap, snap.width, snap.height, spec, { zoom, mirror });
      };
      const takenAt = Date.now();

      // Expose according to the body's capture mechanism.
      let exposures: HTMLCanvasElement[] = [];
      if (camera.capture === 'quad') {
        for (let i = 0; i < 4; i++) {
          setQuadIndex(i);
          setAnnounce(t('cam.quadProgress', { n: i + 1 }));
          exposures.push(expose());
          if (i < 3) await sleep(QUAD_GAP_MS);
          if (aborted()) return;
        }
        setQuadIndex(undefined);
      } else {
        exposures = [expose()];
      }
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
      setScreenFlash(false);
      if (camera.flash === 'charge' && fire) setCharge('empty');
      const rotate = camera.capture === 'single' || camera.capture === 'double' ? captureRotation(c.width, c.height, c.facing === 'user' && !mirror) : 0;

      let result: Awaited<ReturnType<typeof addShot>> | null = null;
      if (camera.capture === 'half' || camera.capture === 'double') {
        if (!r.pending) {
          const first = await toNegative(exposures[0]);
          await savePending(r.id, first.blob, { kind: camera.capture, takenAt, width: first.width, height: first.height });
          if (camera.capture === 'double') toast(t('cam.double1'));
        } else {
          const blob = await getPending(r.id);
          const first = blob ? await blobToCanvas(blob) : blankLike(exposures[0]);
          const composite = camera.capture === 'half' ? composeHalf(first, exposures[0]) : composeDouble(first, exposures[0]);
          const neg = await toNegative(composite);
          result = await addShot(r.id, neg.blob, developFor(r, { flash: fire, rotate }), { width: neg.width, height: neg.height }, r.pending.takenAt, 1);
        }
      } else {
        const composite = camera.capture === 'quad' ? composeQuad(exposures) : exposures[0];
        const neg = await toNegative(composite);
        result = await addShot(r.id, neg.blob, developFor(r, { flash: fire, rotate }), { width: neg.width, height: neg.height }, takenAt, 1);
      }

      if (s.sound) playAdvance(camera.sound);
      if (result) setAnnounce(t('cam.saved', { n: result.photo.frame }));
      else if (camera.capture === 'half') setAnnounce(t('cam.halfNext'));
      if (result && camera.instant) {
        setLastPhoto(result.photo);
        if (camera.id === 'instasq') {
          setEjecting(true);
          setTimeout(() => setEjecting(false), 1300);
        } else if (s.sound && camera.sound !== 'digital') playBeep();
      }
      if (result?.finished) await afterRollFull(result.roll);
    } catch (err) {
      console.error('[silvr] capture failed', err);
      const quota = (err as Error)?.name === 'QuotaExceededError';
      toast(quota ? t('err.storage') : t('common.error'));
    } finally {
      if (torchOn) void cam().setTorch(false);
      shootingRef.current = false;
      if (mountedRef.current) {
        setBusy(false);
        setCountdown(0);
        setScreenFlash(false);
        setQuadIndex(undefined);
      }
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && tag !== 'BUTTON' && tag !== 'INPUT' && state === 'live' && !speedOpen && !rollInfoOpen && !confirmReq.value) {
        e.preventDefault();
        void doCapture();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const [loadingRoll, setLoadingRoll] = useState(false);
  const onLoad = async () => {
    if (loadingRoll) return;
    setLoadingRoll(true);
    // Runs inside the tap gesture: iOS motion permission (for sideways shots) and durable storage.
    void requestOrientationPermission();
    void navigator.storage?.persist?.().catch(() => undefined);
    try {
      const size = camera.capacities.includes(rollSize) ? rollSize : camera.capacities[0];
      await loadRoll(stock.id, size, aspect, Date.now(), camera.id);
      await Promise.all([put('kv', stock.id, LAST_STOCK_KEY), put('kv', camera.id, LAST_CAMERA_KEY)]);
      if (s.haptics) haptic(25);
      if (s.sound) playAdvance(camera.sound === 'digital' || camera.sound === 'pixel' || camera.sound === 'instant' ? 'slr' : camera.sound);
    } catch (err) {
      console.error(err);
      // Most likely a roll was loaded in another tab meanwhile; show it.
      await refreshRolls();
      if (!activeRoll.value) toast(t('common.error'));
    } finally {
      if (mountedRef.current) setLoadingRoll(false);
    }
  };

  const onRewind = async () => {
    if (shootingRef.current) return;
    const r = activeRoll.value;
    if (!r) return;
    setRollInfoOpen(false);
    const shot = (r.negatives ?? r.shots) > 0 || !!r.pending;
    if (!shot) {
      if (await confirm(t('cam.emptyRewind'), t('cam.unload'), true)) await finishRoll(r.id, 'instant');
      return;
    }
    if (r.shots < r.capacity && !(await confirm(t('cam.rewindConfirm', { n: r.shots }), t('cam.rewind')))) return;
    if (camera.instant) {
      await finishWithPending(r, 'instant');
      return;
    }
    // The pending half/exposure is only committed once a lab speed is picked (cancel keeps shooting).
    setSpeedOpen(true);
  };

  /** Commits any pending exposure, then sends the roll off. */
  const finishWithPending = async (stale: Roll, speed: DevelopSpeed) => {
    const r = (await getRoll(stale.id)) ?? stale; // the signal can lag a just-saved pending exposure
    try {
      await flushPending(r);
    } catch (err) {
      console.error('[silvr] could not keep the pending exposure', err);
      toast(t('common.error'));
    }
    const done = await finishRoll(r.id, speed);
    if (done && camera.instant) await markSeen(done.id); // its shots were already seen in the camera
    if (!done) return;
    if (done.status === 'developed') go({ name: 'roll', id: done.id });
    else go({ name: 'lab' });
  };

  const onSpeed = async (speed: DevelopSpeed) => {
    const r = activeRoll.value;
    setSpeedOpen(false);
    if (!r) return;
    await finishWithPending(r, speed);
  };

  const flip = async () => {
    if (busy || state === 'starting') return;
    if (s.haptics) haptic(8);
    await startCamera(cam().facing === 'environment' ? 'user' : 'environment');
  };

  const left = roll ? framesLeft(roll) : 0;
  const flashLabel =
    camera.flash === 'charge' ? (charge === 'ready' ? t('cam.flashReady') : charge === 'charging' ? t('cam.flashCharging') : t('cam.flashCharge')) : t('cam.flash');
  const counterText = roll ? String(roll.shots).padStart(2, '0') : '';

  return (
    <div class={`camera cam-${camera.id}`} data-testid="camera-screen" data-camera={camera.id}>
      <div class={`cam-top ${busy ? 'locked' : ''}`} inert={busy || undefined}>
        <button class="chip cam-name" onClick={() => setRollInfoOpen(true)} disabled={!roll} aria-label={`${camera.name} · ${t('cam.rollInfo')}`} data-testid="camera-chip">
          <span class="chip-txt">{camera.name}</span>
        </button>
        {camera.flash === 'standard' && (
          <button class={`chip ${flashOn ? 'on' : ''}`} onClick={() => setFlashOn(!flashOn)} aria-pressed={flashOn} aria-label={flashLabel} data-testid="btn-flash">
            <Icon name={flashOn ? 'flash' : 'flashOff'} size={20} />
          </button>
        )}
        {camera.flash === 'charge' && (
          <button
            class={`chip flash-charge charge-${charge} ${flashOn ? '' : 'off'}`}
            onClick={() => (charge === 'empty' ? chargeFlash() : charge === 'ready' ? (setFlashOn(!flashOn), undefined) : undefined)}
            aria-label={flashLabel}
            aria-pressed={charge === 'ready' && flashOn}
            data-testid="btn-flash"
            data-charge={charge}
          >
            <Icon name="flash" size={20} />
            <i class="charge-led" />
          </button>
        )}
        <button class={`chip ${timer ? 'on' : ''}`} onClick={() => setTimer(TIMERS[(TIMERS.indexOf(timer) + 1) % TIMERS.length])} aria-label={`${t('cam.timer')} ${timer ? t('cam.sec', { n: timer }) : t('common.off')}`} data-testid="btn-timer">
          <Icon name="timer" size={20} />
          {timer > 0 && <span class="chip-txt">{t('cam.sec', { n: timer })}</span>}
        </button>
        {camera.formats.length > 1 && (
          <button class="chip" onClick={() => setFormatPick(camera.formats[(camera.formats.indexOf(aspect) + 1) % camera.formats.length])} aria-label={`${t('cam.aspect')} ${aspect}`} data-testid="btn-aspect">
            <span class="chip-txt mono">{aspect}</span>
          </button>
        )}
        {camera.zoom.length > 1 && (
          <button class={`chip ${zoom > 1 ? 'on' : ''}`} onClick={() => setZoom(camera.zoom[(camera.zoom.indexOf(zoom) + 1) % camera.zoom.length])} aria-label={`${t('cam.zoom')} ${zoom}×`} data-testid="btn-zoom">
            <span class="chip-txt mono">{zoom}×</span>
          </button>
        )}
        {camera.ev && (
          <button class={`chip ${ev !== 0 || evOpen ? 'on' : ''}`} onClick={() => setEvOpen(!evOpen)} aria-expanded={evOpen} aria-label={`${t('cam.ev')} ${ev > 0 ? '+' : ''}${ev.toFixed(1)}`} data-testid="btn-ev">
            <span class="chip-txt mono">
              {ev > 0 ? '+' : ev < 0 ? '−' : '±'}
              {Math.abs(ev).toFixed(1)}
            </span>
          </button>
        )}
        {getStock(stock.id).kind === 'pixel' && (
          <button class="chip" onClick={() => setPalette(PALETTE_IDS[(PALETTE_IDS.indexOf(palette) + 1) % PALETTE_IDS.length])} aria-label={`${t('cam.palette')} ${t(`palette.${palette}` as MsgKey)}`} data-testid="btn-palette" data-palette={palette}>
            <span class="chip-txt">{t(`palette.${palette}` as MsgKey)}</span>
          </button>
        )}
        {camera.stamp !== 'none' && (
          <button class={`chip ${dateOn ? 'on' : ''}`} onClick={() => setDateOn(!dateOn)} aria-pressed={dateOn} aria-label={t('cam.date')} data-testid="btn-date">
            <Icon name="calendar" size={20} />
          </button>
        )}
        <button class={`chip ${s.grid ? 'on' : ''}`} onClick={() => updateSettings({ grid: !s.grid })} aria-pressed={s.grid} aria-label={t('cam.grid')}>
          <Icon name="grid" size={20} />
        </button>
      </div>
      {camera.ev && evOpen && (
        <div class="ev-row">
          <Slider label={t('cam.ev')} value={ev} min={-2} max={2} step={1 / 3} onInput={(v) => setEv(Math.round(v * 3) / 3)} format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} EV`} testId="sl-ev" />
        </div>
      )}

      <div class="cam-stage" ref={stageRef}>
        <div class={`viewfinder vfs-${camera.viewfinder}`} style={{ width: `${frame.width}px`, height: `${frame.height}px` }}>
          {gpu ? <canvas key={glKey} ref={canvasRef} class="preview" data-testid="preview" /> : <div class="preview" ref={videoHostRef} />}
          <ViewfinderOverlay
            camera={camera}
            state={{
              left,
              half: roll?.pending?.kind === 'half' ? 1 : 0,
              quadIndex,
              ghost: ghostUrl,
              dateText: dateOn && camera.stamp === 'digital' ? formatDigitalStamp(Date.now()) : undefined,
            }}
          />
          {s.grid && <div class="grid-overlay" aria-hidden="true" />}
          {state === 'starting' && <div class="vf-msg">{t('cam.starting')}</div>}
          {countdown > 0 && (
            <div class="countdown" aria-hidden="true">
              {countdown}
            </div>
          )}
          {blink && <div class="blink" />}
          {ejecting && <div class="eject" aria-hidden="true" />}
          {roll && camera.viewfinder !== 'lcd' && camera.viewfinder !== 'pixel' && (
            <div class="counter mono" data-testid="counter" aria-label={t('cam.left', { n: left })}>
              <span>{counterText}</span>
              <small>/{roll.capacity}</small>
            </div>
          )}
          {roll && (camera.viewfinder === 'lcd' || camera.viewfinder === 'pixel') && (
            <span class="sr-only" data-testid="counter">
              {String(roll.shots).padStart(2, '0')}/{roll.capacity}
            </span>
          )}
          {dateOn && camera.stamp === 'led' && <div class="vf-date mono" aria-hidden="true">DATE</div>}
        </div>
        {state === 'error' && (
          <div class="cam-error" data-testid="camera-error">
            <h2>{t('cam.noCamera.title')}</h2>
            <p>{error === 'insecure' ? t('cam.err.insecure') : error === 'unsupported' ? t('cam.err.unsupported') : t('cam.noCamera.body')}</p>
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
          {camera.instant && lastPhoto ? (
            <div class={`last-shot ${camera.id === 'instasq' ? 'instant' : ''}`} data-testid="last-shot">
              <Thumb photo={lastPhoto} onClick={() => go({ name: 'photo', id: lastPhoto.id })} label={t('cam.lastShot')} />
            </div>
          ) : (
            <button class="roll-btn" onClick={() => setRollInfoOpen(true)} disabled={busy} aria-label={`${stock.name} · ${t('cam.left', { n: left })}`} data-testid="roll-btn">
              <Canister stock={stock} size={30} />
              <span class="mono">{t('cam.left', { n: left })}</span>
            </button>
          )}
          <button class={`shutter ${busy ? 'busy' : ''}`} onClick={doCapture} disabled={state !== 'live' || busy} aria-label={t('cam.shutter')} data-testid="shutter">
            <span />
          </button>
          <div class="cam-right">
            {camera.instant && lastPhoto && (
              <button class="icon-btn" onClick={() => setRollInfoOpen(true)} aria-label={`${stock.name} · ${t('cam.left', { n: left })}`} data-testid="roll-btn">
                <Canister stock={stock} size={22} />
              </button>
            )}
            <button class="icon-btn big" onClick={flip} disabled={busy || state === 'starting'} aria-label={t('cam.flip')} data-testid="btn-flip" data-facing={facing}>
              <Icon name="flip" size={26} />
            </button>
          </div>
        </div>
      ) : (
        <LoadPanel
          cameraId={camera.id}
          stockId={stock.id}
          size={camera.capacities.includes(rollSize) ? rollSize : camera.capacities[0]}
          onCamera={(id) => {
            // Each body comes with its signature film; the user can still change it.
            setPickCamera(id);
            setPickStock(getCamera(id).defaultStock);
          }}
          onStock={setPickStock}
          onSize={setRollSize}
          onLoad={onLoad}
          loading={loadingRoll}
        />
      )}

      {roll && camera.capture === 'quad' && !busy && <p class="cam-hint">{t('cam.quadHint')}</p>}
      {roll?.pending?.kind === 'half' && <p class="cam-hint">{t('cam.halfNext')}</p>}
      {screenFlash && <div class="screen-flash" />}
      <div class="sr-only" aria-live="polite" data-testid="announcer">
        {announce}
      </div>

      <Sheet open={rollInfoOpen} onClose={() => setRollInfoOpen(false)} title={`${camera.name} · ${stock.name}`} testId="roll-sheet">
        <p class="muted">{cameraDescription(camera.id)}</p>
        <p class="mono big-num">
          {roll?.shots ?? 0} / {roll?.capacity ?? 0}
        </p>
        {roll && <p class="muted small">{capacityLabel(camera, roll.capacity)}</p>}
        <button class="btn primary wide" onClick={onRewind} data-testid="btn-rewind">
          <Icon name="rewind" size={18} /> {roll && (roll.negatives ?? roll.shots) === 0 && !roll.pending ? t('cam.unload') : t('cam.rewind')}
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
            <strong>
              {t(`speed.${sp}` as const)}
              {sp === def && <small class="speed-def"> · {t('speed.default')}</small>}
            </strong>
            <span>{t(`speed.${sp}.d` as const)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
