import type { CameraModel } from './models';

export interface ViewfinderState {
  /** Remaining exposures / card space, for LCD-style finders. */
  left: number;
  /** Half-frame: which half is next (0 = A, 1 = B). */
  half?: number;
  /** Quad: lens currently firing (0-3) or -1. */
  quadIndex?: number;
  /** Double exposure: object URL of the first exposure. */
  ghost?: string;
  dateText?: string;
  palette?: string;
}

/** Per-camera viewfinder dressing drawn over the live preview. */
export function ViewfinderOverlay({ camera, state }: { camera: CameraModel; state: ViewfinderState }) {
  switch (camera.viewfinder) {
    case 'slr':
      return (
        <div class="vf vf-slr" aria-hidden="true">
          <span class="vf-split" />
          <span class="vf-prism" />
        </div>
      );
    case 'range':
      return (
        <div class="vf vf-range" aria-hidden="true">
          <span class="vf-lines" />
          <span class="vf-patch" />
        </div>
      );
    case 'tunnel':
      return <div class="vf vf-tunnel" aria-hidden="true" />;
    case 'compact':
      return (
        <div class="vf vf-compact" aria-hidden="true">
          <span class="vf-lines" />
        </div>
      );
    case 'half':
      return (
        <div class="vf vf-half" aria-hidden="true">
          <span class="vf-half-tag mono">{state.half ? 'B' : 'A'}</span>
        </div>
      );
    case 'instant':
      return <div class="vf vf-instant" aria-hidden="true" />;
    case 'toy':
      return <div class="vf vf-toy" aria-hidden="true" />;
    case 'pano':
      return (
        <div class="vf vf-pano" aria-hidden="true">
          <span class="vf-lines" />
        </div>
      );
    case 'quad':
      return (
        <div class="vf vf-quad" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} class={`vf-cell ${state.quadIndex === i ? 'on' : ''} ${state.quadIndex !== undefined && state.quadIndex > i ? 'done' : ''}`}>
              {i + 1}
            </span>
          ))}
        </div>
      );
    case 'double':
      return (
        <div class="vf vf-double" aria-hidden="true">
          {state.ghost && <img class="vf-ghost" src={state.ghost} alt="" />}
          <span class="vf-double-tag mono">{state.ghost ? '2/2' : '1/2'}</span>
        </div>
      );
    case 'cine':
      return (
        <div class="vf vf-cine" aria-hidden="true">
          <span class="vf-lines" />
          <span class="vf-cine-tag mono">24 FPS · 2.39</span>
        </div>
      );
    case 'lcd':
      return (
        <div class="vf vf-lcd mono" aria-hidden="true">
          <span class="lcd-tl">▣ 4:3 · F</span>
          <span class="lcd-tr">
            <i class="lcd-batt" /> {String(state.left).padStart(2, '0')}
          </span>
          <span class="lcd-focus" />
          {state.dateText && <span class="lcd-br">{state.dateText}</span>}
        </div>
      );
    case 'pixel':
      return (
        <div class="vf vf-pixel mono" aria-hidden="true">
          <span class="px-tag">{String(state.left).padStart(2, '0')}</span>
        </div>
      );
    default:
      return null;
  }
}
