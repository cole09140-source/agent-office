import { getStock, STOCKS } from '../film/stocks';
import type { Aspect, BorderStyle, FilmStock, Lens, RGB } from '../film/types';

/** How one press of the shutter turns into a negative. */
export type CaptureMode =
  | 'single'
  | 'half' // two portrait halves share one 35mm frame (two presses)
  | 'quad' // four lenses fire in sequence into a 2×2 grid (one press)
  | 'double'; // two exposures stacked on one frame (two presses)

export type BodyStyle =
  | 'slr'
  | 'range'
  | 'disposable'
  | 'compact'
  | 'half'
  | 'instant'
  | 'toy'
  | 'pano'
  | 'fish'
  | 'quad'
  | 'double'
  | 'cine'
  | 'digicam'
  | 'pixel'
  | 'aqua'
  | 'wide'
  | 'tlr'
  | 'super8'
  | 'trip'
  | 'flash'
  | 'kid'
  | 'sprocket'
  | 'floppy'
  | 'slim'
  | 'bridge'
  | 'zoomc'
  | 'mf'
  | 'pinhole'
  | 'flip'
  | 'smart'
  | 'slab'
  | 'qwerty';
export type ViewfinderStyle =
  | 'slr'
  | 'range'
  | 'tunnel'
  | 'compact'
  | 'half'
  | 'instant'
  | 'toy'
  | 'pano'
  | 'none'
  | 'quad'
  | 'double'
  | 'cine'
  | 'lcd'
  | 'pixel'
  | 'sport' // waterproof sport finder: big wire frame
  | 'waist' // TLR ground glass seen from above: laterally reversed
  | 'gate' // cine gate with rounded corners
  | 'phone'; // phone camera app: status bar, shot counter
export type ShutterSound = 'slr' | 'leaf' | 'disposable' | 'instant' | 'toy' | 'quad' | 'digital' | 'pixel' | 'cine' | 'motor' | 'phone';
/** standard: torch / screen flash. charge: must be charged before every flash shot. none: no flash. */
export type FlashMode = 'standard' | 'charge' | 'none';
export type StampStyle = 'led' | 'digital' | 'none';

export interface CameraModel {
  id: string;
  name: string;
  /** Shorter name for the camera toolbar chip when `name` would not fit on one row. */
  chip?: string;
  /** Era/marketing line shown under the name. */
  era: string;
  body: BodyStyle;
  /** body, accent, trim */
  colors: [string, string, string];
  /** Allowed stock ids; 'any' = every non-exclusive stock. */
  films: string[] | 'any';
  defaultStock: string;
  /** Exposures per roll/pack/card, largest first (the order the picker shows them). */
  capacities: number[];
  /** The roll size picked by default when it is not the first (largest) one. */
  defaultCapacity?: number;
  /** Selectable frame formats; the first one is the default. */
  formats: Aspect[];
  capture: CaptureMode;
  lens: Lens;
  flash: FlashMode;
  defaultFlash: boolean;
  stamp: StampStyle;
  defaultDate: boolean;
  sound: ShutterSound;
  viewfinder: ViewfinderStyle;
  /** Shots are viewable right away (instant film, memory card) — no lab. */
  instant: boolean;
  zoom: number[];
  /** Has an exposure-compensation dial. */
  ev: boolean;
  /** Overrides the stock's default border. */
  border?: BorderStyle;
  /** Light-leak probability override (cheap plastic bodies leak). */
  leakChance?: number;
  /** Output size cap for the print (pixel camera stays small). */
  maxLong?: number;
  /** Strength of the flash look when it fires (1 = a normal small flash). */
  flashPower?: number;
  /** Forces the frame orientation regardless of how the sensor is held (wide instant prints). */
  orient?: 'landscape';
  pro: boolean;
}

const lens = (l: Partial<Lens> = {}): Lens => ({
  distort: 0,
  fisheye: false,
  soft: 0,
  streak: 0,
  streakColor: [0.35, 0.55, 1],
  vignette: 0,
  chroma: 0,
  ...l,
});

