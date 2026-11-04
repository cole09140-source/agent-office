/**
 * MY tab (top of the old Settings screen) and the paywall sheet — the UI on top of src/monetize.
 *
 *  - Shots card: today's free shots (x/10, film-counter style), earned shots, when the free ones refill.
 *  - Rewarded ad: "Watch an ad · +10" with "n of 10 left today" and every disabled state.
 *  - Pro: three plans with the store's own localized prices, buy / restore / manage, required disclosure.
 *  - Web (PWA): no store, no ads → 10 a day and a calm "get the app" card.
 *  - "Ad privacy choices" row only when Google UMP says this user needs it.
 *
 * Never shows an ad by itself: only a tap on the ad button calls showRewarded().
 */
import { signal } from '@preact/signals';
import { useEffect, useId, useRef, useState } from 'preact/hooks';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/ui';
import { legalLang, t } from '../i18n';
import { formatDate, formatNumber, formatTime } from '../intl/format';
import {
  AD_REWARD_SHOTS,
  adShowing,
  adsAvailable,
  billingBusy,
  canBuy,
  canWatchAds,
  entitlement,
  FREE_SHOTS_PER_DAY,
  isPro,
  manageSubscriptions,
  MAX_ADS_PER_DAY,
  nativePlatform,
  PRODUCTS,
  privacyOptionsRequired,
  products,
  purchase,
  purchasePending,
  quota,
  restore,
  showPrivacyOptions,
  showRewarded,
  type ProductKind,
  type RewardedResult,
} from '../monetize';
import { isNative } from '../platform/share';
import { toast } from '../state/app';
import './My.css';

/** Film Camela on Google Play. The App Store link is not live yet, so iOS gets no link for now. */
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.filmcamela.app';
export const APP_STORE_URL: string | null = null;

/** Set by the paywall's "Go Pro": MY opens with the Pro card in view and focused. */
export const proRequest = signal(false);

/** navigator.onLine, live. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}

/** Shows one rewarded ad (only ever from a tap) and says how it went. */
export async function watchAd(): Promise<RewardedResult> {
  const r = await showRewarded();
  if (r === 'rewarded') toast(t('my.ad.rewarded', { n: AD_REWARD_SHOTS }));
  else if (r === 'dismissed') toast(t('my.ad.dismissed', { n: AD_REWARD_SHOTS }));
  else if (r === 'failed') toast(t('my.ad.failed'));
  else toast(t('my.ad.blocked'));
  return r;
}

const two = (n: number) => formatNumber(n, undefined, { minimumIntegerDigits: 2 });
/** The store's name never breaks across lines (no-break space). */
const storeName = () => (nativePlatform() === 'ios' ? 'App Store' : 'Google Play');
/** Legal pages open in place inside the native apps (a new window has nowhere to go there). */
const legalLinkAttrs = () => (isNative() ? {} : { target: '_blank', rel: 'noopener' });

// ---------------------------------------------------------------- shots

/** Ten frame marks, lit for each free shot still left today (decorative). */
function FrameMarks({ left }: { left: number }) {
  return (
    <span class="my-marks" aria-hidden="true">
      {Array.from({ length: FREE_SHOTS_PER_DAY }, (_, i) => (
        <i key={i} class={i < left ? 'on' : ''} />
      ))}
    </span>
  );
}

