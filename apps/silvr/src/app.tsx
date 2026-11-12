import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { importFile } from './camera/capture';
import { Icon, type IconName } from './components/Icon';
import { formatWait } from './intl/format';
import { Announcer, Canister, ConfirmDialog, Sheet, StockStrip, Toasts } from './components/ui';
import { DEFAULT_CAMERA_ID, getCamera, hasCamera, stockFits } from './cameras/models';
import { randomSeed } from './film/random';
import { defaultDevelop } from './film/resolve';
import { DEFAULT_STOCK_ID, getStock, STOCKS } from './film/stocks';
import { rollName, stockDescription, t, type MsgKey } from './i18n';
import { holdCapture, isIos, isStandalone, updateReady } from './platform/pwa';
import { clearShareCache, isNative } from './platform/share';
import { get, put } from './store/db';
import { AnalogScreen, LogScreen } from './screens/Analog';
import { CameraScreen } from './screens/Camera';
import { DarkroomScreen } from './screens/Darkroom';
import { GalleryScreen } from './screens/Gallery';
import { Onboarding } from './screens/Onboarding';
import { PhotoScreen } from './screens/Photo';
import { RollScreen } from './screens/Roll';
import { PaywallSheet, proRequest } from './screens/My';
import { restoreRequest, SettingsScreen } from './screens/Settings';
import { activeRoll, announce, confirmReq, developingRolls, newRollCount, now, ready, refreshRolls, rolls, settings, storageError, toast, updateSettings } from './state/app';
import { go, goTab, route, routeToHash, type Route } from './state/router';
import { addImportBatch, developAllNow, finishImport, IMPORT_BATCH, newImportRoll, type ImportItem, type RollStatus } from './store/rolls';

const TABS: { name: Route['name']; icon: IconName; label: MsgKey }[] = [
  { name: 'camera', icon: 'camera', label: 'tab.camera' },
  { name: 'gallery', icon: 'gallery', label: 'tab.gallery' },
  { name: 'analog', icon: 'analog', label: 'tab.analog' },
  { name: 'settings', icon: 'settings', label: 'tab.settings' },
];

const TAB_OF: Record<Route['name'], Route['name']> = {
  camera: 'camera',
  gallery: 'gallery',
  roll: 'gallery',
  photo: 'gallery',
  darkroom: 'gallery',
  analog: 'analog',
  log: 'analog',
  settings: 'settings',
};

function TabBar() {
  const current = TAB_OF[route.value.name];
  const badges: Partial<Record<Route['name'], number>> = { gallery: newRollCount.value };
  // Large text makes the bar taller: publish its real height (without the safe area) as --tab-h,
  // which the page padding, the camera layout and the floating bars below use.
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const root = document.documentElement;
    const measure = () => {
      const pad = parseFloat(getComputedStyle(el).paddingBottom) || 0;
      const h = Math.round(el.getBoundingClientRect().height - pad);
      if (h > 64) root.style.setProperty('--tab-h', `${h}px`);
      else root.style.removeProperty('--tab-h');
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty('--tab-h');
    };
  }, []);
  return (
    <nav class="tabbar" aria-label="Film Camela" ref={ref}>
      {TABS.map((tab) => (
        <button
          key={tab.name}
          class={current === tab.name ? 'on' : ''}
          aria-current={current === tab.name ? 'page' : undefined}
          onClick={() => goTab({ name: tab.name } as Route)}
          data-testid={`tab-${tab.name}`}
        >
          <Icon name={tab.icon} size={22} />
          <span>{t(tab.label)}</span>
          {!!badges[tab.name] && (
            <i class="dot" aria-hidden="true" />
          )}
          {!!badges[tab.name] && <span class="sr-only">({badges[tab.name]})</span>}
        </button>
      ))}
    </nav>
  );
}

/**
 * Films offered for imported photos, by the same format rules as the cameras: ordinary roll films
 * (as a 35mm body takes them, so no Snap 800 that only comes inside a disposable), then the instant
 * packs — an imported photo can still be printed with an instant frame, a look people ask for.
 * The CCD / pixel / toy sensors and other body-exclusive stocks belong to their cameras.
 */
