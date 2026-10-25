import { useEffect, useRef, useState } from 'preact/hooks';
import { t, type MsgKey } from '../i18n';

const SLIDES: { title: MsgKey; body: MsgKey; art: string }[] = [
  { title: 'onb.1.title', body: 'onb.1.body', art: 'roll' },
  { title: 'onb.2.title', body: 'onb.2.body', art: 'lab' },
  { title: 'onb.3.title', body: 'onb.3.body', art: 'dark' },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Move focus to each new step so screen readers read it.
  useEffect(() => {
    if (i > 0) titleRef.current?.focus();
  }, [i]);
  const last = i === SLIDES.length - 1;
  const s = SLIDES[i];
  return (
    <div class="onboarding" role="dialog" aria-modal="true" aria-label="SILVR" data-testid="onboarding">
      <div class="onb-brand">
        <span class="logo">SILVR</span>
        <span class="muted small">{t('app.tagline')}</span>
      </div>
      <div class={`onb-art art-${s.art}`} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <h1 tabIndex={-1} ref={titleRef}>
        <span class="sr-only">
          {i + 1}/{SLIDES.length}.{' '}
        </span>
        {t(s.title)}
      </h1>
      <p>{t(s.body)}</p>
      {last && <p class="onb-privacy small">{t('onb.privacy')}</p>}
      <div class="dots" aria-hidden="true">
        {SLIDES.map((_, k) => (
          <i key={k} class={k === i ? 'on' : ''} />
        ))}
      </div>
      <div class="btn-row">
        {!last && (
          <button class="btn ghost" onClick={onDone} data-testid="onb-skip">
            {t('common.skip')}
          </button>
        )}
        <button class="btn primary" onClick={() => (last ? onDone() : setI(i + 1))} data-testid="onb-next">
          {last ? t('common.start') : t('common.next')}
        </button>
      </div>
    </div>
  );
}
