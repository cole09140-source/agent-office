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
    // InvalidStateError: closed connection. UnknownError: WebKit's "Connection to
    // Indexed Database server lost" after backgrounding. Reopen and retry once.
    const name = (err as DOMException)?.name;
    if (name !== 'InvalidStateError' && name !== 'UnknownError') throw err;
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

/** Promise for one request — only use inside atomic(). */
export function rq<T>(r: IDBRequest<T>): Promise<T> {
  return req(r);
}

/**
 * Runs `fn` inside ONE readwrite transaction so reads and the writes that
 * depend on them can't interleave with another tab or a rapid second action.
 * Only await rq() requests inside `fn` (anything else would let the
 * transaction auto-commit). Throwing aborts every write.
 */
export async function atomic<T>(stores: StoreName[], fn: (t: IDBTransaction) => Promise<T>): Promise<T> {
  return withDb(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(stores, 'readwrite');
        let result: T;
        let failure: unknown = null;
        t.oncomplete = () => (failure ? reject(failure) : resolve(result));
        t.onerror = () => reject(failure ?? t.error);
        t.onabort = () => reject(failure ?? t.error ?? new Error('transaction aborted'));
        fn(t).then(
          (r) => {
            result = r;
          },
          (err) => {
            failure = err;
            try {
              t.abort();
            } catch {
              reject(err);
            }
          },
        );
      }),
  );
}

export async function clearAll(): Promise<void> {
  const stores: StoreName[] = ['rolls', 'photos', 'blobs', 'logRolls', 'logFrames', 'kv'];
  await tx(stores, (t) => stores.forEach((s) => t.objectStore(s).clear()));
}
