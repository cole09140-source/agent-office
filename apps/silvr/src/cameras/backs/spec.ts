import type { CameraModel } from '../models';

/**
 * Camera-screen "back plates": the shooting screen is drawn as the back of the chosen body.
 * Pure data — CSS (styles.css, "camera back plates") turns these into materials, bezels and buttons.
 * Generic designs only: no real brand names, logos or trade dress.
 */

/** Body families: each sets the default material, window, buttons and shutter. */
export type BackFamily = 'leather' | 'compact' | 'disposable' | 'instant' | 'digicam' | 'y2k' | 'console' | 'kid' | 'aqua' | 'cine' | 'phone';
/** Surface of the plate. */
export type BackMaterial = 'leather' | 'matte' | 'gloss' | 'brushed' | 'card' | 'jelly' | 'rubber' | 'crinkle' | 'housing' | 'wood';
/** The window the live preview sits in: rubber eyecup, LCD with screws, molded instant rim, handheld screen, sealed port, TLR hood, edge-to-edge phone glass. */
export type BackWindow = 'optical' | 'lcd' | 'instant' | 'console' | 'housing' | 'waist' | 'phone';
/** Top-row buttons. */
export type BackButtons = 'rubber' | 'chrome' | 'gloss' | 'jelly';
/** The shutter release. */
export type BackShutter = 'knurl' | 'dome' | 'rubber' | 'jelly' | 'trigger' | 'console' | 'touch';
/** A band of a second colour across the body (behind the top row, the window, or the shutter row; 'both' = top and shutter rows, like a rangefinder's chrome top and base plates). */
export type BackBand = 'top' | 'stage' | 'bottom' | 'both' | 'none';

export interface BackColors {
  /** Main body colour (also the flat fallback under textures). */
  body: string;
  /** Darker shade of the body: edges, molded rims. */
  shade: string;
  /** Band colour (chrome top plate, printed wrap band…). */
  band: string;
  /** Model nameplate background ('transparent' = printed straight on the body / band). */
  plate: string;
  /** Nameplate lettering. */
  plateInk: string;
  /** Button face and its lettering (text chips must stay readable: ≥ 4.5:1). */
  btn: string;
  btnInk: string;
  /** Lettering of a latched button (zoom on, EV set…). */
  btnOn: string;
  /** Shutter colour and its darker rim. */
  shutter: string;
  shutterRim: string;
  /** Frame around the film window / last-shot thumbnail. */
  frame: string;
  /** Accent details: pinstripe, LED, honeycomb. */
  accent: string;
}

export interface BackDetails {
  /** Screws in the two lower body corners. */
  screws?: boolean;
  /** Strap lugs on both sides. */
  lugs?: boolean;
  /** Ribbed rubber grip on the right edge. */
  grip?: boolean;
  /** Rainbow stripe next to the nameplate. */
  rainbow?: boolean;
  /** Speaker / mic grille on the window's lower band. */
  grille?: boolean;
  /** Status LED colour on the window's lower band. */
  led?: string;
  /** Thin accent pinstripe above the shutter row. */
  stripe?: boolean;
}

export interface BackSpec extends BackColors {
  family: BackFamily;
  material: BackMaterial;
  window: BackWindow;
  buttons: BackButtons;
  shutterStyle: BackShutter;
  band: string;
  bandAt: BackBand;
  details: BackDetails;
  /** Small print on the window's lower band (LCD / instant / console / housing windows). */
  print?: string;
  /** Ink of that print when the nameplate ink would vanish on the rim (instant windows print in plateInk by default). */
  printInk?: string;
}

type FamilyDefaults = Pick<BackSpec, 'material' | 'window' | 'buttons' | 'shutterStyle' | 'bandAt' | 'details'>;

