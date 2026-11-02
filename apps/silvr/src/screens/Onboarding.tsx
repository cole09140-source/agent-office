import { useEffect, useRef, useState } from 'preact/hooks';
import { guardTaps, trapTab } from '../components/ui';
import { t, type MsgKey } from '../i18n';

const SLIDES: { title: MsgKey; body: MsgKey; art: string }[] = [
  { title: 'onb.1.title', body: 'onb.1.body', art: 'roll' },
  { title: 'onb.2.title', body: 'onb.2.body', art: 'lab' },
  { title: 'onb.3.title', body: 'onb.3.body', art: 'dark' },
];

export function Onboarding({ onDone, onRestore }: { onDone: () => void; onRestore?: () => void }) {
  const [i, setI] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const last = i === SLIDES.length - 1;
  // Closing: the tap that closed it must not fall through to the tab bar under it (double-tap).
  const finish = (then: () => void) => {
    guardTaps();
    then();
  };
  const doneRef = useRef(onDone);
  doneRef.current = () => finish(onDone);
  const advance = () => (last ? doneRef.current() : setI(i + 1));
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  // First slide: focus the main button, so Enter starts right away (the dialog's label and description
  // still read the slide). Later slides: focus the heading so screen readers read the new slide;
  // Enter there goes on as well.
  useEffect(() => {
    if (i === 0) nextRef.current?.focus();
    else titleRef.current?.focus();
  }, [i]);
  // The app is rendered behind the onboarding: keep it out of reach (inert) and Tab inside.
  useEffect(() => {
    const box = boxRef.current;
    if (!box?.parentElement) return;
    const behind = Array.from(box.parentElement.children).filter((el): el is HTMLElement => el !== box && el instanceof HTMLElement);
    behind.forEach((el) => (el.inert = true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') trapTab(e, box);
      else if (e.key === 'Escape') {
        // Escape skips the intro, like the Skip button.
        e.preventDefault();
        doneRef.current();
      } else if (e.key === 'Enter' && (document.activeElement === titleRef.current || document.activeElement === document.body)) {
        e.preventDefault();
        advanceRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      behind.forEach((el) => (el.inert = false));
      window.removeEventListener('keydown', onKey);
    };
  }, []);
  const s = SLIDES[i];
  return (
    <div class="onboarding" role="dialog" aria-modal="true" aria-labelledby="onb-title" aria-describedby="onb-body" ref={boxRef} data-testid="onboarding">
      {/* The slide scrolls on its own above the action row, so large text never hides it behind the buttons. */}
      <div class="onb-scroll">
        <div class="onb-brand">
          <span class="logo">FILM CAMELA</span>
          <span class="muted small">{t('app.tagline')}</span>
        </div>
        <div class={`onb-art art-${s.art}`} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <h1 tabIndex={-1} ref={titleRef} id="onb-title">
          <span class="sr-only">
            {i + 1}/{SLIDES.length}.{' '}
          </span>
          {t(s.title)}
        </h1>
        <p id="onb-body">{t(s.body)}</p>
        {last && <p class="onb-privacy small">{t('onb.privacy')}</p>}
        <div class="dots" aria-hidden="true">
          {SLIDES.map((_, k) => (
            <i key={k} class={k === i ? 'on' : ''} />
          ))}
        </div>
      </div>
      {/* Pinned to the bottom: with large text on a small phone the slide scrolls, the buttons stay in reach. */}
      <div class="onb-actions">
        <div class="btn-row">
          {!last && (
            <button class="btn ghost" onClick={() => doneRef.current()} data-testid="onb-skip">
              {t('common.skip')}
            </button>
          )}
          <button class="btn primary" ref={nextRef} onClick={advance} data-testid="onb-next">
            {last ? t('common.start') : t('common.next')}
          </button>
        </div>
        {/* Moving from another phone: the backup restore lives deep in Settings; offer it here. */}
        {last && onRestore && (
          <button type="button" class="onb-restore" onClick={() => finish(onRestore)} data-testid="onb-restore">
            {t('onb.restore')}
          </button>
        )}
      </div>
    </div>
  );
}