/** Pixel-camera palettes (dark → light). */
export const PIXEL_PALETTES: Record<string, [RGB, RGB, RGB, RGB]> = {
  moss: [
    [15 / 255, 56 / 255, 15 / 255],
    [48 / 255, 98 / 255, 48 / 255],
    [139 / 255, 172 / 255, 15 / 255],
    [155 / 255, 188 / 255, 15 / 255],
  ],
  mono: [
    [0.08, 0.08, 0.08],
    [0.36, 0.36, 0.36],
    [0.68, 0.68, 0.68],
    [0.95, 0.95, 0.95],
  ],
  sepia: [
    [0.17, 0.1, 0.06],
    [0.45, 0.31, 0.2],
    [0.75, 0.6, 0.43],
    [0.96, 0.9, 0.78],
  ],
  ice: [
    [0.06, 0.09, 0.22],
    [0.2, 0.36, 0.6],
    [0.55, 0.75, 0.9],
    [0.92, 0.97, 1],
  ],
  berry: [
    [0.17, 0.05, 0.2],
    [0.55, 0.16, 0.42],
    [0.95, 0.5, 0.55],
    [1, 0.9, 0.78],
  ],
};
export const PALETTE_IDS = Object.keys(PIXEL_PALETTES);

export const CAMERAS: CameraModel[] = [
  {
    id: 'pro35',
    name: 'Pro 35',
    era: '1979 · SLR',
    body: 'slr',
    colors: ['#1d1d1f', '#c9c9c9', '#3a3a3c'],
    films: 'any',
    defaultStock: 'sunny200',
    capacities: [36, 24, 12],
    formats: ['3:2', '4:3', '1:1'],
    capture: 'single',
    lens: lens({ vignette: 0.05 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'led',
    defaultDate: false,
    sound: 'slr',
    viewfinder: 'slr',
    instant: false,
    zoom: [1, 2],
    ev: true,
    pro: false,
  },
  {
    id: 'snap27',
    name: 'Snap 27',
    era: '1996 · Disposable',
    body: 'disposable',
    colors: ['#ffd400', '#00863d', '#111111'],
    films: ['snap800'],
    defaultStock: 'snap800',
    capacities: [27],
    formats: ['3:2'],
    capture: 'single',
    lens: lens({ soft: 0.4, distort: 0.07, vignette: 0.15, chroma: 0.8 }),
    flash: 'charge',
    defaultFlash: true,
    stamp: 'led',
    defaultDate: true,
    sound: 'disposable',
    viewfinder: 'tunnel',
    instant: false,
    zoom: [1],
    ev: false,
    pro: false,
  },
  {
    id: 'instasq',
    name: 'Pop SQ',
    era: '1982 · Instant',
    body: 'instant',
    colors: ['#f2efe8', '#e8452c', '#2b2b2b'],
    films: ['insta600'],
    defaultStock: 'insta600',
    capacities: [10],
    formats: ['1:1'],
    capture: 'single',
    lens: lens({ soft: 0.2, vignette: 0.1 }),
    flash: 'standard',
    defaultFlash: true,
    stamp: 'none',
    defaultDate: false,
    sound: 'instant',
    viewfinder: 'instant',
    instant: true,
    zoom: [1],
    ev: false,
    border: 'instant',
    pro: false,
  },
  {
    id: 'half72',
    name: 'Half 72',
    era: '1963 · Half-frame',
    body: 'half',
    colors: ['#d8d4cc', '#2a2a2a', '#8c8c8c'],
    films: 'any',
    defaultStock: 'mint400',
    capacities: [72, 48, 24],
    formats: ['3:2'],
    capture: 'half',
    lens: lens({ vignette: 0.1, soft: 0.1 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'led',
    defaultDate: false,
    sound: 'leaf',
    viewfinder: 'half',
    instant: false,
    zoom: [1],
    ev: false,
    pro: false,
  },
  {
    id: 'zonelc',
    name: 'Zone LC',
    era: '1984 · Compact',
    body: 'compact',
    colors: ['#2a2a2a', '#b8b8b8', '#c0392b'],
    films: ['sunny200', 'mint400', 'muse400', 'xpro200', 'velvet50', 'mono400'],
    defaultStock: 'xpro200',
    capacities: [36, 24],
    formats: ['3:2'],
    capture: 'single',
    lens: lens({ vignette: 0.45, soft: 0.2, chroma: 0.4 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'leaf',
    viewfinder: 'compact',
    instant: false,
    zoom: [1],
    ev: false,
    pro: true,
  },
  {
    id: 'toy120',
    name: 'Toy 120',
    era: '1982 · 120 toy',
    body: 'toy',
    colors: ['#151515', '#3b3b3b', '#9a9a9a'],
    films: ['sunny200', 'mono400', 'dream160', 'xpro200', 'expired98'],
    defaultStock: 'sunny200',
    capacities: [12],
    formats: ['1:1'],
    capture: 'single',
    lens: lens({ soft: 0.65, vignette: 0.5, distort: 0.05, chroma: 1 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'toy',
    viewfinder: 'toy',
    instant: false,
    zoom: [1],
    ev: false,
    leakChance: 0.45,
    pro: false,
  },
  {
    id: 'quad4',
    name: 'Quad Action',
    era: '1998 · 4-lens',
    body: 'quad',
    colors: ['#2457d6', '#ffd23f', '#111111'],
    films: 'any',
    defaultStock: 'sunny200',
    capacities: [36, 24],
    defaultCapacity: 24,
    formats: ['3:2'],
    capture: 'quad',
    lens: lens({ soft: 0.15, chroma: 0.6 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'quad',
    viewfinder: 'quad',
    instant: false,
    zoom: [1],
    ev: false,
    pro: true,
  },
  {
    id: 'doublex',
    name: 'Double X',
    era: '1975 · Multi-ex',
    body: 'double',
    colors: ['#3a2f2a', '#d9b26b', '#151515'],
    films: 'any',
    defaultStock: 'muse400',
    capacities: [36, 24],
    defaultCapacity: 24,
    formats: ['3:2'],
    capture: 'double',
    lens: lens({ vignette: 0.1 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'slr',
    viewfinder: 'double',
    instant: false,
    zoom: [1],
    ev: true,
    pro: true,
  },
  {
    id: 'panox',
    name: 'Pano X',
    era: '1998 · Panoramic',
    body: 'pano',
    colors: ['#6e6e73', '#1d1d1f', '#c7c7cc'],
    films: 'any',
    defaultStock: 'velvet50',
    capacities: [21],
    formats: ['65:24'],
    capture: 'single',
    lens: lens({ vignette: 0.3, distort: -0.02 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'leaf',
    viewfinder: 'pano',
    instant: false,
    zoom: [1],
    ev: true,
    pro: true,
  },
  {
    id: 'fish180',
    name: 'Fish 180',
    era: '2005 · Fisheye',
    body: 'fish',
    colors: ['#0b7a75', '#f2f2f2', '#111111'],
    films: 'any',
    defaultStock: 'mint400',
    capacities: [36, 24],
    defaultCapacity: 24,
    formats: ['1:1'],
    capture: 'single',
    lens: lens({ fisheye: true, chroma: 1.2, soft: 0.2 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'toy',
    viewfinder: 'none',
    instant: false,
    zoom: [1],
    ev: false,
    pro: true,
  },
  {
    id: 'cine',
    name: 'Cine Scope',
    era: '1970 · Anamorphic',
    body: 'cine',
    colors: ['#202124', '#c8102e', '#9aa0a6'],
    films: ['neon800t', 'chrome100', 'muse400', 'mono400', 'velvet50'],
    defaultStock: 'neon800t',
    capacities: [36, 24],
    defaultCapacity: 24,
    formats: ['2.39:1'],
    capture: 'single',
    lens: lens({ streak: 0.7, distort: -0.025, soft: 0.1, vignette: 0.15 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'cine',
    viewfinder: 'cine',
    instant: false,
    zoom: [1],
    ev: true,
    pro: true,
  },
  {
    id: 'ccd03',
    name: 'CCD 2003',
    era: '2003 · Digicam',
    body: 'digicam',
    colors: ['#c0c6cc', '#1b1b1b', '#3a7bd5'],
    films: ['ccd'],
    defaultStock: 'ccd',
    capacities: [99],
    formats: ['4:3'],
    capture: 'single',
    lens: lens({ soft: -0.55, chroma: 0.4 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'digital',
    defaultDate: true,
    sound: 'digital',
    viewfinder: 'lcd',
    instant: true,
    zoom: [1, 2, 3],
    ev: true,
    pro: false,
  },
  {
    id: 'pixel',
    name: 'Bit Pocket',
    era: '1998 · 2-bit',
    body: 'pixel',
    colors: ['#c6c3bd', '#7a1fa2', '#2b2b2b'],
    films: ['pixel'],
    defaultStock: 'pixel',
    capacities: [30],
    formats: ['8:7'],
    capture: 'single',
    lens: lens(),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'pixel',
    viewfinder: 'pixel',
    instant: true,
    zoom: [1],
    ev: true,
    maxLong: 1024, // 128-cell grid → crisp 8 px blocks
    pro: false,
  },
  {
    id: 'range',
    name: 'Range M',
    era: '1954 · Rangefinder',
    body: 'range',
    colors: ['#141414', '#d6d2c4', '#8a8a8a'],
    films: 'any',
    defaultStock: 'mono400',
    capacities: [36, 24],
    formats: ['3:2'],
    capture: 'single',
    lens: lens({ soft: -0.25, vignette: 0.12 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'leaf',
    viewfinder: 'range',
    instant: false,
    zoom: [1],
    ev: true,
    pro: true,
  },
  {
    id: 'aqua27',
    name: 'Aqua 27',
    era: '1994 · Waterproof',
    body: 'aqua',
    colors: ['#1fa3c9', '#ffd400', '#0b3d5c'],
    films: ['aqua400'],
    defaultStock: 'aqua400',
    capacities: [27],
    formats: ['3:2'],
    capture: 'single',
    // Shooting through a plastic housing window: soft, a little barrel, colour fringes.
    lens: lens({ soft: 0.5, distort: 0.05, vignette: 0.2, chroma: 0.9 }),
    flash: 'charge',
    defaultFlash: true,
    stamp: 'none',
    defaultDate: false,
    sound: 'disposable',
    viewfinder: 'sport',
    instant: false,
    zoom: [1],
    ev: false,
    pro: false,
  },
  {
    id: 'instaw',
    name: 'Pop W',
    era: '1999 · Wide',
    body: 'wide',
    colors: ['#2e2e30', '#f2b705', '#d6d6d6'],
    films: ['instawide'],
    defaultStock: 'instawide',
    capacities: [10],
    formats: ['3:2'],
    orient: 'landscape',
    capture: 'single',
    lens: lens({ soft: 0.15, vignette: 0.12 }),
    flash: 'standard',
    defaultFlash: true,
    stamp: 'none',
    defaultDate: false,
    sound: 'instant',
    viewfinder: 'instant',
    instant: true,
    zoom: [1],
    ev: true,
    border: 'instant',
    pro: false,
  },
  {
    id: 'twin66',
    name: 'Twin 66',
    era: '1957 · TLR',
    body: 'tlr',
    colors: ['#1b1b1b', '#c9b88f', '#8e8e8e'],
    films: 'any',
    defaultStock: 'muse400',
    capacities: [12],
    formats: ['1:1'],
    capture: 'single',
    // Sharp four-element taking lens, gentle corner fall-off.
    lens: lens({ soft: -0.2, vignette: 0.18 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'leaf',
    viewfinder: 'waist',
    instant: false,
    zoom: [1],
    ev: true,
    pro: true,
  },
  {
    id: 'super8',
    name: 'Reel 8',
    era: '1972 · Home movie',
    body: 'super8',
    colors: ['#2b2b2b', '#e0a526', '#bdbdbd'],
    films: ['reel40', 'neon800t', 'mono400'],
    defaultStock: 'reel40',
    capacities: [50, 24],
    formats: ['4:3'],
    capture: 'single',
    lens: lens({ soft: 0.35, distort: 0.03, vignette: 0.3, chroma: 0.6 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'cine',
    viewfinder: 'gate',
    instant: false,
    zoom: [1],
    ev: true,
    border: 'gate',
    leakChance: 0.12,
    pro: true,
  },
  {
    id: 'slide35',
    name: 'Slide 35',
    era: '1968 · Slide',
    body: 'trip',
    colors: ['#d4d4d2', '#1a1a1a', '#6b6b6b'],
    films: ['chrome100', 'velvet50', 'xpro200'],
    defaultStock: 'chrome100',
    capacities: [36, 24],
    formats: ['3:2'],
    capture: 'single',
    lens: lens({ soft: -0.3, vignette: 0.08, chroma: 0.2 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'leaf',
    viewfinder: 'compact',
    instant: false,
    zoom: [1],
    ev: true,
    border: 'slide',
    pro: true,
  },
  {
    id: 'party',
    name: 'Party Flash',
    era: '1989 · Big flash',
    body: 'flash',
    colors: ['#ece8df', '#e63946', '#2b2b2b'],
    films: 'any',
    // Snap 800 only comes inside the disposables; a portrait stock flatters faces under flash.
    defaultStock: 'muse400',
    capacities: [36, 24],
    defaultCapacity: 24,
    formats: ['3:2'],
    capture: 'single',
    lens: lens({ soft: 0.1, vignette: 0.1, chroma: 0.3 }),
    flash: 'standard',
    defaultFlash: true,
    flashPower: 1.8,
    stamp: 'led',
    defaultDate: true,
    sound: 'motor',
    viewfinder: 'compact',
    instant: false,
    zoom: [1],
    ev: false,
    pro: false,
  },
  {
    id: 'kidcam',
    name: 'KidCam 0.3',
    era: '2008 · Kids digicam',
    body: 'kid',
    colors: ['#2f80ed', '#ffcc00', '#ff5a5f'],
    films: ['toycmos'],
    defaultStock: 'toycmos',
    capacities: [80],
    formats: ['4:3'],
    capture: 'single',
    lens: lens({ soft: 0.3, distort: 0.04, vignette: 0.15, chroma: 0.8 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'digital',
    defaultDate: true,
    sound: 'digital',
    viewfinder: 'lcd',
    instant: true,
    zoom: [1, 2],
    ev: false,
    maxLong: 640, // 0.3 MP: 640×480
    pro: false,
  },
  {
    id: 'sprocket',
    name: 'Sprocket 35',
    era: '2010 · Sprocket',
    body: 'sprocket',
    colors: ['#1d1d1d', '#e9e4d8', '#c0392b'],
    films: 'any',
    defaultStock: 'mint400',
    capacities: [18, 12],
    formats: ['65:24'],
    capture: 'single',
    lens: lens({ soft: 0.3, distort: 0.03, vignette: 0.35, chroma: 0.6 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'toy',
    viewfinder: 'pano',
    instant: false,
    zoom: [1],
    ev: false,
    border: 'sprocket',
    leakChance: 0.2,
    pro: true,
  },
  {
    id: 'floppy98',
    name: 'Disk 98',
    era: '1998 · Floppy digicam',
    body: 'floppy',
    colors: ['#3c3f44', '#9aa3ad', '#1c1d20'],
    films: ['vga98'],
    defaultStock: 'vga98',
    // A 1.44 MB disk holds about 20 VGA JPEGs.
    capacities: [20],
    formats: ['4:3'],
    capture: 'single',
    lens: lens({ soft: 0.25, vignette: 0.1, chroma: 0.6 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'digital',
    viewfinder: 'lcd',
    instant: true,
    zoom: [1, 2],
    ev: true,
    maxLong: 640,
    pro: false,
  },
  {
    id: 'slim06',
    name: 'Slim 7',
    era: '2006 · Ultra-slim',
    body: 'slim',
    colors: ['#b3122f', '#e9e9ec', '#2a2a2e'],
    films: ['ccd7'],
    defaultStock: 'ccd7',
    capacities: [99],
    formats: ['4:3'],
    capture: 'single',
    // Tiny periscope zoom, heavy in-camera sharpening.
    lens: lens({ soft: -0.45, distort: 0.03, vignette: 0.08, chroma: 0.7 }),
    flash: 'standard',
    defaultFlash: true,
    flashPower: 1.4,
    stamp: 'digital',
    defaultDate: true,
    sound: 'digital',
    viewfinder: 'lcd',
    instant: true,
    zoom: [1, 2, 3],
    ev: true,
    maxLong: 3072,
    pro: false,
  },
  {
    id: 'bridge09',
    name: 'Tele 20',
    era: '2009 · Superzoom',
    body: 'bridge',
    colors: ['#1e1f22', '#8c8f94', '#c8a24a'],
    films: ['ccd7'],
    defaultStock: 'ccd7',
    capacities: [99],
    formats: ['4:3', '3:2', '1:1'],
    capture: 'single',
    // Long zoom glass: sharp centre, a little pincushion and purple fringing at the long end.
    lens: lens({ soft: -0.3, distort: -0.02, vignette: 0.12, chroma: 1.1 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'digital',
    defaultDate: false,
    sound: 'digital',
    viewfinder: 'lcd',
    instant: true,
    zoom: [1, 2, 4],
    ev: true,
    maxLong: 3072,
    pro: true,
  },
  {
    id: 'zoom90',
    name: 'Zoom 90',
    era: '1993 · Zoom compact',
    body: 'zoomc',
    colors: ['#cbbfa6', '#2b2b2b', '#8a7f6a'],
    films: 'any',
    defaultStock: 'sunny200',
    capacities: [36, 24],
    defaultCapacity: 24,
    formats: ['3:2'],
    capture: 'single',
    lens: lens({ soft: 0.15, distort: 0.03, vignette: 0.2, chroma: 0.4 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'led',
    defaultDate: true,
    sound: 'motor',
    viewfinder: 'compact',
    instant: false,
    zoom: [1, 2],
    ev: false,
    pro: false,
  },
  {
    id: 'mf645',
    name: 'Studio 645',
    era: '1992 · Medium format',
    body: 'mf',
    colors: ['#18191b', '#bfc2c6', '#4a4c50'],
    films: 'any',
    defaultStock: 'muse400',
    capacities: [15],
    formats: ['4:3'],
    capture: 'single',
    // Big negative, big glass: very sharp, almost no fall-off.
    lens: lens({ soft: -0.4, vignette: 0.05 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'slr',
    viewfinder: 'slr',
    instant: false,
    zoom: [1],
    ev: true,
    pro: true,
  },
  {
    id: 'pinhole',
    name: 'Pinhole 66',
    era: '1975 · Pinhole',
    body: 'pinhole',
    colors: ['#8a5a32', '#d9c39a', '#2b1d12'],
    films: 'any',
    defaultStock: 'silver100',
    capacities: [12],
    formats: ['1:1'],
    capture: 'single',
    // No lens at all: soft everywhere, deep fall-off, no colour fringing.
    lens: lens({ soft: 0.85, vignette: 0.55 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'leaf',
    viewfinder: 'none',
    instant: false,
    zoom: [1],
    ev: true,
    leakChance: 0.15,
    pro: true,
  },
  {
    id: 'flip03',
    name: 'Motorola RAZR V3',
    chip: 'RAZR V3',
    era: '2004 · Flip phone',
    body: 'flip',
    colors: ['#aeb4bb', '#2d6cdf', '#26292d'],
    films: ['vgaphone'],
    defaultStock: 'vgaphone',
    capacities: [50],
    formats: ['4:3'],
    capture: 'single',
    // A pinhead plastic lens behind a scratched window.
    lens: lens({ soft: 0.45, distort: 0.04, vignette: 0.2, chroma: 0.7 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'phone',
    viewfinder: 'phone',
    instant: true,
    zoom: [1, 2],
    ev: false,
    maxLong: 640, // VGA: 640×480
    pro: false,
  },
  {
    id: 'touch07',
    name: 'iPhone 2G',
    era: '2007 · Smartphone',
    body: 'smart',
    colors: ['#1a1a1c', '#b9bcc1', '#3a3b3f'],
    films: ['phone2mp'],
    defaultStock: 'phone2mp',
    capacities: [99],
    formats: ['4:3'],
    capture: 'single',
    // Fixed-focus 2 MP module: soft corners, no zoom, no flash.
    lens: lens({ soft: 0.3, vignette: 0.18, chroma: 0.5 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'phone',
    viewfinder: 'phone',
    instant: true,
    zoom: [1],
    ev: false,
    maxLong: 1600, // 2 MP: 1600×1200
    pro: false,
  },
  {
    id: 'curve07',
    name: 'BlackBerry Curve',
    chip: 'BlackBerry',
    era: '2007 · QWERTY phone',
    body: 'qwerty',
    colors: ['#1d1f23', '#9aa0a8', '#3a3c40'],
    films: ['bbcurve'],
    defaultStock: 'bbcurve',
    capacities: [99],
    formats: ['4:3'],
    capture: 'single',
    // 2 MP fixed-focus module over a full keyboard: crisp centre, hard sharpening, digital zoom.
    lens: lens({ soft: 0.2, vignette: 0.22, chroma: 0.6 }),
    flash: 'none',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'phone',
    viewfinder: 'phone',
    instant: true,
    zoom: [1, 2, 4],
    ev: false,
    maxLong: 1600, // 2 MP: 1600×1200
    pro: false,
  },
  {
    id: 'filter10',
    name: 'iPhone 4',
    era: '2010 · Filter app',
    body: 'slab',
    colors: ['#f4f4f2', '#1b1b1d', '#c9c9c6'],
    films: ['app10'],
    defaultStock: 'app10',
    capacities: [99],
    formats: ['1:1'],
    capture: 'single',
    lens: lens({ soft: 0.1, vignette: 0.1, chroma: 0.3 }),
    flash: 'standard',
    defaultFlash: false,
    stamp: 'none',
    defaultDate: false,
    sound: 'phone',
    viewfinder: 'phone',
    instant: true,
    zoom: [1, 2],
    ev: true,
    border: 'print',
    maxLong: 2048,
    pro: true,
  },
];

const BY_ID = new Map(CAMERAS.map((c) => [c.id, c]));
export const DEFAULT_CAMERA_ID = 'pro35';

/** The roll size a body starts on (its explicit default, else its first capacity). */
export function defaultCapacity(camera: CameraModel): number {
  const d = camera.defaultCapacity;
  return d !== undefined && camera.capacities.includes(d) ? d : camera.capacities[0];
}

export function getCamera(id: string | undefined): CameraModel {
  return (id && BY_ID.get(id)) || BY_ID.get(DEFAULT_CAMERA_ID)!;
}

/** Whether a camera id is known (older frames have none — they get a neutral lens). */
export function hasCamera(id: string | undefined): boolean {
  return !!id && BY_ID.has(id);
}

/** Stocks that only ever come pre-loaded inside a single-use camera. */
const DISPOSABLE_ONLY = new Set(['snap800']);

/** What a body physically takes: instant packs, a sealed single-use roll, or ordinary roll film (35mm / 120). */
export type FilmFormat = 'instant' | 'disposable' | 'roll';

export function cameraFormat(camera: CameraModel): FilmFormat {
  if (ejectsPrints(camera)) return 'instant';
  if (camera.body === 'disposable' || camera.body === 'aqua') return 'disposable';
  return 'roll';
}

/** Whether a stock fits a body's format (an instant pack never goes into a 35mm SLR, and vice versa). */
export function stockFits(camera: CameraModel, stock: FilmStock): boolean {
  const fmt = cameraFormat(camera);
  if ((stock.kind === 'instant') !== (fmt === 'instant')) return false;
  if (DISPOSABLE_ONLY.has(stock.id) && fmt !== 'disposable') return false;
  return true;
}

/**
 * Films a body can load: its own list ('any' = every non-exclusive stock), limited to its format.
 * Only new rolls are checked — frames already shot with an older combination still render.
 */
export function filmsFor(camera: CameraModel): FilmStock[] {
  const pool = camera.films === 'any' ? STOCKS.filter((s) => !s.exclusive) : camera.films.map((id) => getStock(id));
  return pool.filter((s) => stockFits(camera, s));
}

export function canLoad(camera: CameraModel, stockId: string): boolean {
  return filmsFor(camera).some((s) => s.id === stockId);
}

/** Instant-print bodies: prints eject and develop in front of you (square and wide packs). */
export function ejectsPrints(camera: CameraModel): boolean {
  return camera.instant && camera.border === 'instant';
}

/** Exposure counter unit: half-frame counts halves, others count frames. */