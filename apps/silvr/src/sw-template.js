/* SILVR service worker — generated at build time. */
const VERSION = '__VERSION__';
const CACHE = `silvr-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('silvr-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Network first so new releases are picked up; fall back to the cached shell offline.
    // Network first (new releases), but never hang an offline-ish launch: fall back after 3 s.
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
    event.respondWith(
      Promise.race([fetch(req), timeout])
        .then((res) => {
          // Only the app shell refreshes the shell entry; other pages cache under their own URL.
          if (res.ok) {
            const path = url.pathname.replace(/\/index\.html$/, '/');
            const isShell = new URL('./', self.registration.scope).pathname === path;
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(isShell ? './' : req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req, { ignoreSearch: true })) || (await caches.match('./'))),
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
