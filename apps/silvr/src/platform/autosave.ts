/**
 * Auto-save: on Android every shot is also written to the phone's gallery, all in one album
 * (Pictures/Film Camela — GalleryPlugin.java). In the app the photos stay sorted by camera.
 * Runs in the background after the frame is committed: one print at a time, never blocking the shutter.
 * The web has no gallery to write to silently (a download per shot would be noise), so it is Android only.
 */
import { settings, toast } from '../state/app';
import { ensurePrint, type Photo } from '../store/rolls';
import { t } from '../i18n';
import { fileName, isNativeAndroid, saveToGallery } from './share';

let chain: Promise<void> = Promise.resolve();
let warned = false;

/**
 * Prints already in the phone's gallery (photo + develop recipe), so Save on the same print does not make
 * "… (1).jpg". A re-developed print (darkroom) is a new key and saves again. Kept in localStorage, last 600.
 */
const SAVED_KEY = 'fc-gallery-saved';
const savedKey = (p: Photo) => `${p.id}|${JSON.stringify(p.develop)}`;
function readSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export function isInGallery(p: Photo): boolean {
  return readSaved().includes(savedKey(p));
}
export function markInGallery(p: Photo): void {
  try {
    const list = readSaved().filter((k) => k !== savedKey(p));
    list.push(savedKey(p));
    localStorage.setItem(SAVED_KEY, JSON.stringify(list.slice(-600)));
  } catch {
    /* private mode / full storage: a second Save just makes a copy */
  }
}

/** Whether this device can auto-save (the setting is shown only then). */
export function canAutoSave(): boolean {
  return isNativeAndroid();
}

export function autoSave(photo: Photo): void {
  if (!canAutoSave() || !settings.value.autoSave) return;
  chain = chain
    .then(async () => {
      const r = await ensurePrint(photo, { dateFormat: settings.value.dateFormat });
      if (!r) return;
      const ext = r.print.type === 'image/png' ? 'png' : 'jpg';
      await saveToGallery([{ blob: r.print, name: fileName('FilmCamela', photo.takenAt, ext, photo.frame) }]);
      markInGallery(photo);
    })
    .catch((err) => {
      console.warn('[silvr] auto-save failed', err);
      // Said once per session: a denied storage permission (Android 7–9) would otherwise toast on every shot.
      if (!warned) {
        warned = true;
        toast((err as { code?: string })?.code === 'DENIED' ? t('err.storagePermission') : t('err.autoSave'));
      }
    });
}
