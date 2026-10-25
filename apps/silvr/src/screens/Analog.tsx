import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { advise, APERTURES, ISOS, LIGHTS, type Light } from '../companion/exposure';
import { Icon } from '../components/Icon';
import { Empty, formatDate, Header, Sheet, Slider } from '../components/ui';
import { t } from '../i18n';
import { download } from '../platform/share';
import { confirm } from '../state/app';
import { signalLang } from '../state/lang';
import { back, go } from '../state/router';
import { deleteLogFrame, deleteLogRoll, listLogFrames, listLogRolls, logToCsv, saveLogFrame, saveLogRoll, type LogFrame, type LogRoll } from '../store/filmLog';

/** Last meter reading, so the log form can prefill it. */
export const meter = signal({ iso: 400, light: 'sunny' as Light, aperture: 8, comp: 0 });

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
          <small class="muted">EV</small>
          <strong class="mono">{a.ev.toFixed(1)}</strong>
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
      <Slider label={t('an.comp')} value={m.comp} min={-3} max={3} step={1 / 3} onInput={(v) => set({ comp: Math.round(v * 3) / 3 })} format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`} />
    </section>
  );
}

function NewRollSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [camera, setCamera] = useState('');
  const [film, setFilm] = useState('');
  const [iso, setIso] = useState(400);
  const [exp, setExp] = useState(36);
  const submit = async (e: Event) => {
    e.preventDefault();
    const r = await saveLogRoll({ camera: camera.trim() || '—', film: film.trim() || '—', iso, exposures: exp, startedAt: Date.now(), note: '' });
    onClose();
    go({ name: 'log', id: r.id });
  };
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
              {[12, 24, 27, 36, 72].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button class="btn primary wide" type="submit" data-testid="log-create">
          {t('common.start')}
        </button>
      </form>
    </Sheet>
  );
}

export function AnalogScreen() {
  const [rolls, setRolls] = useState<LogRoll[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    listLogRolls().then(setRolls).catch(() => setRolls([]));
  }, [open]);
  return (
    <div class="page" data-testid="analog-screen">
      <Header title={t('an.title')} sub={t('an.subtitle')} />
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
                    <strong>{r.film}</strong>
                    <small class="muted">
                      {r.camera} · ISO {r.iso} · {formatDate(r.startedAt, signalLang.value)}
                    </small>
                  </span>
                  <Icon name="chevron" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <NewRollSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export function LogScreen({ id }: { id: string }) {
  const [roll, setRoll] = useState<LogRoll | null>();
  const [frames, setFrames] = useState<LogFrame[]>([]);
  const [adding, setAdding] = useState(false);
  const m = meter.value;
  const [aperture, setAperture] = useState(`f/${m.aperture}`);
  const [shutter, setShutter] = useState(advise(m.light, m.iso, m.aperture, m.comp).label);
  const [lens, setLens] = useState('');
  const [note, setNote] = useState('');
  const [withLoc, setWithLoc] = useState(false);

  const reload = async () => {
    const rs = await listLogRolls();
    setRoll(rs.find((r) => r.id === id) ?? null);
    setFrames(await listLogFrames(id));
  };
  useEffect(() => {
    void reload();
  }, [id]);

  if (roll === null) return <Empty title="—" />;
  if (!roll) return null;

  const useMeter = () => {
    const mm = meter.value;
    setAperture(`f/${mm.aperture}`);
    setShutter(advise(mm.light, roll.iso, mm.aperture, mm.comp).label);
  };

  const add = async (e: Event) => {
    e.preventDefault();
    let lat: number | undefined;
    let lon: number | undefined;
    if (withLoc && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, maximumAge: 60000 }));
        lat = Math.round(pos.coords.latitude * 1e5) / 1e5;
        lon = Math.round(pos.coords.longitude * 1e5) / 1e5;
      } catch {
        /* location optional */
      }
    }
    const next = (frames[frames.length - 1]?.frame ?? 0) + 1;
    await saveLogFrame({ rollId: id, frame: next, aperture, shutter, lens: lens.trim(), note: note.trim(), takenAt: Date.now(), lat, lon });
    setNote('');
    setAdding(false);
    await reload();
  };

  const exportCsv = () => {
    const csv = logToCsv(roll, frames);
    download(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), `SILVR_log_${roll.film.replace(/[^\w-]+/g, '_')}.csv`);
  };

  const remove = async () => {
    if (!(await confirm(t('an.log.deleteConfirm'), t('common.delete'), true))) return;
    await deleteLogRoll(id);
    go({ name: 'analog' }, true);
  };

  return (
    <div class="page" data-testid="log-screen">
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
            <span class="mono frame-num">{f.frame}</span>
            <span class="grow">
              <strong class="mono">
                {f.aperture} · {f.shutter}
              </strong>
              <small class="muted">
                {[f.lens, f.note, new Date(f.takenAt).toLocaleTimeString(signalLang.value === 'ko' ? 'ko-KR' : 'en-US', { hour: '2-digit', minute: '2-digit' })].filter(Boolean).join(' · ')}
              </small>
            </span>
            <button
              class="icon-btn"
              aria-label={t('common.delete')}
              onClick={async () => {
                await deleteLogFrame(f.id);
                await reload();
              }}
            >
              <Icon name="close" size={18} />
            </button>
          </li>
        ))}
      </ul>
      <button class="fab" onClick={() => setAdding(true)} disabled={frames.length >= roll.exposures} data-testid="btn-add-frame" aria-label={t('an.log.addFrame')}>
        <Icon name="plus" />
      </button>
      <Sheet open={adding} onClose={() => setAdding(false)} title={t('an.log.addFrame')} testId="add-frame">
        <form class="form" onSubmit={add}>
          <div class="two">
            <label class="field">
              <span>{t('an.aperture')}</span>
              <input value={aperture} onInput={(e) => setAperture(e.currentTarget.value)} maxLength={10} data-testid="frame-aperture" />
            </label>
            <label class="field">
              <span>{t('an.shutter')}</span>
              <input value={shutter} onInput={(e) => setShutter(e.currentTarget.value)} maxLength={10} />
            </label>
          </div>
          <button type="button" class="btn ghost small" onClick={useMeter}>
            {t('an.log.useMeter')}
          </button>
          <label class="field">
            <span>{t('an.log.lens')}</span>
            <input value={lens} onInput={(e) => setLens(e.currentTarget.value)} placeholder="50mm f/1.8" maxLength={40} />
          </label>
          <label class="field">
            <span>{t('an.log.note')}</span>
            <input value={note} onInput={(e) => setNote(e.currentTarget.value)} maxLength={140} data-testid="frame-note" />
          </label>
          <label class="row toggle">
            <span>{t('an.log.location')}</span>
            <input type="checkbox" role="switch" checked={withLoc} onChange={(e) => setWithLoc(e.currentTarget.checked)} />
            <span class="switch" aria-hidden="true" />
          </label>
          <button class="btn primary wide" type="submit" data-testid="frame-save">
            {t('common.save')}
          </button>
        </form>
      </Sheet>
      {frames.length === 0 && <p class="muted center">{t('an.log.addFrame')} ＋</p>}
    </div>
  );
}
