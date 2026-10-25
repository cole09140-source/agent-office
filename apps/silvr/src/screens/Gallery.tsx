import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { Empty, formatDate, Header, Thumb } from '../components/ui';
import { getStock } from '../film/stocks';
import { t } from '../i18n';
import { developedRolls, developingRolls } from '../state/app';
import { signalLang } from '../state/lang';
import { go } from '../state/router';
import { getCamera } from '../cameras/models';
import { getPhoto, inCamera, type Photo, type Roll } from '../store/rolls';

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
          {formatDate(roll.finishedAt ?? roll.createdAt, signalLang.value)} · {t('gal.frames', { n: roll.negatives ?? roll.shots })}
          {roll.kind === 'import' && ` · ${stock.name}`}
        </span>
      </button>
    </li>
  );
}

export function GalleryScreen({ onImport }: { onImport: () => void }) {
  const list = developedRolls.value;
  const developing = developingRolls.value.length;
  return (
    <div class="page" data-testid="gallery-screen">
      <Header
        title={t('gal.title')}
        right={
          <button class="icon-btn" onClick={onImport} aria-label={t('gal.import')} data-testid="btn-import">
            <Icon name="import" />
          </button>
        }
      />
      {developing > 0 && (
        <button class="banner" onClick={() => go({ name: 'lab' }, true)}>
          <Icon name="lab" size={18} /> {t('gal.developing')} · {developing}
          <Icon name="chevron" size={16} />
        </button>
      )}
      {list.length === 0 ? (
        <Empty title={t('gal.empty')} hint={t('gal.emptyHint')}>
          <button class="btn ghost" onClick={onImport}>
            <Icon name="import" size={18} /> {t('gal.import')}
          </button>
        </Empty>
      ) : (
        <ul class="roll-grid">
          {list.map((r) => (
            <RollCard key={r.id} roll={r} />
          ))}
        </ul>
      )}
    </div>
  );
}
