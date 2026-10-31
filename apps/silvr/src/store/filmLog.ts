import { atomic, del, getAll, getAllByIndex, put, rq } from './db';
import { uid } from './rolls';

/** A real, physical roll the user is shooting on an analog camera. */
export interface LogRoll {
  id: string;
  camera: string;
  film: string;
  iso: number;
  exposures: number;
  startedAt: number;
  note: string;
}

export interface LogFrame {
  id: string;
  rollId: string;
  frame: number;
  aperture: string;
  shutter: string;
  lens: string;
  note: string;
  takenAt: number;
  lat?: number;
  lon?: number;
}

export async function listLogRolls(): Promise<LogRoll[]> {
  return (await getAll<LogRoll>('logRolls')).sort((a, b) => b.startedAt - a.startedAt);
}

export async function saveLogRoll(roll: Omit<LogRoll, 'id'> & { id?: string }): Promise<LogRoll> {
  const r: LogRoll = { ...roll, id: roll.id ?? uid() };
  await put('logRolls', r);
  return r;
}

export async function deleteLogRoll(id: string): Promise<void> {
  // Read and delete together, so a frame added from another tab meanwhile isn't left orphaned.
  await atomic(['logRolls', 'logFrames'], async (t) => {
    const frames = (await rq(t.objectStore('logFrames').index('rollId').getAll(id))) as LogFrame[];
    for (const f of frames) await rq(t.objectStore('logFrames').delete(f.id));
    await rq(t.objectStore('logRolls').delete(id));
  });
}

export async function listLogFrames(rollId: string): Promise<LogFrame[]> {
  return (await getAllByIndex<LogFrame>('logFrames', 'rollId', rollId)).sort((a, b) => a.frame - b.frame);
}

export async function saveLogFrame(frame: Omit<LogFrame, 'id'> & { id?: string }): Promise<LogFrame> {
  const f: LogFrame = { ...frame, id: frame.id ?? uid() };
  await put('logFrames', f);
  return f;
}

/**
 * Adds the next frame of a log roll. Numbering, the exposure limit and the parent check
 * happen in one transaction, so two tabs (or two taps) never save the same frame number.
 * Returns null when the roll is gone or already full.
 */
export async function addLogFrame(frame: Omit<LogFrame, 'id' | 'frame'>): Promise<LogFrame | null> {
  return atomic(['logRolls', 'logFrames'], async (t) => {
    const roll = (await rq(t.objectStore('logRolls').get(frame.rollId))) as LogRoll | undefined;
    if (!roll) return null;
    const frames = (await rq(t.objectStore('logFrames').index('rollId').getAll(frame.rollId))) as LogFrame[];
    if (frames.length >= roll.exposures) return null;
    const f: LogFrame = { ...frame, id: uid(), frame: frames.reduce((m, x) => Math.max(m, x.frame), 0) + 1 };
    await rq(t.objectStore('logFrames').put(f));
    return f;
  });
}

export async function deleteLogFrame(id: string): Promise<void> {
  await del('logFrames', id);
}

const csvCell = (v: string | number | undefined) => {
  let s = v === undefined ? '' : String(v);
  // Spreadsheet formula injection: text starting with = + - @ (or tab/CR) is neutralised with a leading quote.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** "2026-10-31 14:05:09" in the phone's time (what the app shows; spreadsheets read it as a date). */
function localDateTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** Short date for file names, e.g. 20261031. */
export function fileStamp(ts: number): string {
  return localDateTime(ts).slice(0, 10).replace(/-/g, '');
}

/** CSV export for spreadsheet / lab notes. */
export function logToCsv(roll: LogRoll, frames: LogFrame[]): string {
  const head = ['frame', 'datetime', 'aperture', 'shutter', 'lens', 'note', 'lat', 'lon'];
  const rows = frames.map((f) =>
    [f.frame, localDateTime(f.takenAt), f.aperture, f.shutter, f.lens, f.note, f.lat, f.lon].map(csvCell).join(','),
  );
  const meta = `# ${[roll.camera, roll.film, `ISO ${roll.iso}`, `${roll.exposures} exp`].map((s) => s.replace(/[\n,]/g, ' ').replace(/^[=+\-@]/, "'$&")).join(' / ')}`;
  return [meta, head.join(','), ...rows].join('\n') + '\n';
}