function ShotsCard() {
  const q = quota.value;
  const pro = isPro.value;
  if (q.unlimited) {
    return (
      <section class="card my-shots" aria-labelledby="my-shots-h" data-testid="my-shots" data-state="unlimited">
        <h2 id="my-shots-h" class="my-label">
          {t('my.free')}
        </h2>
        <p class="my-count">
          <span class="my-count-num">∞</span>
          <span class="my-count-word">{t('my.unlimited')}</span>
        </p>
        {pro && <p class="muted small my-note">{t('my.ad.pro')}</p>}
      </section>
    );
  }
  const total = FREE_SHOTS_PER_DAY;
  return (
    <section class="card my-shots" aria-labelledby="my-shots-h" data-testid="my-shots" data-state={q.freeLeft + q.earned > 0 ? 'some' : 'empty'}>
      <h2 id="my-shots-h" class="my-label">
        {t('my.free')}
      </h2>
      <p class="my-count">
        {/* Read as one sentence; the counter itself is decoration. */}
        <span class="sr-only">{t('my.free.say', { left: q.freeLeft, n: total })}</span>
        <bdi dir="ltr" class="my-count-num mono" aria-hidden="true" data-testid="my-free-left">
          {two(q.freeLeft)}
          <small>/{two(total)}</small>
        </bdi>
        <FrameMarks left={q.freeLeft} />
      </p>
      <div class="my-earned">
        <span>
          <span class="my-earned-label">{t('my.earned.label')}</span>
          <small class="muted">{t('my.earned.note')}</small>
        </span>
        <strong data-testid="my-earned">
          {t('cam.nShots', { n: q.earned })}
        </strong>
      </div>
      <p class="muted small my-reset" data-testid="my-reset">
        {t('my.resets', { n: total, time: formatTime(q.resetsAt) })}
      </p>
    </section>
  );
}

/**
 * "Watch an ad · +10" with its status line (n of 10 left today, loading, none left, offline, blocked).
 * The caller decides whether ads exist at all (native, not Pro).
 */
export function AdAction({ onRewarded, guard, testId = 'btn-watch-ad', primary = false }: { onRewarded?: () => void; guard?: () => boolean; testId?: string; primary?: boolean }) {
  const q = quota.value;
  const online = useOnline();
  const noteId = useId();
  const loading = adShowing.value;
  const none = q.adsLeftToday <= 0;
  const blocked = !adsAvailable.value && !none;
  // Only an ad already loading disables the button: every other state still answers a tap
  // (it tries the ad, or says why there is none), so the button is never dead.
  const note = loading
    ? t('my.ad.loading')
    : none
      ? t('my.ad.none')
      : !online
        ? t('my.ad.offline')
        : blocked
          ? t('my.ad.blocked')
          : t('my.ad.left', { left: q.adsLeftToday, n: MAX_ADS_PER_DAY });
  const state = loading ? 'loading' : none ? 'none' : !online ? 'offline' : blocked ? 'blocked' : 'ready';
  return (
    <div class="my-ad" data-state={state}>
      <button
        class={`btn ${primary ? 'primary' : ''} wide my-ad-btn`}
        disabled={loading}
        aria-describedby={noteId}
        aria-busy={loading || undefined}
        data-testid={testId}
        onClick={async () => {
          if (guard?.()) return;
          if (none) {
            toast(t('my.ad.none'));
            return;
          }
          const r = await watchAd();
          if (r === 'rewarded') onRewarded?.();
        }}
      >
        {t('my.ad.watch', { n: AD_REWARD_SHOTS })}
      </button>
      <p id={noteId} class="muted small my-ad-note" role="status" aria-live="polite" data-testid="ad-note">
        {note}
      </p>
    </div>
  );
}

/** Web / PWA: no store and no ads here. One calm card that points to the app. */
export function GetAppCard({ compact = false }: { compact?: boolean }) {
  const body = (
    <>
      <p class={`muted ${compact ? 'small' : ''} my-app-body`}>{t('my.app.body', { n: AD_REWARD_SHOTS })}</p>
      <a class="btn ghost wide my-app-link" href={PLAY_URL} target="_blank" rel="noopener" data-testid="get-app-play">
        {t('my.app.play')}
      </a>
      {APP_STORE_URL && (
        <a class="btn ghost wide my-app-link" href={APP_STORE_URL} target="_blank" rel="noopener" data-testid="get-app-ios">
          App Store
        </a>
      )}
    </>
  );
  if (compact) return <div class="my-app compact" data-testid="get-app">{body}</div>;
  return (
    <section class="card my-app" aria-labelledby="my-app-h" data-testid="get-app">
      <h2 id="my-app-h">{t('my.app.title')}</h2>
      {body}
    </section>
  );
}

// ---------------------------------------------------------------- Pro

const PLAN_KEYS: Record<ProductKind, { name: 'my.plan.week' | 'my.plan.3month' | 'my.plan.lifetime'; d: 'my.plan.week.d' | 'my.plan.3month.d' | 'my.plan.lifetime.d' }> = {
  week: { name: 'my.plan.week', d: 'my.plan.week.d' },
  '3month': { name: 'my.plan.3month', d: 'my.plan.3month.d' },
  lifetime: { name: 'my.plan.lifetime', d: 'my.plan.lifetime.d' },
};

