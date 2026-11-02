import { signal } from '@preact/signals';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { advise, APERTURES, ISOS, LIGHTS, LOG_APERTURES, LOG_SHUTTERS, type Light } from '../companion/exposure';
import { Icon } from '../components/Icon';
import { Empty, formatDate, Header, Sheet, Slider } from '../components/ui';
import { formatTime } from '../intl/format';
import { ltr, t } from '../i18n';
import { arrowStep, centerInStrip, revealInStrip } from '../platform/dir';
import { saveFile } from '../platform/share';
import { confirm, toast } from '../state/app';
import { signalLang } from '../state/lang';
import { back, go, goTab, isCurrent } from '../state/router';
import {
  addLogFrame,
  deleteLogFrame,
  deleteLogRoll,
  fileStamp,
  listLogFrames,
  listLogRolls,
  logToCsv,
  restoreLogFrame,
  saveLogRoll,
  updateLogFrame,
  type LogFrame,
  type LogRoll,
} from '../store/filmLog';

/** Last meter reading, so the log form can prefill it. */
export const meter = signal({ iso: 400, light: 'sunny' as Light, aperture: 8, comp: 0 });

const saveError = (err: unknown) => toast((err as Error)?.name === 'QuotaExceededError' ? t('err.storage') : t('common.error'));

