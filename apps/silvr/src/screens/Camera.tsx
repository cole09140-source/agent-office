import { signal } from '@preact/signals';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CameraController, classifyError, type CameraError } from '../camera/camera';
import { snapshotVideo } from '../camera/capture';
import { captureRotation, requestOrientationPermission, startOrientation } from '../camera/orientation';
import { blankLike, blobToCanvas, composeDouble, composeHalf, composeQuad, cropExposure, exposureSpec, previewBlob, toNegative } from '../cameras/compose';
import { CameraRail } from '../cameras/CameraRail';
import { canLoad, DEFAULT_CAMERA_ID, ejectsPrints, filmsFor, getCamera, PALETTE_IDS, type CameraModel } from '../cameras/models';
import { playAdvance, playBeep, playFlashCharge, playShutter, unlockAudio } from '../cameras/sound';
import { ViewfinderOverlay } from '../cameras/Viewfinder';
import { BackDecor, BackWindow } from '../cameras/backs/Back';
import { backFor, backVars } from '../cameras/backs/spec';
import { Icon } from '../components/Icon';
import { ShotsLeftBadge } from '../components/ShotsLeftBadge';
import { Canister, formatSigned, Sheet, sheetOpen, Slider, StockStrip, Thumb, useObjectUrl } from '../components/ui';
import { aspectRatio, cropForAspect, fitContain } from '../film/geometry';
import { GlFilmRenderer } from '../film/glRenderer';
import { formatDigitalStamp } from '../film/overlays';
import { randomSeed } from '../film/random';
import { defaultBorderFor, defaultDevelop, resolveLook } from '../film/resolve';
import { getStock } from '../film/stocks';
import type { Aspect, DevelopSettings, FilmStock } from '../film/types';
import { cameraDescription, isolate, ltr, stockDescription, t, type MsgKey } from '../i18n';
import { haptic } from '../platform/feedback';
import { activeRoll, confirmReq, ready, refreshRolls, setCameraPinned, settings, storageError, toast, updateSettings } from '../state/app';
import { holdCapture } from '../platform/pwa';
import { consumeShot, refundShot } from '../monetize/quota';
import { go, goTab } from '../state/router';
import { get, put } from '../store/db';
import { addShot, dropPending, finishRoll, framesLeft, getPending, getRoll, listPhotos, loadRoll, markSeen, OPEN_CAPACITY, savePending, type Photo, type Roll } from '../store/rolls';

let controller: CameraController | null = null;
const cam = () => (controller ??= new CameraController());

const TIMERS = [0, 3, 10];
const LAST_STOCK_KEY = 'lastStock';
const LAST_CAMERA_KEY = 'lastCamera';
const FLASH_CHARGE_MS = 2800;
const QUAD_GAP_MS = 200;
/** Shutter presses remembered while a capture is still being saved (fired in order afterwards): 4 quick taps → 4 frames. */
const MAX_QUEUE = 3;
/** The instant print hangs over the viewfinder this long before it drops into the thumbnail. */
const EJECT_MS = 2600;

const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

type Charge = 'empty' | 'charging' | 'ready';

/**
 * Store errors that mean another tab (or window) on the same roll got there first: its press took the
 * pending exposure, used it up, or filled / finished the roll. Not a bug: re-read the roll and carry on.
 */
const ROLL_RACE = ['An exposure is already pending', 'Pending exposure already used', 'Roll is full', 'Roll is not loaded'];
const isRollRace = (err: unknown): boolean => ROLL_RACE.includes(String((err as Error)?.message));

/** Set by the Models tab: the camera to shoot with next (taken when the camera screen shows). */
export const cameraRequest = signal<string | null>(null);

function defaultAspect(camera: CameraModel, stock: FilmStock, rollAspect?: Aspect): Aspect {
  if (rollAspect && camera.formats.includes(rollAspect)) return rollAspect;
  return camera.formats.includes(stock.defaultAspect) ? stock.defaultAspect : camera.formats[0];
}

/** Something was shot on this roll (a pending first half / first exposure counts). */
export const hasShots = (r: Roll): boolean => r.shots > 0 || (r.negatives ?? 0) > 0 || !!r.pending;

/**
 * Shots on the roll in words, matching what the album will show:
 * "5장", or for half-frame "5컷(3프레임)" since two halves share one frame.
 */
export function shotsText(r: Roll): string {
  const camera = getCamera(r.cameraId);
  if (camera.capture === 'half') {
    const frames = (r.negatives ?? 0) + (r.pending ? 1 : 0);
    return t('cam.nHalves', { n: r.shots, f: frames });
  }
  return t('cam.nShots', { n: shotCount(r) });
}

/**
 * The number behind shotsText, passed to messages as `n` next to `{shots}` so languages that agree
 * the sentence with the count (ru, ar, fr…) can choose a plural form (ko.ts pluralCounts).
 */
export function shotCount(r: Roll): number {
  if (getCamera(r.cameraId).capture === 'half') return r.shots;
  // A pending first exposure (double) becomes a frame of its own when the roll is finished.
  return r.shots + (r.pending?.kind === 'double' ? 1 : 0);
}

