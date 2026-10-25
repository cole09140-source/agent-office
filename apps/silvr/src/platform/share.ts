import { t } from '../i18n';

export type ShareResult = 'shared' | 'downloaded' | 'cancelled';

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
}

function capacitor(): CapacitorGlobal | undefined {
  return (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
}

export function isNative(): boolean {
  return !!capacitor()?.isNativePlatform?.();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Native (Capacitor) path: write to cache, then open the OS share sheet (which offers "Save Image"). */
async function nativeShare(files: { blob: Blob; name: string }[]): Promise<ShareResult> {
  // Loaded lazily so the web build never pays for the native plugins.
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
  const uris: string[] = [];
  try {
    for (const f of files) {
      const res = await Filesystem.writeFile({ path: f.name, data: await blobToBase64(f.blob), directory: Directory.Cache });
      uris.push(res.uri);
    }
    await Share.share({ title: t('share.title'), files: uris });
    return 'shared';
  } catch (err) {
    if (/cancel/i.test(String((err as Error)?.message ?? err))) return 'cancelled';
    throw err;
  } finally {
    for (const f of files) void Filesystem.deleteFile({ path: f.name, directory: Directory.Cache }).catch(() => undefined);
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
  if (isNative()) return nativeShare(files);
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

let lastSavedFile: string | null = null;

/**
 * Hands a (possibly large) non-image file to the user: native share sheet,
 * the Web Share sheet on iOS (where downloads are unreliable), else a download.
 */
export async function saveFile(blob: Blob, name: string): Promise<ShareResult> {
  if (isNative()) {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    // The share target (Drive, mail…) may still be reading the previous file when the
    // chooser returns, so it is only cleaned up on the next save.
    if (lastSavedFile && lastSavedFile !== name) void Filesystem.deleteFile({ path: lastSavedFile, directory: Directory.Cache }).catch(() => undefined);
    lastSavedFile = name;
    // Written in chunks so a few-hundred-MB backup never becomes one giant base64 string.
    const CHUNK = 3 * 1024 * 1024; // multiple of 3: chunks encode without padding
    try {
      let uri = '';
      for (let at = 0; at === 0 || at < blob.size; at += CHUNK) {
        const data = await blobToBase64(blob.slice(at, at + CHUNK));
        if (at === 0) uri = (await Filesystem.writeFile({ path: name, data, directory: Directory.Cache })).uri;
        else await Filesystem.appendFile({ path: name, data, directory: Directory.Cache });
      }
      await Share.share({ title: name, files: [uri] });
      return 'shared';
    } catch (err) {
      if (/cancel/i.test(String((err as Error)?.message ?? err))) return 'cancelled';
      void Filesystem.deleteFile({ path: name, directory: Directory.Cache }).catch(() => undefined);
      lastSavedFile = null;
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

export function fileName(prefix: string, ts: number, ext = 'jpg'): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${prefix}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
}
