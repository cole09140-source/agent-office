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
  for (const f of files) {
    const res = await Filesystem.writeFile({ path: f.name, data: await blobToBase64(f.blob), directory: Directory.Cache });
    uris.push(res.uri);
  }
  try {
    await Share.share({ title: t('share.title'), files: uris });
    return 'shared';
  } catch {
    return 'cancelled';
  }
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
  if (!preferDownload && typeof navigator.canShare === 'function' && navigator.canShare({ files: fileObjs })) {
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

export function fileName(prefix: string, ts: number, ext = 'jpg'): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${prefix}_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
}
