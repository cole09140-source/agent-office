import { signal } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { HelpLink } from './Gallery';
import { MySection } from './My';
import { formatBytes, Header, Segmented, Sheet, Toggle } from '../components/ui';
import type { DateFormat } from '../film/overlays';
import { bidi, isRtl, legalLang, LICENSES_LANG, ltr, t } from '../i18n';
import { ENDONYMS, HTML_LANG, LOCALES } from '../intl/locales';
import { broadcastReset, confirm, settings, toast, updateSettings } from '../state/app';
import { BackupError, createBackup, restoreBackup } from '../store/backup';
import { clearAll } from '../store/db';
import type { Lang } from '../store/settings';
import { holdCapture, installPrompt, promptInstall } from '../platform/pwa';
import { clearShareCache, fileName, isIos, isNative, saveFile } from '../platform/share';

declare const __APP_VERSION__: string;

// Module level: a long backup / restore keeps its progress and result when you leave Settings.
const backupStatusSig = signal('');
const backupBusySig = signal(false);
const backupFileSig = signal<{ blob: Blob; name: string; saved?: boolean } | null>(null);
const backupWhereSig = signal('');

/** Set by "Restore a backup" (onboarding, album): Settings opens on the restore button, shown as the main action. */
export const restoreRequest = signal(false);

/** The share sheet can carry a .zip here (native app, iOS Safari); Android Chrome cannot share one. */
function canSendFile(file: { blob: Blob; name: string }): boolean {
  if (isNative()) return true;
  try {
    const f = new File([file.blob], file.name, { type: 'application/zip' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [f] });
  } catch {
    return false;
  }
}

