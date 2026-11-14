import { Header } from '../components/ui';
import { CameraBody } from '../cameras/Body';
import { cameraGroup } from '../cameras/CameraRail';
import { CAMERAS } from '../cameras/models';
import { orderByPins } from '../cameras/pins';
import { SHOW_PRO_BADGES } from '../entitlements';
import { getStock } from '../film/stocks';
import { cameraDescription, eraText, t, type MsgKey } from '../i18n';
import { activeRoll, settings } from '../state/app';
import { goTab } from '../state/router';
import { cameraRequest } from './Camera';

const GROUPS = ['film', 'instant', 'digital', 'phone', 'toy'] as const;

/**
 * Every camera at a glance, by kind. A tap takes it straight to the camera tab, ready to shoot
 * (the same as picking it on the strip under the viewfinder).
 */
export function ModelsScreen() {
  const items = orderByPins(CAMERAS, settings.value.pinnedCameras).items;
  const pinned = new Set(settings.value.pinnedCameras);
  const inUse = activeRoll.value?.cameraId;
  const pick = (id: string) => {
    cameraRequest.value = id;
    goTab({ name: 'camera' });
  };
  return (
    <div class="page" data-testid="models-screen">
      <Header title={t('tab.models')} sub={t('models.sub', { n: CAMERAS.length })} />
      {GROUPS.map((g) => {
        const list = items.filter((c) => cameraGroup(c) === g);
        if (!list.length) return null;
        return (
          <section key={g} class="models-group" aria-labelledby={`models-${g}`}>
            <h2 id={`models-${g}`}>
              {t(`cam.group.${g}` as MsgKey)} <span class="muted">{list.length}</span>
            </h2>
            <ul class="models-grid">
              {list.map((c) => {
                const on = c.id === inUse;
                return (
                  <li key={c.id}>
                    <button type="button" class={`model-card ${on ? 'on' : ''}`} onClick={() => pick(c.id)} aria-current={on || undefined} data-testid={`model-${c.id}`}>
                      <span class="model-art" aria-hidden="true">
                        <CameraBody camera={c} width={84} />
                      </span>
                      <strong class="model-name">
                        <bdi>{c.name}</bdi>
                      </strong>
                      <span class="model-era">{eraText(c.era)}</span>
                      <span class="model-desc">{cameraDescription(c.id)}</span>
                      <span class="model-film mono">
                        <bdi>{getStock(c.defaultStock).name}</bdi>
                      </span>
                      {(on || pinned.has(c.id) || (SHOW_PRO_BADGES && c.pro)) && (
                        <span class="model-badges">
                          {on && <span class="badge">{t('models.inUse')}</span>}
                          {pinned.has(c.id) && <span class="badge ghost">{t('cam.pinned')}</span>}
                          {SHOW_PRO_BADGES && c.pro && <span class="badge">{t('common.pro')}</span>}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
