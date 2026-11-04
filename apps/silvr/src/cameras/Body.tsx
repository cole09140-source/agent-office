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
    case 'aqua':
      // Disposable sealed in a chunky clear housing: big shutter paddle, sport finder, dome port.
      shape = (
        <g>
          <rect x="10" y="16" width="100" height="54" rx="12" fill={body} />
          <rect x="16" y="22" width="88" height="42" rx="8" fill="#ffffff" opacity="0.18" />
          <rect x="84" y="8" width="18" height="10" rx="3" fill={accent} />
          <rect x="18" y="26" width="20" height="12" rx="3" fill="#e9f6fb" stroke={trim} stroke-width="1.5" />
          <circle cx="72" cy="42" r="17" fill={trim} />
          {lens(72, 42, 12)}
          <path d="M18 62 q5 -4 10 0 t10 0 t10 0" stroke="#ffffff" stroke-width="1.5" fill="none" opacity="0.75" />
          <circle cx="26" cy="50" r="2" fill="#ffffff" opacity="0.6" />
          <circle cx="33" cy="46" r="1.3" fill="#ffffff" opacity="0.6" />
        </g>
      );
      break;
    case 'wide':
      // Wide instant: broad body, lens left of centre, print slot on top, grip on the right.
      shape = (
        <g>
          <rect x="6" y="20" width="108" height="50" rx="8" fill={body} />
          <rect x="6" y="20" width="108" height="10" rx="6" fill={trim} />
          <rect x="20" y="18" width="56" height="2.5" rx="1" fill="#0b0b0c" />
          <rect x="14" y="22" width="12" height="6" rx="1.5" fill="#2a3440" />
          <rect x="84" y="22" width="22" height="7" rx="1.5" fill="#f6f6f6" stroke="#bbb" stroke-width="0.8" />
          <rect x="96" y="32" width="18" height="38" rx="7" fill={accent} />
          <circle cx="50" cy="49" r="18" fill={trim} />
          {lens(50, 49, 14)}
        </g>
      );
      break;
    case 'tlr':
      // Twin-lens reflex: tall box, viewing lens over taking lens, folding hood on top.
      shape = (
        <g>
          <path d="M38 4 H82 L78 14 H42 Z" fill={trim} />
          <rect x="36" y="12" width="48" height="66" rx="4" fill={body} />
          <rect x="42" y="18" width="36" height="24" rx="3" fill={accent} opacity="0.4" />
          <rect x="84" y="36" width="4" height="8" fill={trim} />
          <circle cx="92" cy="40" r="6" fill={trim} />
          <circle cx="92" cy="40" r="6" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="1.5 1.5" opacity="0.5" />
          {lens(60, 30, 9)}
          {lens(60, 59, 11)}
        </g>
      );
      break;
    case 'super8':
      // Super 8 movie camera: boxy body, pistol grip with trigger, zoom barrel, rear eyepiece.
      shape = (
        <g>
          <rect x="8" y="26" width="12" height="10" rx="3" fill={trim} />
          <rect x="24" y="12" width="40" height="8" rx="2" fill={accent} />
          <rect x="18" y="18" width="70" height="34" rx="6" fill={body} />
          <path d="M46 50 H62 L56 76 H40 Z" fill={trim} />
          <rect x="62" y="52" width="4" height="8" rx="1.5" fill={accent} />
          <rect x="86" y="24" width="20" height="22" rx="3" fill={trim} />
          <text x="28" y="44" font-size="14" font-weight="900" fill={accent} font-family="ui-sans-serif, system-ui">
            8
          </text>
          {lens(106, 35, 9)}
        </g>
      );
      break;
    case 'trip':
      // 60s auto compact: honeycomb selenium meter cell ringing the lens.
      shape = (
        <g>
          <rect x="88" y="16" width="12" height="7" rx="2" fill={trim} />
          <rect x="12" y="22" width="96" height="44" rx="5" fill={body} />
          <rect x="12" y="22" width="96" height="11" rx="4" fill={trim} opacity="0.55" />
          <rect x="18" y="25" width="14" height="6" rx="1.5" fill="#2a3440" />
          <rect x="12" y="40" width="96" height="18" fill={accent} />
          <circle cx="60" cy="48" r="19" fill="#3b3f46" />
          {Array.from({ length: 20 }, (_, i) => {
            const a = (i / 20) * Math.PI * 2;
            return <circle key={i} cx={60 + Math.cos(a) * 16} cy={48 + Math.sin(a) * 16} r="1.4" fill="#8f9bab" />;
          })}
          {lens(60, 48, 12)}
        </g>
      );
      break;
    case 'flash':
      // Party compact with an oversized flash head.
      shape = (
        <g>
          <rect x="14" y="10" width="44" height="20" rx="4" fill={trim} />
          <rect x="18" y="13" width="36" height="14" rx="2" fill="#fffbe6" />
          <path d="M24 13v14 M30 13v14 M36 13v14 M42 13v14 M48 13v14" stroke="#e6dcb0" stroke-width="1.2" />
          <rect x="10" y="28" width="100" height="40" rx="10" fill={body} />
          <rect x="90" y="23" width="10" height="6" rx="2" fill={accent} />
          <rect x="84" y="33" width="14" height="8" rx="2" fill="#2a3440" />
          <rect x="10" y="57" width="100" height="5" fill={accent} />
          {lens(52, 47, 12)}
        </g>
      );
      break;
    case 'kid':
      // Kids' digicam: rubbery twin grips, big friendly lens ring.
      shape = (
        <g>
          <rect x="6" y="26" width="22" height="44" rx="10" fill={trim} />
          <rect x="92" y="26" width="22" height="44" rx="10" fill={trim} />
          <rect x="24" y="11" width="14" height="9" rx="3" fill={accent} />
          <rect x="18" y="18" width="84" height="48" rx="14" fill={body} />
          <rect x="76" y="24" width="16" height="9" rx="3" fill="#2a3440" />
          <circle cx="30" cy="30" r="4" fill={accent} />
          <circle cx="60" cy="44" r="16" fill={accent} />
          {lens(60, 44, 11)}
        </g>
      );
      break;
    case 'sprocket':
      // Wide sprocket-hole panorama: two big winding knobs, cream front, perforation motif.
      shape = (
        <g>
          <circle cx="22" cy="23" r="10" fill={trim} />
          <circle cx="98" cy="23" r="10" fill={trim} />
          <circle cx="22" cy="23" r="10" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="2 2" opacity="0.4" />
          <circle cx="98" cy="23" r="10" fill="none" stroke="#000" stroke-width="1" stroke-dasharray="2 2" opacity="0.4" />
          <rect x="6" y="26" width="108" height="42" rx="6" fill={body} />
          <rect x="6" y="34" width="108" height="22" fill={accent} />
          <rect x="46" y="28" width="28" height="5" rx="1.5" fill="#2a3440" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={14 + i * 8} y="59" width="4" height="4" rx="0.8" fill={accent} />
          ))}
          {lens(60, 45, 13)}
        </g>
      );
      break;
    case 'floppy':
      // Floppy-disk digicam: deep box, the disk slot on the side, lens set in a bulky barrel.
      shape = (
        <g>
          <rect x="8" y="18" width="104" height="50" rx="5" fill={body} />
          <rect x="8" y="18" width="104" height="9" rx="4" fill={trim} />
          <rect x="94" y="30" width="14" height="34" rx="2" fill={trim} />
          <rect x="97" y="34" width="8" height="2.5" rx="1" fill={accent} />
          <rect x="16" y="31" width="14" height="9" rx="1.5" fill="#f4f4f4" stroke="#999" stroke-width="0.8" />
          <rect x="18" y="56" width="22" height="6" rx="1" fill={accent} />
          <circle cx="60" cy="45" r="17" fill={trim} />
          {lens(60, 45, 13)}
        </g>
      );
      break;
    case 'slim':
      // Ultra-slim card camera: thin slab, lens in the top corner behind a sliding cover.
      shape = (
        <g>
          <rect x="10" y="26" width="100" height="36" rx="6" fill={body} />
          <rect x="10" y="26" width="100" height="36" rx="6" fill="none" stroke={accent} stroke-width="1.2" opacity="0.7" />
          <rect x="70" y="29" width="36" height="22" rx="4" fill={accent} opacity="0.85" />
          <rect x="16" y="31" width="10" height="6" rx="1.5" fill="#f4f4f4" stroke="#999" stroke-width="0.6" />
          <rect x="18" y="55" width="40" height="2" rx="1" fill={accent} opacity="0.8" />
          {lens(88, 40, 7)}
        </g>
      );
      break;
    case 'bridge':
      // Superzoom bridge camera: SLR-like hump and grip, a long lens barrel.
      shape = (
        <g>
          <path d="M34 26 L40 14 L60 14 L66 26 Z" fill={body} />
          <rect x="6" y="24" width="74" height="44" rx="7" fill={body} />
          <rect x="6" y="28" width="18" height="40" rx="7" fill={trim} />
          <rect x="62" y="30" width="52" height="32" rx="4" fill={trim} />
          <rect x="72" y="30" width="3" height="32" fill={accent} />
          <rect x="88" y="30" width="2" height="32" fill="#000" opacity="0.35" />
          <rect x="40" y="18" width="12" height="5" rx="1.5" fill="#2a3440" />
          {lens(104, 46, 12)}
        </g>
      );
      break;
    case 'zoomc':
      // 90s zoom compact: rounded clamshell, telescoping lens barrel, flash window top left.
      shape = (
        <g>
          <rect x="8" y="22" width="104" height="44" rx="18" fill={body} />
          <rect x="16" y="28" width="20" height="8" rx="2" fill="#f6f6f6" stroke="#bbb" stroke-width="0.8" />
          <rect x="84" y="28" width="14" height="7" rx="2" fill="#2a3440" />
          <circle cx="60" cy="46" r="18" fill={trim} />
          <circle cx="60" cy="46" r="15" fill={body} />
          <circle cx="60" cy="46" r="15" fill="none" stroke={accent} stroke-width="1" opacity="0.6" />
          {lens(60, 46, 12)}
          <rect x="18" y="56" width="16" height="3" rx="1" fill={accent} />
        </g>
      );
      break;
    case 'mf':
      // 6×4.5 medium-format SLR: boxy body, film back on the right, folding finder hood on top.
      shape = (
        <g>
          <rect x="30" y="8" width="44" height="14" rx="2" fill={trim} />
          <rect x="14" y="20" width="76" height="50" rx="4" fill={body} />
          <rect x="86" y="20" width="22" height="50" rx="3" fill={trim} />
          <rect x="90" y="30" width="14" height="6" rx="1" fill={accent} />
          <rect x="14" y="20" width="76" height="6" fill={accent} opacity="0.35" />
          <circle cx="52" cy="47" r="21" fill={accent} opacity="0.3" />
          {lens(52, 47, 18)}
        </g>
      );
      break;
    case 'pinhole':
      // Wooden pinhole box: grain lines, a sliding shutter over a tiny hole, winding knobs.
      shape = (
        <g>
          <rect x="22" y="14" width="10" height="7" rx="2" fill={trim} />
          <rect x="88" y="14" width="10" height="7" rx="2" fill={trim} />
          <rect x="14" y="20" width="92" height="50" rx="4" fill={body} />
          {[28, 36, 58, 64].map((y) => (
            <path key={y} d={`M18 ${y} q22 -3 44 0 t40 0`} stroke={trim} stroke-width="0.8" fill="none" opacity="0.35" />
          ))}
          <rect x="44" y="34" width="32" height="22" rx="2" fill={accent} />
          <rect x="44" y="40" width="14" height="10" rx="1" fill={trim} />
          <circle cx="66" cy="45" r="2" fill="#0b0b0c" />
        </g>
      );
      break;
    case 'flip':
      // Flip phone opened: screen half above the hinge, keypad half below, camera on the hinge.
      shape = (
        <g>
          <rect x="40" y="2" width="40" height="34" rx="6" fill={body} />
          <rect x="45" y="7" width="30" height="22" rx="2" fill="#1b2633" />
          <rect x="47" y="9" width="26" height="18" fill={accent} opacity="0.55" />
          <rect x="38" y="35" width="44" height="7" rx="3.5" fill={trim} />
          <circle cx="60" cy="38.5" r="2.5" fill="#0b0b0c" />
          <rect x="40" y="42" width="40" height="36" rx="6" fill={body} />
          <circle cx="60" cy="50" r="4.5" fill={accent} />
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={47 + (i % 3) * 9} y={57 + Math.floor(i / 3) * 5} width="7" height="3.5" rx="1.2" fill={trim} />
          ))}
        </g>
      );
      break;
    case 'smart':
      // First touchscreen phone, seen from the back: metal top, black lower band, lens top left.
      shape = (
        <g>
          <rect x="38" y="4" width="44" height="74" rx="9" fill={accent} />
          <rect x="38" y="58" width="44" height="20" rx="9" fill={body} />
          <rect x="38" y="58" width="44" height="8" fill={body} />
          <circle cx="47" cy="13" r="4" fill={trim} />
          <circle cx="47" cy="13" r="2.4" fill="#0b0b0c" />
          <circle cx="46.2" cy="12.2" r="0.7" fill="#fff" opacity="0.6" />
          <rect x="54" y="30" width="12" height="12" rx="3" fill={body} opacity="0.25" />
        </g>
      );
      break;
    case 'qwerty':
      // QWERTY business phone, front view: wide screen on top, trackball, four rows of thumb keys.
      shape = (
        <g>
          <rect x="36" y="4" width="48" height="74" rx="8" fill={body} />
          <rect x="41" y="9" width="38" height="28" rx="2" fill="#1b2633" />
          <rect x="43" y="11" width="34" height="24" fill={accent} opacity="0.5" />
          <rect x="41" y="40" width="38" height="5" rx="2.5" fill={trim} />
          <circle cx="60" cy="42.5" r="2.2" fill={accent} />
          {Array.from({ length: 20 }, (_, i) => (
            <rect key={i} x={41.5 + (i % 5) * 7.6} y={49 + Math.floor(i / 5) * 6.6} width="6.2" height="5" rx="1.6" fill={trim} />
          ))}
        </g>
      );
      break;
    case 'slab':
      // 2010 glass-slab phone, back view: flat glass, lens and LED flash in the top corner.
      shape = (
        <g>
          <rect x="38" y="4" width="44" height="74" rx="7" fill={trim} />
          <rect x="39.5" y="5.5" width="41" height="71" rx="6" fill={body} />
          <circle cx="47" cy="13" r="4" fill={accent} />
          <circle cx="47" cy="13" r="2.4" fill="#0b0b0c" />
          <circle cx="46.2" cy="12.2" r="0.7" fill="#fff" opacity="0.6" />
          <circle cx="55" cy="13" r="1.8" fill="#fff4cc" stroke={trim} stroke-width="0.6" />
          <rect x="54" y="34" width="12" height="12" rx="3" fill={accent} opacity="0.12" />
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
