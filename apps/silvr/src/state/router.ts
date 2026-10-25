import { signal } from '@preact/signals';

export type Route =
  | { name: 'camera' }
  | { name: 'lab' }
  | { name: 'gallery' }
  | { name: 'roll'; id: string }
  | { name: 'photo'; id: string }
  | { name: 'darkroom'; id: string }
  | { name: 'analog' }
  | { name: 'log'; id: string }
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [head, id] = parts;
  switch (head) {
    case 'lab':
    case 'gallery':
    case 'analog':
    case 'settings':
      return { name: head };
    case 'roll':
    case 'photo':
    case 'darkroom':
    case 'log':
      return id ? { name: head, id } : { name: head === 'log' ? 'analog' : 'gallery' };
    default:
      return { name: 'camera' };
  }
}

export function routeToHash(r: Route): string {
  return 'id' in r ? `#/${r.name}/${encodeURIComponent(r.id)}` : `#/${r.name}`;
}

export const route = signal<Route>(typeof location !== 'undefined' ? parseHash(location.hash) : { name: 'camera' });

const depth = (): number => (history.state as { silvr?: number } | null)?.silvr ?? 0;

if (typeof window !== 'undefined') {
  if (typeof (history.state as { silvr?: number } | null)?.silvr !== 'number') {
    history.replaceState({ silvr: 0 }, '', location.hash || '#/camera');
  }
  const sync = () => {
    route.value = parseHash(location.hash);
  };
  window.addEventListener('popstate', sync);
  window.addEventListener('hashchange', sync);
}

export function go(r: Route, replace = false): void {
  const h = routeToHash(r);
  if (location.hash === h) return;
  if (replace) history.replaceState({ silvr: depth() }, '', h);
  else history.pushState({ silvr: depth() + 1 }, '', h);
  route.value = r;
}

/** In-app back; falls back to `fallback` when the page was opened via a deep link. */
export function back(fallback: Route): void {
  if (depth() > 0) history.back();
  else go(fallback, true);
}
