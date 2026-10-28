import { useEffect, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { Empty, formatDate, Header, Sheet, Thumb, useObjectUrl } from '../components/ui';
import { contactSheet } from '../film/contactSheet';
import { getStock } from '../film/stocks';
import { t } from '../i18n';
import { fileName, shareImages } from '../platform/share';
import { confirm, rolls, settings, toast } from '../state/app';
import { signalLang } from '../state/lang';
import { back, go, isCurrent } from '../state/router';
import { getCamera } from '../cameras/models';
import { deleteRoll, ensurePrint, inCamera, listPhotos, markSeen, subscribe, viewable, type Photo } from '../store/rolls';

export function RollScreen({ id }: { id: string }) {
  const roll = rolls.value.find((r) => r.id === id);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [working, setWorking] = useState(false);
  const [sheet, setSheet] = useState<{ blob: Blob; name: string } | null>(null);
  const sheetUrl = useObjectUrl(sheet?.blob);

  useEffect(() => {
    let alive = true;
    const load = () => listPhotos(id).then((p) => alive && setPhotos(p));
    void load();
    const off = subscribe(load);
    return () => {
      alive = false;
      off();
    };
  }, [id]);

  useEffect(() => {
    if (roll?.status === 'developed' && !roll.seenAt) void markSeen(id);
  }, [roll?.status, roll?.seenAt, id]);

  if (!roll) {
    return (
      <div class="page">
        <Header title={t('gal.title')} onBack={() => back({ name: 'gallery' })} />
        <Empty title={photos === null ? t('common.loading') : t('gal.empty')} />
      </div>
    );
  }
  const stock = getStock(roll.stockId);

  const exportSheet = async () => {
    if (!photos?.length || working) return;
    setWorking(true);
    const frames: { image: ImageBitmap; width: number; height: number; frame: number }[] = [];
    try {
      for (const p of photos) {
        const pr = await ensurePrint(p, { dateFormat: settings.value.dateFormat });
        if (!pr) continue;
        const bmp = await createImageBitmap(pr.thumb);
        frames.push({ image: bmp, width: bmp.width, height: bmp.height, frame: p.frame });
      }
      const blob = await contactSheet(frames, {
        title: `${stock.name} · ${formatDate(roll.finishedAt ?? roll.createdAt, signalLang.value)}`,
        subtitle: `SILVR  ·  ISO ${stock.iso}  ·  ${photos.length} EXP`,
      });
      const file = { blob, name: fileName('SILVR_contact', roll.finishedAt ?? roll.createdAt) };
      // Building takes seconds, so the original tap no longer counts as a user gesture
      // for navigator.share; offer the share from a fresh tap instead.
      setSheet(file);
    } catch (err) {
      console.error(err);
      toast(t('common.error'));
    } finally {
      frames.forEach((f) => f.image.close?.());
      setWorking(false);
    }
  };

  const exportContact = async (download: boolean) => {
    if (!sheet) return;
    try {
      const res = await shareImages([sheet], download);
      if (res === 'downloaded') toast(t('view.savedToast'));
    } catch (err) {
      console.error('[silvr] share failed', err);
      toast(t('common.error'));
    }
  };

  const remove = async () => {
    if (await confirm(t('gal.deleteRollConfirm', { n: photos?.length ?? roll.shots }), t('common.delete'), true)) {
      await deleteRoll(roll.id);
      if (isCurrent({ name: 'roll', id: roll.id })) go({ name: 'gallery' }, true);
    }
  };

  const developing = !viewable(roll);
  const camName = roll.kind === 'camera' ? getCamera(roll.cameraId).name : '';

  return (
    <div class="page" data-testid="roll-screen">
      <Header
        title={roll.kind === 'import' ? t('gal.imported') : `${camName} · ${stock.name}`}
        sub={`${inCamera(roll) ? t('cam.inCamera') : formatDate(roll.finishedAt ?? roll.createdAt, signalLang.value)} · ${t('gal.frames', { n: photos?.length ?? roll.shots })}`}
        onBack={() => back({ name: 'gallery' })}
        right={
          <>
            <button class="icon-btn" onClick={exportSheet} disabled={working || developing} aria-label={t('gal.contact')} data-testid="btn-contact">
              <Icon name="sheet" />
            </button>
            <button class="icon-btn" onClick={remove} aria-label={t('gal.deleteRoll')} data-testid="btn-delete-roll">
              <Icon name="trash" />
            </button>
          </>
        }
      />
      {developing ? (
        <Empty title={t('gal.developing')} hint={t('lab.emptyHint')} />
      ) : (
        <ul class="photo-grid">
          {(photos ?? []).map((p) => (
            <li key={p.id}>
              <Thumb photo={p} onClick={() => go({ name: 'photo', id: p.id })} />
              <span class="frame-no mono">{p.frame}</span>
            </li>
          ))}
        </ul>
      )}
      {working && <div class="working mono">{t('view.developing')}</div>}
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={t('gal.contact')} testId="contact-sheet">
        {sheetUrl && <img class="contact-preview" src={sheetUrl} alt={t('gal.contact')} />}
        <div class="btn-row">
          <button class="btn ghost" onClick={() => void exportContact(true)} data-testid="btn-contact-save">
            <Icon name="download" size={18} /> {t('view.saveImage')}
          </button>
          <button class="btn primary" onClick={() => void exportContact(false)} data-testid="btn-contact-share">
            <Icon name="share" size={18} /> {t('view.share')}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