export const IMPORT_STOCKS = (() => {
  const roll = getCamera(DEFAULT_CAMERA_ID);
  const ok = STOCKS.filter((st) => !st.exclusive && (st.kind === 'instant' || stockFits(roll, st)));
  return [...ok.filter((st) => st.kind !== 'instant'), ...ok.filter((st) => st.kind === 'instant')];
})();

function ImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stockId, setStockId] = useState(DEFAULT_STOCK_ID);
  const [progress, setProgress] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const importing = useRef(false);

  const onFiles = async (files: FileList | null) => {
    // One import at a time until it is saved: picking again meanwhile made a duplicate roll.
    if (!files?.length || importing.current) return;
    importing.current = true;
    const release = holdCapture(); // an update reload must not cut the import off
    try {
      await importFiles(files);
    } finally {
      release();
      importing.current = false;
      setProgress(null);
      if (input.current) input.current.value = '';
    }
  };

  const importFiles = async (files: FileList) => {
    const stock = getStock(stockId);
    const list = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(f.name));
    setTotal(list.length);
    setProgress(0);
    const roll = newImportRoll(stock.id);
    let batch: ImportItem[] = [];
    let saved = 0;
    let failed = 0;
    try {
      for (const f of list) {
        try {
          const neg = await importFile(f);
          batch.push({
            negative: neg.blob,
            width: neg.width,
            height: neg.height,
            takenAt: neg.takenAt,
            undated: !neg.dated,
            develop: defaultDevelop(stock, randomSeed(), {
              // Only stamp a date we actually know (EXIF); a file time would print the import day.
              dateStamp: settings.value.dateStamp && neg.dated,
              leak: Math.random() < stock.leakChance ? randomSeed() : null,
            }),
          });
        } catch (err) {
          console.warn('[silvr] import failed', f.name, err);
          failed++;
        }
        // Save as we go: holding every negative until the end runs a phone out of memory.
        if (batch.length >= IMPORT_BATCH) {
          await addImportBatch(roll, batch);
          saved += batch.length;
          batch = [];
        }
        setProgress(saved + batch.length + failed);
      }
      await addImportBatch(roll, batch);
      saved += batch.length;
    } catch (err) {
      console.error('[silvr] import save failed', err);
      toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'), undefined, 6000);
    }
    if (failed) toast(t('err.import'));
    if (!saved) return;
    // Whatever was saved stays, in shooting order.
    await finishImport(roll.id).catch((err) => console.error('[silvr] import order not saved', err));
    onClose();
    go({ name: 'roll', id: roll.id });
  };

  return (
    <Sheet open={open} onClose={() => progress === null && onClose()} title={t('gal.import')} testId="import-sheet">
      <p class="muted small import-hint">{t('gal.importHint')}</p>
      <div class="import-pick" data-testid="import-stock-preview">
        <Canister stock={getStock(stockId)} size={30} />
        <p>
          <strong>{getStock(stockId).name}</strong>
          <span class="muted small">{stockDescription(stockId)}</span>
        </p>
      </div>
      <StockStrip stocks={IMPORT_STOCKS} value={stockId} onChange={setStockId} />
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.currentTarget.files)} data-testid="import-input" />
      <button class="btn primary wide" disabled={progress !== null} onClick={() => input.current?.click()} data-testid="btn-pick-files">
        {progress !== null ? t('gal.importing', { n: progress, total }) : t('gal.import')}
      </button>
    </Sheet>
  );
}

