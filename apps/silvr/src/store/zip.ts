/**
 * Minimal uncompressed (STORE) ZIP writer/reader for backups. Photos are
 * already JPEG/PNG, so deflate would gain nothing. Entry data stays as Blob
 * slices, so a multi-hundred-MB archive is never held in JS memory at once.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array, crc = 0): number {
  let c = ~crc >>> 0;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

export interface ZipInput {
  name: string;
  data: Blob;
}

export interface ZipEntry {
  name: string;
  crc: number;
  size: number;
  /** Lazily sliced entry data. */
  data: Blob;
}

const LIMIT = 0xffffffff;
const enc = new TextEncoder();

function dosDateTime(d: Date): [number, number] {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = (Math.max(0, d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return [time, date];
}

/** Builds a STORE zip. Reads each entry once (to checksum it) and only keeps a reference to it afterwards. */
export async function writeZip(files: ZipInput[], now = new Date(), onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const [time, date] = dosDateTime(now);
  const parts: BlobPart[] = [];
  const central: Uint8Array<ArrayBuffer>[] = [];
  let offset = 0;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const name = enc.encode(f.name);
    const crc = crc32(new Uint8Array(await f.data.arrayBuffer()));
    const size = f.data.size;
    if (size >= LIMIT || offset >= LIMIT) throw new Error('Backup larger than 4 GB');
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // STORE
    local.setUint16(10, time, true);
    local.setUint16(12, date, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, size, true);
    local.setUint32(22, size, true);
    local.setUint16(26, name.length, true);
    local.setUint16(28, 0, true);
    parts.push(local.buffer, name, f.data);

    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, time, true);
    cd.setUint16(14, date, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, size, true);
    cd.setUint32(24, size, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    const rec = new Uint8Array(46 + name.length);
    rec.set(new Uint8Array(cd.buffer), 0);
    rec.set(name, 46);
    central.push(rec);
    offset += 30 + name.length + size;
    onProgress?.(i + 1, files.length);
  }
  const cdSize = central.reduce((s, c) => s + c.length, 0);
  if (offset + cdSize >= LIMIT || files.length > 0xffff) throw new Error('Backup larger than 4 GB');
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: 'application/zip' });
}

/** Lists the entries of a STORE zip (as written above). Throws on anything else. */
export async function readZip(file: Blob): Promise<ZipEntry[]> {
  const tailLen = Math.min(file.size, 22 + 0xffff);
  const tail = new DataView(await file.slice(file.size - tailLen).arrayBuffer());
  let eocd = -1;
  for (let i = tailLen - 22; i >= 0; i--) {
    if (tail.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('Not a zip file');
  const count = tail.getUint16(eocd + 10, true);
  const cdSize = tail.getUint32(eocd + 12, true);
  const cdOffset = tail.getUint32(eocd + 16, true);
  if (cdOffset + cdSize > file.size) throw new Error('Truncated zip file');
  // 65,535 entries × a short name stays far below this; a forged size must not be read into memory.
  if (cdSize > 32 * 1024 * 1024) throw new Error('Zip directory too large');
  const cd = new DataView(await file.slice(cdOffset, cdOffset + cdSize).arrayBuffer());
  const dec = new TextDecoder();
  const out: ZipEntry[] = [];
  let p = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > cd.byteLength || cd.getUint32(p, true) !== 0x02014b50) throw new Error('Corrupt zip directory');
    const method = cd.getUint16(p + 10, true);
    const crc = cd.getUint32(p + 16, true);
    const size = cd.getUint32(p + 20, true);
    const usize = cd.getUint32(p + 24, true);
    const nameLen = cd.getUint16(p + 28, true);
    const extraLen = cd.getUint16(p + 30, true);
    const commentLen = cd.getUint16(p + 32, true);
    const localOff = cd.getUint32(p + 42, true);
    const name = dec.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (method !== 0 || size !== usize) throw new Error('Compressed zip entries are not supported');
    const lh = new DataView(await file.slice(localOff, localOff + 30).arrayBuffer());
    if (lh.byteLength < 30 || lh.getUint32(0, true) !== 0x04034b50) throw new Error('Corrupt zip entry');
    const start = localOff + 30 + lh.getUint16(26, true) + lh.getUint16(28, true);
    if (start + size > file.size) throw new Error('Truncated zip file');
    out.push({ name, crc, size, data: file.slice(start, start + size) });
  }
  return out;
}
