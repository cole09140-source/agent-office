import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { formatArrival } from '../components/arrival';
import { Empty, formatDate, formatDuration, Header, savedToastText, Sheet, Thumb, useObjectUrl } from '../components/ui';
import { contactSheet } from '../film/contactSheet';
import { borderImageRect } from '../film/overlays';
import { getStock } from '../film/stocks';
import { isolate, isRtl, ltr, rollName, t } from '../i18n';
import { pushBackHandler } from '../platform/back';
import { fileName, isNative, shareImages } from '../platform/share';
import { announce, confirm, now, rolls, settings, toast } from '../state/app';
import { signalLang } from '../state/lang';
import { back, go, goTab, isCurrent, route } from '../state/router';
import { ejectsPrints, getCamera, hasCamera } from '../cameras/models';
import { deleteRoll, ensurePrint, inCamera, listPhotos, markSeen, restoreRoll, subscribe, viewable, type DeletedRoll, type Photo } from '../store/rolls';
import { framesText } from './Gallery';

const SHEET_MAX_FRAMES = 72;
const LONG_PRESS_MS = 480;
/** After this long the tap no longer counts as a user gesture for navigator.share: offer a fresh tap. */
const GESTURE_MS = 3000;

type ShareFile = { blob: Blob; name: string };

/** The picture inside the stored print (its border cropped away), as fractions of the print. */
function pictureRect(p: Photo) {
  const turned = (p.develop.rotate ?? 0) % 2 === 1;
  return borderImageRect(p.develop.border, turned ? p.height : p.width, turned ? p.width : p.height);
}

/** Four-lens frames are a 2×2 grid: a square centre crop would scramble it. */
const isQuad = (p: Photo) => hasCamera(p.develop.cameraId) && getCamera(p.develop.cameraId).capture === 'quad';

/** Undo for a roll delete: puts it back and opens it again. */
async function undoDelete(snap: DeletedRoll): Promise<void> {
  try {
    if (!(await restoreRoll(snap))) {
      toast(snap.roll.status === 'loaded' ? t('gal.rollRestoreBlocked') : t('common.notFound'));
      return;
    }
  } catch (err) {
    console.error('[silvr] undo roll delete failed', err);
    toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'));
    return;
  }
  announce(t('gal.rollRestored'));
  const target = { name: 'roll' as const, id: snap.roll.id };
  if (!isCurrent(target)) go(target, route.value.name === 'roll');
}