/** Ticks the clock and announces rolls that finish developing while the app is open. */
function useLabClock() {
  const known = useRef<Set<string> | null>(null);
  /** Rolls this session saw in the lab: only they get a "developed" toast (a restore's old rolls don't). */
  const inLab = useRef(new Set<string>());
  // The lab tab is gone: a roll still waiting there from an older version is developed at once
  // (the "developed" toast below then points to it).
  useEffect(() => {
    if (ready.value && developingRolls.value.length) void developAllNow().catch(() => undefined);
  }, [ready.value, developingRolls.value.length]);
  useEffect(() => {
    const tick = () => {
      now.value = Date.now();
      const due = developingRolls.value.some((r) => (r.readyAt ?? 0) <= now.value);
      if (due) void refreshRolls();
    };
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    for (const r of rolls.value) if (r.status === 'developing') inLab.current.add(r.id);
    const developed = rolls.value.filter((r) => r.status === 'developed');
    if (known.current === null) {
      if (ready.value) known.current = new Set(developed.map((r) => r.id));
      return;
    }
    for (const r of developed) {
      if (known.current.has(r.id)) continue;
      known.current.add(r.id);
      if (r.kind === 'camera' && inLab.current.has(r.id) && r.readyAt !== r.finishedAt && !r.seenAt) {
        // Several rolls back at once (a rush, the app reopened after 9 AM): one "3 rolls developed · View".
        // Named like the lab and the album: "camera · film".
        const name = rollName(hasCamera(r.cameraId) ? getCamera(r.cameraId).name : undefined, getStock(r.stockId).name);
        toast(t('lab.developedToast', { stock: name }), { label: t('lab.open'), run: () => go({ name: 'roll', id: r.id }) }, 6000, undefined, {
          group: 'developed',
          many: (n) => ({ text: t('lab.developedMany', { n }), action: { label: t('lab.open'), run: () => goTab({ name: 'gallery' }) } }),
        });
      }
    }
  }, [rolls.value, ready.value]);
}

export { formatWait } from './intl/format';

/**
 * Tells screen readers about roll changes that happen without a screen change:
 * a roll loaded ("Sunny 200 · 24장 넣었어요") and a roll sent off ("현상소로 보냈어요 · 1시간 뒤 도착").
 * Lives here (not in the camera screen) so every way of loading/sending is covered.
 */
function useRollAnnouncements() {
  const prev = useRef<{ active?: string; status: Map<string, RollStatus> } | null>(null);
  useEffect(() => {
    if (!ready.value) return;
    const status = new Map(rolls.value.map((x) => [x.id, x.status]));
    const before = prev.current;
    const active = activeRoll.value;
    prev.current = { active: active?.id, status };
    if (!before) return; // first read after start: nothing changed in front of the user
    // A new roll starts silently whenever the camera changes: the camera strip says which camera it is.
    if (active && active.id !== before.active && !before.status.has(active.id)) return;
    for (const x of rolls.value) {
      // Sent to the lab with a wait (instant development opens the roll, which speaks for itself).
      if (before.status.get(x.id) === 'loaded' && x.status === 'developing' && x.readyAt && x.readyAt - Date.now() > 30_000) {
        announce(t('a11y.sentToLab', { wait: formatWait(x.readyAt - Date.now()) }));
        return;
      }
    }
  }, [rolls.value, activeRoll.value, ready.value]);
}

/** What to put focus back on when the same kind of screen replaces itself (photo → next photo). */
function focusKey(el: Element | null): string | null {
  if (!(el instanceof HTMLElement) || el === document.body) return null;
  const id = el.getAttribute('data-testid');
  if (id) return `[data-testid="${CSS.escape(id)}"]`;
  const label = el.getAttribute('aria-label');
  return label ? `[aria-label="${CSS.escape(label)}"]` : null;
}

/**
 * After a screen change, move focus to the new screen's heading (screen readers read where they are,
 * Tab starts at the top) without scrolling. Not on first load, not under onboarding or an open dialog.
 */
