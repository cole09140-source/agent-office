import { computed, signal } from '@preact/signals';
import { detectLang, isLocaleLoaded, loadLocale, setDocumentLang } from '../i18n';
import { getActiveRoll, inCamera, listRolls, photoCount, subscribe, type Roll } from '../store/rolls';
import { setPinned } from '../cameras/pins';
import { DEFAULT_SETTINGS, loadSettings, patchSettingsWith, type Settings } from '../store/settings';
import { signalLang } from './lang';

export const settings = signal<Settings>({ ...DEFAULT_SETTINGS });
export const rolls = signal<Roll[]>([]);
export const activeRoll = signal<Roll | undefined>(undefined);
export const now = signal(Date.now());
export const ready = signal(false);
/** IndexedDB is unusable (locked-down private mode, blocked site data): nothing can be saved. */
export const storageError = signal(false);

export const developingRolls = computed(() => rolls.value.filter((r) => r.status === 'developing'));
/** Rolls shown in the album: developed ones, plus the roll still in the camera. */
/** A roll still in the camera shows once it holds a photo (all of them deleted again: hidden). */
export const developedRolls = computed(() => rolls.value.filter((r) => r.status === 'developed' || (inCamera(r) && photoCount(r) > 0)));
export const newRollCount = computed(() => developedRolls.value.filter((r) => r.status === 'developed' && !r.seenAt).length);

let langSeq = 0;

/**
 * Switches the UI language. A lazy locale loads first; until then the UI stays in its current
 * language (never half-translated). If the chunk cannot load, the language still switches and
 * every string falls back to English. <html lang> and dir follow.
 */
export function applyLang(s: Settings): Promise<void> {
  const lang = s.lang === 'auto' ? detectLang() : s.lang;
  const seq = ++langSeq;
  const commit = () => {
    if (seq !== langSeq) return; // a newer choice won
    signalLang.value = lang;
    setDocumentLang(lang);
  };
  if (isLocaleLoaded(lang)) {
    commit();
    return Promise.resolve();
  }
  return loadLocale(lang).then(commit, (err) => {
    console.warn(`[silvr] could not load the ${lang} messages; showing English`, err);
    commit();
  });
}

const settingsChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('silvr-settings') : null;
if (settingsChannel) {
  settingsChannel.onmessage = async (e: MessageEvent) => {
    if (e.data === 'reset') {
      location.reload(); // another tab wiped everything
      return;
    }
    const s = await loadSettings();
    settings.value = s;
    void applyLang(s);
  };
}

/** Tells other open tabs that everything was deleted. */
export function broadcastReset(): void {
  settingsChannel?.postMessage('reset');
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  return updateSettingsWith(() => patch);
}

/**
 * Applies a change computed from current settings: first to this tab's copy (instant UI),
 * then again inside the storage transaction against what is stored, so a change based on
 * a list (e.g. pinned cameras) merges with what another tab wrote meanwhile.
 */
export async function updateSettingsWith(change: (s: Settings) => Partial<Settings>): Promise<void> {
  const next = { ...settings.value, ...change(settings.value) };
  settings.value = next;
  void applyLang(next);
  try {
    // Merge into what is stored (another tab may have changed other settings), then adopt it.
    const saved = await patchSettingsWith(change);
    settings.value = saved;
    void applyLang(saved);
  } catch (err) {
    // Keep the change for this session; the banner already explains storage is unavailable.
    console.warn('[silvr] settings not saved', err);
    storageError.value = true;
    return;
  }
  settingsChannel?.postMessage('settings');
}

/** Pins or unpins a camera in the picker (merged atomically with other tabs' pins). */
export function setCameraPinned(id: string, pinned: boolean): Promise<void> {
  return updateSettingsWith((s) => ({ pinnedCameras: setPinned(s.pinnedCameras, id, pinned) }));
}

let refreshing: Promise<void> | null = null;
let again = false;

