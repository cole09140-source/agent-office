import { render } from 'preact';
import { App } from './app';
import { initPwa } from './platform/pwa';
import { applyLang, ready, refreshRolls, settings } from './state/app';
import { loadSettings } from './store/settings';
import './styles.css';

async function boot() {
  initPwa();
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
