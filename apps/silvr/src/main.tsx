import { render } from 'preact';
import { App } from './app';
import { initNativeBack } from './platform/back';
import { initPwa } from './platform/pwa';
import { depth, go, route } from './state/router';
import { applyLang, ready, refreshRolls, settings } from './state/app';
import { loadSettings } from './store/settings';
import './styles.css';

async function boot() {
  initPwa();
  void initNativeBack({ depth, atRoot: () => route.value.name === 'camera', toRoot: () => go({ name: 'camera' }, true) });
  const s = await loadSettings();
  settings.value = s;
  applyLang(s);
  try {
    await refreshRolls();
  } catch (err) {
    console.error('[silvr] storage unavailable', err);
  }
  ready.value = true;
}

render(<App />, document.getElementById('app')!);
void boot();
