import { describe, expect, it } from 'vitest';
import { formatArrival } from '../src/components/arrival';
import { readyAtFor } from '../src/store/rolls';

describe('lab arrival wording', () => {
  const t0 = new Date(2026, 10, 1, 14, 20).getTime(); // Sun 1 Nov 14:20

  it('instant arrives now', () => {
    expect(formatArrival(readyAtFor('instant', t0), t0, 'ko')).toBe('지금 바로 앨범에 도착');
    expect(formatArrival(readyAtFor('instant', t0), t0, 'en')).toBe('In your album right away');
  });

  it('1 hour arrives today with the clock time', () => {
    expect(formatArrival(readyAtFor('1h', t0), t0, 'ko')).toMatch(/^오늘 오후 3:20 도착$/);
    expect(formatArrival(readyAtFor('1h', t0), t0, 'en')).toMatch(/^Arrives today at 3:20\sPM$/);
  });

  it('1 hour late at night rolls over to tomorrow', () => {
    const late = new Date(2026, 10, 1, 23, 30).getTime();
    expect(formatArrival(readyAtFor('1h', late), late, 'ko')).toMatch(/^내일 오전 12:30 도착$/);
  });

  it('morning arrives tomorrow 9:00 (or today when sent before dawn)', () => {
    expect(formatArrival(readyAtFor('morning', t0), t0, 'ko')).toMatch(/^내일 오전 9:00 도착$/);
    const dawn = new Date(2026, 10, 2, 2, 0).getTime();
    expect(formatArrival(readyAtFor('morning', dawn), dawn, 'ko')).toMatch(/^오늘 오전 9:00 도착$/);
    expect(formatArrival(readyAtFor('morning', t0), t0, 'en')).toMatch(/^Arrives tomorrow at 9:00\sAM$/);
  });

  it('3 days shows the date', () => {
    expect(formatArrival(readyAtFor('3d', t0), t0, 'ko')).toBe('11월 4일 도착');
    expect(formatArrival(readyAtFor('3d', t0), t0, 'en')).toBe('Arrives Nov 4');
  });
});
