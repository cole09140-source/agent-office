import { signal } from '@preact/signals';
import { isNative } from './share';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const installPrompt = signal<BeforeInstallPromptEvent | null>(null);
export const updateReady = signal<(() => void) | null>(null);

export async function promptInstall(): Promise<void> {
  const e = installPrompt.value;
  if (!e) return;
  await e.prompt();
  await e.userChoice.catch(() => undefined);
  installPrompt.value = null;
}

export function initPwa(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt.value = e as BeforeInstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => (installPrompt.value = null));

  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  if (isNative()) {
    // The app bundle ships inside the native package; a SW would only serve stale files after store updates.
    void navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => void r.unregister()));
    return;
  }
  window.addEventListener('load', async () => {
    // On first install clients.claim() also fires controllerchange; only reload for real updates.
    const hadController = !!navigator.serviceWorker.controller;
    let userRequested = false;
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });
      const offerUpdate = (worker: ServiceWorker) => {
        updateReady.value = () => {
          userRequested = true;
          worker.postMessage({ type: 'SKIP_WAITING' });
        };
      };
      if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => {
          if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(w);
        });
      });
      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloading || !(hadController || userRequested)) return;
        reloading = true;
        location.reload();
      });
    } catch (err) {
      console.warn('[silvr] service worker registration failed', err);
    }
  });
}

export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}
