import { computed, signal } from '@preact/signals';
import { detectLang } from '../i18n';
import { getActiveRoll, inCamera, listRolls, subscribe, type Roll } from '../store/rolls';
import { DEFAULT_SETTINGS, saveSettings, type Settings } from '../store/settings';
import { signalLang } from './lang';

export const settings = signal<Settings>({ ...DEFAULT_SETTINGS });
export const rolls = signal<Roll[]>([]);
export const activeRoll = signal<Roll | undefined>(undefined);
export const now = signal(Date.now());
export const ready = signal(false);

export const developingRolls = computed(() => rolls.value.filter((r) => r.status === 'developing'));
/** Rolls shown in the album: developed, plus instant/digital cameras' rolls still in the camera. */
export const developedRolls = computed(() => rolls.value.filter((r) => r.status === 'developed' || inCamera(r)));
export const newRollCount = computed(() => developedRolls.value.filter((r) => r.status === 'developed' && !r.seenAt).length);

export function applyLang(s: Settings): void {
  signalLang.value = s.lang === 'auto' ? detectLang() : s.lang;
  if (typeof document !== 'undefined') document.documentElement.lang = signalLang.value;
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const next = { ...settings.value, ...patch };
  settings.value = next;
  applyLang(next);
  await saveSettings(next);
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
