const DB_NAME = 'silvr';
const DB_VERSION = 1;

export type StoreName = 'rolls' | 'photos' | 'blobs' | 'logRolls' | 'logFrames' | 'kv';

let dbPromise: Promise<IDBDatabase> | null = null;

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('rolls')) db.createObjectStore('rolls', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('photos')) {
        const s = db.createObjectStore('photos', { keyPath: 'id' });
        s.createIndex('rollId', 'rollId');
      }
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
      if (!db.objectStoreNames.contains('logRolls')) db.createObjectStore('logRolls', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('logFrames')) {
        const s = db.createObjectStore('logFrames', { keyPath: 'id' });
        s.createIndex('rollId', 'rollId');
      }
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    open.onsuccess = () => {
      const db = open.result;
      // Forget dead connections (another tab upgrading, iOS dropping the IDB server
      // after backgrounding) so the next call reopens instead of failing forever.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    open.onerror = () => {
      dbPromise = null;
      reject(open.error);
    };
    open.onblocked = () => console.warn('[silvr] IndexedDB upgrade blocked by another tab');
  });
  return dbPromise;
}

/** Test hook: forget the cached connection (used with fake-indexeddb resets). */
export function resetDbConnection(): void {
  dbPromise?.then((db) => db.close()).catch(() => undefined);
  dbPromise = null;
}

/** Runs `fn` with a live connection, reopening once if the cached one has died. */
async function withDb<T>(fn: (db: IDBDatabase) => Promise<T>): Promise<T> {
  try {
    return await fn(await openDb());
  } catch (err) {
    if ((err as DOMException)?.name !== 'InvalidStateError') throw err;
    dbPromise = null;
    return fn(await openDb());
  }
}

export async function get<T>(store: StoreName, key: IDBValidKey): Promise<T | undefined> {
  return withDb((db) => req(db.transaction(store).objectStore(store).get(key)) as Promise<T | undefined>);
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  return withDb((db) => req(db.transaction(store).objectStore(store).getAll()) as Promise<T[]>);
}

export async function getAllByIndex<T>(store: StoreName, index: string, key: IDBValidKey): Promise<T[]> {
  return withDb((db) => req(db.transaction(store).objectStore(store).index(index).getAll(key)) as Promise<T[]>);
}

export async function put<T>(store: StoreName, value: T, key?: IDBValidKey): Promise<void> {
  await withDb((db) => req(db.transaction(store, 'readwrite').objectStore(store).put(value, key)));
}

export async function del(store: StoreName, key: IDBValidKey | IDBKeyRange): Promise<void> {
  await withDb((db) => req(db.transaction(store, 'readwrite').objectStore(store).delete(key)));
}

/** Runs several writes atomically across stores. */
export async function tx(stores: StoreName[], fn: (t: IDBTransaction) => void): Promise<void> {
  await withDb(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const t = db.transaction(stores, 'readwrite');
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error ?? new Error('transaction aborted'));
        try {
          fn(t);
        } catch (err) {
          // A synchronous failure (e.g. QuotaExceededError from put) must roll back
          // the writes already queued, or we'd commit half a shot.
          try {
            t.abort();
          } catch {
            /* already finished */
          }
          reject(err);
        }
      }),
  );
}

export async function clearAll(): Promise<void> {
  const stores: StoreName[] = ['rolls', 'photos', 'blobs', 'logRolls', 'logFrames', 'kv'];
  await tx(stores, (t) => stores.forEach((s) => t.objectStore(s).clear()));
}