function useRouteFocus(r: Route, enabled: boolean) {
  const key = routeToHash(r);
  const last = useRef<{ key: string; name: string } | null>(null);
  const lastFocus = useRef<string | null>(null);
  // Remember the focused control while still on the old screen (updated on every focus move).
  useEffect(() => {
    const onFocus = (e: FocusEvent) => (lastFocus.current = focusKey(e.target as Element));
    document.addEventListener('focusin', onFocus);
    return () => document.removeEventListener('focusin', onFocus);
  }, []);
  useEffect(() => {
    const prev = last.current;
    last.current = { key, name: r.name };
    if (!prev || prev.key === key || !enabled) return;
    const sameKind = prev.name === r.name;
    const keep = sameKind ? lastFocus.current : null;
    let tries = 0;
    let handle: ReturnType<typeof setTimeout> | undefined;
    const attempt = () => {
      const active = document.activeElement;
      // Something on the new screen already took focus on purpose (a dialog, an input): leave it.
      if (active && active !== document.body && active.closest('[role=dialog], .onboarding')) return;
      const main = document.querySelector<HTMLElement>('main.screen');
      const again = keep ? main?.querySelector<HTMLElement>(keep) : null;
      if (again && !again.hasAttribute('disabled')) {
        again.focus({ preventScroll: true });
        return;
      }
      const h1 = main?.querySelector<HTMLElement>('h1');
      if (h1) {
        if (!h1.hasAttribute('tabindex')) h1.tabIndex = -1;
        h1.focus({ preventScroll: true });
        // Screens that swap their header once loaded (darkroom: loading → photo) drop the focused heading:
        // check again once the screen has settled and focus the new one.
        const settle = (wait: number) =>
          (handle = setTimeout(() => {
            const lost = !h1.isConnected && (!document.activeElement || document.activeElement === document.body);
            if (lost) attempt();
            else if (wait < 1000) settle(wait * 3);
          }, wait));
        if (settles++ < 3) settle(250);
      } else if (++tries < 20) handle = setTimeout(attempt, 50); // screens that render their heading after loading
    };
    let settles = 0;
    attempt();
    return () => handle && clearTimeout(handle);
  }, [key, enabled]);
}

/**
 * Where focus goes when the focused control disappears without a screen change. On the camera after
 * Load: the shutter (the next thing to press). Otherwise the screen's heading.
 */
function focusScreenStart(preferShutter: boolean): void {
  const main = document.querySelector<HTMLElement>('main.screen');
  if (!main) return;
  if (preferShutter && route.value.name === 'camera') {
    const shutter = main.querySelector<HTMLElement>('[data-testid="shutter"]');
    if (shutter && !shutter.hasAttribute('disabled')) {
      shutter.focus({ preventScroll: true });
      return;
    }
  }
  const h1 = main.querySelector<HTMLElement>('h1');
  if (!h1) return;
  if (!h1.hasAttribute('tabindex')) h1.tabIndex = -1;
  h1.focus({ preventScroll: true });
}

/**
 * Focus rescue: when the focused control is removed (the Load button once the roll is in, a rushed roll's
 * button, a toast's ×, Skip on the onboarding, the darkroom's loading header), browsers drop focus to
 * <body> and keyboard / screen-reader users start over from the top. Put it on the screen instead.
 */
function useFocusRescue() {
  useEffect(() => {
    let last: HTMLElement | null = null;
    let wasLoad = false;
    let queued = false;
    const onFocus = (e: FocusEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      last = e.target;
      wasLoad = e.target.getAttribute('data-testid') === 'btn-load';
    };
    const check = () => {
      queued = false;
      const active = document.activeElement;
      if ((active && active !== document.body) || !last || last.isConnected) return;
      // Open sheets and the onboarding put focus where it belongs themselves.
      if (document.querySelector('[role=dialog]')) return;
      last = null;
      focusScreenStart(wasLoad);
    };
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      setTimeout(check, 0);
    });
    document.addEventListener('focusin', onFocus);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      document.removeEventListener('focusin', onFocus);
      mo.disconnect();
    };
  }, []);
}

/**
 * From the onboarding's "restore a backup" link: Settings with Restore as the main action, in view and
 * focused (Settings reads restoreRequest, as for the album's restore link).
 */
function openRestore(): void {
  restoreRequest.value = true;
  void updateSettings({ onboarded: true });
  goTab({ name: 'settings' });
}

