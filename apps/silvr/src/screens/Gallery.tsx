import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { Empty, formatDate, Header, Thumb } from '../components/ui';
import { getStock } from '../film/stocks';
import { t, legalLang, rollName } from '../i18n';
import { developedRolls } from '../state/app';
import { signalLang } from '../state/lang';
import { go, goTab } from '../state/router';
import { getCamera, hasCamera } from '../cameras/models';
import { isNative } from '../platform/share';
import { getPhoto, inCamera, photoCount, type Photo, type Roll } from '../store/rolls';
import { restoreRequest } from './Settings';
import { buildFolders, FolderCard } from './Folder';

/**
 * "12장", or for half-frame rolls "3프레임 (5컷)" (frames on the film, presses taken), like the camera.
 * `count`: photos actually on the roll when known (a deleted photo leaves frames = photos).
 */
export function framesText(r: Roll, count?: number): string {
  const frames = count ?? photoCount(r);
  const half = r.kind === 'camera' && hasCamera(r.cameraId) && getCamera(r.cameraId).capture === 'half';
  return half && r.shots > frames && frames === (r.negatives ?? frames) ? t('gal.framesHalf', { f: frames, n: r.shots }) : t('gal.frames', { n: frames });
}

/**
 * The day shown for an album group: when its photos were taken (camera groups are closed later, by a
 * camera change or the next day, so "finished" is not their date). Imports keep their import date.
 */
export function rollDate(r: Roll, first?: { takenAt: number }): number {
  if (r.kind === 'camera') return first?.takenAt ?? r.createdAt;
  return r.finishedAt ?? r.createdAt;
}

/** The help page (FAQ, contact) in the current language. */
export function HelpLink({ class: cls = '' }: { class?: string }) {
  return (
    <a class={`link-btn help-link ${cls}`} href={`./support.html?lang=${legalLang()}`} {...(isNative() ? {} : { target: '_blank', rel: 'noopener' })} data-testid="help-link">
      {t('gal.help')}
    </a>
  );
}

/** Settings, scrolled to "Restore from backup". */
function openRestore(): void {
  restoreRequest.value = true;
  goTab({ name: 'settings' });
}

function RollCard({ roll }: { roll: Roll }) {
  const [cover, setCover] = useState<Photo>();
  useEffect(() => {
    if (roll.coverPhotoId) getPhoto(roll.coverPhotoId).then(setCover);
  }, [roll.coverPhotoId]);
  const stock = getStock(roll.stockId);
  const open = () => go({ name: 'roll', id: roll.id });
  return (
    <li class="roll-card" data-testid="roll-card">
      {cover ? <Thumb photo={cover} onClick={open} label={stock.name} tabIndex={-1} /> : <button class="thumb" onClick={open} aria-label={stock.name} tabIndex={-1} />}
      <button class="roll-meta" onClick={open}>
        <strong>
          {roll.kind === 'import' ? t('gal.imported') : rollName(getCamera(roll.cameraId).name, stock.name)}
          {inCamera(roll) ? <span class="badge">{t('cam.inCamera')}</span> : !roll.seenAt && <span class="badge new">{t('gal.new')}</span>}
        </strong>
        <span class="muted small">
          {formatDate(rollDate(roll, cover), signalLang.value)} · {framesText(roll)}
          {roll.kind === 'import' && (
            <>
              {' · '}
              <bdi>{stock.name}</bdi>
            </>
          )}
        </span>
      </button>
    </li>
  );
}

export function GalleryScreen({ onImport }: { onImport: () => void }) {
  const list = developedRolls.value;
  return (
    <div class="page" data-testid="gallery-screen">
      <Header
        title={t('gal.title')}
        right={
          // Labelled: a bare arrow icon read as "save / download".
          <button class="btn ghost small hdr-import" onClick={onImport} data-testid="btn-import">
            <Icon name="plus" size={18} /> {t('gal.import')}
          </button>
        }
      />
      {list.length === 0 ? (
        <Empty title={t('gal.empty')} hint={t('gal.emptyHint')}>
          <button class="btn primary" onClick={() => goTab({ name: 'camera' })} data-testid="btn-gal-shoot">
            <Icon name="camera" size={18} /> {t('gal.shoot')}
          </button>
          {/* Fresh install, nothing anywhere yet: the way back to an old phone's photos. */}
          <button class="link-btn gal-restore" onClick={openRestore} data-testid="btn-gal-restore">
            {t('gal.restore')}
          </button>
          <HelpLink />
        </Empty>
      ) : (
        <>
          {/* Folders: every photo at once, and one per camera. */}
          <h2 class="gal-section">{t('gal.folders')}</h2>
          <ul class="folder-row" data-testid="folder-row">
            {buildFolders(list).map((f) => (
              <FolderCard key={f.id} folder={f} />
            ))}
          </ul>
          <h2 class="gal-section">{t('gal.groups')}</h2>
          <ul class="roll-grid">
            {list.map((r) => (
              <RollCard key={r.id} roll={r} />
            ))}
          </ul>
          <p class="gal-help">
            <HelpLink />
          </p>
        </>
      )}
    </div>
  );
}
