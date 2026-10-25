import { useEffect, useRef, useState } from 'preact/hooks';
import { importFile } from './camera/capture';
import { Icon, type IconName } from './components/Icon';
import { ConfirmDialog, Sheet, StockCard, Toasts } from './components/ui';
import { randomSeed } from './film/random';
import { defaultDevelop } from './film/resolve';
import { DEFAULT_STOCK_ID, getStock, STOCKS } from './film/stocks';
import { stockDescription, t, type MsgKey } from './i18n';
import { isIos, isStandalone, updateReady } from './platform/pwa';
import { get, put } from './store/db';
import { AnalogScreen, LogScreen } from './screens/Analog';
import { CameraScreen } from './screens/Camera';
import { DarkroomScreen } from './screens/Darkroom';
import { GalleryScreen } from './screens/Gallery';
import { LabScreen } from './screens/Lab';
import { Onboarding } from './screens/Onboarding';
import { PhotoScreen } from './screens/Photo';
import { RollScreen } from './screens/Roll';
import { SettingsScreen } from './screens/Settings';
import { confirmReq, developingRolls, newRollCount, now, ready, refreshRolls, rolls, settings, toast, updateSettings } from './state/app';
import { go, goTab, route, type Route } from './state/router';
import { importRoll, type ImportItem } from './store/rolls';

const TABS: { name: Route['name']; icon: IconName; label: MsgKey }[] = [
  { name: 'camera', icon: 'camera', label: 'tab.camera' },
  { name: 'lab', icon: 'lab', label: 'tab.lab' },
  { name: 'gallery', icon: 'gallery', label: 'tab.gallery' },
  { name: 'analog', icon: 'analog', label: 'tab.analog' },
  { name: 'settings', icon: 'settings', label: 'tab.settings' },
];

const TAB_OF: Record<Route['name'], Route['name']> = {
  camera: 'camera',
  lab: 'lab',
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
  const badges: Partial<Record<Route['name'], number>> = { lab: developingRolls.value.length, gallery: newRollCount.value };
  return (
    <nav class="tabbar" aria-label="SILVR">
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
          {!!badges[tab.name] && <i class="dot" aria-label={String(badges[tab.name])} />}
        </button>
      ))}
    </nav>
  );
}

function ImportSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [stockId, setStockId] = useState(DEFAULT_STOCK_ID);
  const [progress, setProgress] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const stock = getStock(stockId);
    const list = Array.from(files).filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif|avif)$/i.test(f.name));
    setProgress(0);
    const items: ImportItem[] = [];
    let failed = 0;
    for (const f of list) {
      try {
        const neg = await importFile(f);
        items.push({
          negative: neg.blob,
          width: neg.width,
          height: neg.height,
          takenAt: neg.takenAt,
          develop: defaultDevelop(stock, randomSeed(), {
            dateStamp: settings.value.dateStamp,
            leak: Math.random() < stock.leakChance ? randomSeed() : null,
          }),
        });
      } catch (err) {
        console.warn('[silvr] import failed', f.name, err);
        failed++;
      }
      setProgress(items.length + failed);
    }
    if (input.current) input.current.value = '';
    setProgress(null);
    if (failed) toast(t('err.import'));
    if (!items.length) return;
    items.sort((a, b) => a.takenAt - b.takenAt);
    try {
      const roll = await importRoll(stock.id, items);
      onClose();
      go({ name: 'roll', id: roll.id });
    } catch (err) {
      console.error('[silvr] import save failed', err);
      toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'));
    }
  };

  return (
    <Sheet open={open} onClose={() => progress === null && onClose()} title={t('gal.import')} testId="import-sheet">
      <p class="muted small">{stockDescription(stockId)}</p>
      <div class="stock-strip">
        {STOCKS.map((st) => (
          <StockCard key={st.id} stock={st} selected={st.id === stockId} onClick={() => setStockId(st.id)} />
        ))}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.currentTarget.files)} data-testid="import-input" />
      <button class="btn primary wide" disabled={progress !== null} onClick={() => input.current?.click()} data-testid="btn-pick-files">
        {progress !== null ? t('gal.importing', { n: progress }) : t('gal.import')}
      </button>
    </Sheet>
  );
}

/** Ticks the clock and announces rolls that finish developing while the app is open. */
function useLabClock() {
  const known = useRef<Set<string> | null>(null);
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
    const developed = rolls.value.filter((r) => r.status === 'developed');
    if (known.current === null) {
      if (ready.value) known.current = new Set(developed.map((r) => r.id));
      return;
    }
    for (const r of developed) {
      if (known.current.has(r.id)) continue;
      known.current.add(r.id);
      if (r.kind === 'camera' && r.readyAt !== r.finishedAt && !r.seenAt) {
        toast(t('lab.developedToast', { stock: getStock(r.stockId).name }), { label: t('lab.open'), run: () => go({ name: 'roll', id: r.id }) }, 6000);
      }
    }
  }, [rolls.value, ready.value]);
}

export function App() {
  const [importOpen, setImportOpen] = useState(false);
  const r = route.value;
  useLabClock();

  // Safari tabs lose storage after 7 idle days; nudge iOS users to install once.
  const onboarded = settings.value.onboarded;
  useEffect(() => {
    if (!ready.value || !onboarded || !isIos() || isStandalone()) return;
    get<boolean>('kv', 'iosHint')
      .then((seen) => {
        if (seen) return;
        toast(t('hint.ios'), undefined, 9000);
        return put('kv', true, 'iosHint');
      })
      .catch(() => undefined);
  }, [ready.value, onboarded]);

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

  if (!ready.value) return <div class="splash logo">SILVR</div>;

  const openImport = () => setImportOpen(true);
  let screen;
  switch (r.name) {
    case 'camera':
      screen = <CameraScreen onImport={openImport} />;
      break;
    case 'lab':
      screen = <LabScreen />;
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
    <div class={`app route-${r.name}`}>
      <main class="screen">{screen}</main>
      <TabBar />
      <ImportSheet open={importOpen} onClose={() => setImportOpen(false)} />
      <ConfirmDialog />
      <Toasts />
      {updateReady.value && (
        <div class="update-bar" role="status">
          <span>{t('update.ready')}</span>
          <button onClick={() => updateReady.value?.()}>{t('update.reload')}</button>
        </div>
      )}
      {!settings.value.onboarded && <Onboarding onDone={() => updateSettings({ onboarded: true })} />}
    </div>
  );
}
