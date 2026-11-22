/**
 * Pinned ("favourite") cameras. Pure helpers so ordering can be unit-tested and shared
 * between the picker and the atomic settings update.
 *
 * Pins are kept in the order they were pinned (newest last). Ids of cameras that no
 * longer exist stay in storage (harmless, and they come back if the body returns) but
 * are ignored for display.
 */

/** Cleans whatever was stored: strings only, no duplicates, original order kept. */
export function normalizePins(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const id of raw) if (typeof id === 'string' && id && !out.includes(id)) out.push(id);
  return out;
}

/** Returns the pin list with `id` pinned (appended) or unpinned. */
export function setPinned(pins: unknown, id: string, pinned: boolean): string[] {
  const list = normalizePins(pins).filter((p) => p !== id);
  return pinned ? [...list, id] : list;
}

/**
 * Orders cameras for the picker: pinned ones first in pin order, then the rest in
 * their normal order. `pinnedCount` is how many leading items are pinned.
 */
export function orderByPins<T extends { id: string }>(items: readonly T[], pins: unknown): { items: T[]; pinnedCount: number } {
  const byId = new Map(items.map((c) => [c.id, c] as const));
  const pinned: T[] = [];
  for (const id of normalizePins(pins)) {
    const c = byId.get(id);
    if (c) pinned.push(c);
  }
  const pinnedIds = new Set(pinned.map((c) => c.id));
  return { items: [...pinned, ...items.filter((c) => !pinnedIds.has(c.id))], pinnedCount: pinned.length };
}
