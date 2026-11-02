import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { Empty, formatDate, Header, Thumb } from '../components/ui';
import { getStock } from '../film/stocks';
import { t } from '../i18n';
import { activeRoll, developedRolls, developingRolls } from '../state/app';
import { signalLang } from '../state/lang';
import { go, goTab } from '../state/router';
import { getCamera, hasCamera } from '../cameras/models';
import { isNative } from '../platform/share';
import { getPhoto, inCamera, type Photo, type Roll } from '../store/rolls';
import { hasShots, rollSheetRequest, shotsText } from './Camera';
import { restoreRequest } from './Settings';

/** A film roll in the camera with shots on it (instant/digital rolls already show in the album). */
export function filmInCamera(): Roll | undefined {
  const r = activeRoll.value;
  return r && r.status === 'loaded' && !inCamera(r) && hasShots(r) ? r : undefined;
}

/** Back to the camera with its roll sheet (finish & develop) open. */
export function developFromCamera(): void {
  rollSheetRequest.value = true;
  goTab({ name: 'camera' });
}

/**
 * "12장", or for half-frame rolls "3프레임 (5컷)" (frames on the film, presses taken), like the camera.
 * `count`: photos actually on the roll when known (a deleted photo leaves frames = photos).
 */
export function framesText(r: Roll, count?: number): string {
  const frames = count ?? r.negatives ?? r.shots;
  const half = r.kind === 'camera' && hasCamera(r.cameraId) && getCamera(r.cameraId).capture === 'half';
  return half && r.shots > frames && frames === (r.negatives ?? frames) ? t('gal.framesHalf', { f: frames, n: r.shots }) : t('gal.frames', { n: frames });
}

/** The help page (FAQ, contact) in the current language. */
export function HelpLink({ class: cls = '' }: { class?: string }) {
  return (
    <a class={`link-btn help-link ${cls}`} href={`./support.html?lang=${signalLang.value}`} {...(isNative() ? {} : { target: '_blank', rel: 'noopener' })} data-testid="help-link">
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
          {roll.kind === 'import' ? t('gal.imported') : `${getCamera(roll.cameraId).name} · ${stock.name}`}
          {inCamera(roll) ? <span class="badge">{t('cam.inCamera')}</span> : !roll.seenAt && <span class="badge new">{t('gal.new')}</span>}
        </strong>
        <span class="muted small">
          {formatDate(roll.finishedAt ?? roll.createdAt, signalLang.value)} · {framesText(roll)}
          {roll.kind === 'import' && ` · ${stock.name}`}
        </span>
      </button>
    </li>
  );
}

export function GalleryScreen({ onImport }: { onImport: () => void }) {
  const list = developedRolls.value;
  const developing = developingRolls.value.length;
  const camRoll = filmInCamera();
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
      {developing > 0 && (
        <button class="banner" onClick={() => go({ name: 'lab' }, true)}>
          <Icon name="lab" size={18} /> {t('gal.developing')} · {developing}
          <Icon name="chevron" size={16} />
        </button>
      )}
      {camRoll && list.length > 0 && (
        <button class="banner" onClick={developFromCamera} data-testid="banner-in-camera">
          <Icon name="camera" size={18} /> {t('gal.inCameraBanner', { shots: shotsText(camRoll) })}
          <Icon name="chevron" size={16} />
        </button>
      )}
      {list.length === 0 ? (
        <Empty
          title={t('gal.empty')}
          hint={camRoll ? t('gal.emptyHintCamera', { shots: shotsText(camRoll) }) : developing > 0 ? t('gal.emptyHintLab', { n: developing }) : t('gal.emptyHint')}
        >
          {camRoll && developing > 0 && <p class="empty-hint">{t('gal.emptyHintLab', { n: developing })}</p>}
          {camRoll && (
            <button class="btn primary" onClick={developFromCamera} data-testid="btn-develop-now">
              <Icon name="lab" size={18} /> {t('gal.developNow')}
            </button>
          )}
          {developing > 0 && (
            <button class={`btn ${camRoll ? 'ghost' : 'primary'}`} onClick={() => go({ name: 'lab' }, true)} data-testid="btn-open-lab">
              <Icon name="lab" size={18} /> {t('gal.openLab')}
            </button>
          )}
          {/* Fresh install, nothing anywhere yet: the way back to an old phone's photos. */}
          {!camRoll && developing === 0 && (
            <button class="link-btn gal-restore" onClick={openRestore} data-testid="btn-gal-restore">
              {t('gal.restore')}
            </button>
          )}
          <HelpLink />
        </Empty>
      ) : (
        <>
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
