import type { BackSpec } from './spec';

/**
 * Static decoration of the camera back: the material layer and the parts that sit on the plate
 * (strap lugs, grip, corner screws). Purely decorative, never mirrored in RTL, never hit-testable.
 * Keyed by camera id where it is used, so a body change fades the new material in.
 */
export function BackDecor({ spec }: { spec: BackSpec }) {
  const d = spec.details;
  return (
    <div class="bp-decor" aria-hidden="true">
      <i class="bp-skin" />
      {d.lugs && (
        <>
          <i class="bp-lug bp-l" />
          <i class="bp-lug bp-r" />
        </>
      )}
      {d.grip && <i class="bp-grip" />}
      {d.screws && (
        <>
          <i class="bp-screw bp-bl" />
          <i class="bp-screw bp-br" />
        </>
      )}
    </div>
  );
}

/**
 * The bezel the live preview sits in (LCD frame, rubber eyecup, molded rim…), drawn behind the
 * viewfinder in the same grid cell and sized from it, so the preview itself is never covered.
 */
export function BackWindow({ spec, width, height }: { spec: BackSpec; width: number; height: number }) {
  if (!width || !height) return null;
  const d = spec.details;
  const band = spec.window !== 'optical' && spec.window !== 'waist';
  return (
    <div
      class="bp-window"
      aria-hidden="true"
      style={{
        width: `calc(${width}px + 2 * var(--bp-bez-x))`,
        height: `calc(${height}px + var(--bp-bez-t) + var(--bp-bez-b))`,
      }}
    >
      {(spec.window === 'lcd' || spec.window === 'console' || spec.window === 'housing') && (
        <>
          <i class="bp-wscrew bp-tl" />
          <i class="bp-wscrew bp-tr" />
          <i class="bp-wscrew bp-bl" />
          <i class="bp-wscrew bp-br" />
        </>
      )}
      {band && spec.print && <span class="bp-print" data-print={spec.print} />}
      {band && d.grille && <i class="bp-grille" />}
      {band && d.led && <i class="bp-led" />}
    </div>
  );
}
