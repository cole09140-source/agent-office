import { describe, expect, it } from 'vitest';
import { isFriendCode, normalizeCode } from '../src/monetize/friend';

describe("friends' lifetime code", () => {
  it('normalizes case, spaces and dashes', () => {
    expect(normalizeCode(' camela-friend ')).toBe('CAMELAFRIEND');
  });
  it('reads the code typed on a Korean (2-beolsik) keyboard', async () => {
    expect(normalizeCode('ㅊ므딤ㄹ갸둥')).toBe('CAMELAFRIEND'); // C A M E L A F R I E N D on the Korean layout
    expect(normalizeCode('ㅊㅁㅡㄷㅣㅁㄹㄱㅑㄷㅜㅇ')).toBe('CAMELAFRIEND'); // the same keys left as loose jamo
    expect(await isFriendCode('ㅊ므딤ㄹ갸둥')).toBe(true);
  });
  it('accepts the friends code in any spelling and rejects others', async () => {
    expect(await isFriendCode('CAMELAFRIEND')).toBe(true);
    expect(await isFriendCode('camela friend')).toBe(true);
    expect(await isFriendCode('CAMELAFRIENDS')).toBe(false);
    expect(await isFriendCode('ABC')).toBe(false);
    expect(await isFriendCode('')).toBe(false);
  });
});
