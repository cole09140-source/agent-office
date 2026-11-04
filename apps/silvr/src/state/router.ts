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

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s; // malformed %-escapes in a hand-typed link must not crash the app
  }
};

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(safeDecode);
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

export const depth = (): number => (history.state as { silvr?: number } | null)?.silvr ?? 0;
let pendingTab: Route | null = null;

if (typeof window !== 'undefined') {
  if (typeof (history.state as { silvr?: number } | null)?.silvr !== 'number') {
    history.replaceState({ silvr: 0 }, '', location.hash || '#/camera');
  }
  const sync = () => {
    if (pendingTab && depth() === 0) {
      const r = pendingTab;
      pendingTab = null;
      go(r, true);
      return;
    }
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

/**
 * Tab switch: unwind the in-app stack first so system back from a tab never
 * walks through screens of another tab (or a dead duplicate entry).
 */
export function goTab(r: Route): void {
  const d = depth();
  if (d > 0) {
    pendingTab = r;
    history.go(-d);
  } else {
    go(r, true);
  }
}

/**
 * Still on `r`? Navigation after an await must check this: if the user went
 * back meanwhile, a replace would overwrite the screen they returned to.
 */
export function isCurrent(r: Route): boolean {
  return routeToHash(route.value) === routeToHash(r);
}

/** In-app back; falls back to `fallback` when the page was opened via a deep link. */
export function back(fallback: Route): void {
  if (depth() > 0) history.back();
  else go(fallback, true);
}
