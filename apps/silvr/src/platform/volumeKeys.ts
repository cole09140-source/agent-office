/**
 * Volume keys as the shutter (Android app, KeysPlugin.java). While `enabled`, the native side keeps the
 * keys from changing the volume and calls `onPress` once per press. A browser that reports the keys
 * (key "AudioVolumeUp" / "AudioVolumeDown") gets the same, without being able to stop the volume change.
 */
import { useEffect, useRef } from 'preact/hooks';
import { isNativeAndroid } from './share';

interface KeysPlugin {
  setVolumeShutter(opts: { enabled: boolean }): Promise<void>;
  addListener(event: 'volumeShutter', cb: (d: { key: string }) => void): Promise<{ remove: () => Promise<void> }>;
}

// Wrapped: a Capacitor plugin proxy answers every property, `then` included, so resolving a promise WITH
// the proxy would treat it as a thenable and never settle.
let plugin: Promise<{ k: KeysPlugin }> | null = null;
function keysBox(): Promise<{ k: KeysPlugin }> {
  plugin ??= import('@capacitor/core').then(({ registerPlugin }) => ({ k: registerPlugin<KeysPlugin>('SilvrKeys') }));
  return plugin;
}

/** Whether the volume keys can be the shutter here (the setting is shown only then). */
export function hasVolumeShutter(): boolean {
  return isNativeAndroid();
}

export const isVolumeKey = (key: string) => key === 'AudioVolumeUp' || key === 'AudioVolumeDown' || key === 'VolumeUp' || key === 'VolumeDown';

export function useVolumeShutter(enabled: boolean, onPress: () => void): void {
  const press = useRef(onPress);
  press.current = onPress;
  useEffect(() => {
    if (!enabled) return;
    // browsers / WebViews that report the key (also how e2e drives it)
    const onKey = (e: KeyboardEvent) => {
      if (!isVolumeKey(e.key) || e.repeat) return;
      e.preventDefault();
      press.current();
    };
    window.addEventListener('keydown', onKey);
    if (!isNativeAndroid()) return () => window.removeEventListener('keydown', onKey);
    let gone = false;
    let remove: (() => Promise<void>) | undefined;
    const on = () =>
      void keysBox()
        .then(({ k }) => (gone ? undefined : k.setVolumeShutter({ enabled: !document.hidden })))
        .catch(() => undefined);
    void keysBox()
      .then(({ k }) => k.addListener('volumeShutter', () => press.current()))
      .then((h) => (gone ? void h.remove() : (remove = h.remove)))
      .catch((err) => console.warn('[silvr] volume shutter unavailable', err));
    on();
    // Android hands the keys back to the system when the app pauses: ask again on return.
    document.addEventListener('visibilitychange', on);
    return () => {
      gone = true;
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', on);
      void remove?.();
      void keysBox()
        .then(({ k }) => k.setVolumeShutter({ enabled: false }))
        .catch(() => undefined);
    };
  }, [enabled]);
}