async function buy(kind: ProductKind, onPro?: () => void): Promise<void> {
  const def = PRODUCTS.find((p) => p.kind === kind);
  if (!def) return;
  const r = await purchase(def.id);
  if (r === 'purchased') {
    toast(t('my.buy.done'));
    onPro?.();
  } else if (r === 'pending') toast(t('my.pro.pending'), undefined, 6000);
  else if (r === 'failed') toast(t('my.buy.failed'));
  else if (r === 'unavailable') toast(t('my.pro.noStore'));
  // 'cancelled': the user closed the store sheet themselves; nothing to say.
}

async function doRestore(): Promise<void> {
  const r = await restore();
  toast(r === 'restored' ? t('my.restore.done') : r === 'none' ? t('my.restore.none') : r === 'unavailable' ? t('my.pro.noStore') : t('my.restore.failed'));
}

function ProCard() {
  const [plan, setPlan] = useState<ProductKind>('3month');
  const busy = billingBusy.value;
  const store = canBuy.value;
  const pro = isPro.value;
  const ent = entitlement.value;
  const list = products.value;
  const headRef = useRef<HTMLHeadingElement>(null);
  const wantPro = proRequest.value;

  // From the paywall's "Go Pro": bring the plans into view once the screen-change focus has run.
  useEffect(() => {
    if (!wantPro) return;
    proRequest.value = false;
    const id = setTimeout(() => {
      headRef.current?.scrollIntoView({ block: 'start' });
      headRef.current?.focus({ preventScroll: true });
    }, 140);
    return () => clearTimeout(id);
  }, [wantPro]);

  const price = (kind: ProductKind) => list.find((p) => p.kind === kind)?.price;

  return (
    <section class="card my-pro" aria-labelledby="my-pro-h" data-testid="my-pro" data-state={pro ? 'pro' : 'free'}>
      <div class="my-pro-head">
        <h2 id="my-pro-h" ref={headRef} tabIndex={-1}>
          Film Camela Pro
        </h2>
        {pro && (
          <span class="badge new" data-testid="pro-badge">
            {t('common.pro')}
          </span>
        )}
      </div>
      {pro ? (
        <>
          <p class="my-pro-on">{t('my.pro.on')}</p>
          <p class="muted small">{ent.source === 'lifetime' ? t('my.pro.lifetimeOn') : t('my.pro.subOn')}</p>
          {ent.source === 'subscription' && ent.expiresAt && <p class="muted small">{t('my.pro.renews', { date: formatDate(ent.expiresAt) })}</p>}
          {ent.source === 'subscription' && (
            <button class="btn ghost wide" onClick={() => void manageSubscriptions().catch(() => toast(t('my.pro.noStore')))} data-testid="btn-manage-sub">
              {t('my.manage')}
            </button>
          )}
        </>
      ) : (
        <>
          <p class="muted my-pro-lead">{t('my.pro.lead')}</p>
          <fieldset class="my-plans" disabled={busy}>
            <legend class="sr-only">{t('my.plans')}</legend>
            {PRODUCTS.map((def) => {
              const k = PLAN_KEYS[def.kind];
              const best = def.kind === '3month';
              return (
                <label key={def.id} class={`my-plan${plan === def.kind ? ' on' : ''}${best ? ' best' : ''}`} data-testid={`plan-${def.kind}`}>
                  <input type="radio" name="my-plan" value={def.kind} checked={plan === def.kind} onChange={() => setPlan(def.kind)} />
                  <span class="my-plan-txt">
                    <span class="my-plan-name">
                      {t(k.name)}
                      {best && <span class="my-plan-best">{t('my.plan.best')}</span>}
                    </span>
                    <small class="muted">{t(k.d)}</small>
                  </span>
                  {/* Google Play policy: only the store's own localized price, the same currency as checkout. */}
                  <bdi class="my-plan-price" data-testid={`price-${def.kind}`}>
                    {price(def.kind) ?? '—'}
                  </bdi>
                </label>
              );
            })}
          </fieldset>
          {purchasePending.value && (
            <p class="small my-pro-pending" role="status">
              {t('my.pro.pending')}
            </p>
          )}
          {!store && (
            <p class="muted small my-pro-nostore" role="status">
              {t('my.pro.noStore')}
            </p>
          )}
          {/* Always tappable: if the store was out of reach at start-up, the tap reconnects (or says why not). */}
          <button class="btn primary wide" disabled={busy} aria-busy={busy || undefined} onClick={() => void buy(plan)} data-testid="btn-buy">
            {t('my.buy')}
          </button>
        </>
      )}
      <button class="link-btn my-restore" disabled={busy} onClick={() => void doRestore()} data-testid="btn-restore-purchases">
        {t('my.restore')}
      </button>
      {!pro && (
        <p class="muted small my-legal" data-testid="sub-disclosure">
          {t('my.pro.legal', { store: storeName() })}{' '}
          <a href={`./terms.html?lang=${legalLang()}`} {...legalLinkAttrs()}>
            {t('set.terms')}
          </a>
          {' · '}
          <a href={`./privacy.html?lang=${legalLang()}`} {...legalLinkAttrs()}>
            {t('set.privacy')}
          </a>
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- MY section

/** The top of the MY tab. The existing settings follow it unchanged. */
export function MySection() {
  const native = nativePlatform() !== null;
  const pro = isPro.value;
  return (
    <div class="my" data-testid="my-section">
      <ShotsCard />
      {native ? (
        <>
          {!pro && canWatchAds.value && (
            <section class="card my-ad-card" aria-label={t('my.ad.watch', { n: AD_REWARD_SHOTS })}>
              <AdAction />
            </section>
          )}
          <ProCard />
          {privacyOptionsRequired.value && (
            <section class="card">
              <button class="row link" onClick={() => void showPrivacyOptions().catch(() => toast(t('my.ad.blocked')))} data-testid="btn-ad-privacy">
                <span>{t('my.adPrivacy')}</span>
                <Icon name="chevron" size={18} />
              </button>
            </section>
          )}
        </>
      ) : (
        !quota.value.unlimited && <GetAppCard />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- paywall

/**
 * Bottom sheet when a shutter press finds no shots left. Never starts an ad by itself; focus lands on
 * the calm "Come back tomorrow", and taps in the first moments are ignored (the Space key that pressed
 * the shutter must not also press a button in the sheet when it is released).
 */
export function PaywallSheet({ open, onClose, onGoPro }: { open: boolean; onClose: () => void; onGoPro: () => void }) {
  const openedAt = useRef(0);
  const leadId = useId();
  const resetId = useId();
  useEffect(() => {
    if (open) openedAt.current = Date.now();
  }, [open]);
  // Pro bought (or the day rolled over) while the sheet is up: nothing left to ask.
  const q = quota.value;
  useEffect(() => {
    if (open && (q.unlimited || q.freeLeft > 0)) onClose();
  }, [open, q.unlimited, q.freeLeft]);
  const tooSoon = () => Date.now() - openedAt.current < 450;
  const native = nativePlatform() !== null;
  return (
    <Sheet open={open} onClose={onClose} title={t('pw.title', { n: FREE_SHOTS_PER_DAY })} testId="paywall" describedBy={leadId}>
      <p id={leadId} class="muted pw-lead">
        {t('pw.lead')}
      </p>
      {native ? (
        <>
          {canWatchAds.value && <AdAction primary guard={tooSoon} onRewarded={onClose} testId="pw-watch-ad" />}
          <button class="btn ghost wide" onClick={() => !tooSoon() && onGoPro()} data-testid="pw-pro">
            {t('pw.pro')}
          </button>
        </>
      ) : (
        <GetAppCard compact />
      )}
      <button class="btn ghost wide pw-later" data-autofocus onClick={() => !tooSoon() && onClose()} aria-describedby={resetId} data-testid="pw-later">
        {t('pw.later')}
      </button>
      <p id={resetId} class="muted small center pw-reset">
        {t('my.resets', { n: FREE_SHOTS_PER_DAY, time: formatTime(q.resetsAt) })}
      </p>
    </Sheet>
  );
}
