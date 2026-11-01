import { normalizePins } from '../cameras/pins';
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
  /** Camera ids pinned to the front of the picker, in pin order (newest last). */
  pinnedCameras: string[];
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
  pinnedCameras: [],
};

const KEY = 'settings';

/** Fills in defaults and repairs fields an older build or a bad write could have left malformed. */
function withDefaults(saved: Partial<Settings> | undefined): Settings {
  const s = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  s.pinnedCameras = normalizePins(s.pinnedCameras);
  return s;
}

export async function loadSettings(): Promise<Settings> {
  try {
    const saved = await get<Partial<Settings>>('kv', KEY);
    return withDefaults(saved);
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
  return patchSettingsWith(() => patch);
}

/**
 * Like patchSettings, but the change is computed from the stored settings inside the
 * transaction (e.g. adding one pin to a list another tab may have just changed).
 */
export async function patchSettingsWith(change: (saved: Settings) => Partial<Settings>): Promise<Settings> {
  return atomic(['kv'], async (t) => {
    const store = t.objectStore('kv');
    const saved = withDefaults((await rq(store.get(KEY))) as Partial<Settings> | undefined);
    const next = withDefaults({ ...saved, ...change(saved) });
    await rq(store.put(next, KEY));
    return next;
  });
}
