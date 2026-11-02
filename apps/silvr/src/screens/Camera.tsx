import { signal } from '@preact/signals';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CameraController, classifyError, type CameraError } from '../camera/camera';
import { snapshotVideo } from '../camera/capture';
import { captureRotation, requestOrientationPermission, startOrientation } from '../camera/orientation';
import { blankLike, blobToCanvas, composeDouble, composeHalf, composeQuad, cropExposure, exposureSpec, previewBlob, toNegative } from '../cameras/compose';
import { LoadPanel, QUICK_START_KEY } from '../cameras/LoadPanel';
import { canLoad, DEFAULT_CAMERA_ID, defaultCapacity, ejectsPrints, getCamera, PALETTE_IDS, type CameraModel } from '../cameras/models';
import { playAdvance, playBeep, playFlashCharge, playShutter, unlockAudio } from '../cameras/sound';
import { ViewfinderOverlay } from '../cameras/Viewfinder';
import { Icon } from '../components/Icon';
import { Canister, Sheet, Slider, Thumb, useObjectUrl } from '../components/ui';
import { aspectRatio, cropForAspect, fitContain } from '../film/geometry';
import { GlFilmRenderer } from '../film/glRenderer';
import { formatDigitalStamp } from '../film/overlays';
import { randomSeed } from '../film/random';
import { defaultBorderFor, defaultDevelop, resolveLook } from '../film/resolve';
import { getStock } from '../film/stocks';
import type { Aspect, DevelopSettings, FilmStock } from '../film/types';
import { cameraDescription, isolate, ltr, t, type MsgKey } from '../i18n';
import { haptic } from '../platform/feedback';
import { activeRoll, confirm, confirmReq, refreshRolls, settings, storageError, toast, updateSettings } from '../state/app';
import { holdCapture } from '../platform/pwa';
import { go, isCurrent } from '../state/router';
import { get, put } from '../store/db';
import { addShot, dropPending, finishRoll, framesLeft, getPending, getRoll, listPhotos, loadRoll, markSeen, readyAtFor, savePending, type DevelopSpeed, type Photo, type Roll } from '../store/rolls';
import { formatArrival } from '../components/arrival';
import { signalLang } from '../state/lang';

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

function defaultAspect(camera: CameraModel, stock: FilmStock, rollAspect?: Aspect): Aspect {
  if (rollAspect && camera.formats.includes(rollAspect)) return rollAspect;
  return camera.formats.includes(stock.defaultAspect) ? stock.defaultAspect : camera.formats[0];
}

/**
 * Set by other screens ("develop now" in the album / lab) to open the roll sheet
 * the next time the camera screen shows.
 */
export const rollSheetRequest = signal(false);