export const FAMILIES: Record<BackFamily, FamilyDefaults> = {
  // Classic SLR / rangefinder / TLR: leatherette with a chrome top plate, chrome buttons, knurled release.
  leather: { material: 'leather', window: 'optical', buttons: 'chrome', shutterStyle: 'knurl', bandAt: 'top', details: { lugs: true, screws: true } },
  // 80s–90s point-and-shoot: matte plastic, rubber buttons and grip.
  compact: { material: 'matte', window: 'optical', buttons: 'rubber', shutterStyle: 'rubber', bandAt: 'none', details: { grip: true, lugs: true } },
  // Single-use camera: printed card wrap over black plastic.
  disposable: { material: 'card', window: 'optical', buttons: 'gloss', shutterStyle: 'rubber', bandAt: 'bottom', details: {} },
  // Instant camera: glossy molded plastic, red dome release, rainbow stripe.
  instant: { material: 'gloss', window: 'instant', buttons: 'gloss', shutterStyle: 'dome', bandAt: 'none', details: { rainbow: true, screws: true } },
  // Early-2000s digicam: brushed aluminium, LCD with screws, chrome dial.
  digicam: { material: 'brushed', window: 'lcd', buttons: 'chrome', shutterStyle: 'knurl', bandAt: 'none', details: { screws: true, grille: true, led: '#4cff7a' } },
  // Y2K translucent candy plastic.
  y2k: { material: 'jelly', window: 'instant', buttons: 'jelly', shutterStyle: 'jelly', bandAt: 'none', details: { lugs: true } },
  // Pocket handheld: grey plastic, slate screen frame, A-button release.
  console: { material: 'matte', window: 'console', buttons: 'gloss', shutterStyle: 'console', bandAt: 'none', details: { screws: true, grille: true, led: '#ff3b30' } },
  // Kids' digicam: soft rubber, chunky buttons, giant release.
  kid: { material: 'rubber', window: 'lcd', buttons: 'jelly', shutterStyle: 'jelly', bandAt: 'none', details: { grille: true, led: '#ffd400' } },
  // Waterproof housing: thick clear shell, gasket, paddle release.
  aqua: { material: 'housing', window: 'housing', buttons: 'jelly', shutterStyle: 'jelly', bandAt: 'none', details: { screws: true } },
  // Movie camera: crinkle paint, trigger-style run button.
  cine: { material: 'crinkle', window: 'optical', buttons: 'rubber', shutterStyle: 'trigger', bandAt: 'none', details: { grip: true, screws: true } },
  // Phone: glass front, the preview fills a thin black bezel, an on-screen ring for the shutter.
  phone: { material: 'gloss', window: 'phone', buttons: 'gloss', shutterStyle: 'touch', bandAt: 'none', details: {} },
};

/** Per-body choices on top of the family defaults. */
type BackEntry = { family: BackFamily } & BackColors & Partial<Omit<BackSpec, 'family' | keyof BackColors>>;

const CHROME_BTN = { btn: '#d9dbde', btnInk: '#1d1f22', btnOn: '#9a3412' };
const RUBBER_BTN = { btn: '#232323', btnInk: '#ece8e1', btnOn: '#ffb36b' };

