/**
 * Friends' lifetime pass: one shared code, redeemable any number of times, that turns Pro on for good on
 * this device (the owner hands it to friends and family). Google Play promo codes for a one-time product are
 * single-use only, so this lives in the app. Only a salted SHA-256 of the code ships in the bundle; the pass
 * is kept in IndexedDB (a reinstall forgets it — enter the code again).
 */
import { signal } from '@preact/signals';
import { get, put } from '../store/db';

const SALT = 'FILMCAMELA-FRIENDS-v1:';
/** sha256(SALT + code) for the friends' code(s). */
const FRIEND_HASHES = new Set(['6fc09d5c995387d026f252b9f9787e6b9d0cb552eb10ca658aafd121b397f7f3']);
const KEY = 'friend-pass';

/** Pro granted by a friends' code on this device. */
export const friendPass = signal(false);

/** Letters and digits only, upper case: "camela-friend " and "CAMELAFRIEND" are the same code. */
export function normalizeCode(code: string): string {
  return code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Whether a typed code is a friends' code (no side effects). */
export async function isFriendCode(code: string): Promise<boolean> {
  const c = normalizeCode(code);
  if (c.length < 6 || typeof crypto === 'undefined' || !crypto.subtle) return false;
  return FRIEND_HASHES.has(await sha256Hex(SALT + c));
}

/** Turns the pass on when the code is a friends' code; true if it did (or it already was on). */
export async function redeemFriendCode(code: string): Promise<boolean> {
  if (!(await isFriendCode(code))) return false;
  friendPass.value = true;
  try {
    await put('kv', true, KEY);
  } catch (err) {
    console.warn('[silvr] friend pass not saved', err);
  }
  return true;
}

/** Reads the saved pass at boot (before the shot quota charges anything). */
export async function loadFriendPass(): Promise<void> {
  try {
    if ((await get('kv', KEY)) === true) friendPass.value = true;
  } catch (err) {
    console.warn('[silvr] friend pass unavailable', err);
  }
}
