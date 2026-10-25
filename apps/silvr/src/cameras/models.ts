import { getStock, STOCKS } from '../film/stocks';
import type { Aspect, BorderStyle, FilmStock, Lens, RGB } from '../film/types';

/** How one press of the shutter turns into a negative. */
export type CaptureMode =
  | 'single'
  | 'half' // two portrait halves share one 35mm frame (two presses)
  | 'quad' // four lenses fire in sequence into a 2×2 grid (one press)
  | 'double'; // two exposures stacked on one frame (two presses)

export type BodyStyle = 'slr' | 'range' | 'disposable' | 'compact' | 'half' | 'instant' | 'toy' | 'pano' | 'fish' | 'quad' | 'double' | 'cine' | 'digicam' | 'pixel';
export type ViewfinderStyle = 'slr' | 'range' | 'tunnel' | 'compact' | 'half' | 'instant' | 'toy' | 'pano' | 'none' | 'quad' | 'double' | 'cine' | 'lcd' | 'pixel';
export type ShutterSound = 'slr' | 'leaf' | 'disposable' | 'instant' | 'toy' | 'quad' | 'digital' | 'pixel' | 'cine';
/** standard: torch / screen flash. charge: must be charged before every flash shot. none: no flash. */
export type FlashMode = 'standard' | 'charge' | 'none';
export type StampStyle = 'led' | 'digital' | 'none';

export interface CameraModel {
  id: string;
  name: string;
  /** Era/marketing line shown under the name. */
  era: string;
  body: BodyStyle;
  /** body, accent, trim */
  colors: [string, string, string];
  /** Allowed stock ids; 'any' = every non-exclusive stock. */
  films: string[] | 'any';
  defaultStock: string;
  /** Exposures per roll/pack/card; the first one is the default. */
  capacities: number[];
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
    name: 'Insta SQ',
    era: '1982 · Instant',
    body: 'instant',
    colors: ['#f2efe8', '#e8452c', '#2b2b2b'],
    films: ['insta600', 'instamini'],
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
    capacities: [24, 36],
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
    capacities: [24, 36],
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
    capacities: [24, 36],
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
    capacities: [24, 36],
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
    name: 'Pixel Pocket',
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
];

const BY_ID = new Map(CAMERAS.map((c) => [c.id, c]));
export const DEFAULT_CAMERA_ID = 'pro35';

export function getCamera(id: string | undefined): CameraModel {
  return (id && BY_ID.get(id)) || BY_ID.get(DEFAULT_CAMERA_ID)!;
}

/** Whether a camera id is known (older frames have none — they get a neutral lens). */
export function hasCamera(id: string | undefined): boolean {
  return !!id && BY_ID.has(id);
}

export function filmsFor(camera: CameraModel): FilmStock[] {
  if (camera.films === 'any') return STOCKS.filter((s) => !s.exclusive);
  return camera.films.map((id) => getStock(id));
}

export function canLoad(camera: CameraModel, stockId: string): boolean {
  return filmsFor(camera).some((s) => s.id === stockId);
}

/** Exposure counter unit: half-frame counts halves, others count frames. */