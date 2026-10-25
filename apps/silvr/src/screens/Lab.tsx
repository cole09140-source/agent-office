import { Canister, Empty, formatDuration, Header } from '../components/ui';
import { canUse } from '../entitlements';
import { getStock } from '../film/stocks';
import { t } from '../i18n';
import { confirm, developingRolls, now } from '../state/app';
import { signalLang } from '../state/lang';
import { rushRoll } from '../store/rolls';

export function LabScreen() {
  const list = developingRolls.value;
  const n = now.value;
  return (
    <div class="page" data-testid="lab-screen">
      <Header title={t('lab.title')} />
      {list.length === 0 ? (
        <Empty title={t('lab.empty')} hint={t('lab.emptyHint')} />
      ) : (
        <ul class="lab-list">
          {list.map((r) => {
            const stock = getStock(r.stockId);
            const total = Math.max(1, (r.readyAt ?? n) - (r.finishedAt ?? n));
            const remaining = Math.max(0, (r.readyAt ?? n) - n);
            const pct = Math.min(100, Math.max(0, 100 - (remaining / total) * 100));
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
                  <strong>{stock.name}</strong>
                  <span class="muted">{t('gal.frames', { n: r.shots })}</span>
                  <div class="progress" role="progressbar" aria-label={stock.name} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span class="tnum small">{remaining > 0 ? t('lab.readyIn', { t: formatDuration(remaining, signalLang.value) }) : t('lab.ready')}</span>
                </div>
                {canUse('rushDevelop') && (
                  <button
                    class="btn ghost small"
                    data-testid="btn-rush"
                    onClick={async () => {
                      if (await confirm(t('lab.rushConfirm'), t('lab.rush'))) await rushRoll(r.id);
                    }}
                  >
                    {t('lab.rush')}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
