import type { DateFormat } from '../film/overlays';
import { atomic, get, put, rq } from './db';
import type { DevelopSpeed } from './rolls';

export type Lang = 'auto' | 'ko' | 'en';

export interface Settings {
  lang: Lang;
  sound: boolean;
  haptics: boolean;
  dateStamp: boolean;
  dateFormat: DateFormat;
  grid: boolean;
  mirrorFront: boolean;
  defaultRollSize: number;
  defaultSpeed: DevelopSpeed;
  onboarded: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'auto',
  sound: true,
  haptics: true,
  dateStamp: false,
  dateFormat: 'YMD',
  grid: false,
  mirrorFront: true,
  defaultRollSize: 24,
  defaultSpeed: 'instant',
  onboarded: false,
};

const KEY = 'settings';

export async function loadSettings(): Promise<Settings> {
  try {
    const saved = await get<Partial<Settings>>('kv', KEY);
    return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  } catch (err) {
    console.warn('[silvr] settings unavailable, using defaults', err);
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(s: Settings): Promise<void> {
  await put('kv', s, KEY);
}

/**
 * Merges a change into the stored settings in one transaction and returns the result,
 * so two tabs changing different settings never undo each other.
 */
export async function patchSettings(patch: Partial<Settings>): Promise<Settings> {
  return atomic(['kv'], async (t) => {
    const store = t.objectStore('kv');
    const saved = (await rq(store.get(KEY))) as Partial<Settings> | undefined;
    const next = { ...DEFAULT_SETTINGS, ...(saved ?? {}), ...patch };
    await rq(store.put(next, KEY));
    return next;
  });
}
