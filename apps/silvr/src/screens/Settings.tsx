import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { formatBytes, Header, Segmented, Toggle } from '../components/ui';
import type { DateFormat } from '../film/overlays';
import { t } from '../i18n';
import { broadcastReset, confirm, settings, toast, updateSettings } from '../state/app';
import { BackupError, createBackup, restoreBackup } from '../store/backup';
import { clearAll } from '../store/db';
import { ROLL_SIZES, type DevelopSpeed } from '../store/rolls';
import type { Lang } from '../store/settings';
import { installPrompt, promptInstall } from '../platform/pwa';
import { fileName, saveFile } from '../platform/share';

declare const __APP_VERSION__: string;

export function SettingsScreen({ onReplayOnboarding }: { onReplayOnboarding: () => void }) {
  const s = settings.value;
  const [usage, setUsage] = useState<number | null>(null);
  const [persisted, setPersisted] = useState(false);

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage(e.usage ?? 0)).catch(() => undefined);
    navigator.storage?.persisted?.().then(setPersisted).catch(() => undefined);
  }, []);

  const [backupStatus, setBackupStatus] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = async () => {
    setBackupBusy(true);
    try {
      const now = Date.now();
      const { blob, summary } = await createBackup(now, (done, total) => setBackupStatus(t('set.backup.working', { done, total })));
      if (!summary.photos && !summary.logRolls) {
        setBackupStatus(t('set.backup.empty'));
        return;
      }
      const res = await saveFile(blob, fileName('SILVR_backup', now, 'zip'));
      setBackupStatus(res === 'cancelled' ? '' : t('set.backup.done', { rolls: summary.rolls, photos: summary.photos }));
    } catch (err) {
      console.error('[silvr] backup failed', err);
      setBackupStatus(t('set.backup.failed'));
    } finally {
      setBackupBusy(false);
    }
  };

  const importBackup = async (file: File | undefined) => {
    if (!file) return;
    setBackupBusy(true);
    setBackupStatus(t('set.backup.restoring'));
    try {
      const r = await restoreBackup(file);
      const lines = [t('set.backup.restored', { rolls: r.rolls, photos: r.photos })];
      if (r.skipped) lines.push(t('set.backup.skipped', { n: r.skipped }));
      if (r.damaged) lines.push(t('set.backup.damaged', { n: r.damaged }));
      setBackupStatus(lines.join(' · '));
      toast(lines[0]);
    } catch (err) {
      console.error('[silvr] restore failed', err);
      setBackupStatus(err instanceof BackupError ? t('set.backup.invalid') : t('set.backup.failed'));
    } finally {
      setBackupBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const reset = async () => {
    if (!(await confirm(t('set.resetConfirm'), t('set.reset'), true))) return;
    await clearAll();
    broadcastReset();
    location.hash = '#/camera';
    location.reload();
  };

  return (
    <div class="page" data-testid="settings-screen">
      <Header title={t('set.title')} />
      <section class="card">
        <div class="field">
          <span>{t('set.lang')}</span>
          <Segmented<Lang>
            label={t('set.lang')}
            value={s.lang}
            onChange={(lang) => updateSettings({ lang })}
            options={[
              { value: 'auto', label: t('set.lang.auto') },
              { value: 'ko', label: '한국어' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
        <Toggle label={t('set.sound')} checked={s.sound} onChange={(sound) => updateSettings({ sound })} />
        <Toggle label={t('set.haptics')} checked={s.haptics} onChange={(haptics) => updateSettings({ haptics })} />
        <Toggle label={t('set.grid')} checked={s.grid} onChange={(grid) => updateSettings({ grid })} />
        <Toggle label={t('set.mirror')} checked={s.mirrorFront} onChange={(mirrorFront) => updateSettings({ mirrorFront })} />
      </section>
      <section class="card">
        <Toggle label={t('set.dateStamp')} checked={s.dateStamp} onChange={(dateStamp) => updateSettings({ dateStamp })} testId="set-date" />
        <div class="field">
          <span>{t('set.dateFormat')}</span>
          <Segmented<DateFormat>
            label={t('set.dateFormat')}
            value={s.dateFormat}
            onChange={(dateFormat) => updateSettings({ dateFormat })}
            options={[
              { value: 'YMD', label: "'26 10 24" },
              { value: 'MDY', label: "10 24 '26" },
              { value: 'DMY', label: "24 10 '26" },
            ]}
          />
        </div>
        <div class="field">
          <span>{t('set.rollSize')}</span>
          <Segmented<number>
            label={t('set.rollSize')}
            value={s.defaultRollSize}
            onChange={(defaultRollSize) => updateSettings({ defaultRollSize })}
            options={ROLL_SIZES.map((n) => ({ value: n, label: t('cam.exposures', { n }) }))}
          />
        </div>
        <div class="field">
          <span>{t('set.speed')}</span>
          <Segmented<DevelopSpeed>
            grid
            label={t('set.speed')}
            value={s.defaultSpeed}
            onChange={(defaultSpeed) => updateSettings({ defaultSpeed })}
            options={(['instant', '1h', 'morning', '3d'] as DevelopSpeed[]).map((v) => ({ value: v, label: t(`speed.${v}` as const) }))}
          />
        </div>
      </section>
      <section class="card">
        <div class="row">
          <span>{t('set.storage')}</span>
          <span class="muted mono">{usage === null ? '—' : t('set.storage.used', { used: formatBytes(usage) })}</span>
        </div>
        {navigator.storage?.persist && (
          <button
            class="row link"
            disabled={persisted}
            onClick={async () => setPersisted(await navigator.storage.persist())}
          >
            <span>{t('set.storage.persist')}</span>
            <span class="muted">{persisted ? t('set.storage.persisted') : <Icon name="chevron" size={18} />}</span>
          </button>
        )}
        {installPrompt.value && (
          <button class="row link" onClick={promptInstall}>
            <span>{t('set.install')}</span>
            <Icon name="chevron" size={18} />
          </button>
        )}
      </section>
      <section class="card" aria-labelledby="backup-h">
        <div class="field">
          <span id="backup-h">{t('set.backup')}</span>
          <p class="muted small backup-hint">{t('set.backup.hint')}</p>
        </div>
        <button class="row link" onClick={exportBackup} disabled={backupBusy} data-testid="btn-backup">
          <span>{t('set.backup.export')}</span>
          <Icon name="chevron" size={18} />
        </button>
        <button class="row link" onClick={() => fileRef.current?.click()} disabled={backupBusy} data-testid="btn-restore">
          <span>{t('set.backup.import')}</span>
          <Icon name="chevron" size={18} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          hidden
          data-testid="restore-input"
          onChange={(e) => void importBackup((e.currentTarget as HTMLInputElement).files?.[0])}
        />
        <p class="muted small backup-status" role="status" aria-live="polite" data-testid="backup-status">
          {backupStatus}
        </p>
      </section>
      <section class="card">
        <a class="row link" href="./privacy.html" target="_blank" rel="noopener">
          <span>{t('set.privacy')}</span>
          <Icon name="chevron" size={18} />
        </a>
        <a class="row link" href="./terms.html" target="_blank" rel="noopener">
          <span>{t('set.terms')}</span>
          <Icon name="chevron" size={18} />
        </a>
        <a class="row link" href="./licenses.html" target="_blank" rel="noopener">
          <span>{t('set.licenses')}</span>
          <Icon name="chevron" size={18} />
        </a>
        <button class="row link" onClick={onReplayOnboarding}>
          <span>{t('set.replayOnb')}</span>
          <Icon name="chevron" size={18} />
        </button>
        <div class="row">
          <span>{t('set.version')}</span>
          <span class="muted mono">{__APP_VERSION__}</span>
        </div>
      </section>
      <button class="btn danger wide" onClick={reset} data-testid="btn-reset">
        {t('set.reset')}
      </button>
    </div>
  );
}
