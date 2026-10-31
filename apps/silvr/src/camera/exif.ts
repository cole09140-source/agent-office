/**
 * Reads the shooting time from a JPEG's EXIF (DateTimeOriginal, else DateTime).
 * Imported files are temporary copies on iOS, so `lastModified` is the pick time,
 * not when the photo was taken. Returns local-time milliseconds, or null.
 */
export function exifTakenAt(buf: ArrayBuffer): number | null {
  const v = new DataView(buf);
  if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null; // not a JPEG
  let p = 2;
  while (p + 4 <= v.byteLength) {
    const marker = v.getUint16(p);
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return null; // start of scan: no EXIF
    const len = v.getUint16(p + 2);
    if (marker === 0xffe1 && p + 10 <= v.byteLength && v.getUint32(p + 4) === 0x45786966) {
      return readTiff(v, p + 10, Math.min(v.byteLength, p + 2 + len)); // "Exif\0\0" + TIFF
    }
    p += 2 + len;
  }
  return null;
}

function readTiff(v: DataView, start: number, end: number): number | null {
  if (start + 8 > end) return null;
  const little = v.getUint16(start) === 0x4949;
  const u16 = (o: number) => v.getUint16(start + o, little);
  const u32 = (o: number) => v.getUint32(start + o, little);
  const inRange = (o: number, n: number) => o >= 0 && start + o + n <= end;
  const ifd = (off: number) => {
    const tags = new Map<number, number>(); // tag → offset of its 12-byte entry
    if (!inRange(off, 2)) return tags;
    const n = u16(off);
    for (let i = 0; i < n && inRange(off + 2 + i * 12, 12); i++) tags.set(u16(off + 2 + i * 12), off + 2 + i * 12);
    return tags;
  };
  const ascii = (entry: number): string | null => {
    const count = u32(entry + 4);
    const at = count <= 4 ? entry + 8 : u32(entry + 8);
    if (count < 19 || !inRange(at, 19)) return null;
    let s = '';
    for (let i = 0; i < 19; i++) s += String.fromCharCode(v.getUint8(start + at + i));
    return s;
  };
  const ifd0 = ifd(u32(4));
  const exifPtr = ifd0.get(0x8769);
  const exif = exifPtr !== undefined ? ifd(u32(exifPtr + 8)) : new Map<number, number>();
  for (const entry of [exif.get(0x9003), ifd0.get(0x0132)]) {
    if (entry === undefined) continue;
    const t = parseExifDate(ascii(entry));
    if (t !== null) return t;
  }
  return null;
}

/** "2025:06:01 14:30:05" (local time) → ms; null for blanks like "0000:00:00 00:00:00". */
export function parseExifDate(s: string | null): number | null {
  const m = s?.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [y, mo, d, h, mi, se] = m.slice(1).map(Number);
  if (y < 1900 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const t = new Date(y, mo - 1, d, h, mi, se).getTime();
  return Number.isFinite(t) ? t : null;
}
