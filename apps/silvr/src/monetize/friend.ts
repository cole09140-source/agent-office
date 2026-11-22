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

// A Korean (2-beolsik) keyboard turns "CAMELAFRIEND" into Hangul: read those keys back as the Latin letters.
const KEYS: Record<string, string> = {
  ㅂ: 'Q', ㅈ: 'W', ㄷ: 'E', ㄱ: 'R', ㅅ: 'T', ㅛ: 'Y', ㅕ: 'U', ㅑ: 'I', ㅐ: 'O', ㅔ: 'P',
  ㅁ: 'A', ㄴ: 'S', ㅇ: 'D', ㄹ: 'F', ㅎ: 'G', ㅗ: 'H', ㅓ: 'J', ㅏ: 'K', ㅣ: 'L',
  ㅋ: 'Z', ㅌ: 'X', ㅊ: 'C', ㅍ: 'V', ㅠ: 'B', ㅜ: 'N', ㅡ: 'M',
  ㅃ: 'Q', ㅉ: 'W', ㄸ: 'E', ㄲ: 'R', ㅆ: 'T', ㅒ: 'O', ㅖ: 'P',
  ㅘ: 'HK', ㅙ: 'HO', ㅚ: 'HL', ㅝ: 'NJ', ㅞ: 'NP', ㅟ: 'NL', ㅢ: 'ML',
  ㄳ: 'RT', ㄵ: 'SW', ㄶ: 'SG', ㄺ: 'FR', ㄻ: 'FA', ㄼ: 'FQ', ㄽ: 'FT', ㄾ: 'FX', ㄿ: 'FV', ㅀ: 'FG', ㅄ: 'QT',
};
const LEAD = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const VOWEL = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const TAIL = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
/** Hangul typed on a 2-beolsik keyboard → the Latin keys that were pressed ("츠믇ㅣ" → "CMEL"). */
export function hangulToKeys(s: string): string {
  let out = '';
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 0xac00 && c <= 0xd7a3) {
      const i = c - 0xac00;
      const jamo = LEAD[Math.floor(i / 588)] + VOWEL[Math.floor((i % 588) / 28)] + TAIL[i % 28];
      for (const j of jamo) out += KEYS[j] ?? '';
    } else out += KEYS[ch] ?? ch;
  }
  return out;
}

/** Letters and digits only, upper case: "camela-friend ", "CAMELAFRIEND" and the same keys on a Korean keyboard are one code. */
export function normalizeCode(code: string): string {
  return hangulToKeys(code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
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
