import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dismissToast, MAX_TOASTS, toast, toasts } from '../src/state/app';

afterEach(() => {
  for (const x of toasts.value) dismissToast(x.id);
  vi.useRealTimers();
});

describe('toasts', () => {
  it('drops an exact repeat of a plain toast', () => {
    toast('Saved');
    toast('Saved');
    expect(toasts.value.map((x) => x.text)).toEqual(['Saved']);
  });

  it('keeps repeated toasts that carry their own undo', () => {
    toast('Deleted', { label: 'Undo', run: () => undefined });
    toast('Deleted', { label: 'Undo', run: () => undefined });
    expect(toasts.value).toHaveLength(2);
  });

  it('merges a group into one toast with a count', () => {
    const many = (n: number) => ({ text: `${n} rolls developed`, action: { label: 'View', run: () => undefined } });
    toast('A developed', { label: 'View', run: () => undefined }, 6000, undefined, { group: 'dev', many });
    toast('B developed', { label: 'View', run: () => undefined }, 6000, undefined, { group: 'dev', many });
    toast('C developed', { label: 'View', run: () => undefined }, 6000, undefined, { group: 'dev', many });
    expect(toasts.value.map((x) => x.text)).toEqual(['3 rolls developed']);
  });

  it(`shows at most ${MAX_TOASTS}, pushing out plain toasts before ones with a button`, () => {
    const expired = vi.fn();
    toast('Undo me', { label: 'Undo', run: () => undefined }, 10_000, expired);
    toast('one');
    toast('two');
    expect(toasts.value.map((x) => x.text)).toEqual(['Undo me', 'two']);
    expect(expired).not.toHaveBeenCalled();
  });

  it('keeps action toasts at least 10 s', () => {
    vi.useFakeTimers();
    toast('Open', { label: 'Go', run: () => undefined }, 3000);
    vi.advanceTimersByTime(9_000);
    expect(toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(1_500);
    expect(toasts.value).toHaveLength(0);
  });
});
