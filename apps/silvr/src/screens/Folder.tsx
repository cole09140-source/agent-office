import { useEffect, useState } from 'preact/hooks';
import { Empty, formatDate, Header, Thumb } from '../components/ui';
import { getCamera, hasCamera } from '../cameras/models';
import { t } from '../i18n';
import { developedRolls } from '../state/app';
import { signalLang } from '../state/lang';
import { back, go } from '../state/router';
import { getPhoto, listPhotos, photoCount, subscribe, type Photo, type Roll } from '../store/rolls';

/** Album folders: every photo, one folder per camera, and one for imported photos. */
export type FolderId = 'all' | 'import' | string;

/** Which folder a roll's photos belong to. */
export function folderOf(r: Roll): FolderId {
  if (r.kind === 'import') return 'import';
  return hasCamera(r.cameraId) ? getCamera(r.cameraId).id : getCamera(undefined).id;
}

export function folderName(id: FolderId): string {
  if (id === 'all') return t('gal.allPhotos');
  if (id === 'import') return t('gal.imported');
  return getCamera(id).name;
}

export interface Folder {
  id: FolderId;
  rolls: Roll[];
  count: number;
  /** The newest group's cover photo id. */
  coverId?: string;
}

/** Folders for the album, newest activity first; "All photos" leads. */
export function buildFolders(rolls: Roll[]): Folder[] {
  const map = new Map<FolderId, Roll[]>();
  for (const r of rolls) {
    const id = folderOf(r);
    map.set(id, [...(map.get(id) ?? []), r]);
  }
  const make = (id: FolderId, rs: Roll[]): Folder => {
    const sorted = [...rs].sort((a, b) => b.createdAt - a.createdAt);
    return { id, rolls: sorted, count: sorted.reduce((n, r) => n + photoCount(r), 0), coverId: sorted.find((r) => r.coverPhotoId)?.coverPhotoId };
  };
  const per = [...map.entries()].map(([id, rs]) => make(id, rs)).sort((a, b) => (b.rolls[0]?.createdAt ?? 0) - (a.rolls[0]?.createdAt ?? 0));
  return [make('all', rolls), ...per];
}

/** A folder card: cover, name, count. */
export function FolderCard({ folder }: { folder: Folder }) {
  const [cover, setCover] = useState<Photo>();
  useEffect(() => {
    let alive = true;
    if (folder.coverId) void getPhoto(folder.coverId).then((p) => alive && setCover(p));
    else setCover(undefined);
    return () => {
      alive = false;
    };
  }, [folder.coverId]);
  const open = () => go({ name: 'folder', id: folder.id });
  const name = folderName(folder.id);
  return (
    <li class={`folder-card ${folder.id === 'all' ? 'all' : ''}`} data-testid={`folder-${folder.id}`}>
      {cover ? <Thumb photo={cover} onClick={open} label={name} tabIndex={-1} /> : <button class="thumb" onClick={open} aria-label={name} tabIndex={-1} />}
      <button class="folder-meta" onClick={open}>
        <strong>
          <bdi>{name}</bdi>
        </strong>
        <span class="muted small">{t('gal.frames', { n: folder.count })}</span>
      </button>
    </li>
  );
}

const dayKey = (ts: number) => new Date(ts).toDateString();

/** One folder's photos, newest first, under a heading per day. */
export function FolderScreen({ id }: { id: FolderId }) {
  const rolls = developedRolls.value.filter((r) => id === 'all' || folderOf(r) === id);
  const key = rolls.map((r) => `${r.id}:${photoCount(r)}`).join(',');
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      Promise.all(rolls.map((r) => listPhotos(r.id)))
        .then((lists) => alive && setPhotos(lists.flat().sort((a, b) => b.takenAt - a.takenAt)))
        .catch(() => alive && setPhotos([]));
    void load();
    const off = subscribe(() => void load());
    return () => {
      alive = false;
      off();
    };
  }, [key]);

  const days: { key: string; ts: number; items: Photo[] }[] = [];
  for (const p of photos ?? []) {
    const k = dayKey(p.takenAt);
    const last = days[days.length - 1];
    if (last && last.key === k) last.items.push(p);
    else days.push({ key: k, ts: p.takenAt, items: [p] });
  }
  return (
    <div class="page" data-testid="folder-screen">
      <Header title={folderName(id)} sub={photos ? t('gal.frames', { n: photos.length }) : undefined} onBack={() => back({ name: 'gallery' })} />
      {photos !== null && photos.length === 0 ? (
        <Empty title={t('gal.empty')} hint={t('gal.emptyHint')} />
      ) : (
        days.map((d) => (
          <section key={d.key} class="folder-day" aria-label={formatDate(d.ts, signalLang.value)}>
            <h2 class="folder-day-title">
              {formatDate(d.ts, signalLang.value)} <span class="muted">{t('gal.frames', { n: d.items.length })}</span>
            </h2>
            <ul class="photo-grid">
              {d.items.map((p) => (
                <li key={p.id}>
                  <Thumb photo={p} onClick={() => go({ name: 'photo', id: p.id })} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
