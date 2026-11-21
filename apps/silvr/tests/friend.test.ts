import { describe, expect, it } from 'vitest';
import { isFriendCode, normalizeCode } from '../src/monetize/friend';

describe("friends' lifetime code", () => {
  it('normalizes case, spaces and dashes', () => {
    expect(normalizeCode(' camela-friend ')).toBe('CAMELAFRIEND');
  });
  it('accepts the friends code in any spelling and rejects others', async () => {
    expect(await isFriendCode('CAMELAFRIEND')).toBe(true);
    expect(await isFriendCode('camela friend')).toBe(true);
    expect(await isFriendCode('CAMELAFRIENDS')).toBe(false);
    expect(await isFriendCode('ABC')).toBe(false);
    expect(await isFriendCode('')).toBe(false);
  });
});
