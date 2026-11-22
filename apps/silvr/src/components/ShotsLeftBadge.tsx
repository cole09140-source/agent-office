/**
 * A quiet "shots left today" pill for the camera screen (free + earned shots). Hidden for Pro / the
 * web QA hatch (unlimited) and until the stored quota has been read. Purely informative: the shutter
 * itself decides (consumeShot), and an empty count opens the paywall from App.
 *
 * Mount it next to the frame counter in the viewfinder, e.g. inside `.viewfinder` after
 * `[data-testid="counter"]` (Camera.tsx). It positions nothing itself: pass `class` for placement.
 */
import { t } from '../i18n';
import { quota } from '../monetize/quota';
import './ShotsLeftBadge.css';

/** Below this many shots the pill turns warm (a gentle "running low"). */
export const LOW_SHOTS = 3;

export function ShotsLeftBadge({ class: cls = '', onClick }: { class?: string; onClick?: () => void }) {
  const q = quota.value;
  if (q.unlimited || !q.ready) return null;
  const n = q.freeLeft + q.earned;
  const low = n <= LOW_SHOTS;
  const label = t('shots.leftSay', { n });
  const body = (
    <>
      <span aria-hidden="true">{t('shots.left', { n })}</span>
      <span class="sr-only">{label}</span>
    </>
  );
  const klass = `shots-left${low ? ' low' : ''}${n === 0 ? ' empty' : ''} ${cls}`.trim();
  return onClick ? (
    <button type="button" class={klass} onClick={onClick} data-testid="shots-left" data-n={n}>
      {body}
    </button>
  ) : (
    <span class={klass} data-testid="shots-left" data-n={n}>
      {body}
    </span>
  );
}
