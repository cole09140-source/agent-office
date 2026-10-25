import type { CameraModel } from './models';

/** Stylised illustration of each camera body (viewBox 120×80). */
export function CameraBody({ camera, width = 96 }: { camera: CameraModel; width?: number }) {
  const [body, accent, trim] = camera.colors;
  const lens = (cx: number, cy: number, r: number) => (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={trim} />
      <circle cx={cx} cy={cy} r={r * 0.78} fill="#0b0b0c" />
      <circle cx={cx} cy={cy} r={r * 0.5} fill="#1b2633" />
      <circle cx={cx - r * 0.22} cy={cy - r * 0.22} r={r * 0.16} fill="#ffffff" opacity="0.55" />
    </g>
  );
  let shape;
  switch (camera.body) {
    case 'slr':
    case 'double':
      shape = (
        <g>
          <path d="M40 30 L48 12 L72 12 L80 30 Z" fill={body} />
          <rect x="10" y="28" width="100" height="42" rx="6" fill={body} />
          <rect x="10" y="40" width="100" height="22" fill={trim} opacity="0.45" />
          <rect x="88" y="22" width="12" height="7" rx="2" fill={accent} />
          {lens(60, 50, 19)}
          {camera.body === 'double' && <path d="M16 32 l8 8 M24 32 l-8 8" stroke={accent} stroke-width="2.5" stroke-linecap="round" />}
        </g>
      );
      break;
    case 'range':
      shape = (
        <g>
          <rect x="8" y="22" width="104" height="44" rx="7" fill={body} />
          <rect x="8" y="22" width="104" height="12" rx="6" fill={accent} />
          <rect x="16" y="25" width="14" height="7" rx="1.5" fill="#2a3440" />
          <rect x="88" y="25" width="16" height="7" rx="1.5" fill="#2a3440" />
          {lens(52, 50, 14)}
        </g>
      );
      break;
    case 'disposable':
      shape = (
        <g>
          <rect x="14" y="20" width="92" height="46" rx="4" fill={body} />
          <rect x="14" y="44" width="92" height="12" fill={accent} />
          <rect x="22" y="26" width="18" height="10" rx="1.5" fill="#f4f4f4" stroke={trim} stroke-width="1" />
          <rect x="94" y="14" width="10" height="8" rx="2" fill={trim} />
          <text x="22" y="54" font-size="9" font-weight="900" fill="#fff" font-family="ui-sans-serif, system-ui">27</text>
          {lens(78, 38, 9)}
        </g>
      );
      break;
    case 'compact':
    case 'half':
      shape = (
        <g>
          <rect x={camera.body === 'half' ? 22 : 12} y="24" width={camera.body === 'half' ? 76 : 96} height="40" rx="12" fill={body} />
          <rect x={camera.body === 'half' ? 72 : 84} y="29" width="12" height="7" rx="2" fill="#2a3440" />
          <circle cx={camera.body === 'half' ? 34 : 24} cy="31" r="2.5" fill={accent} />
          {lens(camera.body === 'half' ? 52 : 52, 46, 12)}
          {camera.body === 'half' && <rect x="74" y="44" width="16" height="12" rx="2" fill={trim} />}
        </g>
      );
      break;
    case 'instant':
      shape = (
        <g>
          <path d="M26 8 H94 L100 72 H20 Z" fill={body} />
          <rect x="56" y="8" width="8" height="64" fill={accent} />
          <rect x="34" y="14" width="20" height="10" rx="2" fill="#f6f6f6" stroke="#bbb" stroke-width="1" />
          <rect x="70" y="14" width="14" height="10" rx="2" fill="#2a3440" />
          <rect x="30" y="66" width="60" height="3" rx="1" fill={trim} />
          {lens(60, 42, 15)}
        </g>
      );
      break;
    case 'toy':
      shape = (
        <g>
          <rect x="16" y="18" width="88" height="52" rx="5" fill={body} />
          <rect x="48" y="10" width="24" height="10" rx="2" fill={trim} />
          <circle cx="60" cy="46" r="22" fill={trim} />
          <circle cx="60" cy="46" r="20" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="2 2" />
          {lens(60, 46, 15)}
        </g>
      );
      break;
    case 'pano':
      shape = (
        <g>
          <rect x="4" y="28" width="112" height="32" rx="6" fill={body} />
          <rect x="4" y="28" width="112" height="9" rx="4" fill={trim} />
          <rect x="70" y="30" width="34" height="6" rx="1.5" fill="#2a3440" />
          {lens(40, 46, 12)}
        </g>
      );
      break;
    case 'fish':
      shape = (
        <g>
          <rect x="18" y="24" width="84" height="42" rx="14" fill={body} />
          <circle cx="60" cy="45" r="21" fill={trim} />
          <circle cx="60" cy="45" r="17" fill="#0b0b0c" />
          <ellipse cx="54" cy="39" rx="8" ry="5" fill="#fff" opacity="0.45" />
          <circle cx="92" cy="30" r="2.5" fill={accent} />
        </g>
      );
      break;
    case 'quad':
      shape = (
        <g>
          <rect x="10" y="22" width="100" height="44" rx="8" fill={body} />
          <rect x="10" y="22" width="100" height="10" rx="6" fill={accent} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>{lens(28 + (i % 2) * 18 + (i > 1 ? 0 : 0), 42 + Math.floor(i / 2) * 14, 6)}</g>
          ))}
          <rect x="72" y="38" width="28" height="20" rx="3" fill={trim} />
        </g>
      );
      break;
    case 'cine':
      shape = (
        <g>
          <circle cx="34" cy="18" r="13" fill={trim} />
          <circle cx="62" cy="18" r="13" fill={trim} />
          <circle cx="34" cy="18" r="4" fill={body} />
          <circle cx="62" cy="18" r="4" fill={body} />
          <rect x="14" y="28" width="72" height="40" rx="5" fill={body} />
          <rect x="86" y="38" width="22" height="20" rx="3" fill={trim} />
          <circle cx="24" cy="36" r="3" fill={accent} />
          {lens(108, 48, 8)}
        </g>
      );
      break;
    case 'digicam':
      shape = (
        <g>
          <rect x="10" y="22" width="100" height="40" rx="8" fill={body} />
          <rect x="10" y="54" width="100" height="5" fill={trim} />
          <rect x="18" y="28" width="12" height="8" rx="1.5" fill="#f4f4f4" stroke="#999" stroke-width="0.8" />
          <rect x="40" y="27" width="22" height="4" rx="1" fill={accent} />
          {lens(86, 40, 10)}
        </g>
      );
      break;
    case 'pixel':
      shape = (
        <g>
          <rect x="34" y="6" width="52" height="70" rx="6" fill={body} />
          <circle cx="60" cy="10" r="8" fill={accent} />
          <circle cx="60" cy="10" r="4" fill="#0b0b0c" />
          <rect x="40" y="18" width="40" height="28" rx="2" fill="#3b3b3b" />
          <rect x="44" y="21" width="32" height="22" fill="#9bbc0f" />
          <path d="M46 56 h4 v-4 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 z" fill={trim} />
          <circle cx="70" cy="62" r="3" fill={accent} />
          <circle cx="77" cy="57" r="3" fill={accent} />
        </g>
      );
      break;
  }
  return (
    <svg width={width} height={(width * 80) / 120} viewBox="0 0 120 80" aria-hidden="true" class="camera-body">
      {shape}
    </svg>
  );
}
