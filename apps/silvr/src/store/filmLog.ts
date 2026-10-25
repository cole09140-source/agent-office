import { del, getAll, getAllByIndex, put, tx } from './db';
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
  const frames = await listLogFrames(id);
  await tx(['logRolls', 'logFrames'], (t) => {
    frames.forEach((f) => t.objectStore('logFrames').delete(f.id));
    t.objectStore('logRolls').delete(id);
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

export async function deleteLogFrame(id: string): Promise<void> {
  await del('logFrames', id);
}

const csvCell = (v: string | number | undefined) => {
  const s = v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV export for spreadsheet / lab notes. */
export function logToCsv(roll: LogRoll, frames: LogFrame[]): string {
  const head = ['frame', 'datetime', 'aperture', 'shutter', 'lens', 'note', 'lat', 'lon'];
  const rows = frames.map((f) =>
    [f.frame, new Date(f.takenAt).toISOString(), f.aperture, f.shutter, f.lens, f.note, f.lat, f.lon].map(csvCell).join(','),
  );
  const meta = `# ${[roll.camera, roll.film, `ISO ${roll.iso}`, `${roll.exposures} exp`].map((s) => s.replace(/[\n,]/g, ' ')).join(' / ')}`;
  return [meta, head.join(','), ...rows].join('\n') + '\n';
}