export function SettingsScreen({ onReplayOnboarding }: { onReplayOnboarding: () => void }) {
  const s = settings.value;
  /** One settings group at a time opens as a sheet; the page itself stays a short list. */
  const [group, setGroup] = useState<null | 'lang' | 'shoot' | 'date' | 'backup' | 'storage' | 'about'>(null);
  const [usage, setUsage] = useState<number | null>(null);
  // 'refused' stays visible: the toast alone left the button looking untouched.
  const [persisted, setPersisted] = useState<boolean | 'refused'>(false);
  const restoreRef = useRef<HTMLButtonElement>(null);
  // Came here to restore: for this visit "Restore from backup" is the primary button, not "Save backup".
  const [restoreFirst, setRestoreFirst] = useState(() => restoreRequest.value);
  const wantRestore = restoreRequest.value;

  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setUsage(e.usage ?? 0)).catch(() => undefined);
    navigator.storage?.persisted?.().then(setPersisted).catch(() => undefined);
  }, []);

  // Also when Settings is already open (onboarding replayed from here, then "restore a backup").
  useEffect(() => {
    if (!wantRestore) return;
    restoreRequest.value = false;
    setRestoreFirst(true);
    setGroup('backup');
    // After the screen-change focus (the heading) has run.
    const id = setTimeout(() => {
      restoreRef.current?.scrollIntoView({ block: 'center' });
      restoreRef.current?.focus({ preventScroll: true });
    }, 120);
    return () => clearTimeout(id);
  }, [wantRestore]);

  const backupStatus = backupStatusSig.value;
  const backupBusy = backupBusySig.value;
  const backupFile = backupFileSig.value;
  const setBackupStatus = (v: string) => (backupStatusSig.value = v);
  const setBackupBusy = (v: boolean) => (backupBusySig.value = v);
  const setBackupFile = (v: { blob: Blob; name: string; saved?: boolean } | null) => (backupFileSig.value = v);
  const backupWhere = backupWhereSig.value;
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = async () => {
    if (backupBusySig.value) return;
    setBackupBusy(true);
    setBackupFile(null);
    backupWhereSig.value = '';
    let built: { blob: Blob; name: string } | null = null;
    const release = holdCapture(); // an update reload waits for long backup / restore work
    try {
      const now = Date.now();
      const { blob, summary } = await createBackup(now, (done, total) => setBackupStatus(t('set.backup.working', { done, total })));
      // A roll holding only a waiting first exposure still has something worth moving to a new phone.
      if (!summary.photos && !summary.logRolls && !summary.pending) {
        setBackupStatus(t('set.backup.empty'));
        return;
      }
      built = { blob, name: fileName('FilmCamela_backup', now, 'zip') };
      setBackupFile(built);
      setBackupStatus(t('set.backup.done', { rolls: summary.rolls, photos: summary.photos }));
    } catch (err) {
      console.error('[silvr] backup failed', err);
      setBackupStatus(err instanceof BackupError && err.code === 'too-large' ? t('set.backup.tooLarge') : t('set.backup.failed'));
    } finally {
      release();
      setBackupBusy(false);
    }
    // One tap: save straight away. Only iOS Safari needs a fresh tap for its share sheet
    // (building took too long to still count as the user's gesture): it gets the "Ready · Save" step.
    if (built && !(isIos() && !isNative())) await saveBackup(built);
  };

  const saveBackup = async (file = backupFileSig.value) => {
    // Busy while writing: on native a big backup is written in chunks for seconds, and a second
    // tap would interleave its chunks into the same file or delete it under the share sheet.
    if (!file || backupBusySig.value) return;
    setBackupBusy(true);
    const release = holdCapture();
    try {
      const res = await saveFile(file.blob, file.name);
      if (res === 'cancelled') return;
      // On iOS web a plain download goes nowhere: only the share sheet counts as saved.
      if (res === 'downloaded' && isIos() && !isNative()) {
        setBackupStatus(t('set.backup.saveFailed'));
        return;
      }
      // Say where it went, and how it comes back.
      setBackupStatus(res === 'downloaded' && !isNative() ? t('set.backup.savedWeb', { name: ltr(file.name) }) : t('set.backup.savedShared', { name: ltr(file.name) }));
      backupWhereSig.value = t('set.backup.restoreHint');
      setBackupFile({ ...file, saved: true });
    } catch (err) {
      console.error('[silvr] backup save failed', err);
      setBackupStatus(t('set.backup.saveFailed'));
    } finally {
      release();
      setBackupBusy(false);
    }
  };

  /** After saving: hand the same .zip to the share sheet (KakaoTalk, Drive…) to move it to the new phone. */
  const sendBackup = async () => {
    const file = backupFileSig.value;
    if (!file || backupBusySig.value) return;
    // Native: saveFile is the share sheet already (it writes the file in chunks, so it stays busy-guarded).
    if (isNative()) return saveBackup(file);
    try {
      await navigator.share({ files: [new File([file.blob], file.name, { type: 'application/zip' })], title: file.name });
      setBackupStatus(t('set.backup.savedShared', { name: ltr(file.name) }));
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('[silvr] backup share failed', err);
        setBackupStatus(t('set.backup.saveFailed'));
      }
    }
  };

  const importBackup = async (file: File | undefined) => {
    if (!file || backupBusySig.value) return;
    setBackupBusy(true);
    setBackupStatus(t('set.backup.restoring'));
    backupWhereSig.value = '';
    const release = holdCapture();
    try {
      const r = await restoreBackup(file);
      const lines = [t('set.backup.restored', { rolls: r.rolls, photos: r.photos })];
      if (r.skipped) lines.push(t('set.backup.skipped', { n: r.skipped }));
      if (r.damaged) lines.push(t('set.backup.damaged', { n: r.damaged }));
      setBackupStatus(lines.join(' · '));
      toast(lines[0]);
    } catch (err) {
      console.error('[silvr] restore failed', err);
      const partial = (err as { partial?: { rolls: number } }).partial;
      if (err instanceof BackupError) setBackupStatus(err.code === 'newer' ? t('set.backup.newer') : t('set.backup.invalid'));
      else if (partial?.rolls) setBackupStatus(t('set.backup.partial', { rolls: partial.rolls }));
      else setBackupStatus(t('set.backup.failed'));
    } finally {
      release();
      setBackupBusy(false);
      if (fileRef.current) fileRef.current.value = '';
      // Keyboard / screen-reader users stay on the button they pressed (focus may have dropped to the page).
      const active = document.activeElement;
      if (restoreRef.current?.isConnected && (!active || active === document.body)) restoreRef.current.focus({ preventScroll: true });
    }
  };

  const reset = async () => {
    // The confirm text points to the backup first: this cannot be undone.
    if (!(await confirm(t('set.resetConfirm'), t('set.reset'), true))) return;
    await clearAll();
    await clearShareCache();
    broadcastReset();
    location.hash = '#/camera';
    location.reload();
  };

  // In the native apps a new window has nowhere to go (iOS hands capacitor:// to the system and
  // nothing opens), so legal pages open in place and link back to Settings.
  const legalLink = isNative() ? {} : { target: '_blank', rel: 'noopener' };

  return (
    <div class="page settings" data-testid="settings-screen">
      {/* The tab is "MY": shots, ads and Pro first, then the settings as before. */}
      <Header title={t('tab.settings')} />
      <MySection />
      <h2 class="my-settings-h">{t('set.title')}</h2>
      {/* iOS-style list: each row names its group and its current value, and opens it as a sheet. */}
      <section class="card set-list" data-testid="settings-list">
        <button class="row link" onClick={() => setGroup('lang')} aria-haspopup="dialog" data-testid="set-row-lang">
          <span>{t('set.lang')}</span>
          <span class="row-val">{s.lang === 'auto' ? t('set.lang.auto') : ENDONYMS[s.lang]}<Icon name="chevron" size={18} /></span>
        </button>
        <button class="row link" onClick={() => setGroup('shoot')} aria-haspopup="dialog" data-testid="set-row-shoot">
          <span>{t('set.shooting')}</span>
          <span class="row-val">{t('set.shooting.sum')}<Icon name="chevron" size={18} /></span>
        </button>
        <button class="row link" onClick={() => setGroup('date')} aria-haspopup="dialog" data-testid="set-row-date">
          <span>{t('set.dateStamp')}</span>
          <span class="row-val">{s.dateStamp ? t('common.on') : t('common.off')}<Icon name="chevron" size={18} /></span>
        </button>
        <button class="row link" onClick={() => setGroup('backup')} aria-haspopup="dialog" data-testid="set-row-backup">
          <span>{t('set.backup')}</span>
          <span class="row-val"><Icon name="chevron" size={18} /></span>
        </button>
        <button class="row link" onClick={() => setGroup('storage')} aria-haspopup="dialog" data-testid="set-row-storage">
          <span>{t('set.storage')}</span>
          <span class="row-val mono">{usage === null ? '' : ltr(formatBytes(usage))}<Icon name="chevron" size={18} /></span>
        </button>
        <button class="row link" onClick={() => setGroup('about')} aria-haspopup="dialog" data-testid="set-row-about">
          <span>{t('set.about')}</span>
          <span class="row-val mono" dir="ltr">{__APP_VERSION__}<Icon name="chevron" size={18} /></span>
        </button>
      </section>
      <Sheet open={group === 'lang'} onClose={() => setGroup(null)} title={t('set.lang')} testId="sheet-lang">
        <div class="field">
          <span id="lang-h">{t('set.lang')}</span>
          {/* Language names are endonyms (never translated), each marked with its own lang/dir. */}
          <Segmented<Lang>
            list
            label={t('set.lang')}
            value={s.lang}
            onChange={(lang) => updateSettings({ lang })}
            testId="lang-picker"
            options={[
              { value: 'auto', label: t('set.lang.auto') },
              ...LOCALES.map((l) => ({ value: l, label: ENDONYMS[l], lang: HTML_LANG[l], dir: isRtl(l) ? ('rtl' as const) : ('ltr' as const) })),
            ]}
          />
        </div>
      </Sheet>
      <Sheet open={group === 'shoot'} onClose={() => setGroup(null)} title={t('set.shooting')} testId="sheet-shoot">
        <div class="set-sheet">
        <Toggle label={t('set.sound')} checked={s.sound} onChange={(sound) => updateSettings({ sound })} />
        <Toggle label={t('set.haptics')} checked={s.haptics} onChange={(haptics) => updateSettings({ haptics })} />
        <Toggle label={t('set.grid')} checked={s.grid} onChange={(grid) => updateSettings({ grid })} />
        <Toggle label={t('set.mirror')} checked={s.mirrorFront} onChange={(mirrorFront) => updateSettings({ mirrorFront })} />
        </div>
      </Sheet>
      <Sheet open={group === 'date'} onClose={() => setGroup(null)} title={t('set.dateStamp')} testId="sheet-date">
      <div class="set-sheet">
        <Toggle label={t('set.dateStamp')} checked={s.dateStamp} onChange={(dateStamp) => updateSettings({ dateStamp })} testId="set-date" />
        <div class="field">
          <span>{t('set.dateFormat')}</span>
          <Segmented<DateFormat>
            label={t('set.dateFormat')}
            value={s.dateFormat}
            onChange={(dateFormat) => updateSettings({ dateFormat })}
            options={[
              { value: 'YMD', label: "'26 10 24", dir: 'ltr' },
              { value: 'MDY', label: "10 24 '26", dir: 'ltr' },
              { value: 'DMY', label: "24 10 '26", dir: 'ltr' },
            ]}
          />
        </div>
      </div>
      </Sheet>
      <Sheet open={group === 'backup'} onClose={() => setGroup(null)} title={t('set.backup')} testId="sheet-backup">
      <div class="set-sheet">
        <div class="field">
          <span id="backup-h">{t('set.backup')}</span>
          <p class="muted small backup-hint">{bidi(t('set.backup.hint'))}</p>
          <HelpLink class="small" />
        </div>
        {backupFile && !backupFile.saved ? (
          // Built but not saved yet (iOS Safari, or the share sheet was dismissed): one clear next step.
          <button class="btn primary wide backup-save" onClick={() => void saveBackup()} disabled={backupBusy} data-testid="btn-backup-save">
            <Icon name="download" size={18} /> {t('set.backup.save')}
          </button>
        ) : (
          <button class={`btn ${restoreFirst ? 'ghost' : 'primary'} wide backup-save`} onClick={() => void exportBackup()} disabled={backupBusy} data-testid="btn-backup">
            <Icon name="download" size={18} /> {bidi(t('set.backup.export'))}
          </button>
        )}
        <p class="muted small backup-status" role="status" aria-live="polite" data-testid="backup-status">
          {backupStatus}
          {backupWhere && <span class="backup-where">{backupWhere}</span>}
        </p>
        {backupFile?.saved && canSendFile(backupFile) && (
          <button class="btn ghost wide backup-send" onClick={() => void sendBackup()} disabled={backupBusy} data-testid="btn-backup-send">
            <Icon name="share" size={18} /> {t('set.backup.send')}
          </button>
        )}
        {/* Native: saving is the share sheet, so "send" above is the same thing. */}
        {backupFile?.saved && !isNative() && (
          <button class="link-btn backup-again" onClick={() => void saveBackup()} disabled={backupBusy} data-testid="btn-backup-save">
            {t('set.backup.saveAgain')}
          </button>
        )}
        {/* aria-disabled, not disabled: a disabled button drops keyboard focus to the page mid-restore. */}
        <button
          ref={restoreRef}
          class={`btn ${restoreFirst ? 'primary' : 'ghost'} wide backup-restore`}
          onClick={() => !backupBusySig.value && fileRef.current?.click()}
          aria-disabled={backupBusy || undefined}
          data-testid="btn-restore"
        >
          {t('set.backup.import')}
        </button>
        <input
          ref={fileRef}
          type="file"
          hidden
          data-testid="restore-input"
          onChange={(e) => void importBackup((e.currentTarget as HTMLInputElement).files?.[0])}
        />
      </div>
      </Sheet>
      <Sheet open={group === 'storage'} onClose={() => setGroup(null)} title={t('set.storage')} testId="sheet-storage">
      <div class="set-sheet">
        <div class="row">
          <span>{t('set.storage')}</span>
          <span class="muted mono">{usage === null ? '—' : t('set.storage.used', { used: ltr(formatBytes(usage)) })}</span>
        </div>
        {/* App storage is already durable in the native apps. */}
        {!isNative() && navigator.storage?.persist && (
          <div class="row persist-row">
            <span class="persist-txt">
              <span>{t('set.storage.persist')}</span>
              <small class="muted">{t('set.storage.persistHint')}</small>
              {persisted === 'refused' && (
                <small class="persist-why" role="status">
                  {t('set.storage.refused')}
                </small>
              )}
            </span>
            {persisted === true ? (
              <span class="muted persist-on" data-testid="persist-state" data-state="on">
                <Icon name="check" size={16} /> {t('set.storage.persisted')}
              </span>
            ) : persisted === 'refused' ? (
              <span class="muted persist-on persist-refused" data-testid="persist-state" data-state="refused">
                {t('set.storage.refusedShort')}
              </span>
            ) : (
              <button
                class="btn ghost small"
                data-testid="btn-persist"
                onClick={async () => {
                  const ok = await navigator.storage.persist().catch(() => false);
                  setPersisted(ok || 'refused');
                }}
              >
                {t('set.storage.persistAsk')}
              </button>
            )}
          </div>
        )}
        {installPrompt.value && (
          <button class="row link" onClick={promptInstall}>
            <span>{t('set.install')}</span>
            <Icon name="chevron" size={18} />
          </button>
        )}
      </div>
      </Sheet>
      <Sheet open={group === 'about'} onClose={() => setGroup(null)} title={t('set.about')} testId="sheet-about">
      <div class="set-sheet">
        <a class="row link" href={`./privacy.html?lang=${legalLang()}`} {...legalLink}>
          <span>{t('set.privacy')}</span>
          <Icon name="chevron" size={18} />
        </a>
        <a class="row link" href={`./terms.html?lang=${legalLang()}`} {...legalLink}>
          <span>{t('set.terms')}</span>
          <Icon name="chevron" size={18} />
        </a>
        <a class="row link" href={`./support.html?lang=${legalLang()}`} {...legalLink}>
          <span>{t('set.support')}</span>
          <Icon name="chevron" size={18} />
        </a>
        <a class="row link" href={`./licenses.html?lang=${LICENSES_LANG}`} {...legalLink}>
          <span>{t('set.licenses')}</span>
          <Icon name="chevron" size={18} />
        </a>
        <button class="row link" onClick={() => { setGroup(null); onReplayOnboarding(); }} data-testid="btn-replay-intro">
          <span>{t('set.replayOnb')}</span>
          <Icon name="chevron" size={18} />
        </button>
        <div class="row">
          <span>{t('set.version')}</span>
          <span class="muted mono" dir="ltr">{__APP_VERSION__}</span>
        </div>
      </div>
      <button class="btn danger wide" onClick={reset} data-testid="btn-reset">
        {t('set.reset')}
      </button>
      </Sheet>
      {/* Same operator name as terms.html: 아티움그룹 주식회사 / ATIUM GROUP Co., Ltd. */}
      <p class="muted small app-credit">{bidi(t('set.credit'))}</p>
    </div>
  );
}