export function RollScreen({ id }: { id: string }) {
  const roll = rolls.value.find((r) => r.id === id);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const [working, setWorking] = useState(false);
  const [sheet, setSheet] = useState<ShareFile | null>(null);
  const sheetUrl = useObjectUrl(sheet?.blob);
  // Multi-select (long-press a frame or "Select"): share or save several prints at once.
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** Prints gathered too slowly for the original tap to still open the share sheet. */
  const [ready, setReady] = useState<ShareFile[] | null>(null);
  const press = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  /** The click that ends a long press must not also open (or toggle) the photo. */
  const suppressClick = useRef(false);

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

  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  // Escape / Android back leave selection mode before leaving the roll.
  useEffect(() => {
    if (!selecting) return;
    const offBack = pushBackHandler(exitSelect);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || document.querySelector('.sheet-backdrop')) return;
      e.preventDefault();
      exitSelect();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      offBack();
      window.removeEventListener('keydown', onKey);
    };
  }, [selecting]);

  // Frames deleted elsewhere drop out of the selection.
  useEffect(() => {
    if (!photos || !selected.size) return;
    const ids = new Set(photos.map((p) => p.id));
    if ([...selected].some((s) => !ids.has(s))) setSelected(new Set([...selected].filter((s) => ids.has(s))));
  }, [photos]);

  const [sharing, setSharing] = useState(false);
  const sharingRef = useRef(false);

  if (!roll) {
    return (
      <div class="page">
        <Header title={t('gal.title')} onBack={() => back({ name: 'gallery' })} />
        <Empty title={photos === null ? t('common.loading') : t('common.notFound')} />
      </div>
    );
  }
  const stock = getStock(roll.stockId);

  const exportSheet = async () => {
    if (!photos?.length || working) return;
    setWorking(true);
    const frames: { image: ImageBitmap; width: number; height: number; frame: number; crop: ReturnType<typeof pictureRect> }[] = [];
    try {
      // A sheet holds a roll's worth (72 half frames); a 400-photo import would hold 400 bitmaps at once.
      for (const p of photos.slice(0, SHEET_MAX_FRAMES)) {
        if (!mounted.current) return; // left the roll: stop developing for a sheet nobody will see
        const pr = await ensurePrint(p, { dateFormat: settings.value.dateFormat });
        if (!pr) continue;
        const bmp = await createImageBitmap(pr.thumb);
        // The sheet draws its own film rebate: frames go on without their print border.
        frames.push({ image: bmp, width: bmp.width, height: bmp.height, frame: p.frame, crop: pictureRect(p) });
      }
      const blob = await contactSheet(frames, {
        title: `${isolate(stock.name)} · ${formatDate(roll.finishedAt ?? roll.createdAt, signalLang.value)}`,
        // A long day can hold more than one sheet's worth: say how many are on it out of how many.
        subtitle: `${ltr('FILM CAMELA')}  ·  ${ltr(`ISO ${stock.iso}`)}  ·  ${t('gal.frames', { n: frames.length })}${photos.length > frames.length ? ltr(` / ${photos.length}`) : ''}`,
        rtl: isRtl(),
        camera: hasCamera(roll.cameraId) ? getCamera(roll.cameraId).name : undefined,
        instant: hasCamera(roll.cameraId) && ejectsPrints(getCamera(roll.cameraId)),
      });
      const file = { blob, name: fileName('FilmCamela_contact', roll.finishedAt ?? roll.createdAt) };
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

  /** One save/share at a time (see Photo). Returns whether it went through (not cancelled / failed). */
  const send = async (files: ShareFile[], download: boolean): Promise<boolean> => {
    if (!files.length || sharingRef.current) return false;
    sharingRef.current = true;
    setSharing(true);
    try {
      const res = await shareImages(files, download);
      if (res === 'downloaded') toast(savedToastText());
      return res !== 'cancelled';
    } catch (err) {
      console.error('[silvr] share failed', err);
      toast((err as { code?: string })?.code === 'DENIED' ? t('err.storagePermission') : t('common.error'));
      return false;
    } finally {
      sharingRef.current = false;
      setSharing(false);
    }
  };

  const exportContact = (download: boolean) => {
    if (sheet) void send([sheet], download);
  };

  /** Prints of the selected frames, in roll order, with names that never collide. */
  const exportSelected = async (download: boolean) => {
    if (!photos || !selected.size || sharingRef.current || working) return;
    const started = Date.now();
    setWorking(true);
    const files: ShareFile[] = [];
    try {
      for (const p of photos.filter((x) => selected.has(x.id))) {
        const pr = await ensurePrint(p, { dateFormat: settings.value.dateFormat });
        if (pr) files.push({ blob: pr.print, name: fileName('FilmCamela', p.takenAt, pr.print.type === 'image/png' ? 'png' : 'jpg', p.frame) });
      }
    } catch (err) {
      console.error(err);
      toast(t('common.error'));
      return;
    } finally {
      setWorking(false);
    }
    if (!files.length || !mounted.current) return;
    // Developing took long: the share sheet needs a fresh tap (the native share sheet does not).
    if (!download && !isNative() && Date.now() - started > GESTURE_MS) {
      setReady(files);
      return;
    }
    if (await send(files, download)) exitSelect();
  };

  const remove = async () => {
    if (!(await confirm(t('gal.deleteRollConfirm', { n: photos?.length ?? roll.shots }), t('common.delete'), true, t('gal.deleteRollTitle')))) return;
    const snap = await deleteRoll(roll.id);
    // Soft delete, like a photo: the roll's records and negatives stay in memory while the toast offers an undo.
    if (snap) toast(t('gal.rollDeleted'), { label: t('common.undo'), run: () => void undoDelete(snap) }, 10_000);
    if (isCurrent({ name: 'roll', id: roll.id })) goTab({ name: 'gallery' }); // unwind past the deleted roll
  };

  const toggle = (pid: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });

  const startPress = (p: Photo, e: PointerEvent) => {
    if (selecting || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const x = e.clientX;
    const y = e.clientY;
    press.current = {
      x,
      y,
      timer: setTimeout(() => {
        press.current = null;
        suppressClick.current = true;
        setSelecting(true);
        setSelected(new Set([p.id]));
        navigator.vibrate?.(10);
      }, LONG_PRESS_MS),
    };
  };
  const endPress = () => {
    if (press.current) clearTimeout(press.current.timer);
    press.current = null;
  };
  const movePress = (e: PointerEvent) => {
    const pr = press.current;
    if (pr && Math.hypot(e.clientX - pr.x, e.clientY - pr.y) > 10) endPress();
  };
  const openOrToggle = (p: Photo) => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (selecting) toggle(p.id);
    else go({ name: 'photo', id: p.id });
  };

  const developing = !viewable(roll);
  // When it comes back from the lab ("오늘 오후 3:20 도착 · 59분 남음"), not how rolls get there.
  const n = now.value;
  const readyAt = roll.readyAt ?? n;
  const arrivalHint = readyAt > n ? `${formatArrival(readyAt, n, signalLang.value)} · ${t('lab.readyIn', { t: formatDuration(readyAt - n, signalLang.value) })}` : t('lab.ready');
  const camName = roll.kind === 'camera' ? getCamera(roll.cameraId).name : '';
  const count = selected.size;

  return (
    <div class={`page${selecting ? ' selecting' : ''}`} data-testid="roll-screen">
      {selecting ? (
        <Header
          title={t('roll.selectedN', { n: count })}
          sub={t('roll.selectHint')}
          right={
            <button class="btn ghost small" onClick={exitSelect} data-testid="btn-select-cancel">
              {t('common.cancel')}
            </button>
          }
        />
      ) : (
        <Header
          title={roll.kind === 'import' ? t('gal.imported') : rollName(camName, stock.name)}
          sub={`${inCamera(roll) ? t('cam.inCamera') : formatDate(roll.finishedAt ?? roll.createdAt, signalLang.value)} · ${framesText(roll, photos?.length)}`}
          onBack={() => back({ name: 'gallery' })}
          wrap
          right={
            <>
              <button class="btn ghost small hdr-text-btn" onClick={() => setSelecting(true)} disabled={developing || !photos?.length} data-testid="btn-select">
                {t('roll.select')}
              </button>
              <button class="icon-btn" onClick={exportSheet} disabled={working || developing || !photos?.length} aria-label={t('gal.contact')} data-testid="btn-contact">
                <Icon name="sheet" />
              </button>
              <button class="icon-btn" onClick={remove} aria-label={t('gal.deleteRoll')} data-testid="btn-delete-roll">
                <Icon name="trash" />
              </button>
            </>
          }
        />
      )}
      {developing ? (
        <Empty title={t('gal.developing')} hint={arrivalHint} />
      ) : (
        <ul class="photo-grid">
          {(photos ?? []).map((p) => {
            const on = selected.has(p.id);
            return (
              <li
                key={p.id}
                class={`${isQuad(p) ? 'quad' : ''}${on ? ' on' : ''}`}
                onPointerDown={(e) => startPress(p, e)}
                onPointerMove={movePress}
                onPointerUp={endPress}
                onPointerCancel={endPress}
                onPointerLeave={endPress}
                onContextMenu={(e) => (selecting || suppressClick.current) && e.preventDefault()}
              >
                <Thumb photo={p} onClick={() => openOrToggle(p)} tabIndex={selecting ? -1 : undefined} />
                <span class="frame-no mono">{p.frame}</span>
                {selecting && (
                  <button
                    type="button"
                    class="sel-toggle"
                    aria-pressed={on}
                    aria-label={t('roll.selectPhoto', { n: p.frame })}
                    onClick={() => openOrToggle(p)}
                    data-testid="sel-toggle"
                  >
                    <span class="sel-mark" aria-hidden="true">
                      {on && <Icon name="check" size={16} />}
                    </span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {selecting && (
        <div class="sel-bar" role="toolbar" aria-label={t('roll.selectedN', { n: count })}>
          <button class="btn ghost" onClick={() => void exportSelected(true)} disabled={!count || sharing || working} data-testid="btn-sel-save">
            <Icon name="download" size={18} /> {t('roll.saveN', { n: count })}
          </button>
          <button class="btn primary" onClick={() => void exportSelected(false)} disabled={!count || sharing || working} data-testid="btn-sel-share">
            <Icon name="share" size={18} /> {t('roll.shareN', { n: count })}
          </button>
        </div>
      )}
      {working && <div class="working mono">{t('view.developing')}</div>}
      <Sheet open={!!sheet} onClose={() => setSheet(null)} title={t('gal.contact')} testId="contact-sheet">
        {sheetUrl && <img class="contact-preview" src={sheetUrl} alt={t('gal.contact')} />}
        <div class="btn-row">
          <button class="btn ghost" onClick={() => exportContact(true)} disabled={sharing} data-testid="btn-contact-save">
            <Icon name="download" size={18} /> {t('view.saveImage')}
          </button>
          <button class="btn primary" onClick={() => exportContact(false)} disabled={sharing} data-testid="btn-contact-share">
            <Icon name="share" size={18} /> {t('view.share')}
          </button>
        </div>
      </Sheet>
      <Sheet open={!!ready} onClose={() => setReady(null)} title={t('roll.ready', { n: ready?.length ?? 0 })} testId="sel-ready">
        <div class="btn-row">
          <button
            class="btn ghost"
            onClick={() => ready && void send(ready, true).then((ok) => ok && (setReady(null), exitSelect()))}
            disabled={sharing}
            data-testid="btn-ready-save"
          >
            <Icon name="download" size={18} /> {t('roll.saveN', { n: ready?.length ?? 0 })}
          </button>
          <button
            class="btn primary"
            onClick={() => ready && void send(ready, false).then((ok) => ok && (setReady(null), exitSelect()))}
            disabled={sharing}
            data-testid="btn-ready-share"
          >
            <Icon name="share" size={18} /> {t('roll.shareN', { n: ready?.length ?? 0 })}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
