import { computed, signal } from '@preact/signals';
import { detectLang } from '../i18n';
import { getActiveRoll, inCamera, listRolls, subscribe, type Roll } from '../store/rolls';
import { DEFAULT_SETTINGS, loadSettings, patchSettings, type Settings } from '../store/settings';
import { signalLang } from './lang';

export const settings = signal<Settings>({ ...DEFAULT_SETTINGS });
export const rolls = signal<Roll[]>([]);
export const activeRoll = signal<Roll | undefined>(undefined);
export const now = signal(Date.now());
export const ready = signal(false);
/** IndexedDB is unusable (locked-down private mode, blocked site data): nothing can be saved. */
export const storageError = signal(false);

export const developingRolls = computed(() => rolls.value.filter((r) => r.status === 'developing'));
/** Rolls shown in the album: developed, plus instant/digital cameras' rolls still in the camera. */
export const developedRolls = computed(() => rolls.value.filter((r) => r.status === 'developed' || inCamera(r)));
export const newRollCount = computed(() => developedRolls.value.filter((r) => r.status === 'developed' && !r.seenAt).length);

export function applyLang(s: Settings): void {
  signalLang.value = s.lang === 'auto' ? detectLang() : s.lang;
  if (typeof document !== 'undefined') document.documentElement.lang = signalLang.value;
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
    applyLang(s);
  };
}

/** Tells other open tabs that everything was deleted. */
export function broadcastReset(): void {
  settingsChannel?.postMessage('reset');
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const next = { ...settings.value, ...patch };
  settings.value = next;
  applyLang(next);
  try {
    // Merge into what is stored (another tab may have changed other settings), then adopt it.
    const saved = await patchSettings(patch);
    settings.value = saved;
    applyLang(saved);
  } catch (err) {
    // Keep the change for this session; the banner already explains storage is unavailable.
    console.warn('[silvr] settings not saved', err);
    storageError.value = true;
    return;
  }
  settingsChannel?.postMessage('settings');
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
}
export const toasts = signal<Toast[]>([]);
let toastId = 0;

export function toast(text: string, action?: Toast['action'], ms = 3200): void {
  const id = ++toastId;
  toasts.value = [...toasts.value, { id, text, action }];
  setTimeout(() => {
    toasts.value = toasts.value.filter((x) => x.id !== id);
  }, ms);
}

// ---------- confirm dialog ----------

export interface ConfirmReq {
  text: string;
  ok: string;
  danger?: boolean;
  resolve: (v: boolean) => void;
}
export const confirmReq = signal<ConfirmReq | null>(null);

export function confirm(text: string, ok: string, danger = false): Promise<boolean> {
  return new Promise((resolve) => {
    confirmReq.value = { text, ok, danger, resolve };
  });
}