export function App() {
  // Leftover share/backup copies from an earlier session (native cache).
  useEffect(() => {
    void clearShareCache();
  }, []);

  const [importOpen, setImportOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const cameraShown = useRef(false);
  const r = route.value;
  useLabClock();
  useRollAnnouncements();
  useRouteFocus(r, settings.value.onboarded);
  useFocusRescue();

  // Safari tabs lose storage after 7 idle days; nudge iOS users to install once.
  const onboarded = settings.value.onboarded;
  useEffect(() => {
    // The App Store app is not a Safari tab: no "add to home screen" hint there.
    // Not on the camera: the hint would sit over the viewfinder. It shows on the next other screen.
    if (!ready.value || !onboarded || isNative() || !isIos() || isStandalone() || r.name === 'camera') return;
    get<boolean>('kv', 'iosHint')
      .then((seen) => {
        if (seen) return;
        toast(t('hint.ios'), undefined, 9000);
        return put('kv', true, 'iosHint');
      })
      .catch(() => undefined);
  }, [ready.value, onboarded, r.name]);

  // A shutter press with no shots left (free + earned) opens the paywall. The quota engine fires
  // 'fc:quota-exhausted' together with its quotaExhausted signal; the camera screen stays untouched.
  useEffect(() => {
    const onEmpty = () => {
      if (settings.value.onboarded) setPaywallOpen(true);
    };
    window.addEventListener('fc:quota-exhausted', onEmpty);
    return () => window.removeEventListener('fc:quota-exhausted', onEmpty);
  }, []);

  // A confirm left open by a route change (system back) must not act on the next screen.
  useEffect(() => {
    const req = confirmReq.value;
    if (req) {
      confirmReq.value = null;
      req.resolve(false);
    }
  }, [r.name, 'id' in r ? r.id : '']);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [r.name, 'id' in r ? r.id : '']);

  if (!ready.value) return <div class="splash logo">FILM CAMELA</div>;

  const openImport = () => setImportOpen(true);
  let screen;
  switch (r.name) {
    case 'camera':
      // Not under the first-run onboarding: the OS camera prompt would cover its first slide.
      // Once shown it stays (onboarding replayed from another tab must not drop a shot).
      if (settings.value.onboarded) cameraShown.current = true;
      screen = cameraShown.current ? <CameraScreen onImport={openImport} /> : null;
      break;
    case 'gallery':
      screen = <GalleryScreen onImport={openImport} />;
      break;
    case 'roll':
      screen = <RollScreen id={r.id} key={r.id} />;
      break;
    case 'photo':
      screen = <PhotoScreen id={r.id} key={r.id} />;
      break;
    case 'darkroom':
      screen = <DarkroomScreen id={r.id} key={r.id} />;
      break;
    case 'analog':
      screen = <AnalogScreen />;
      break;
    case 'log':
      screen = <LogScreen id={r.id} key={r.id} />;
      break;
    case 'settings':
      screen = <SettingsScreen onReplayOnboarding={() => updateSettings({ onboarded: false })} />;
      break;
  }

  return (
    <div class={`app route-${r.name}${updateReady.value ? ' has-update' : ''}`}>
      <main class="screen">
        {/* The camera screen has no visible title: name it for screen readers and focus moves.
            position: fixed keeps it out of layout measurements (offsetParent null). */}
        {r.name === 'camera' && (
          <h1 class="sr-only" style={{ position: 'fixed' }} tabIndex={-1}>
            {t('a11y.cameraTitle')}
          </h1>
        )}
        {storageError.value && (
          <p class="storage-banner" role="alert" data-testid="storage-banner">
            {t('err.noStorage')}
          </p>
        )}
        {screen}
      </main>
      <TabBar />
      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} />
      <PaywallSheet
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onGoPro={() => {
          setPaywallOpen(false);
          proRequest.value = true;
          goTab({ name: 'settings' });
        }}
      />
      <ConfirmDialog />
      <Toasts />
      <Announcer />
      {updateReady.value && (
        <div class="update-bar" role="status">
          <span>{t('update.ready')}</span>
          <button onClick={() => updateReady.value?.()}>{t('update.reload')}</button>
        </div>
      )}
      {!settings.value.onboarded && <Onboarding onDone={() => updateSettings({ onboarded: true })} onRestore={openRestore} />}
    </div>
  );
}
