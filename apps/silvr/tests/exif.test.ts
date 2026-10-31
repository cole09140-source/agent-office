import { describe, expect, it } from 'vitest';
import { exifTakenAt, parseExifDate } from '../src/camera/exif';

/** Minimal JPEG: SOI + APP1 Exif (IFD0 → Exif IFD with DateTimeOriginal) + SOS. */
function jpeg(date: string | null, little: boolean): ArrayBuffer {
  const tiff: number[] = [];
  const u16 = (n: number) => (little ? [n & 255, n >> 8] : [n >> 8, n & 255]);
  const u32 = (n: number) => (little ? [n & 255, (n >> 8) & 255, (n >> 16) & 255, n >>> 24] : [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255]);
  tiff.push(...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8));
  // IFD0 at 8: one entry, ExifIFD pointer → 26
  tiff.push(...u16(1), ...u16(0x8769), ...u16(4), ...u32(1), ...u32(26), ...u32(0));
  // Exif IFD at 26: one entry, DateTimeOriginal ASCII(20) at 44
  tiff.push(...u16(1), ...u16(0x9003), ...u16(2), ...u32(20), ...u32(44), ...u32(0));
  const text = (date ?? '').padEnd(19, '\0');
  for (let i = 0; i < 19; i++) tiff.push(text.charCodeAt(i));
  tiff.push(0);
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const len = app1.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 255, ...app1, 0xff, 0xda, 0, 2]).buffer;
}

/** Minimal HEIF-like file: ftyp box, filler, then the EXIF item payload (offset + "Exif\0\0" + TIFF). */
function heif(date: string): ArrayBuffer {
  const jpg = new Uint8Array(jpeg(date, false));
  const exif = jpg.slice(6, jpg.length - 4); // "Exif\0\0" + TIFF, without JPEG framing
  const ftyp = [0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63, 0, 0, 0, 0];
  return new Uint8Array([...ftyp, ...new Array(40).fill(0), 0, 0, 0, 6, ...exif]).buffer;
}

describe('EXIF shooting time for imports', () => {
  it('reads the EXIF item of a HEIC file', () => {
    expect(exifTakenAt(heif('2023:03:04 05:06:07'))).toBe(new Date(2023, 2, 4, 5, 6, 7).getTime());
  });

  it('reads DateTimeOriginal as local time, both byte orders', () => {
    const want = new Date(2025, 5, 1, 14, 30, 5).getTime();
    expect(exifTakenAt(jpeg('2025:06:01 14:30:05', true))).toBe(want);
    expect(exifTakenAt(jpeg('2025:06:01 14:30:05', false))).toBe(want);
  });
  it('returns null for blank dates, non-JPEG and truncated data', () => {
    expect(exifTakenAt(jpeg('0000:00:00 00:00:00', true))).toBeNull();
    expect(exifTakenAt(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)).toBeNull();
    expect(exifTakenAt(jpeg('2025:06:01 14:30:05', true).slice(0, 30))).toBeNull();
    expect(exifTakenAt(new ArrayBuffer(0))).toBeNull();
  });
  it('parses only well-formed EXIF dates', () => {
    expect(parseExifDate('2024:12:31 23:59:59')).toBe(new Date(2024, 11, 31, 23, 59, 59).getTime());
    expect(parseExifDate('2024-12-31 23:59:59')).toBeNull();
    expect(parseExifDate(null)).toBeNull();
  });
});