export const BACKS: Record<string, BackEntry> = {
  pro35: { family: 'leather', body: '#1c1c1d', shade: '#0d0d0e', band: '#c9cacd', plate: 'transparent', plateInk: '#17181a', ...CHROME_BTN, shutter: '#d7d9dc', shutterRim: '#5c6066', frame: '#b9bbbf', accent: '#d6402b' },
  doublex: { family: 'leather', body: '#3b2a21', shade: '#21160f', band: '#d2b273', plate: 'transparent', plateInk: '#2a1c10', btn: '#e2c88e', btnInk: '#2a1c10', btnOn: '#7c2d12', shutter: '#d8bb7c', shutterRim: '#6b5124', frame: '#c6a463', accent: '#d9b26b' },
  range: { family: 'leather', bandAt: 'both', body: '#171615', shade: '#0a0909', band: '#b9b6ad', plate: 'transparent', plateInk: '#1b1a17', btn: '#cdcac1', btnInk: '#1b1a17', btnOn: '#7c2d12', shutter: '#c9c6bd', shutterRim: '#5a5852', frame: '#a9a69d', accent: '#8a8a8a' },
  twin66: { family: 'leather', window: 'waist', body: '#1b1b1b', shade: '#0b0b0b', band: '#cbbb93', plate: 'transparent', plateInk: '#2b2414', btn: '#ddd0ab', btnInk: '#2b2414', btnOn: '#7c2d12', shutter: '#d4c59d', shutterRim: '#665a3a', frame: '#bcae86', accent: '#c9b88f' },
  slide35: { family: 'leather', body: '#4b4b49', shade: '#2c2c2b', band: '#dcdcda', plate: 'transparent', plateInk: '#1a1a1a', ...CHROME_BTN, shutter: '#e1e2e3', shutterRim: '#6b6b6b', frame: '#c4c4c2', accent: '#6b6b6b', details: { lugs: true, screws: true, stripe: true } },
  half72: { family: 'compact', material: 'brushed', buttons: 'chrome', shutterStyle: 'knurl', body: '#d3cfc6', shade: '#a19c92', band: '#2a2a2a', plate: '#2a2a2a', plateInk: '#eeeae2', ...CHROME_BTN, shutter: '#e2dfd8', shutterRim: '#77736b', frame: '#8c8c8c', accent: '#2a2a2a', bandAt: 'stage', details: { lugs: true, screws: true } },
  zonelc: { family: 'compact', body: '#272727', shade: '#121212', band: '#272727', plate: 'transparent', plateInk: '#f1ede6', ...RUBBER_BTN, shutter: '#c0392b', shutterRim: '#151515', frame: '#4a4a4a', accent: '#d64535', details: { grip: true, lugs: true, stripe: true } },
  toy120: { family: 'compact', body: '#9b2226', shade: '#5c1015', band: '#9b2226', plate: 'transparent', plateInk: '#fbefe1', ...RUBBER_BTN, shutter: '#ece6da', shutterRim: '#1a1a1a', frame: '#1c1c1c', accent: '#ece6da', details: { lugs: true, grip: false } },
  panox: { family: 'compact', body: '#5d5d62', shade: '#3a3a3e', band: '#5d5d62', plate: '#1d1d1f', plateInk: '#e6e6ea', ...RUBBER_BTN, shutter: '#c7c7cc', shutterRim: '#1d1d1f', frame: '#2a2a2d', accent: '#c7c7cc', details: { grip: true, stripe: true } },
  sprocket: { family: 'compact', body: '#1e1e1e', shade: '#0c0c0c', band: '#e6e0d2', plate: 'transparent', plateInk: '#ece6d8', ...RUBBER_BTN, shutterStyle: 'knurl', shutter: '#3a3a3a', shutterRim: '#111111', frame: '#c0392b', accent: '#c0392b', bandAt: 'stage', details: { lugs: true, screws: true } },
  party: { family: 'compact', material: 'gloss', buttons: 'gloss', shutterStyle: 'dome', body: '#efe6d3', shade: '#cdbfa3', band: '#d93644', plate: 'transparent', plateInk: '#2b2b2b', btn: '#f7f1e4', btnInk: '#2b2b2b', btnOn: '#b42318', shutter: '#e63946', shutterRim: '#8f1d27', frame: '#d6cbb4', accent: '#e63946', bandAt: 'bottom', details: { lugs: true } },
  snap27: { family: 'disposable', body: '#ffd21a', shade: '#d9a900', band: '#0b7a3e', plate: 'transparent', plateInk: '#111111', btn: '#1a1a1a', btnInk: '#f4f4f4', btnOn: '#ffd21a', shutter: '#1a1a1a', shutterRim: '#000000', frame: '#111111', accent: '#0b7a3e' },
  instasq: { family: 'instant', body: '#f1ede4', shade: '#d6d0c3', band: '#f1ede4', plate: 'transparent', plateInk: '#2b2b2b', btn: '#2b2b2b', btnInk: '#f4f1ea', btnOn: '#ffb36b', shutter: '#e8452c', shutterRim: '#9a2a17', frame: '#2b2b2b', accent: '#e8452c', print: 'SQ · INSTANT' },
  instaw: { family: 'instant', material: 'matte', bandAt: 'top', body: '#26272a', shade: '#141416', band: '#c9cbcf', plate: 'transparent', plateInk: '#1f2023', btn: '#d6d6d6', btnInk: '#1f1f21', btnOn: '#8a4b00', shutter: '#f2b705', shutterRim: '#8a6600', frame: '#d6d6d6', accent: '#f2b705', print: 'WIDE · INSTANT', printInk: '#c9cbcf', details: { screws: true } },
  ccd03: { family: 'digicam', body: '#c3c9cf', shade: '#8f979f', band: '#c3c9cf', plate: '#e4e8ec', plateInk: '#1d2a3a', ...CHROME_BTN, btnOn: '#1e4f9c', shutter: '#dfe3e7', shutterRim: '#5f6870', frame: '#4b5560', accent: '#3a7bd5', print: '3.2 MEGA PIXELS · CCD' },
  quad4: { family: 'y2k', body: '#ff7a1a', shade: '#c24d00', band: '#ff7a1a', plate: '#1e2a5a', plateInk: '#ffffff', btn: '#c8f03c', btnInk: '#1d2a00', btnOn: '#7a2400', shutter: '#c8f03c', shutterRim: '#7fa312', frame: '#1e2a5a', accent: '#c8f03c', print: '4 LENS ACTION' },
  fish180: { family: 'y2k', body: '#23a89d', shade: '#0f6e66', band: '#23a89d', plate: '#f4f4f4', plateInk: '#0b3f3b', btn: '#f4f4f4', btnInk: '#0b3f3b', btnOn: '#a32a00', shutter: '#f4f4f4', shutterRim: '#8fa5a3', frame: '#0b3f3b', accent: '#f4f4f4', print: 'FISHEYE 180°' },
  pixel: { family: 'console', body: '#c9c6c0', shade: '#a19d95', band: '#c9c6c0', plate: 'transparent', plateInk: '#3d1260', btn: '#7a1fa2', btnInk: '#ffffff', btnOn: '#ffd23f', shutter: '#8e2bbd', shutterRim: '#4a0f66', frame: '#4b4d57', accent: '#7a1fa2', print: 'DOT MATRIX · 2-BIT' },
  kidcam: { family: 'kid', body: '#ec5f95', shade: '#b5306a', band: '#ec5f95', plate: '#fff4c2', plateInk: '#6a1239', btn: '#7ed9c3', btnInk: '#0b3a31', btnOn: '#7a1747', shutter: '#ffd23f', shutterRim: '#c79a00', frame: '#7ed9c3', accent: '#ffd23f', print: '0.3 MEGA · FUN CAM' },
  aqua27: { family: 'aqua', body: '#1fa3c9', shade: '#0b5f7d', band: '#1fa3c9', plate: '#ffd400', plateInk: '#0b3d5c', btn: '#ffd400', btnInk: '#0b3d5c', btnOn: '#a32a00', shutter: '#ffd400', shutterRim: '#b08f00', frame: '#0b3d5c', accent: '#ffd400', print: 'WATERPROOF · 10 M' },
  cine: { family: 'cine', body: '#26272b', shade: '#121316', band: '#26272b', plate: '#9aa0a6', plateInk: '#141518', ...RUBBER_BTN, shutter: '#c8102e', shutterRim: '#5e0715', frame: '#55595f', accent: '#c8102e' },
  floppy98: { family: 'digicam', material: 'matte', buttons: 'rubber', body: '#3c3f44', shade: '#24262a', band: '#3c3f44', plate: '#9aa3ad', plateInk: '#16181b', ...RUBBER_BTN, shutter: '#9aa3ad', shutterRim: '#4b525a', frame: '#1c1d20', accent: '#9aa3ad', print: '1.44 MB DISK · VGA', details: { screws: true, grille: true, led: '#ff9f1a' } },
  slim06: { family: 'digicam', material: 'gloss', buttons: 'gloss', shutterStyle: 'dome', body: '#b3122f', shade: '#7a0b1f', band: '#b3122f', plate: 'transparent', plateInk: '#ffffff', btn: '#e9e9ec', btnInk: '#2a2a2e', btnOn: '#b3122f', shutter: '#e9e9ec', shutterRim: '#8f9095', frame: '#2a2a2e', accent: '#e9e9ec', print: '7.2 MEGA PIXELS · 3× ZOOM', details: { screws: false, grille: false, led: '#4cff7a' } },
  bridge09: { family: 'digicam', material: 'rubber', buttons: 'rubber', body: '#1e1f22', shade: '#0e0f10', band: '#1e1f22', plate: 'transparent', plateInk: '#e6e6e8', ...RUBBER_BTN, shutter: '#8c8f94', shutterRim: '#3c3e42', frame: '#3a3b3f', accent: '#c8a24a', print: '20× OPTICAL ZOOM', details: { grip: true, screws: true, grille: true, led: '#ff3b30' } },
  zoom90: { family: 'compact', body: '#cbbfa6', shade: '#9d927b', band: '#cbbfa6', plate: 'transparent', plateInk: '#2b2b2b', btn: '#2b2b2b', btnInk: '#f1ece0', btnOn: '#ffb36b', shutter: '#e8e1d0', shutterRim: '#8a7f6a', frame: '#2b2b2b', accent: '#8a7f6a', details: { grip: false, lugs: true, stripe: true } },
  mf645: { family: 'leather', body: '#18191b', shade: '#0a0a0b', band: '#bfc2c6', plate: 'transparent', plateInk: '#141518', ...CHROME_BTN, shutter: '#c9ccd0', shutterRim: '#55585c', frame: '#a9acb0', accent: '#e0442b' },
  pinhole: { family: 'compact', material: 'wood', buttons: 'chrome', shutterStyle: 'knurl', body: '#8a5a32', shade: '#5c3a1e', band: '#8a5a32', plate: '#d9c39a', plateInk: '#2b1d12', btn: '#d9c39a', btnInk: '#2b1d12', btnOn: '#7c2d12', shutter: '#c9b28a', shutterRim: '#5c3a1e', frame: '#2b1d12', accent: '#d9c39a', details: { grip: false, lugs: false, screws: true } },
  flip03: { family: 'phone', material: 'brushed', window: 'lcd', buttons: 'chrome', shutterStyle: 'console', body: '#aeb4bb', shade: '#7d848c', band: '#aeb4bb', plate: 'transparent', plateInk: '#1b1e22', ...CHROME_BTN, shutter: '#2d6cdf', shutterRim: '#173f8a', frame: '#26292d', accent: '#2d6cdf', print: 'VGA CAMERA', details: { grille: true, led: '#4cc3ff' } },
  touch07: { family: 'phone', body: '#141416', shade: '#060607', band: '#141416', plate: 'transparent', plateInk: '#e8e8ea', btn: '#2a2b2e', btnInk: '#f1f1f3', btnOn: '#ffcc4d', shutter: '#f4f4f6', shutterRim: '#9a9ca0', frame: '#2a2b2e', accent: '#b9bcc1' },
  curve07: { family: 'phone', material: 'matte', buttons: 'rubber', body: '#1d1f23', shade: '#0d0e10', band: '#1d1f23', plate: 'transparent', plateInk: '#e6e8ec', btn: '#30333a', btnInk: '#f1f2f5', btnOn: '#7fd0ff', shutter: '#d9dde3', shutterRim: '#80868f', frame: '#30333a', accent: '#9aa0a8' },
  filter10: { family: 'phone', body: '#f4f4f2', shade: '#d4d4d0', band: '#f4f4f2', plate: 'transparent', plateInk: '#1b1b1d', btn: '#1b1b1d', btnInk: '#f4f4f2', btnOn: '#ffb36b', shutter: '#ffffff', shutterRim: '#b9b9b5', frame: '#1b1b1d', accent: '#c76b2a' },
  super8: { family: 'cine', body: '#4a4733', shade: '#2b291c', band: '#4a4733', plate: '#d9d6c8', plateInk: '#2b291c', ...RUBBER_BTN, shutter: '#e0a526', shutterRim: '#6e4f0c', frame: '#bdbdbd', accent: '#e0a526', details: { grip: true, screws: true, lugs: true } },
};

