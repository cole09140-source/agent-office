import { getCamera } from '../cameras/models';
import { Icon } from '../components/Icon';
import { formatArrival } from '../components/arrival';
import { Canister, Empty, formatDuration, Header } from '../components/ui';
import { canUse } from '../entitlements';
import { getStock } from '../film/stocks';
import { joinSentences, rollName, t } from '../i18n';
import { confirm, developingRolls, now } from '../state/app';
import { signalLang } from '../state/lang';
import { rushRoll } from '../store/rolls';
import { shotCount, shotsText } from './Camera';
import { developFromCamera, filmInCamera, framesText } from './Gallery';

export function LabScreen() {
  // Soonest arrival first: the roll you will see next sits on top.
  const list = [...developingRolls.value].sort((a, b) => (a.readyAt ?? 0) - (b.readyAt ?? 0));
  const n = now.value;
  const camRoll = filmInCamera();
  return (
    <div class="page" data-testid="lab-screen">
      <Header title={t('lab.title')} />
      {list.length === 0 ? (
        <Empty title={t('lab.empty')} hint={camRoll ? t('lab.emptyCamera', { shots: shotsText(camRoll), n: shotCount(camRoll) }) : t('lab.emptyWhat')}>
          {camRoll ? (
            <button class="btn primary" onClick={developFromCamera} data-testid="btn-develop-now">
              <Icon name="lab" size={18} /> {t('gal.developNow')}
            </button>
          ) : (
            <p class="empty-hint">{t('lab.emptyHow')}</p>
          )}
        </Empty>
      ) : (
        <>
          <p class="muted small lab-intro" data-testid="lab-intro">
            {canUse('rushDevelop') ? joinSentences(t('lab.intro'), t('lab.introRush')) : t('lab.intro')}
          </p>
          <ul class="lab-list">
            {list.map((r) => {
              const stock = getStock(r.stockId);
              // Named like the album: "camera · film".
              const name = rollName(getCamera(r.cameraId).name, stock.name);
              const total = Math.max(1, (r.readyAt ?? n) - (r.finishedAt ?? n));
              const remaining = Math.max(0, (r.readyAt ?? n) - n);
              const pct = Math.min(100, Math.max(0, 100 - (remaining / total) * 100));
              const etaParts = remaining > 0 ? [formatArrival(r.readyAt ?? n, n, signalLang.value), t('lab.readyIn', { t: formatDuration(remaining, signalLang.value) })] : [t('lab.ready')];
              const eta = etaParts.join(' · ');
              return (
                <li class="lab-item" key={r.id} data-testid="lab-item">
                  <div class="tank" aria-hidden="true">
                    <Canister stock={stock} size={36} />
                    <div class="bubbles">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  <div class="lab-body">
                    <strong class="lab-name">
                      {name}
                    </strong>
                    <span class="muted">{framesText(r)}</span>
                    <div class="progress" role="progressbar" aria-label={name} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-valuetext={eta}>
                      <span style={{ width: `${pct}%` }} />
                    </div>
                    <span class="tnum small lab-eta" data-testid="lab-eta">
                      {etaParts.map((p, i) => (
                        <>
                          {i > 0 && ' · '}
                          <span>{p}</span>
                        </>
                      ))}
                    </span>
                  </div>
                  {canUse('rushDevelop') && (
                    <button
                      class="btn ghost small"
                      // Starts with the visible words (WCAG 2.5.3): "Develop now · Pro 35 · Sunny 200".
                      aria-label={t('lab.rushFor', { stock: name })}
                      data-testid="btn-rush"
                      onClick={async () => {
                        if (await confirm(t('lab.rushConfirm'), t('lab.rush'), false, t('lab.rushTitle'))) await rushRoll(r.id);
                      }}
                    >
                      {t('lab.rush')}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
