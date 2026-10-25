import type { DateFormat } from '../film/overlays';
import { get, put } from './db';
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