function Meter() {
  const m = meter.value;
  const a = advise(m.light, m.iso, m.aperture, m.comp);
  const set = (p: Partial<typeof m>) => (meter.value = { ...m, ...p });
  return (
    <section class="card" data-testid="meter">
      <h2>{t('an.meter')}</h2>
      <div class="meter-result">
        <div>
          <small class="muted">{t('an.shutter')}</small>
          <strong class="mono" data-testid="meter-shutter">
            {a.label}
          </strong>
        </div>
        <div>
          <small class="muted">{t('an.aperture')}</small>
          <strong class="mono">f/{m.aperture}</strong>
        </div>
        <div>
          <small class="muted">EV (ISO {m.iso})</small>
          <strong class="mono" data-testid="meter-ev" dir="ltr">
            {a.ev.toFixed(1)}
          </strong>
        </div>
      </div>
      {a.outOfRange ? <p class="warn small">{t('an.outOfRange')}</p> : a.tripod && <p class="warn small">{t('an.tripod')}</p>}
      <label class="field">
        <span>{t('an.light')}</span>
        <select value={m.light} onChange={(e) => set({ light: e.currentTarget.value as Light })} data-testid="meter-light">
          {LIGHTS.map((l) => (
            <option value={l} key={l}>
              {t(`an.light.${l}` as const)}
            </option>
          ))}
        </select>
      </label>
      <div class="field">
        <span>{t('an.iso')}</span>
        <div class="pills">
          {ISOS.map((i) => (
            <button key={i} class={i === m.iso ? 'on' : ''} aria-pressed={i === m.iso} onClick={() => set({ iso: i })} data-testid={`iso-${i}`}>
              {i}
            </button>
          ))}
        </div>
      </div>
      <div class="field">
        <span>{t('an.aperture')}</span>
        <div class="pills">
          {APERTURES.map((f) => (
            <button key={f} class={f === m.aperture ? 'on' : ''} aria-pressed={f === m.aperture} onClick={() => set({ aperture: f })} data-testid={`ap-${f}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <Slider label={t('an.comp')} value={m.comp} min={-3} max={3} step={1 / 3} onInput={(v) => set({ comp: Math.round(v * 3) / 3 })} format={(v) => ltr(`${v > 0 ? '+' : ''}${v.toFixed(1)}`)} />
    </section>
  );
}

function NewRollSheet({ open, onClose, last }: { open: boolean; onClose: () => void; last?: LogRoll }) {
  const [camera, setCamera] = useState('');
  const [film, setFilm] = useState('');
  const [iso, setIso] = useState(400);
  const [exp, setExp] = useState(36);
  const [saving, setSaving] = useState(false);
  // Most people shoot the same body (and often the same film) roll after roll: start from the last log.
  useEffect(() => {
    if (!open || !last) return;
    setCamera(last.camera === '—' ? '' : last.camera);
    setFilm(last.film === '—' ? '' : last.film);
    if (ISOS.includes(last.iso)) setIso(last.iso);
    setExp(last.exposures);
  }, [open, last?.id]);
  const submit = async (e: Event) => {
    e.preventDefault();
    if (saving) return; // a double tap would start two rolls
    setSaving(true);
    try {
      const r = await saveLogRoll({ camera: camera.trim() || '—', film: film.trim() || '—', iso, exposures: exp, startedAt: Date.now(), note: '' });
      onClose();
      go({ name: 'log', id: r.id });
    } catch (err) {
      console.error('[silvr] log roll not saved', err);
      saveError(err);
    } finally {
      setSaving(false);
    }
  };
  const sizes = [12, 24, 27, 36, 72];
  return (
    <Sheet open={open} onClose={onClose} title={t('an.log.new')} testId="new-log">
      <form onSubmit={submit} class="form">
        <label class="field">
          <span>{t('an.log.camera')}</span>
          <input value={camera} onInput={(e) => setCamera(e.currentTarget.value)} placeholder="Nikon FM2" maxLength={60} data-testid="log-camera" />
        </label>
        <label class="field">
          <span>{t('an.log.film')}</span>
          <input value={film} onInput={(e) => setFilm(e.currentTarget.value)} placeholder="Portra 400" maxLength={60} data-testid="log-film" />
        </label>
        <div class="two">
          <label class="field">
            <span>{t('an.iso')}</span>
            <select value={iso} onChange={(e) => setIso(Number(e.currentTarget.value))}>
              {ISOS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </label>
          <label class="field">
            <span>{t('an.log.exposures')}</span>
            <select value={exp} onChange={(e) => setExp(Number(e.currentTarget.value))}>
              {(sizes.includes(exp) ? sizes : [...sizes, exp].sort((a, b) => a - b)).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button class="btn primary wide" type="submit" disabled={saving} data-testid="log-create">
          {t('common.start')}
        </button>
      </form>
    </Sheet>
  );
}

export function AnalogScreen() {
  const [rolls, setRolls] = useState<LogRoll[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      const rs = await listLogRolls();
      const cs: Record<string, number> = {};
      for (const r of rs) cs[r.id] = (await listLogFrames(r.id)).length;
      if (!alive) return;
      setRolls(rs);
      setCounts(cs);
    })().catch(() => setRolls([]));
    return () => {
      alive = false;
    };
  }, [open]);
  // The roll being shot right now: the newest log that still has frames left.
  const active = rolls.find((r) => (counts[r.id] ?? 0) < r.exposures);
  return (
    <div class="page analog" data-testid="analog-screen">
      <Header title={t('an.title')} sub={t('an.subtitle')} />
      {active && (
        <button class="card log-active" onClick={() => go({ name: 'log', id: active.id })} data-testid="active-log">
          <span class="log-active-txt">
            <small class="muted">{t('an.active')}</small>
            <strong>{active.film}</strong>
            <small class="muted">
              {active.camera} · ISO {active.iso}
            </small>
          </span>
          <span class="log-active-side">
            <strong class="mono">
              {counts[active.id] ?? 0}/{active.exposures}
            </strong>
            <span class="log-active-go">
              {t('an.active.go')} <Icon name="chevron" size={16} />
            </span>
          </span>
          <span class="log-active-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, ((counts[active.id] ?? 0) / active.exposures) * 100)}%` }} />
          </span>
        </button>
      )}
      <Meter />
      <section class="card">
        <div class="card-head">
          <h2>{t('an.log')}</h2>
          <button class="btn ghost small" onClick={() => setOpen(true)} data-testid="btn-new-log">
            <Icon name="plus" size={16} /> {t('an.log.new')}
          </button>
        </div>
        {rolls.length === 0 ? (
          <p class="muted">{t('an.log.empty')}</p>
        ) : (
          <ul class="list">
            {rolls.map((r) => (
              <li key={r.id}>
                <button class="list-row" onClick={() => go({ name: 'log', id: r.id })}>
                  <span>
                    <strong><bdi>{r.film}</bdi></strong>
                    <small class="muted">
                      <bdi>{r.camera}</bdi> · <bdi>ISO {r.iso}</bdi> · {formatDate(r.startedAt, signalLang.value)}
                    </small>
                  </span>
                  <span class="list-row-end">
                    <small class="mono muted">
                      {counts[r.id] ?? 0}/{r.exposures}
                    </small>
                    <Icon name="chevron" size={18} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <NewRollSheet open={open} onClose={() => setOpen(false)} last={rolls[0]} />
    </div>
  );
}

/**
 * One row of standard stops as a real radio group: one Tab stop (the picked stop, else the first),
 * arrows / Home / End move and pick. A value off the list (typed earlier) shows first.
 * The picked stop is marked for the sheet's initial focus.
 */
function StopPicker({ label, options, value, onChange, testId, autofocus }: { label: string; options: string[]; value: string; onChange: (v: string) => void; testId: string; autofocus?: boolean }) {
  const opts = value && !options.includes(value) ? [value, ...options] : options;
  const row = useRef<HTMLDivElement>(null);
  const focusNext = useRef<string | null>(null);
  const current = opts.indexOf(value);
  // Bring the picked stop into view (horizontal only: the sheet itself must not jump).
  useLayoutEffect(() => {
    const el = row.current;
    const on = el?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (el && on) centerInStrip(el, on);
  }, []);
  // After a keyboard pick, focus follows the new stop (the list can shift when an off-list value drops out).
  useLayoutEffect(() => {
    const el = row.current;
    if (!el || focusNext.current === null || focusNext.current !== value) return;
    focusNext.current = null;
    const on = el.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!on) return;
    on.focus({ preventScroll: true });
    revealInStrip(el, on);
  }, [value]);
  const onKeyDown = (e: KeyboardEvent) => {
    const n = opts.length;
    if (!n) return;
    const at = Math.max(0, current);
    let next = -1;
    const step = arrowStep(e.key);
    if (step > 0) next = current < 0 ? 0 : (at + 1) % n;
    else if (step < 0) next = current < 0 ? n - 1 : (at - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    e.stopPropagation();
    focusNext.current = opts[next];
    onChange(opts[next]);
  };
  return (
    <div class="field">
      <span>{label}</span>
      <div class="stop-picker" role="radiogroup" aria-label={label} ref={row} onKeyDown={onKeyDown} data-testid={testId}>
        {opts.map((o, i) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={o === value}
            tabIndex={i === current || (current < 0 && i === 0) ? 0 : -1}
            data-autofocus={autofocus && o === value ? '' : undefined}
            class={o === value ? 'on' : ''}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

type Editing = { mode: 'new' } | { mode: 'edit'; frame: LogFrame };

export function LogScreen({ id }: { id: string }) {
  const [roll, setRoll] = useState<LogRoll | null>();
  const [frames, setFrames] = useState<LogFrame[]>([]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [aperture, setAperture] = useState('');
  const [shutter, setShutter] = useState('');
  const [lens, setLens] = useState('');
  const [note, setNote] = useState('');
  const [manual, setManual] = useState(false);
  const [withLoc, setWithLoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  const reload = async () => {
    const rs = await listLogRolls();
    setRoll(rs.find((r) => r.id === id) ?? null);
    setFrames(await listLogFrames(id));
  };
  useEffect(() => {
    void reload();
  }, [id]);

  if (roll === null) {
    return (
      <div class="page">
        <Header title={t('an.title')} onBack={() => back({ name: 'analog' })} />
        <Empty title={t('common.notFound')} />
      </div>
    );
  }
  if (!roll) return null;

  const last = frames[frames.length - 1];
  const full = frames.length >= roll.exposures;

  /** The meter's suggestion for this roll's film (empty past the dial rather than a wrong speed). */
  const meterValues = () => {
    const mm = meter.value;
    const a = advise(mm.light, roll.iso, mm.aperture, mm.comp);
    return { aperture: `f/${mm.aperture}`, shutter: a.outOfRange ? '' : a.label };
  };

  const openNew = () => {
    // Between real shots most settings stay put: start from the previous frame, else the meter.
    const v = last ? { aperture: last.aperture, shutter: last.shutter } : meterValues();
    setAperture(v.aperture);
    setShutter(v.shutter);
    setLens(last?.lens ?? '');
    setNote('');
    setManual(false);
    setEditing({ mode: 'new' });
  };

  const openEdit = (f: LogFrame) => {
    setAperture(f.aperture);
    setShutter(f.shutter);
    setLens(f.lens);
    setNote(f.note);
    setManual(false);
    setEditing({ mode: 'edit', frame: f });
  };

  const useMeter = () => {
    const v = meterValues();
    setAperture(v.aperture);
    setShutter(v.shutter);
  };

  /** Runs one save at a time: the location lookup can take seconds and a second tap must not log twice. */
  const once = async (fn: () => Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      await fn();
    } catch (err) {
      console.error('[silvr] log frame not saved', err);
      saveError(err);
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  const logFrame = async (v: { aperture: string; shutter: string; lens: string; note: string }) => {
    let lat: number | undefined;
    let lon: number | undefined;
    if (withLoc && navigator.geolocation) {
      try {
        // High accuracy = GPS. Without it Android's WebView asks only the network provider,
        // which has no fix outdoors without Wi-Fi/cell positioning, so nothing would be saved.
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }),
        );
        lat = Math.round(pos.coords.latitude * 1e5) / 1e5;
        lon = Math.round(pos.coords.longitude * 1e5) / 1e5;
      } catch {
        toast(t('an.log.noLocation')); // saved without it; say so rather than leave a silent gap
      }
    }
    const f = await addLogFrame({ rollId: id, aperture: v.aperture.trim(), shutter: v.shutter.trim(), lens: v.lens.trim(), note: v.note.trim(), takenAt: Date.now(), lat, lon });
    return f;
  };

  const submit = (e: Event) => {
    e.preventDefault();
    const cur = editing;
    if (!cur) return;
    void once(async () => {
      if (cur.mode === 'edit') {
        await updateLogFrame(cur.frame.id, { aperture: aperture.trim(), shutter: shutter.trim(), lens: lens.trim(), note: note.trim() });
      } else {
        if (frames.length >= roll.exposures) return;
        await logFrame({ aperture, shutter, lens, note });
      }
      setEditing(null);
      await reload();
      if (cur.mode === 'new') showNewest();
    });
  };

  /** The fast path between shots: same aperture, shutter and lens as the previous frame. */
  const repeat = () => {
    if (!last || full) return;
    void once(async () => {
      const f = await logFrame({ aperture: last.aperture, shutter: last.shutter, lens: last.lens, note: '' });
      await reload();
      showNewest();
      if (f) toast(t('an.log.logged', { n: f.frame }), undefined, 1600);
    });
  };

  /** Keep the frame just logged in view above the fixed buttons. */
  const showNewest = () => requestAnimationFrame(() => window.scrollTo({ top: document.documentElement.scrollHeight }));

  const removeFrame = async (f: LogFrame) => {
    try {
      await deleteLogFrame(f.id);
    } catch (err) {
      console.error('[silvr] log frame not deleted', err);
      toast(t('common.error'));
      return;
    }
    await reload();
    toast(
      t('an.log.deleted', { n: f.frame }),
      {
        label: t('an.log.undo'),
        run: () =>
          void restoreLogFrame(f)
            .then((ok) => {
              if (!ok) toast(t('an.log.undoFailed'));
              return reload();
            })
            .catch(() => toast(t('common.error'))),
      },
      6000,
    );
  };

  const exportCsv = async () => {
    const csv = logToCsv(roll, frames);
    try {
      // saveFile goes through the share sheet in the native apps, where an <a download> does nothing.
      await saveFile(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `FilmCamela_log_${roll.film.replace(/[^\p{L}\p{N}_-]+/gu, '_')}_${fileStamp(roll.startedAt)}.csv`);
    } catch (err) {
      console.error('[silvr] csv export failed', err);
      toast(t('common.error'));
    }
  };

  const remove = async () => {
    if (!(await confirm(t('an.log.deleteConfirm'), t('common.delete'), true))) return;
    await deleteLogRoll(id);
    if (isCurrent({ name: 'log', id })) goTab({ name: 'analog' }); // unwind, so back never lands on the deleted log
  };

  const timeOf = (ts: number) => formatTime(ts);
  const isEdit = editing?.mode === 'edit';
  // Where focus lands when the frame sheet opens (manual entry: its first field, the sheet's default).
  const sheetFocus = manual ? null : aperture ? 'aperture' : shutter ? 'shutter' : 'save';

  return (
    <div class="page log" data-testid="log-screen">
      <Header
        title={roll.film}
        sub={`${roll.camera} · ISO ${roll.iso} · ${t('an.log.frames', { n: frames.length, m: roll.exposures })}`}
        onBack={() => back({ name: 'analog' })}
        right={
          <>
            <button class="icon-btn" onClick={exportCsv} aria-label={t('an.log.export')} data-testid="btn-csv">
              <Icon name="download" />
            </button>
            <button class="icon-btn" onClick={remove} aria-label={t('an.log.deleteRoll')}>
              <Icon name="trash" />
            </button>
          </>
        }
      />
      <ul class="list frames">
        {frames.map((f) => (
          <li key={f.id} class="frame-row" data-testid="log-frame">
            <button class="frame-main" onClick={() => openEdit(f)} data-testid="log-frame-edit">
              <span class="mono frame-num">{f.frame}</span>
              <span class="grow">
                <strong class="mono">
                  {f.aperture || '—'} · {f.shutter || '—'}
                </strong>
                <small class="muted">{[f.lens, f.note, timeOf(f.takenAt)].filter(Boolean).join(' · ')}</small>
              </span>
              <span class="sr-only">{t('an.log.editFrame', { n: f.frame })}</span>
            </button>
            <button class="icon-btn" aria-label={t('an.log.deleteFrame', { n: f.frame })} onClick={() => void removeFrame(f)}>
              <Icon name="close" size={18} />
            </button>
          </li>
        ))}
      </ul>
      {frames.length === 0 && <p class="muted center">{t('an.log.firstHint')}</p>}
      {full && <p class="muted center">{t('an.log.full')}</p>}
      <div class="log-actions">
        {last && (
          <button class="btn primary log-repeat" onClick={repeat} disabled={full || saving} data-testid="btn-repeat-frame">
            <span>{t('an.log.repeat')}</span>
            <small class="mono">
              {[last.aperture, last.shutter].filter(Boolean).join(' · ')}
            </small>
          </button>
        )}
        <button class={`btn ${last ? 'ghost' : 'primary'} log-add`} onClick={openNew} disabled={full} data-testid="btn-add-frame">
          <Icon name="plus" size={18} /> {last ? t('an.log.otherSettings') : t('an.log.addFrame')}
        </button>
      </div>
      <Sheet open={!!editing} onClose={() => setEditing(null)} title={isEdit ? t('an.log.editFrame', { n: (editing as { frame: LogFrame }).frame.frame }) : t('an.log.frameN', { n: (last?.frame ?? 0) + 1 })} testId="add-frame">
        <form class="form" onSubmit={submit}>
          {manual ? (
            <div class="two">
              <label class="field">
                <span>{t('an.aperture')}</span>
                <input value={aperture} onInput={(e) => setAperture(e.currentTarget.value)} maxLength={10} data-testid="frame-aperture" />
              </label>
              <label class="field">
                <span>{t('an.shutter')}</span>
                <input value={shutter} onInput={(e) => setShutter(e.currentTarget.value)} maxLength={10} data-testid="frame-shutter" />
              </label>
            </div>
          ) : (
            <>
              {/* Initial focus: the picked aperture, else the picked shutter, else Save (never f/1.2 by default). */}
              <StopPicker label={t('an.aperture')} options={LOG_APERTURES} value={aperture} onChange={setAperture} testId="pick-aperture" autofocus={sheetFocus === 'aperture'} />
              <StopPicker label={t('an.shutter')} options={LOG_SHUTTERS} value={shutter} onChange={setShutter} testId="pick-shutter" autofocus={sheetFocus === 'shutter'} />
            </>
          )}
          <div class="log-tools">
            <button type="button" class="btn ghost small" onClick={useMeter}>
              {t('an.log.useMeter')}
            </button>
            <button type="button" class="link-btn" aria-pressed={manual} onClick={() => setManual(!manual)} data-testid="btn-manual">
              {manual ? t('an.log.pickStops') : t('an.log.manual')}
            </button>
          </div>
          <label class="field">
            <span>{t('an.log.lens')}</span>
            <input value={lens} onInput={(e) => setLens(e.currentTarget.value)} placeholder="50mm f/1.8" maxLength={40} />
          </label>
          <label class="field">
            <span>{t('an.log.note')}</span>
            <input value={note} onInput={(e) => setNote(e.currentTarget.value)} maxLength={140} data-testid="frame-note" />
          </label>
          {!isEdit && (
            <label class="row toggle">
              <span>{t('an.log.location')}</span>
              <input type="checkbox" role="switch" checked={withLoc} onChange={(e) => setWithLoc(e.currentTarget.checked)} />
              <span class="switch" aria-hidden="true" />
            </label>
          )}
          <button class="btn primary wide log-sheet-save" type="submit" disabled={saving} data-autofocus={sheetFocus === 'save' ? '' : undefined} data-testid="frame-save">
            {isEdit ? t('an.log.saveEdit') : t('an.log.saveFrame')}
          </button>
        </form>
      </Sheet>
    </div>
  );
}