/** How a body ends its roll: film goes to the lab, instant packs and memory cards are already viewable. */
export type FinishKind = 'film' | 'pack' | 'card';
export const finishKind = (c: CameraModel): FinishKind => (!c.instant ? 'film' : ejectsPrints(c) ? 'pack' : 'card');

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
  // The "default roll size" setting is a 35mm film habit; packs, cards and half-frame rolls keep their own default.
  const sizeFor = (c: CameraModel) =>
    !c.instant && c.capture !== 'half' && c.capacities.includes(settings.value.defaultRollSize) ? settings.value.defaultRollSize : defaultCapacity(c);
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
  /** Set by a second shutter press or Escape while the self-timer runs. */
  const timerCancel = useRef(false);
  const [zoom, setZoom] = useState(1);
  const [formatPick, setFormatPick] = useState<Aspect | null>(null);
  const [busy, setBusy] = useState(false);
  const [blink, setBlink] = useState(false);
  const [quadIndex, setQuadIndex] = useState<number | undefined>(undefined);
  const [screenFlash, setScreenFlash] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [rollInfoOpen, setRollInfoOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  /** The roll is being finished to change bodies: stay here (the picker) instead of opening the lab. */
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

  // Restore the last camera/film the user loaded.
  useEffect(() => {
    Promise.all([get<string>('kv', LAST_CAMERA_KEY), get<string>('kv', LAST_STOCK_KEY)])
      .then(([c, st]) => {
        if (c) setPickCamera(getCamera(c).id);
        if (st) setPickStock(st);
      })
      .catch(() => undefined);
  }, []);

  // "Develop now" from the album / lab: open the roll sheet with its finish button.
  useEffect(() => {
    if (!rollSheetRequest.value) return;
    rollSheetRequest.value = false;
    if (roll) setRollInfoOpen(true);
  }, [rollSheetRequest.value, roll?.id]);

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
        if (startPressRef.current) droppedRef.current += 1;
        startPressRef.current = false;
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

  const afterRollFull = async (r: Roll) => {
    haptic([20, 60, 20]);
    if (camera.instant) {
      try {
        const done = await finishRoll(r.id, 'instant');
        toast(t('cam.packDone'));
        if (done) {
          await markSeen(done.id);
          if (isCurrent({ name: 'camera' })) go({ name: 'roll', id: done.id }); // not if the user moved on meanwhile
        }
      } catch (err) {
        console.error('[silvr] could not finish the pack', err);
        storageToast(err);
      }
    } else {
      setSpeedOpen(true);
    }
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

  /** The countdown stops at its next 100 ms check (shutter, timer chip, viewfinder tap or Escape). */
  const cancelTimer = () => {
    if (countdown > 0) timerCancel.current = true;
  };

  /** The shutter button / Space / Enter. Presses during a capture queue up instead of being dropped. */
  const onShutter = () => {
    if (countdown > 0) {
      cancelTimer();
      pulse('press');
      return;
    }
    if (state === 'error' || !activeRoll.value) return;
    if (s.sound) unlockAudio();
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
        for (let i = timer; i > 0; i--) {
          setCountdown(i);
          haptic(8);
          for (let k = 0; k < 10; k++) {
            await sleep(100);
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
              if (camera.instant) quickBlob = previewBlob(composite, rotate).catch(() => null);
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
        if (camera.instant) quickBlob = previewBlob(composite, rotate).catch(() => null);
        const neg = await toNegative(composite);
        result = await addShot(r.id, neg.blob, developFor(r, { flash: fire, rotate }), { width: neg.width, height: neg.height }, takenAt, 1);
      }

      // Everything below runs only once the frame is committed to IndexedDB (addShot resolves on
      // transaction complete): the thumbnail / eject never shows a photo that is not saved yet.
      if (s.sound) playAdvance(camera.sound);
      if (result) setAnnounce(t('cam.saved', { n: result.photo.frame }));
      else if (camera.capture === 'half') setAnnounce(t('cam.halfNext'));
      if (result && camera.instant) {
        const blob = quickBlob ? await quickBlob : null;
        if (mountedRef.current) {
          const url = blob ? URL.createObjectURL(blob) : undefined;
          if (quickRef.current) URL.revokeObjectURL(quickRef.current);
          quickRef.current = url;
          setQuick(url ? { url, id: result.photo.id } : undefined);
          setLastPhoto(result.photo);
          if (ejectsPrints(camera)) {
            if (url && !reduceMotion()) setEject({ url, key: Date.now() });
          } else if (s.sound && camera.sound !== 'digital') playBeep();
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
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat && tag !== 'BUTTON' && tag !== 'INPUT' && state !== 'error' && !speedOpen && !rollInfoOpen && !confirmReq.value) {
        e.preventDefault();
        onShutter();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const [loadingRoll, setLoadingRoll] = useState(false);
  const onLoad = async () => {
    if (loadingRoll) return;
    setLoadingRoll(true);
    if (s.sound) unlockAudio();
    // Runs inside the tap gesture: iOS motion permission (for sideways shots) and durable storage.
    void requestOrientationPermission();
    void navigator.storage?.persist?.().catch(() => undefined);
    try {
      const size = camera.capacities.includes(rollSize) ? rollSize : defaultCapacity(camera);
      await loadRoll(stock.id, size, aspect, Date.now(), camera.id);
      await Promise.all([put('kv', stock.id, LAST_STOCK_KEY), put('kv', camera.id, LAST_CAMERA_KEY), put('kv', true, QUICK_START_KEY)]);
      if (s.haptics) haptic(25);
      if (s.sound) playAdvance(camera.sound === 'digital' || camera.sound === 'pixel' || camera.sound === 'instant' ? 'slr' : camera.sound);
    } catch (err) {
      console.error(err);
      // Most likely a roll was loaded in another tab meanwhile; show it.
      try {
        await refreshRolls();
      } catch {
        storageError.value = true;
      }
      if (!activeRoll.value) {
        const quota = (err as Error)?.name === 'QuotaExceededError';
        toast(quota ? t('err.storage') : storageError.value ? t('err.noStorage') : t('common.error'), undefined, 6000);
      }
    } finally {
      if (mountedRef.current) setLoadingRoll(false);
    }
  };

  const onRewind = async () => {
    if (shootingRef.current) return;
    const r = activeRoll.value;
    if (!r) return;
    setRollInfoOpen(false);
    if (!hasShots(r)) {
      if (!(await confirm(t('cam.emptyRewind'), t('cam.unload'), true))) return;
      try {
        await finishRoll(r.id, 'instant');
      } catch (err) {
        console.error('[silvr] could not unload the roll', err);
        storageToast(err);
      }
      return;
    }
    const kind = finishKind(camera);
    if (r.shots < r.capacity) {
      const left = framesLeft(r);
      const leftText = camera.capture === 'half' ? t('cam.nHalfShots', { n: left }) : t('cam.nShots', { n: left });
      const text = t(kind === 'film' ? 'cam.rewindConfirm' : kind === 'pack' ? 'cam.finishPackConfirm' : 'cam.finishCardConfirm', { shots: shotsText(r), left: leftText, n: shotCount(r), m: left });
      const ok = kind === 'film' ? t('cam.sendToLab') : kind === 'pack' ? t('cam.finishPack') : t('cam.finishCard');
      if (!(await confirm(text, ok))) return;
    }
    if (camera.instant) {
      await finishWithPending(r, 'instant');
      return;
    }
    // The pending half/exposure is only committed once a lab speed is picked (cancel keeps shooting).
    setSpeedOpen(true);
  };

  /** Commits any pending exposure, then sends the roll off. */
  const finishWithPending = async (stale: Roll, speed: DevelopSpeed) => {
    const switching = switchingRef.current;
    switchingRef.current = false;
    if (shootingRef.current) return;
    // Lock the shutter while the pending exposure is committed, or a shot could pair with it twice.
    shootingRef.current = true;
    pressesLeftRef.current = 0;
    setBusy(true);
    const release = holdCapture();
    let done: Roll | null;
    try {
      const r = (await getRoll(stale.id)) ?? stale; // the signal can lag a just-saved pending exposure
      try {
        await flushPending(r);
      } catch (err) {
        // finishRoll would drop the pending blob, so keep the roll loaded instead of losing that frame.
        console.error('[silvr] could not keep the pending exposure', err);
        storageToast(err);
        return;
      }
      done = await finishRoll(r.id, speed);
      if (done && camera.instant) await markSeen(done.id); // its shots were already seen in the camera
    } catch (err) {
      console.error('[silvr] could not send the roll', err);
      storageToast(err);
      return;
    } finally {
      release();
      shootingRef.current = false;
      if (mountedRef.current) setBusy(false);
    }
    if (!done || !isCurrent({ name: 'camera' })) return; // the user switched tabs while it was saving
    if (switching) {
      // Changing bodies: stay on the picker, and say where the roll went.
      const developed = done.status === 'developed';
      const id = done.id;
      toast(developed ? t('cam.switchedAlbum') : t('cam.switchedLab'), {
        label: developed ? t('lab.open') : t('gal.openLab'),
        run: () => go(developed ? { name: 'roll', id } : { name: 'lab' }),
      });
      return;
    }
    if (done.status === 'developed') go({ name: 'roll', id: done.id });
    else go({ name: 'lab' });
  };

  /** Changing bodies mid-roll: the roll is finished first (lab for film), then the picker shows. */
  const onSwitchBody = async () => {
    if (shootingRef.current) return;
    const r = activeRoll.value;
    if (!r) return;
    setRollInfoOpen(false);
    if (!hasShots(r)) {
      // Nothing shot: just take the roll out.
      try {
        await finishRoll(r.id, 'instant');
      } catch (err) {
        console.error('[silvr] could not unload the roll', err);
        storageToast(err);
      }
      return;
    }
    const kind = finishKind(camera);
    // Say what happens to both: the shots taken and the frames that will never be used.
    // A pending first exposure (double) becomes a frame of its own, so it is not "left".
    const unused = Math.max(0, framesLeft(r) - (r.pending?.kind === 'double' ? 1 : 0));
    const leftText = camera.capture === 'half' ? t('cam.nHalfShots', { n: unused }) : t('cam.nShots', { n: unused });
    const text =
      unused > 0
        ? t(kind === 'film' ? 'cam.switchConfirmFilm2' : kind === 'pack' ? 'cam.switchConfirmPack2' : 'cam.switchConfirmCard2', {
            shots: shotsText(r),
            left: leftText,
            // English verbs agree with the counts ("1 shot gets developed").
            n: shotCount(r),
            m: unused,
          })
        : t(kind === 'film' ? 'cam.switchConfirm' : kind === 'pack' ? 'cam.switchConfirmPack' : 'cam.switchConfirmCard', { shots: shotsText(r), n: shotCount(r) });
    if (!(await confirm(text, kind === 'film' ? t('cam.switchOkFilm') : t('cam.switchOkDone')))) return;
    switchingRef.current = true;
    if (camera.instant) await finishWithPending(r, 'instant');
    else setSpeedOpen(true); // the lab speed sheet; cancelling it keeps the roll (and the body)
  };

  const closeSpeed = () => {
    switchingRef.current = false;
    setSpeedOpen(false);
  };

  const toggleFlash = () => {
    const on = !flashOn;
    setFlashOn(on);
    // Said out loud and shown: the icon alone is easy to miss. The front camera lights the screen instead.
    toast(on ? (facing === 'user' ? t('cam.flashOnScreen') : t('cam.flashOnSay')) : t('cam.flashOffSay'), undefined, 1600);
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
    // Selfies never use the rear torch: with the flash on, the screen lights up instead. Say so.
    if (mountedRef.current && cam().facing === 'user' && flashLook) toast(t('cam.flashOnScreen'), undefined, 2200);
  };

  const left = roll ? framesLeft(roll) : 0;
  const kind = finishKind(camera);
  const shot = !!roll && hasShots(roll);
  // The pill names the way to the photos ("5장 · 현상하기"), not just the frames left.
  const pillCount = roll ? (camera.capture === 'half' ? t('cam.nHalfShots', { n: roll.shots }) : t('cam.nShots', { n: roll.shots + (roll.pending?.kind === 'double' ? 1 : 0) })) : '';
  // Accessible name starts with the visible text (WCAG 2.5.3), the film name follows.
  const rollBtnLabel = shot
    ? `${pillCount} ${t(kind === 'film' ? 'cam.develop' : kind === 'pack' ? 'cam.finishPack' : 'cam.finishCard')} · ${isolate(stock.name)}`
    : `${t('cam.left', { n: left })} · ${isolate(stock.name)}`;
  const flashLabel =
    camera.flash === 'charge' ? (charge === 'ready' ? t('cam.flashReady') : charge === 'charging' ? t('cam.flashCharging') : t('cam.flashCharge')) : t('cam.flash');
  const counterText = roll ? String(roll.shots).padStart(2, '0') : '';
  const counting = countdown > 0;
  const starting = state === 'starting';
  /** While the self-timer counts, only the timer chip (cancel) stays usable in the toolbar. */
  const chipLock = counting || undefined;

  return (
    <div class={`camera cam-${camera.id}${roll ? '' : ' unloaded'}`} data-testid="camera-screen" data-camera={camera.id}>
      <div class={`cam-top ${busy ? 'locked' : ''} ${counting ? 'counting' : ''}`} inert={(busy && !counting) || undefined}>
        <button class="chip cam-name" onClick={() => setRollInfoOpen(true)} disabled={!roll || counting} aria-label={`${camera.name} · ${t('cam.rollInfo')}`} data-testid="camera-chip">
          <span class="chip-txt">{camera.name}</span>
        </button>
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
            <span class="chip-txt mono">{aspect}</span>
          </button>
        )}
        {camera.zoom.length > 1 && (
          <button class={`chip ${zoom > 1 ? 'on' : ''}`} disabled={chipLock} onClick={() => setZoom(camera.zoom[(camera.zoom.indexOf(zoom) + 1) % camera.zoom.length])} aria-label={`${t('cam.zoom')} ${zoom}×`} data-testid="btn-zoom">
            <span class="chip-txt mono">{zoom}×</span>
          </button>
        )}
        {camera.ev && (
          <button class={`chip ${ev !== 0 || evOpen ? 'on' : ''}`} disabled={chipLock} onClick={() => setEvOpen(!evOpen)} aria-expanded={evOpen} aria-label={`${t('cam.ev')} ${ev > 0 ? '+' : ''}${ev.toFixed(1)}`} data-testid="btn-ev">
            <span class="chip-txt mono" dir="ltr">
              {ev > 0 ? '+' : ev < 0 ? '−' : '±'}
              {Math.abs(ev).toFixed(1)}
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
          <Slider label={t('cam.ev')} value={ev} min={-2} max={2} step={1 / 3} onInput={(v) => setEv(Math.round(v * 3) / 3)} format={(v) => ltr(`${v > 0 ? '+' : ''}${v.toFixed(1)} EV`)} testId="sl-ev" />
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
            <div class="counter mono" data-testid="counter" role="img" aria-label={t('cam.left', { n: left })}>
              {/* Re-keyed per frame: a short tick shows the film advanced. */}
              <span key={counterText} class="counter-tick">
                {counterText}
              </span>
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
        {!roll && state !== 'error' && frame.width > 0 && (
          // Check selfie framing before loading: the same control the loaded camera has next to the shutter.
          <button
            class="icon-btn vf-flip"
            onClick={flip}
            disabled={starting}
            aria-label={facing === 'user' ? t('cam.flipToBack') : t('cam.flipToFront')}
            data-testid="btn-flip"
            data-facing={facing}
            style={{ top: `${(box.h - frame.height) / 2 + 10}px`, right: `${(box.w - frame.width) / 2 + 10}px` }}
          >
            <Icon name="flip" size={22} />
          </button>
        )}
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

      {roll ? (
        <div class="cam-bottom">
          {camera.instant && lastPhoto ? (
            <div class={`last-shot ${ejectsPrints(camera) ? 'instant' : ''} ${eject ? 'landing' : ''}`} data-testid="last-shot">
              {/* Shown under the thumbnail until its developed print is ready: never a black square. */}
              {quick?.id === lastPhoto.id && <img class="last-shot-quick" src={quick.url} alt="" aria-hidden="true" />}
              <Thumb key={lastPhoto.id} photo={lastPhoto} onClick={() => go({ name: 'photo', id: lastPhoto.id })} label={t('cam.lastShot')} />
            </div>
          ) : (
            <button class={`roll-btn ${shot ? 'has-shots' : ''}`} onClick={() => setRollInfoOpen(true)} disabled={busy} aria-label={rollBtnLabel} data-testid="roll-btn">
              {/* The canister's ISO digits are decoration, not part of the button's name. */}
              <span class="roll-btn-can" aria-hidden="true">
                <Canister stock={stock} size={26} />
              </span>
              {shot ? (
                <span class="roll-btn-txt">
                  <small class="mono">{pillCount}</small>
                  <b>{t(kind === 'film' ? 'cam.develop' : kind === 'pack' ? 'cam.finishPack' : 'cam.finishCard')}</b>
                </span>
              ) : (
                <span class="roll-btn-txt">
                  <span class="mono">{t('cam.left', { n: left })}</span>
                </span>
              )}
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
            {camera.instant && lastPhoto && (
              <button class="icon-btn" onClick={() => setRollInfoOpen(true)} aria-label={rollBtnLabel} data-testid="roll-btn">
                <Canister stock={stock} size={22} />
              </button>
            )}
            <button class="icon-btn big" onClick={flip} disabled={busy || state === 'starting'} aria-label={facing === 'user' ? t('cam.flipToBack') : t('cam.flipToFront')} data-testid="btn-flip" data-facing={facing}>
              <Icon name="flip" size={26} />
            </button>
          </div>
        </div>
      ) : (
        <LoadPanel
          cameraId={camera.id}
          stockId={stock.id}
          size={camera.capacities.includes(rollSize) ? rollSize : defaultCapacity(camera)}
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

      <Sheet open={rollInfoOpen} onClose={() => setRollInfoOpen(false)} title={`${camera.name} · ${stock.name}`} testId="roll-sheet">
        <p class="muted">{cameraDescription(camera.id)}</p>
        <p class="mono big-num">
          {roll?.shots ?? 0} / {roll?.capacity ?? 0}
        </p>
        {/* "5 / 27" already says the roll size. Half-frame: the counter counts halves, the album counts frames. Say both. */}
        {roll && shot && camera.capture === 'half' && <p class="muted small">{shotsText(roll)}</p>}
        <button class="btn primary wide" onClick={onRewind} aria-describedby={shot ? 'finish-sub' : undefined} data-testid="btn-rewind">
          <Icon name="rewind" size={18} /> {shot ? t(kind === 'film' ? 'cam.rewind' : kind === 'pack' ? 'cam.finishPack' : 'cam.finishCard') : t('cam.unload')}
        </button>
        {shot && (
          <p class="muted small sheet-sub" id="finish-sub">
            {t(kind === 'film' ? 'cam.rewindSub' : 'cam.finishSubViewable')}
          </p>
        )}
        <button class="btn ghost wide" onClick={onSwitchBody} aria-describedby="switch-sub" data-testid="btn-switch-body">
          <Icon name="camera" size={18} /> {t('cam.switchBody')}
        </button>
        <p class="muted small sheet-sub" id="switch-sub">
          {shot ? t(kind === 'film' ? 'cam.switchSub' : 'cam.switchSubViewable') : t('cam.switchSubEmpty')}
        </p>
      </Sheet>

      <SpeedSheet open={speedOpen} onClose={closeSpeed} onPick={onSpeed} full={!!roll && framesLeft(roll) === 0} />
    </div>
  );
}

/**
 * Slowest first, so "Instant" ends bottom-right: exactly where the previous confirm's OK button was.
 * A double-tap on "Send to lab" then lands on Instant, never on "3 days".
 */
const SPEEDS: DevelopSpeed[] = ['3d', 'morning', '1h', 'instant'];
/** How long after the sheet opens a tap on the spot of the opening tap is treated as its repeat. */
const REPEAT_TAP_MS = 900;

/** The last pointer press anywhere (capture phase): where the tap that opened the sheet landed. */
let lastPress = { x: -1, y: -1, at: 0 };
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => (lastPress = { x: e.clientX, y: e.clientY, at: performance.now() }), { capture: true, passive: true });
}

export function SpeedSheet({ open, onClose, onPick, full }: { open: boolean; onClose: () => void; onPick: (s: DevelopSpeed) => void; full: boolean }) {
  const def = settings.value.defaultSpeed;
  // Read on every render: the sheet re-renders when it opens, so arrival times are current.
  const at = Date.now();
  /** When the sheet opened and where the tap that opened it was (a confirm's OK, the shutter). */
  const opened = useRef<{ at: number; x: number; y: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const now = performance.now();
    opened.current = now - lastPress.at < 1500 ? { at: now, x: lastPress.x, y: lastPress.y } : null;
  }, [open]);
  /**
   * The 2nd tap of a double-tap (350–700 ms later) lands where the 1st one did. Instant sits there by
   * design; any other speed under that spot ignores pointer taps for a moment. Keyboard picks always count.
   */
  const repeatTap = (e: MouseEvent, sp: DevelopSpeed): boolean => {
    const o = opened.current;
    if (!o || sp === 'instant' || e.detail === 0 || performance.now() - o.at > REPEAT_TAP_MS) return false;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return o.x >= r.left && o.x <= r.right && o.y >= r.top && o.y <= r.bottom;
  };
  return (
    <Sheet open={open} onClose={onClose} title={full ? t('cam.rollFull') : t('speed.title')} testId="speed-sheet">
      {full && <p class="muted">{t('speed.title')}</p>}
      <p class="muted small speed-why">{t('speed.why')}</p>
      <div class="speed-list">
        {SPEEDS.map((sp) => (
          <button
            key={sp}
            class={`speed ${sp === def ? 'def' : ''}`}
            onClick={(e) => {
              if (repeatTap(e, sp)) return;
              onPick(sp);
            }}
            // Focus starts on the default speed (Enter keeps the usual choice), not on the first card.
            data-autofocus={sp === def ? '' : undefined}
            data-testid={`speed-${sp}`}
          >
            <strong>
              {t(`speed.${sp}` as const)}
              {sp === def && <small class="speed-def"> · {t('speed.default')}</small>}
            </strong>
            <span class="speed-at tnum" data-testid={`speed-at-${sp}`}>
              {formatArrival(readyAtFor(sp, at), at, signalLang.value)}
            </span>
            <span>{t(`speed.${sp}.d` as const)}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
