import { t } from '../i18n';

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
}

function capacitor(): CapacitorGlobal | undefined {
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export function isNative(): boolean {
  return !!capacitor()?.isNativePlatform?.();
}

function isNativeAndroid(): boolean {
  return isNative() && capacitor()?.getPlatform?.() === 'android';
}

interface SilvrGalleryPlugin {
  saveImage(opts: { data: string; name: string; mime: string }): Promise<{ uri: string }>;
}

/** Android app: Save goes straight to Pictures/SILVR (app-local plugin, see GalleryPlugin.java). */
async function saveToGallery(files: { blob: Blob; name: string }[]): Promise<ShareResult> {
  const { registerPlugin } = await import('@capacitor/core');
  const gallery = registerPlugin<SilvrGalleryPlugin>('SilvrGallery');
  for (const f of files) {
    await gallery.saveImage({ data: await blobToBase64(f.blob), name: f.name, mime: f.blob.type || 'image/jpeg' });
  }
  return 'downloaded';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

type FsModule = typeof import('@capacitor/filesystem');

/**
 * Each native share/save gets its own cache folder (share-…/NAME): sharing the same photo
 * again never overwrites a file a share target (Instagram, mail, Drive…) may still be reading
 * after the chooser returns. Folders older than 10 minutes go on the next share; all of them
 * at start-up and on "delete all data" (clearShareCache).
 */
const SHARE_DIR = 'share-';
const shareDirs: { dir: string; at: number }[] = [];

function newShareDir({ Filesystem, Directory }: FsModule): string {
  const now = Date.now();
  for (let i = shareDirs.length - 1; i >= 0; i--) {
    if (now - shareDirs[i].at < 10 * 60_000) continue;
    void Filesystem.rmdir({ path: shareDirs[i].dir, directory: Directory.Cache, recursive: true }).catch(() => undefined);
    shareDirs.splice(i, 1);
  }
  const dir = `${SHARE_DIR}${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  shareDirs.push({ dir, at: now });
  return dir;
}

function dropShareDir({ Filesystem, Directory }: FsModule, dir: string): void {
  void Filesystem.rmdir({ path: dir, directory: Directory.Cache, recursive: true }).catch(() => undefined);
  const i = shareDirs.findIndex((d) => d.dir === dir);
  if (i >= 0) shareDirs.splice(i, 1);
}

const isCancel = (err: unknown) => /cancel/i.test(String((err as Error)?.message ?? err));

/** Native (Capacitor) path: write to cache, then open the OS share sheet (which offers "Save Image"). */
async function nativeShare(files: { blob: Blob; name: string }[]): Promise<ShareResult> {
  // Loaded lazily so the web build never pays for the native plugins.
  const [fs, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
  const dir = newShareDir(fs);
  const uris: string[] = [];
  try {
    for (const f of files) {
      const res = await fs.Filesystem.writeFile({ path: `${dir}/${f.name}`, data: await blobToBase64(f.blob), directory: fs.Directory.Cache, recursive: true });
      uris.push(res.uri);
    }
    await Share.share({ title: t('share.title'), files: uris });
    return 'shared';
  } catch (err) {
    if (isCancel(err)) return 'cancelled';
    dropShareDir(fs, dir);
    throw err;
  }
}

export function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Shares images through the best available channel: native share sheet,
 * Web Share with files, or a plain download.
 */
export async function shareImages(files: { blob: Blob; name: string }[], preferDownload = false): Promise<ShareResult> {
  if (isNative()) return preferDownload && isNativeAndroid() ? saveToGallery(files) : nativeShare(files);
  const fileObjs = files.map((f) => new File([f.blob], f.name, { type: f.blob.type || 'image/jpeg' }));
  // On iOS a download lands in Files (or does nothing in an installed PWA); the share sheet's "Save Image" reaches Photos.
  const viaShare = !preferDownload || isIos();
  if (viaShare && typeof navigator.canShare === 'function' && navigator.canShare({ files: fileObjs })) {
    try {
      await navigator.share({ files: fileObjs, title: t('share.title') });
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled';
      // Fall through to download (e.g. NotAllowedError without user activation).
    }
  }
  files.forEach((f, i) => setTimeout(() => download(f.blob, f.name), i * 250));
  return 'downloaded';
}

/**
 * Hands a (possibly large) non-image file to the user: native share sheet,
 * the Web Share sheet on iOS (where downloads are unreliable), else a download.
 */
export async function saveFile(blob: Blob, name: string): Promise<ShareResult> {
  if (isNative()) {
    const [fs, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const { Filesystem, Directory } = fs;
    const dir = newShareDir(fs);
    const path = `${dir}/${name}`;
    // Written in chunks so a few-hundred-MB backup never becomes one giant base64 string.
    const CHUNK = 3 * 1024 * 1024; // multiple of 3: chunks encode without padding
    try {
      let uri = '';
      for (let at = 0; at === 0 || at < blob.size; at += CHUNK) {
        const data = await blobToBase64(blob.slice(at, at + CHUNK));
        if (at === 0) uri = (await Filesystem.writeFile({ path, data, directory: Directory.Cache, recursive: true })).uri;
        else await Filesystem.appendFile({ path, data, directory: Directory.Cache });
      }
      await Share.share({ title: name, files: [uri] });
      return 'shared';
    } catch (err) {
      if (isCancel(err)) return 'cancelled';
      dropShareDir(fs, dir);
      throw err;
    }
  }
  const file = new File([blob], name, { type: blob.type || 'application/octet-stream' });
  // iOS: a download does nothing in an installed PWA; the share sheet ("Save to Files") works.
  // Call this straight from a tap — after a long await the gesture has expired.
  if (isIos() && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return 'shared';
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled';
    }
  }
  download(blob, name);
  return 'downloaded';
}

/**
 * Native only: deletes the share/save copies (prints, contact sheets, backup zips) left in the
 * app cache. The in-memory "clean up next time" lists die with the process, so this runs at
 * start-up and on "delete all data" — the privacy policy promises nothing is left behind.
 */
export async function clearShareCache(): Promise<void> {
  if (!isNative()) return;
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { files } = await Filesystem.readdir({ path: '', directory: Directory.Cache });
    await Promise.all(
      files.map((f) =>
        f.type === 'directory' && f.name.startsWith(SHARE_DIR)
          ? Filesystem.rmdir({ path: f.name, directory: Directory.Cache, recursive: true }).catch(() => undefined)
          : f.type === 'file' && f.name.startsWith('SILVR') // copies written by older versions
            ? Filesystem.deleteFile({ path: f.name, directory: Directory.Cache }).catch(() => undefined)
            : undefined,
      ),
    );
    shareDirs.length = 0;
  } catch {
    /* empty or unreadable cache: nothing to clean */
  }
}

export function fileName(prefix: string, ts: number, ext = 'jpg'): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${prefix}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
}
