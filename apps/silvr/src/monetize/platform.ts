import { UNLIMITED_FLAG } from './config';

export type NativePlatform = 'android' | 'ios';

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

/**
 * The native shell the app runs in, or null for the web / PWA build. Safe outside a browser
 * (unit tests): the Capacitor bridge sets globalThis.Capacitor before any app script runs.
 */
export function nativePlatform(): NativePlatform | null {
  const cap = (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  const p = cap.getPlatform?.();
  return p === 'android' || p === 'ios' ? p : null;
}

/** Web-build-only QA hatch (see UNLIMITED_FLAG). Always false in the native apps. */
export function testUnlimited(): boolean {
  if (nativePlatform()) return false;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(UNLIMITED_FLAG) === '1';
  } catch {
    return false;
  }
}