/** Fallback by body style, for a camera that has no entry above (keeps new bodies themed). */
const BY_BODY: Partial<Record<CameraModel['body'], string>> = {
  slr: 'pro35', double: 'doublex', range: 'range', tlr: 'twin66', trip: 'slide35', half: 'half72', compact: 'zonelc', toy: 'toy120', pano: 'panox', sprocket: 'sprocket',
  flash: 'party', disposable: 'snap27', instant: 'instasq', wide: 'instaw', digicam: 'ccd03', quad: 'quad4', fish: 'fish180', pixel: 'pixel', kid: 'kidcam', aqua: 'aqua27', cine: 'cine', super8: 'super8',
  floppy: 'floppy98', slim: 'slim06', bridge: 'bridge09', zoomc: 'zoom90', mf: 'mf645', pinhole: 'pinhole', flip: 'flip03', smart: 'touch07', slab: 'filter10', qwerty: 'curve07',
};

export function backFor(camera: Pick<CameraModel, 'id' | 'body'>): BackSpec {
  const entry = BACKS[camera.id] ?? BACKS[BY_BODY[camera.body] ?? 'pro35'];
  const fam = FAMILIES[entry.family];
  return {
    ...fam,
    ...entry,
    details: { ...fam.details, ...entry.details },
  } as BackSpec;
}

/** CSS custom properties for the plate (set inline on .bp-body; the CSS reads only these). */
export function backVars(b: BackSpec): Record<string, string> {
  return {
    '--bp-body': b.body,
    '--bp-shade': b.shade,
    '--bp-band': b.band,
    '--bp-plate': b.plate,
    '--bp-plate-ink': b.plateInk,
    '--bp-btn': b.btn,
    '--bp-btn-ink': b.btnInk,
    '--bp-btn-on': b.btnOn,
    '--bp-shutter': b.shutter,
    '--bp-shutter-rim': b.shutterRim,
    '--bp-frame': b.frame,
    '--bp-accent': b.accent,
    '--bp-led': b.details.led ?? b.accent,
    '--bp-print-ink': b.printInk ?? b.plateInk,
  };
}

// ---- contrast helpers (used by the unit test that keeps every plate readable) ----

function lum(hex: string): number {
  const n = hex.replace('#', '');
  const v = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

export function contrast(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** The colour actually behind the nameplate lettering. */
export function plateBackground(b: BackSpec): string {
  if (b.plate !== 'transparent') return b.plate;
  return b.bandAt === 'top' || b.bandAt === 'both' ? b.band : b.body;
}