/** Re-reads rolls from storage. Coalesces bursts of change notifications. */
export function refreshRolls(): Promise<void> {
  if (refreshing) {
    again = true;
    return refreshing;
  }
  refreshing = (async () => {
    do {
      again = false;
      const [all, active] = await Promise.all([listRolls(Date.now()), getActiveRoll()]);
      rolls.value = all;
      activeRoll.value = active;
    } while (again);
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

subscribe(() => void refreshRolls());

// ---------- toasts ----------

export interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
  /** Same-kind toasts merge into one (e.g. "3 rolls developed · View"). */
  group?: string;
  count?: number;
}
export const toasts = signal<Toast[]>([]);
let toastId = 0;
/** A toast with a button stays at least this long: time to read it and reach the button. */
export const ACTION_TOAST_MS = 10_000;
/** At most this many toasts on screen: a third pushes the oldest (plain ones first) out. */
export const MAX_TOASTS = 2;

export interface ToastOptions {
  /** Toasts with the same group merge: the visible one is updated instead of stacking another. */
  group?: string;
  /** Text and action for a merged group of `n` (n ≥ 2). Without it the newest text replaces the old. */
  many?: (n: number) => { text: string; action?: Toast['action'] };
}

interface ToastTimer {
  handle?: ReturnType<typeof setTimeout>;
  /** Time left while paused; when running, the time it ends. */
  left: number;
  endsAt: number;
  pauses: number;
  onExpire?: () => void;
}
const toastTimers = new Map<number, ToastTimer>();

function runToastTimer(id: number, tm: ToastTimer): void {
  tm.endsAt = Date.now() + tm.left;
  tm.handle = setTimeout(() => dismissToast(id, true), tm.left);
}

/**
 * Shows a toast. One with an action stays ≥ 10 s and pauses while hovered or focused.
 * `onExpire` runs when it goes away without its action being used (e.g. finalize a delete).
 * Returns the toast's id.
 */
export function toast(text: string, action?: Toast['action'], ms = 3200, onExpire?: () => void, opts: ToastOptions = {}): number {
  const life = (a?: Toast['action']) => (a ? Math.max(ms, ACTION_TOAST_MS) : ms);
  const restart = (id: number, left: number) => {
    const tm = toastTimers.get(id);
    if (!tm) return;
    tm.left = Math.max(left, tm.pauses ? tm.left : 0);
    if (tm.pauses) return; // held by hover/focus: it restarts with the new time on resume
    if (tm.handle) clearTimeout(tm.handle);
    runToastTimer(id, tm);
  };
  // Same kind already showing: update it in place (one "3 rolls developed" instead of three toasts).
  const same = opts.group ? toasts.value.find((x) => x.group === opts.group) : undefined;
  if (same && !onExpire && !toastTimers.get(same.id)?.onExpire) {
    const count = (same.count ?? 1) + 1;
    const next = opts.many ? opts.many(count) : { text, action };
    toasts.value = toasts.value.map((x) => (x.id === same.id ? { ...x, text: next.text, action: next.action, count } : x));
    restart(same.id, life(next.action));
    return same.id;
  }
  // Exact repeat of a visible plain toast: keep one and give it its time again.
  // Not for toasts with a button (each delete's Undo undoes its own photo) or an expiry action.
  const dup = !action && !onExpire && toasts.value.find((x) => x.text === text && !x.action && !toastTimers.get(x.id)?.onExpire);
  if (dup) {
    restart(dup.id, life());
    return dup.id;
  }
  // Room for the new one: drop the oldest plain toast first, then the oldest of any kind.
  while (toasts.value.length >= MAX_TOASTS) {
    const victim = toasts.value.find((x) => !x.action) ?? toasts.value[0];
    dismissToast(victim.id, true);
  }
  const id = ++toastId;
  toasts.value = [...toasts.value, { id, text, action, group: opts.group, count: 1 }];
  const tm: ToastTimer = { left: life(action), endsAt: 0, pauses: 0, onExpire };
  toastTimers.set(id, tm);
  runToastTimer(id, tm);
  return id;
}

/** Removes a toast; `expired` runs its onExpire (not when its action was used). */
export function dismissToast(id: number, expired = false): void {
  const tm = toastTimers.get(id);
  if (tm?.handle) clearTimeout(tm.handle);
  toastTimers.delete(id);
  toasts.value = toasts.value.filter((x) => x.id !== id);
  if (expired) tm?.onExpire?.();
}

/** Hover / focus holds the toast; each pause needs a matching resume. */
export function pauseToast(id: number): void {
  const tm = toastTimers.get(id);
  if (!tm) return;
  if (tm.pauses++ === 0 && tm.handle) {
    clearTimeout(tm.handle);
    tm.handle = undefined;
    tm.left = Math.max(0, tm.endsAt - Date.now());
  }
}

export function resumeToast(id: number): void {
  const tm = toastTimers.get(id);
  if (!tm || tm.pauses === 0) return;
  if (--tm.pauses === 0) {
    // Leave a moment to come back to it after the pointer or focus moves away.
    tm.left = Math.max(tm.left, 3000);
    runToastTimer(id, tm);
  }
}

// ---------- screen-reader announcements ----------

/** Text of the app-wide polite live region (rendered by <Announcer/> in ui.tsx). */
export const announcement = signal('');
let announceHandle: ReturnType<typeof setTimeout> | undefined;

/**
 * Says something to screen readers once, without showing it (e.g. "Sunny 200 · 24 exposures loaded").
 * Repeating the same text announces it again.
 */
export function announce(text: string): void {
  if (announceHandle) clearTimeout(announceHandle);
  announcement.value = '';
  // A new text node after a tick makes screen readers read it even when the text is unchanged.
  announceHandle = setTimeout(() => {
    announcement.value = text;
    announceHandle = undefined;
  }, 60);
}

// ---------- confirm dialog ----------

export interface ConfirmReq {
  text: string;
  ok: string;
  danger?: boolean;
  /** Dialog title, ideally a question ("사진을 삭제할까요?"); defaults to the OK label. */
  title?: string;
  resolve: (v: boolean) => void;
}
export const confirmReq = signal<ConfirmReq | null>(null);

/**
 * Asks before doing something. Destructive confirms (`danger`) start on Cancel;
 * others start on the OK button so Enter goes ahead.
 */
export function confirm(text: string, ok: string, danger = false, title?: string): Promise<boolean> {
  return new Promise((resolve) => {
    confirmReq.value = { text, ok, danger, title, resolve };
  });
}