export function CameraScreen({ onImport }: { onImport: () => void }) {
  const roll = activeRoll.value;
  const s = settings.value;
  const [pickCamera, setPickCamera] = useState(DEFAULT_CAMERA_ID);
  const [pickStock, setPickStock] = useState(getCamera(DEFAULT_CAMERA_ID).defaultStock);
  const camera = getCamera(roll ? roll.cameraId : pickCamera);
  const stock = getStock(roll?.stockId ?? (canLoad(camera, pickStock) ? pickStock : camera.defaultStock));

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
  /** Set by a second shutter press or Escape while the self-timer runs. */
  const timerCancel = useRef(false);
  /** Wakes the self-timer wait at once when it is cancelled (instead of at its next tick). */
  const timerWake = useRef<(() => void) | null>(null);
  const [zoom, setZoom] = useState(1);
  const [formatPick, setFormatPick] = useState<Aspect | null>(null);
  const [busy, setBusy] = useState(false);
  const [blink, setBlink] = useState(false);
  const [quadIndex, setQuadIndex] = useState<number | undefined>(undefined);
  const [screenFlash, setScreenFlash] = useState(false);
  /** The camera sheet: film choice, pin, the way to this camera's photos. */
  const [filmOpen, setFilmOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  /** A camera change is closing the current roll: no second change (or auto-load) meanwhile. */
  const switchingRef = useRef(false);
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
  /** Presses waiting for the current capture to finish (shown as "+n" on the shutter). */
  const queueRef = useRef(0);
  const [queued, setQueued] = useState(0);
  /** A press made while the camera was still starting: taken once the stream is live. */
  const startPressRef = useRef(false);
  /** A press made while cameras were being changed (no roll for a moment): taken as soon as the new one is in. */
  const rollPressRef = useRef(false);
  /** Presses the roll can still take, read when the current capture started. */
  const pressesLeftRef = useRef(0);
  /** Presses lost because the app went to the background: said once when it comes back. */
  const droppedRef = useRef(0);
  const shutterRef = useRef<HTMLButtonElement>(null);
  /** A small upright copy of the last saved exposure: shown until the developed thumbnail is ready. */
  const [quick, setQuick] = useState<{ url: string; id: string }>();
  const quickRef = useRef<string>();
  /** The instant print sliding out over the viewfinder. */
  const [eject, setEject] = useState<{ url: string; key: number } | null>(null);

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

  // Restore the last camera/film the user shot with (before the first roll goes in by itself).
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    Promise.all([get<string>('kv', LAST_CAMERA_KEY), get<string>('kv', LAST_STOCK_KEY)])
      .then(([c, st]) => {
        // A roll already in the camera wins: the strip shows the camera that is really loaded.
        const r = activeRoll.value;
        if (r) {
          setPickCamera(getCamera(r.cameraId).id);
          setPickStock(r.stockId);
          return;
        }
        if (c) setPickCamera(getCamera(c).id);
        if (st) setPickStock(st);
      })
      .catch(() => undefined)
      .finally(() => setRestored(true));
  }, []);

  /** The camera + film the user asked for and does not have yet: wins over whatever roll is in. */
  const wanted = useRef<{ camera: string; stock: string } | null>(null);

  // The "more" popover (date imprint, grid) closes on an outside tap or Escape.
  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!moreRef.current?.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  // Per-camera defaults whenever the body changes.
  useEffect(() => {
    setFlashOn(camera.defaultFlash);
    setCharge('empty');
    setDateOn(camera.defaultDate || settings.value.dateStamp);
    setZoom(1);
    setFormatPick(null);
    setEv(0);
    setEvOpen(false);
  }, [camera.id]);

  // Last shot (instant/digital review) and the pending first exposure (double exposure ghost).
  useEffect(() => {
    let alive = true;
    if (roll) {
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
  }, [roll?.id, roll?.shots, roll?.negatives, roll?.pending?.takenAt]);

  // ----- camera lifecycle -----
  const startCamera = async (facingMode = cam().facing) => {
    setState('starting');
    try {
      if (!(await cam().start(facingMode))) return; // superseded by a newer start/stop
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
      if (document.hidden) {
        // A press made while starting must not fire minutes later when the app comes back.
        if (startPressRef.current || rollPressRef.current) droppedRef.current += 1;
        startPressRef.current = false;
        rollPressRef.current = false;
        setQueued(0);
        cam().stop();
      } else {
        // Presses that were waiting when the app went away were not taken: say so once.
        const n = droppedRef.current;
        droppedRef.current = 0;
        if (n > 0) toast(t('cam.pressesDropped', { n }), undefined, 5000, undefined, { group: 'pressesDropped' });
        void startCamera();
      }
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
    return () => {
      v.remove();
      v.style.transform = '';
    };
  }, [gpu]);
  // Match the GPU preview: zoom crops the centre, the front camera is shown mirrored.
  useEffect(() => {
    if (gpu) return;
    cam().video.style.transform = `scale(${zoom})${facing === 'user' ? ' scaleX(-1)' : ''}`;
  }, [gpu, zoom, facing]);

  // ----- layout -----
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    // Content box: the stage's padding is the room the body's window bezel takes around the preview.
    const ro = new ResizeObserver(([e]) => setBox({ w: Math.floor(e.contentRect.width), h: Math.floor(e.contentRect.height) }));
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
      border: defaultBorderFor(camera, st), // never 35mm sprockets on 120 / instant / sensor bodies
      cameraId: camera.id,
      ev,
      palette: st.kind === 'pixel' ? palette : undefined,
      ...extra,
      flash: fired,
    });
  };

  /**
   * The pending first half / first exposure as a canvas; null when it is gone or can no longer
   * be decoded (a damaged backup, a failed blob read). An undecodable one must not lock the roll.
   */
  const loadPending = async (id: string): Promise<HTMLCanvasElement | null> => {
    const blob = await getPending(id);
    if (!blob) return null;
    try {
      return await blobToCanvas(blob);
    } catch (err) {
      console.error('[silvr] pending exposure is unreadable', err);
      return null;
    }
  };

  /** Turns a pending first half / first exposure into a negative on its own (rewind mid-pair). */
  const flushPending = async (r: Roll) => {
    if (!r.pending) return;
    const first = await loadPending(r.id);
    if (!first) {
      await dropPending(r.id);
      return;
    }
    const half = r.pending.kind === 'half';
    const neg = await toNegative(half ? composeHalf(first, blankLike(first)) : first);
    const pd = r.pending;
    const rotate = Number.isInteger(pd.rotate) ? (pd.rotate as number) & 3 : 0;
    await addShot(r.id, neg.blob, developFor(r, { rotate, flash: pd.flash === true }), { width: neg.width, height: neg.height }, pd.takenAt, half ? 0 : 1, pd.takenAt);
  };

  const storageToast = (err: unknown) => toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'), undefined, 6000);

  /**
   * Closes the roll in the camera without a word: its photos are already in the album, so this only
   * ends the album group (a camera change, a full roll). A pending half / first exposure becomes a
   * frame of its own first. False if it could not be saved (the roll then stays in the camera).
   */
  const closeRoll = async (stale: Roll): Promise<boolean> => {
    // Lock the shutter while the pending exposure is committed, or a shot could pair with it twice.
    shootingRef.current = true;
    pressesLeftRef.current = 0;
    setBusy(true);
    const release = holdCapture();
    try {
      // Read it fresh: the signal can lag a just-saved pending exposure, or an empty roll already removed.
      const r = await getRoll(stale.id);
      if (!r || r.status !== 'loaded') return true;
      try {
        await flushPending(r);
      } catch (err) {
        // finishRoll would drop the pending blob: keep the roll loaded instead of losing that frame.
        console.error('[silvr] could not keep the pending exposure', err);
        storageToast(err);
        return false;
      }
      closedHere.current = true; // the next roll goes in straight away (see the load effect)
      const done = await finishRoll(r.id, 'instant');
      if (done) await markSeen(done.id); // its shots were already seen in the camera
      return true;
    } catch (err) {
      console.error('[silvr] could not close the roll', err);
      storageToast(err);
      return false;
    } finally {
      release();
      shootingRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
  };

  /** A roll this long is closed and a fresh one starts on the same camera (only the album notices). */
  const afterRollFull = async (r: Roll) => {
    await closeRoll(r);
  };

  /** Shutter feedback: a press dip for every accepted press, a small shake for one that is ignored. */
  const pulse = (kind: 'press' | 'nudge') => {
    const el = shutterRef.current;
    if (!el || typeof el.animate !== 'function') return;
    if (kind === 'press') {
      el.querySelector('span')?.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.78)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
    } else if (reduceMotion()) {
      el.animate([{ opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }], { duration: 300 });
    } else {
      el.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }],
        { duration: 300, easing: 'ease-out' },
      );
    }
  };

  const setQueue = (n: number) => {
    queueRef.current = n;
    setQueued(n);
  };

  /** Stops the countdown at once (shutter, timer chip, viewfinder tap or Escape). */
  const cancelTimer = () => {
    if (countdown > 0) {
      timerCancel.current = true;
      timerWake.current?.();
    }
  };

  /** The shutter button / Space / Enter. Presses during a capture queue up instead of being dropped. */
  /** The first shutter press asked for what needs a user gesture. */
  const gestureDone = useRef(false);
  const onShutter = () => {
    if (countdown > 0) {
      cancelTimer();
      pulse('press');
      return;
    }
    if (state === 'error') return;
    if (s.sound) unlockAudio();
    if (!activeRoll.value || switchingRef.current) {
      // Between two cameras: remember the press, take it with the new camera.
      if (rollPressRef.current) {
        pulse('nudge');
        return;
      }
      rollPressRef.current = true;
      setQueued(1);
      pulse('press');
      if (s.haptics) haptic(6);
      return;
    }
    if (!gestureDone.current) {
      // Inside the first tap: iOS motion permission (for sideways shots) and durable storage.
      gestureDone.current = true;
      void requestOrientationPermission();
      void navigator.storage?.persist?.().catch(() => undefined);
    }
    if (state === 'starting') {
      // Remembered and taken as soon as the stream is live.
      if (startPressRef.current) {
        pulse('nudge');
        return;
      }
      startPressRef.current = true;
      setQueued(1);
      pulse('press');
      setAnnounce(t('cam.startingQueued'));
      return;
    }
    if (shootingRef.current) {
      const room = pressesLeftRef.current - 1 - queueRef.current;
      // With a self-timer, every photo gets its own countdown: no queueing behind it.
      if (timer === 0 && queueRef.current < MAX_QUEUE && room > 0) {
        setQueue(queueRef.current + 1);
        pulse('press');
        if (s.haptics) haptic(6);
      } else {
        pulse('nudge');
        if (s.haptics) haptic([6, 40, 6]);
        setAnnounce(room <= 0 && pressesLeftRef.current > 0 ? t('cam.pressFull') : t('cam.pressBusy'));
      }
      return;
    }
    pulse('press');
    void doCapture();
  };

  const doCapture = async (fromQueue = false) => {
    if (!activeRoll.value || shootingRef.current) return;
    void requestOrientationPermission(); // inside the tap gesture; no-op once answered
    if (s.sound) unlockAudio();
    shootingRef.current = true;
    /** Whether queued presses may follow this one. */
    let drain = true;
    let r: Roll | undefined;
    // Fresh read: the signal lags IndexedDB, and a stale copy could miss a pending exposure.
    try {
      r = await getRoll(activeRoll.value.id);
    } catch (err) {
      // A failed read must not leave the shutter locked for good.
      console.error('[silvr] could not read the roll', err);
      shootingRef.current = false;
      setQueue(0);
      if (mountedRef.current) setBusy(false);
      toast(t('common.error'));
      return;
    }
    if (!r || r.status !== 'loaded') {
      // The screen's roll is stale (just unloaded, another tab, evicted storage): show what is really loaded.
      shootingRef.current = false;
      setQueue(0);
      if (mountedRef.current) setBusy(false);
      void refreshRolls().catch(() => undefined);
      return;
    }
    if (framesLeft(r) <= 0 && !r.pending) {
      shootingRef.current = false;
      setQueue(0);
      if (mountedRef.current) setBusy(false);
      // A queued press after the last frame: the full roll was already handled.
      if (!fromQueue) await afterRollFull(r);
      return;
    }
    // Daily shot quota: every accepted shutter press costs one shot (half-frame / double exposure:
    // each press; quad: one press). Taken before the timer so a refused press says so at once;
    // given back below unless the exposure is actually saved. Imports never come through here.
    if (!(await consumeShot())) {
      shootingRef.current = false;
      setQueue(0);
      if (mountedRef.current) setBusy(false);
      // The paywall sheet (App, on the engine's 'fc:quota-exhausted' event) explains and offers more shots.
      return;
    }
    /** The press produced a saved exposure: its shot stays spent. */
    let kept = false;
    const left = framesLeft(r);
    // A double exposure takes two presses per frame; half-frame and the rest one.
    pressesLeftRef.current = camera.capture === 'double' ? left * 2 - (r.pending ? 1 : 0) : left;
    setBusy(true);
    const release = holdCapture(); // an update reload waits until the shot is saved
    let torchOn = false;
    /** This press itself was lost to the app going to the background. */
    let hiddenAbort = false;
    const aborted = () => {
      if (document.hidden) hiddenAbort = true;
      return !mountedRef.current || document.hidden;
    };
    try {
      if (timer > 0) {
        timerCancel.current = false;
        // One announcement, not one per second.
        setAnnounce(t('cam.timerSay', { n: timer }));
        // Counted against a wall-clock deadline, not by adding up sleeps: timers fire late under load
        // (100 ms ticks ran ~1.6x slow), but the shutter still goes off `timer` seconds after the press.
        const deadline = performance.now() + timer * 1000;
        let shown = 0;
        for (;;) {
          const remaining = deadline - performance.now();
          if (remaining <= 0) break;
          const n = Math.ceil(remaining / 1000);
          if (n !== shown) {
            shown = n;
            setCountdown(n);
            haptic(8);
          }
          // Sleep to the next whole second (re-checking at least every 250 ms for backgrounding);
          // a cancel wakes the wait at once.
          const wait = Math.min(250, remaining - (n - 1) * 1000);
          await new Promise<void>((res) => {
            const id = setTimeout(done, wait);
            function done() {
              clearTimeout(id);
              timerWake.current = null;
              res();
            }
            timerWake.current = done;
          });
          if (aborted()) {
            drain = false;
            return;
          }
          if (timerCancel.current) {
            timerCancel.current = false;
            drain = false;
            // The toast region is a live region: announcing it here too would say it twice.
            toast(t('cam.timerCancelled'), undefined, 1800);
            return;
          }
        }
        setCountdown(0);
      }
      const c = cam();
      // Just after start / flip the stream can be live before its first frame: wait for it briefly.
      for (let k = 0; k < 30 && (!c.video.videoWidth || c.video.readyState < 2); k++) await sleep(100);
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
      if (aborted()) {
        drain = false;
        return;
      }
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
          if (aborted()) {
            drain = false;
            return;
          }
        }
        setQuadIndex(undefined);
      } else {
        exposures = [expose()];
      }
      setBlink(true);
      setTimeout(() => setBlink(false), 220);
      setScreenFlash(false);
      if (camera.flash === 'charge' && fire) setCharge('empty');
      // Turning the whole sheet works for half/quad too: each cell turns upright with it.
      const rotate = captureRotation(c.width, c.height, c.facing === 'user' && !mirror);

      let result: Awaited<ReturnType<typeof addShot>> | null = null;
      /** Instant / digital bodies show the shot in the camera: a quick copy while the real print develops. */
      let quickBlob: Promise<Blob | null> | null = null;
      if (camera.capture === 'half' || camera.capture === 'double') {
        // Another tab on this roll can take or use up the pending exposure in between: re-read the
        // roll once and go on (this press becomes the second exposure if a first one is waiting now).
        let rr: Roll = r;
        for (let attempt = 0; ; attempt++) {
          try {
            if (!rr.pending) {
              const first = await toNegative(exposures[0]);
              await savePending(rr.id, first.blob, { kind: camera.capture, takenAt, width: first.width, height: first.height, rotate, flash: fire });
              if (camera.capture === 'double') setAnnounce(t('cam.double1'));
            } else {
              const pd = rr.pending;
              const first = (await loadPending(rr.id)) ?? blankLike(exposures[0]);
              const composite = camera.capture === 'half' ? composeHalf(first, exposures[0]) : composeDouble(first, exposures[0]);
              quickBlob = previewBlob(composite, rotate).catch(() => null);
              const neg = await toNegative(composite);
              result = await addShot(rr.id, neg.blob, developFor(rr, { flash: fire, rotate }), { width: neg.width, height: neg.height }, pd.takenAt, 1, pd.takenAt);
            }
            break;
          } catch (err) {
            if (attempt > 0 || !isRollRace(err)) throw err;
            const fresh = await getRoll(rr.id);
            if (!fresh || fresh.status !== 'loaded' || (!fresh.pending && framesLeft(fresh) <= 0)) throw err;
            console.warn('[silvr] the roll changed in another window; trying again', err);
            rr = fresh;
          }
        }
      } else {
        const composite = camera.capture === 'quad' ? composeQuad(exposures) : exposures[0];
        quickBlob = previewBlob(composite, rotate).catch(() => null);
        const neg = await toNegative(composite);
        result = await addShot(r.id, neg.blob, developFor(r, { flash: fire, rotate }), { width: neg.width, height: neg.height }, takenAt, 1);
      }

      // Everything below runs only once the frame is committed to IndexedDB (addShot resolves on
      // transaction complete): the thumbnail / eject never shows a photo that is not saved yet.
      kept = true;
      if (s.sound) playAdvance(camera.sound);
      if (result) setAnnounce(t('cam.saved', { n: result.photo.frame }));
      else if (camera.capture === 'half') setAnnounce(t('cam.halfNext'));
      if (result) {
        const blob = quickBlob ? await quickBlob : null;
        if (mountedRef.current) {
          const url = blob ? URL.createObjectURL(blob) : undefined;
          if (quickRef.current) URL.revokeObjectURL(quickRef.current);
          quickRef.current = url;
          setQuick(url ? { url, id: result.photo.id } : undefined);
          setLastPhoto(result.photo);
          if (ejectsPrints(camera)) {
            if (url && !reduceMotion()) setEject({ url, key: Date.now() });
          } else if (camera.instant && s.sound && camera.sound !== 'digital' && camera.sound !== 'phone') playBeep();
        }
      }
      if (result?.finished) {
        drain = false;
        await afterRollFull(result.roll);
      }
    } catch (err) {
      drain = false;
      if (isRollRace(err)) {
        // Another window took this frame first: not an error, just show the roll as it is now.
        console.warn('[silvr] shot taken in another window', err);
        toast(t('cam.otherWindow'), undefined, 4000, undefined, { group: 'otherWindow' });
        void refreshRolls().catch(() => undefined);
      } else {
        console.error('[silvr] capture failed', err);
        const quota = (err as Error)?.name === 'QuotaExceededError';
        toast(quota ? t('err.storage') : t('common.error'));
      }
    } finally {
      if (!kept) void refundShot(); // cancelled timer, backgrounded, another window, save failed
      if (torchOn) void cam().setTorch(false);
      release();
      shootingRef.current = false;
      const next = drain && queueRef.current > 0 && mountedRef.current && !document.hidden;
      if (next) {
        // The shutter stays "busy" (roll pill and toolbar locked) straight into the queued press.
        setQueue(queueRef.current - 1);
        // Bridge the gap so a waiting update reload cannot slip in between queued shots.
        const bridge = holdCapture();
        setTimeout(() => void captureRef.current(true).finally(bridge), 0);
      } else {
        // Backgrounded: this press (if cut short) and the waiting ones are gone. Said on return.
        if (document.hidden && mountedRef.current) droppedRef.current += queueRef.current + (hiddenAbort ? 1 : 0);
        setQueue(0);
        if (mountedRef.current) {
          setBusy(false);
          setCountdown(0);
          setScreenFlash(false);
          setQuadIndex(undefined);
        }
      }
    }
  };
  /** Always the latest render's capture: a queued press must see the current flash charge, timer and zoom. */
  const captureRef = useRef(doCapture);
  captureRef.current = doCapture;

  // A press made while the camera was starting is taken once the preview is live.
  useEffect(() => {
    if (state === 'starting' || !startPressRef.current) return;
    startPressRef.current = false;
    setQueued(0);
    if (state === 'live' && activeRoll.value && !shootingRef.current) void captureRef.current();
  }, [state]);

  // A press made between two cameras is taken once the wanted camera's roll is in and the stream is live.
  useEffect(() => {
    if (!rollPressRef.current || !roll || state !== 'live' || busy || switchingRef.current || shootingRef.current) return;
    const w = wanted.current;
    if (w && (roll.cameraId !== w.camera || roll.stockId !== w.stock)) return; // not the picked camera yet
    rollPressRef.current = false;
    setQueued(0);
    void captureRef.current();
  }, [roll?.id, state, busy]);

  // Quick previews are object URLs: free the last one when the screen goes away.
  useEffect(
    () => () => {
      if (quickRef.current) URL.revokeObjectURL(quickRef.current);
    },
    [],
  );

  // The instant print slides out over the lower viewfinder, hangs there, then drops into the thumbnail.
  useEffect(() => {
    if (!eject) return;
    const print = document.querySelector<HTMLElement>('.eject-print');
    const vf = stageRef.current?.querySelector<HTMLElement>('.viewfinder');
    const thumb = document.querySelector<HTMLElement>('[data-testid=last-shot] .thumb');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (mountedRef.current) setEject((e) => (e?.key === eject.key ? null : e));
    };
    if (!print || !vf || typeof print.animate !== 'function') {
      const id = setTimeout(finish, 300);
      return () => clearTimeout(id);
    }
    const v = vf.getBoundingClientRect();
    const p = print.getBoundingClientRect();
    // Hold position: centred, its bottom just above the viewfinder's bottom edge.
    const holdX = v.left + (v.width - p.width) / 2;
    const holdY = v.bottom - p.height - 12;
    print.style.left = `${holdX}px`;
    print.style.top = `${holdY}px`;
    const rise = p.height + 12; // starts hidden below the viewfinder's bottom edge, like out of a slot
    const tr = thumb?.getBoundingClientRect();
    const k = tr && tr.width ? tr.width / p.width : 0.25;
    const dx = tr ? tr.left - holdX : -holdX;
    const dy = tr ? tr.top - holdY : rise;
    const anim = print.animate(
      [
        { offset: 0, transform: `translate(0px, ${rise}px) scale(1)`, clipPath: `inset(0px 0px ${rise}px 0px)`, opacity: 1, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' },
        { offset: 0.2, transform: 'translate(0px, 0px) scale(1)', clipPath: 'inset(0px 0px 0px 0px)', opacity: 1, easing: 'linear' },
        { offset: 0.78, transform: 'translate(0px, 0px) scale(1)', clipPath: 'inset(0px 0px 0px 0px)', opacity: 1, easing: 'cubic-bezier(0.5, 0, 0.3, 1)' },
        { offset: 1, transform: `translate(${dx}px, ${dy}px) scale(${k})`, clipPath: 'inset(0px 0px 0px 0px)', opacity: 0.7 },
      ],
      { duration: EJECT_MS, fill: 'forwards' },
    );
    anim.onfinish = finish;
    anim.oncancel = finish;
    return () => anim.cancel();
  }, [eject?.key]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === 'Escape' && countdown > 0) {
        cancelTimer();
        return;
      }
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'TEXTAREA' && !e.defaultPrevented && state !== 'error' && !filmOpen && !sheetOpen() && !confirmReq.value) {
        e.preventDefault();
        onShutter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const [loadingRoll, setLoadingRoll] = useState(false);
  /** loadingRoll, current even inside an older render's callback. */
  const loadingRef = useRef(false);
  /** The camera is always ready: a roll goes in by itself for the picked camera and film. */
  const onLoad = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingRoll(true);
    try {
      await loadRoll(stock.id, OPEN_CAPACITY, aspect, Date.now(), camera.id);
      await Promise.all([put('kv', stock.id, LAST_STOCK_KEY), put('kv', camera.id, LAST_CAMERA_KEY)]);
      loadFailed.current = '';
      closedHere.current = false;
      setLoadError(false);
    } catch (err) {
      // Another tab put a roll in first: not a failure (the pick, if different, replaces it next).
      const raced = String((err as Error)?.message) === 'A roll is already loaded';
      if (raced) loadFailed.current = '';
      else console.error(err);
      try {
        await refreshRolls();
      } catch {
        storageError.value = true;
      }
      if (!activeRoll.value && !raced && mountedRef.current) setLoadError(true);
      if (!activeRoll.value) {
        const quota = (err as Error)?.name === 'QuotaExceededError';
        toast(quota ? t('err.storage') : storageError.value ? t('err.noStorage') : t('common.error'), undefined, 6000);
      }
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoadingRoll(false);
    }
  };
  /** The camera + film whose automatic load failed: not retried until something else is picked. */
  const loadFailed = useRef('');
  /** The automatic load failed (storage): the camera shows a retry button instead of an empty bottom bar. */
  const [loadError, setLoadError] = useState(false);
  /** Bumped when a camera change finishes, so the load below runs again (it skips while switching). */
  const [switched, setSwitched] = useState(0);
  /** This screen has seen a roll in the camera, and whether this screen took the last one out. */
  const hadRoll = useRef(false);
  const closedHere = useRef(false);
  if (roll) hadRoll.current = true;
  useEffect(() => {
    if (roll || !restored || !ready.value || storageError.value || loadingRoll || switchingRef.current) return;
    const key = `${camera.id}|${stock.id}`;
    if (loadFailed.current === key) return;
    const go = () => {
      loadFailed.current = key; // cleared again once the load succeeds
      void onLoad();
    };
    // The roll went away elsewhere (another tab changing cameras, the album deleting it): give that
    // tab a moment to put its own roll in instead of racing it with this screen's camera.
    if (hadRoll.current && !closedHere.current) {
      const id = setTimeout(() => !activeRoll.value && go(), 700);
      return () => clearTimeout(id);
    }
    go();
  }, [roll?.id, restored, ready.value, storageError.value, loadingRoll, camera.id, stock.id, switched]);

  /**
   * Another camera (or another film for this one): the current roll is closed (its photos are already
   * in the album) and the next one goes in. Dragging the camera strip lands here.
   */
  const switchTo = (id: string, stockId?: string) => {
    if (countdown > 0) return;
    const next = getCamera(id);
    // The same camera again (Models, a tap on the strip) keeps its film; another camera brings its own.
    const nextStock = stockId && canLoad(next, stockId) ? stockId : next.id === pickCamera && canLoad(next, pickStock) ? pickStock : next.defaultStock;
    if (next.id === pickCamera && nextStock === pickStock && !wanted.current) {
      const r = activeRoll.value;
      if (!r || (r.cameraId === next.id && r.stockId === nextStock)) return;
    }
    if (s.haptics) haptic(8);
    wanted.current = { camera: next.id, stock: nextStock };
    // Remembered at once: leaving the tab mid-change must not bring the old camera back.
    void Promise.all([put('kv', nextStock, LAST_STOCK_KEY), put('kv', next.id, LAST_CAMERA_KEY)]).catch(() => undefined);
    setPickCamera(next.id);
    setPickStock(nextStock);
    void reconcile();
  };

  /**
   * Brings the roll in line with the pick: a roll for another camera or film is closed, and the load
   * effect puts in the wanted one. Runs again after a load or a shot that was still going on, so a
   * pick made meanwhile (even while the very first roll was loading) is never undone.
   */
  const reconcile = async () => {
    const w = wanted.current;
    if (!w) return;
    if (switchingRef.current || shootingRef.current || loadingRef.current) {
      // Something is still saving or loading: look again shortly (never drop the pick).
      clearTimeout(reconcileTimer.current);
      reconcileTimer.current = setTimeout(() => mountedRef.current && void reconcileRef.current(), 120);
      return;
    }
    const r = activeRoll.value;
    if (!r) return; // the load effect puts in the wanted camera
    if (r.cameraId === w.camera && r.stockId === w.stock) {
      wanted.current = null;
      return;
    }
    switchingRef.current = true;
    let ok = false;
    try {
      ok = await closeRoll(r);
    } finally {
      switchingRef.current = false;
      if (mountedRef.current) setSwitched((n) => n + 1); // the next roll goes in now
    }
    if (!ok && wanted.current === w) {
      // Could not close it (storage): stay with the camera that is in.
      wanted.current = null;
      setPickCamera(getCamera(r.cameraId).id);
      setPickStock(r.stockId);
    }
  };
  const reconcileRef = useRef(reconcile);
  reconcileRef.current = reconcile;
  const reconcileTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(reconcileTimer.current), []);

  // A camera picked in the Models tab: shoot with it now (once the last camera has been read back).
  useEffect(() => {
    const id = cameraRequest.value;
    if (!id || !restored) return;
    cameraRequest.value = null;
    switchTo(id);
  }, [cameraRequest.value, restored]);

  // One album group per camera per day: the first shot on a new day (the app left open overnight, or
  // opened again days later) starts a fresh group. A half / first exposure still waiting is kept.
  const lastPhotoRef = useRef(lastPhoto);
  lastPhotoRef.current = lastPhoto;
  useEffect(() => {
    const check = () => {
      const r = activeRoll.value;
      const last = lastPhotoRef.current;
      if (!r || r.pending || document.hidden) return;
      if (shootingRef.current || switchingRef.current || wanted.current) return;
      // Its last photo's day; an unused roll counts from the day it went in (so the album dates it today).
      let stamp: number;
      if (hasShots(r)) {
        if (!last || last.rollId !== r.id) return; // its photos are not read yet
        stamp = last.takenAt;
      } else stamp = r.createdAt;
      if (new Date(stamp).toDateString() === new Date().toDateString()) return;
      switchingRef.current = true;
      void closeRoll(r).finally(() => {
        switchingRef.current = false;
        if (mountedRef.current) setSwitched((n) => n + 1);
      });
    };
    check();
    document.addEventListener('visibilitychange', check);
    return () => document.removeEventListener('visibilitychange', check);
  }, [roll?.id, lastPhoto?.id]);

  // A roll changed (loaded, closed, loaded in another tab, restored): follow it, or replace it with the pick.
  useEffect(() => {
    if (!roll || switchingRef.current) return;
    if (wanted.current) {
      void reconcileRef.current();
      return;
    }
    if (roll.cameraId && roll.cameraId !== pickCamera) setPickCamera(getCamera(roll.cameraId).id);
    if (roll.stockId !== pickStock) setPickStock(roll.stockId);
  }, [roll?.id, loadingRoll, busy]);

  const toggleFlash = () => {
    const on = !flashOn;
    setFlashOn(on);
    // Said out loud and shown: the icon alone is easy to miss. The front camera lights the screen instead.
    toast(on ? (facing === 'user' ? t('cam.flashOnScreen') : t('cam.flashOnSay')) : t('cam.flashOffSay'), undefined, 1600);
  };

  const flip = async () => {
    if (busy || state === 'starting') return;
    if (s.haptics) haptic(8);
    await startCamera(cam().facing === 'environment' ? 'user' : 'environment');
    // Selfies never use the rear torch: with the flash on, the screen lights up instead. Say so.
    if (mountedRef.current && cam().facing === 'user' && flashLook) toast(t('cam.flashOnScreen'), undefined, 2200);
  };

  const shot = !!roll && hasShots(roll);
  const shotsSaid = roll ? (camera.capture === 'half' ? t('cam.nHalfShots', { n: roll.shots }) : t('cam.nShots', { n: shotCount(roll) })) : '';
  /** The camera sheet button: this camera and its film. */
  const sheetLabel = `${camera.name} · ${isolate(stock.name)}`;
  const films = filmsFor(camera);
  const pinned = s.pinnedCameras.includes(camera.id);
  const flashLabel =
    camera.flash === 'charge' ? (charge === 'ready' ? t('cam.flashReady') : charge === 'charging' ? t('cam.flashCharging') : t('cam.flashCharge')) : t('cam.flash');
  const counterText = roll ? String(roll.shots).padStart(2, '0') : '';
  const counting = countdown > 0;
  const starting = state === 'starting';
  /** While the self-timer counts, only the timer chip (cancel) stays usable in the toolbar. */
  const chipLock = counting || undefined;
  /** The body's back plate: material, window, buttons and release for this camera (static CSS). */
  const back = useMemo(() => backFor(camera), [camera.id]);

  return (
    <div class={`camera cam-${camera.id}`} data-testid="camera-screen" data-camera={camera.id}>
      <div
        class="bp-body"
        data-family={back.family}
        data-mat={back.material}
        data-win={back.window}
        data-btn={back.buttons}
        data-shutter={back.shutterStyle}
        data-band={back.bandAt}
        data-plate={back.plate === 'transparent' ? 'print' : 'badge'}
        data-rainbow={back.details.rainbow || undefined}
        data-stripe={back.details.stripe || undefined}
        style={backVars(back)}
      >
      <BackDecor key={camera.id} spec={back} />
      <div class={`cam-top ${busy ? 'locked' : ''} ${counting ? 'counting' : ''}`} inert={(busy && !counting) || undefined}>
        {camera.flash === 'standard' && (
          <button class={`chip ${flashOn ? 'on' : ''}`} onClick={toggleFlash} disabled={chipLock} aria-pressed={flashOn} aria-label={flashLabel} data-testid="btn-flash">
            <Icon name={flashOn ? 'flash' : 'flashOff'} size={20} />
          </button>
        )}
        {camera.flash === 'charge' && (
          <button
            class={`chip flash-charge charge-${charge} ${flashOn ? '' : 'off'}`}
            disabled={chipLock}
            onClick={() => (charge === 'empty' ? chargeFlash() : charge === 'ready' ? toggleFlash() : undefined)}
            aria-label={flashLabel}
            aria-pressed={charge === 'ready' && flashOn}
            data-testid="btn-flash"
            data-charge={charge}
          >
            <Icon name="flash" size={20} />
            <i class="charge-led" />
          </button>
        )}
        {/* While counting down, the timer chip is the cancel button (like the shutter and Escape). */}
        {/* Fixed width (icon + digit badge): turning the timer on never wraps the bar or moves the viewfinder. */}
        <button
          class={`chip timer-chip ${timer ? 'on' : ''} ${counting ? 'cancel' : ''}`}
          onClick={counting ? cancelTimer : () => setTimer(TIMERS[(TIMERS.indexOf(timer) + 1) % TIMERS.length])}
          aria-label={counting ? t('cam.cancelTimer') : `${t('cam.timer')} ${timer ? t('cam.sec', { n: timer }) : t('common.off')}`}
          data-testid="btn-timer"
        >
          <Icon name={counting ? 'close' : 'timer'} size={20} />
          {(counting || timer > 0) && (
            <span class="timer-badge mono" aria-hidden="true">
              {counting ? countdown : timer}
            </span>
          )}
        </button>
        {camera.formats.length > 1 && (
          <button class="chip" disabled={chipLock} onClick={() => setFormatPick(camera.formats[(camera.formats.indexOf(aspect) + 1) % camera.formats.length])} aria-label={`${t('cam.aspect')} ${aspect}`} data-testid="btn-aspect">
            <span class="chip-txt mono" dir="ltr">{aspect}</span>
          </button>
        )}
        {camera.zoom.length > 1 && (
          <button class={`chip ${zoom > 1 ? 'on' : ''}`} disabled={chipLock} onClick={() => setZoom(camera.zoom[(camera.zoom.indexOf(zoom) + 1) % camera.zoom.length])} aria-label={`${t('cam.zoom')} ${zoom}×`} data-testid="btn-zoom">
            <span class="chip-txt mono" dir="ltr">{zoom}×</span>
          </button>
        )}
        {camera.ev && (
          <button class={`chip ${ev !== 0 || evOpen ? 'on' : ''}`} disabled={chipLock} onClick={() => setEvOpen(!evOpen)} aria-expanded={evOpen} aria-label={`${t('cam.ev')} ${formatSigned(ev)}`} data-testid="btn-ev">
            <span class="chip-txt mono" dir="ltr">
              {formatSigned(ev, undefined, '±')}
            </span>
          </button>
        )}
        {getStock(stock.id).kind === 'pixel' && (
          <button class="chip" disabled={chipLock} onClick={() => setPalette(PALETTE_IDS[(PALETTE_IDS.indexOf(palette) + 1) % PALETTE_IDS.length])} aria-label={`${t('cam.palette')} ${t(`palette.${palette}` as MsgKey)}`} data-testid="btn-palette" data-palette={palette}>
            <span class="chip-txt">{t(`palette.${palette}` as MsgKey)}</span>
          </button>
        )}
        {/* Low-priority toggles live under "more" so the bar fits a 360px phone without scrolling. */}
        <div class="cam-more-wrap" ref={moreRef}>
          <button
            class={`chip more-chip ${moreOpen ? 'on' : ''}`}
            disabled={chipLock}
            onClick={() => setMoreOpen(!moreOpen)}
            aria-expanded={moreOpen}
            aria-controls="cam-more"
            aria-label={t('cam.more')}
            data-testid="btn-more"
          >
            <span class="more-dots" aria-hidden="true">
              ⋯
            </span>
          </button>
          <div class="cam-more" id="cam-more" hidden={!moreOpen} data-testid="cam-more">
            {camera.stamp !== 'none' && (
              <button class={`more-item ${dateOn ? 'on' : ''}`} onClick={() => setDateOn(!dateOn)} aria-pressed={dateOn} data-testid="btn-date">
                <Icon name="calendar" size={20} />
                <span>{t('cam.date')}</span>
                <small aria-hidden="true">{dateOn ? t('common.on') : t('common.off')}</small>
              </button>
            )}
            <button class={`more-item ${s.grid ? 'on' : ''}`} onClick={() => updateSettings({ grid: !s.grid })} aria-pressed={s.grid} data-testid="btn-grid">
              <Icon name="grid" size={20} />
              <span>{t('cam.grid')}</span>
              <small aria-hidden="true">{s.grid ? t('common.on') : t('common.off')}</small>
            </button>
          </div>
        </div>
      </div>
      {camera.ev && evOpen && (
        <div class="ev-row">
          <Slider label={t('cam.ev')} value={ev} min={-2} max={2} step={1 / 3} onInput={(v) => setEv(Math.round(v * 3) / 3)} format={(v) => ltr(`${formatSigned(v)} EV`)} testId="sl-ev" />
        </div>
      )}

      <div class="cam-stage" ref={stageRef}>
        <BackWindow spec={back} width={frame.width} height={frame.height} />
        <div class={`viewfinder vfs-${camera.viewfinder}`} style={{ width: `${frame.width}px`, height: `${frame.height}px` }}>
          {gpu ? <canvas key={glKey} ref={canvasRef} class="preview" data-testid="preview" /> : <div class="preview" ref={videoHostRef} />}
          <ViewfinderOverlay
            camera={camera}
            state={{
              // The LCD / phone / pixel readout: shots taken with this camera today (there is no roll to run out).
              left: roll ? roll.shots : 0,
              half: roll?.pending?.kind === 'half' ? 1 : 0,
              quadIndex,
              ghost: ghostUrl,
              // The front preview is always mirrored; the first exposure is saved unmirrored when "mirror front" is off.
              ghostMirror: facing === 'user' && !s.mirrorFront,
              dateText: dateOn && camera.stamp === 'digital' ? formatDigitalStamp(Date.now()) : undefined,
            }}
          />
          {s.grid && <div class="grid-overlay" aria-hidden="true" />}
          {state === 'starting' && <div class="vf-msg">{t('cam.starting')}</div>}
          {counting && (
            // A tap anywhere on the viewfinder cancels too; the shutter is the labelled control.
            <div class="countdown-wrap" onClick={cancelTimer} aria-hidden="true">
              <div class="countdown">{countdown}</div>
              <div class="countdown-hint">{t('cam.tapToCancel')}</div>
            </div>
          )}
          {blink && <div class="blink" />}
          {roll && camera.viewfinder !== 'lcd' && camera.viewfinder !== 'pixel' && (
            <div class="counter mono" data-testid="counter" role="img" aria-label={shotsSaid}>
              {/* Re-keyed per frame: a short tick shows the film advanced. */}
              <span key={counterText} class="counter-tick">
                {counterText}
              </span>
            </div>
          )}
          {/* Today's free shots, in the corner opposite the frame counter (hidden for Pro / unlimited and while counting down). */}
          {roll && !counting && <ShotsLeftBadge class="vf-shots" onClick={() => goTab({ name: 'settings' })} />}
          {roll && (camera.viewfinder === 'lcd' || camera.viewfinder === 'pixel') && (
            <span class="sr-only" data-testid="counter">
              {String(roll.shots).padStart(2, '0')}
            </span>
          )}
          {dateOn && camera.stamp === 'led' && <div class="vf-date mono" aria-hidden="true">DATE</div>}
        </div>
        {state === 'error' && (
          <div class="cam-error" data-testid="camera-error">
            <h2>{t('cam.noCamera.title')}</h2>
            <p>
              {error === 'insecure'
                ? t('cam.err.insecure')
                : error === 'unsupported'
                  ? t('cam.err.unsupported')
                  : error === 'busy'
                    ? t('cam.err.busy')
                    : error === 'notfound'
                      ? t('cam.err.notfound')
                      : t('cam.noCamera.body')}
            </p>
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

      {/* Drag sideways: the camera that stops in the middle is the one you shoot with. */}
      <CameraRail selected={pickCamera} onPick={(id) => switchTo(id)} locked={busy || counting} />

      {(roll || (!loadError && !storageError.value)) && (
        <div class="cam-bottom">
          {lastPhoto ? (
            <div class={`last-shot ${ejectsPrints(camera) ? 'instant' : ''} ${eject ? 'landing' : ''}`} data-testid="last-shot">
              {/* Shown under the thumbnail until its developed print is ready: never a black square. */}
              {quick?.id === lastPhoto.id && <img class="last-shot-quick" src={quick.url} alt="" aria-hidden="true" />}
              <Thumb key={lastPhoto.id} photo={lastPhoto} onClick={() => go({ name: 'photo', id: lastPhoto.id })} label={t('cam.lastShot')} />
            </div>
          ) : (
            // Nothing shot with this camera yet: the slot leads to the album (earlier photos live there).
            <button class="last-shot-empty" onClick={() => goTab({ name: 'gallery' })} aria-label={t('tab.gallery')} data-testid="btn-last-album">
              <Icon name="gallery" size={22} />
            </button>
          )}
          {/* Stays operable while busy (presses queue up) and while counting (a press cancels the timer). */}
          <button
            ref={shutterRef}
            class={`shutter ${busy && !counting ? 'busy' : ''} ${counting ? 'cancel' : ''} ${starting ? 'starting' : ''}`}
            onClick={onShutter}
            disabled={state === 'error'}
            aria-disabled={starting || undefined}
            aria-label={counting ? t('cam.cancelTimer') : starting ? `${t('cam.shutter')} · ${t('cam.starting')}` : t('cam.shutter')}
            data-testid="shutter"
            data-state={counting ? 'cancel' : starting ? 'starting' : busy ? 'busy' : 'ready'}
          >
            <span>{counting && <Icon name="close" size={28} />}</span>
            {queued > 0 && (
              <i class="shutter-queue mono" aria-hidden="true">
                +{queued}
              </i>
            )}
          </button>
          <div class="cam-right">
            <button class="icon-btn" onClick={() => setFilmOpen(true)} disabled={counting || !roll} aria-label={sheetLabel} aria-haspopup="dialog" data-testid="roll-btn">
              <Canister stock={stock} size={22} />
            </button>
            <button class="icon-btn big" onClick={flip} disabled={busy || state === 'starting'} aria-label={facing === 'user' ? t('cam.flipToBack') : t('cam.flipToFront')} data-testid="btn-flip" data-facing={facing}>
              <Icon name="flip" size={26} />
            </button>
          </div>
        </div>
      )}
      </div>
      {!roll && loadError && !storageError.value && (
        <div class="cam-retry">
          <button
            class="btn primary"
            onClick={() => {
              loadFailed.current = '';
              setLoadError(false);
              void onLoad();
            }}
            data-testid="btn-load-retry"
          >
            {t('common.retry')}
          </button>
        </div>
      )}
      {roll && camera.capture === 'quad' && !busy && <p class="cam-hint">{t('cam.quadHint')}</p>}
      {roll && camera.capture === 'double' && (
        <p class="cam-hint" data-testid="double-hint">
          {roll.pending?.kind === 'double' ? t('cam.double2') : t('cam.doubleHint')}
        </p>
      )}
      {roll?.pending?.kind === 'half' && <p class="cam-hint">{t('cam.halfNext')}</p>}
      {screenFlash && <div class="screen-flash" />}
      {eject && (
        <div class={`eject-print ${camera.id === 'instaw' ? 'wide' : ''}`} key={eject.key} aria-hidden="true" style={{ width: `${Math.round(Math.min(frame.width * 0.46, 220))}px` }}>
          <img src={eject.url} alt="" class="instant-dev" />
        </div>
      )}
      <div class="sr-only" aria-live="polite" data-testid="announcer">
        {announce}
      </div>

      <Sheet open={filmOpen} onClose={() => setFilmOpen(false)} title={camera.name} testId="roll-sheet">
        <p class="muted">{cameraDescription(camera.id)}</p>
        {films.length > 1 ? (
          <>
            <div class="load-sub">
              <span>{t('cam.film')}</span>
              <span class="muted small">{stockDescription(stock.id)}</span>
            </div>
            <StockStrip key={camera.id} stocks={films} value={stock.id} onChange={(id) => switchTo(camera.id, id)} label={t('cam.chooseFilm')} />
          </>
        ) : (
          <div class="load-sub">
            <span>{t('cam.fixedFilm')}</span>
            <span class="muted small">
              <bdi>{stock.name}</bdi> · {stockDescription(stock.id)}
            </span>
          </div>
        )}
        {roll && shot && (
          <button
            class="btn primary wide"
            onClick={() => {
              setFilmOpen(false);
              go({ name: 'roll', id: roll.id });
            }}
            data-testid="btn-open-roll"
          >
            <Icon name="gallery" size={18} /> {t('lab.open')} · {shotsSaid}
          </button>
        )}
        <button
          class={`btn ghost wide ${pinned ? 'on' : ''}`}
          onClick={() => void setCameraPinned(camera.id, !pinned)}
          aria-pressed={pinned}
          data-testid={`pin-${camera.id}`}
        >
          <Icon name="pin" size={18} /> {t('cam.pin', { name: camera.name })}
        </button>
        <p class="muted small sheet-sub">{t('cam.pinHint')}</p>
      </Sheet>
    </div>
  );
}
