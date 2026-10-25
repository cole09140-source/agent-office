export type RGB = [number, number, number];

export type FilmKind = 'color' | 'slide' | 'bw' | 'instant' | 'cine';
export type BorderStyle = 'none' | 'film35' | 'instant' | 'print';
export type Aspect = '3:2' | '4:3' | '1:1';

/** The intrinsic look of a film stock. Values are tuned by eye against reference scans. */
export interface FilmLook {
  /** Exposure offset in stops. */
  exposure: number;
  /** S-curve strength; 1 = linear. */
  contrast: number;
  /** Per-channel gamma applied after the S-curve (>1 darkens that channel). */
  gamma: RGB;
  /** Per-channel black level (fade / base fog). */
  lift: RGB;
  /** Per-channel white level. */
  gain: RGB;
  saturation: number;
  /** Row-major 3x3 colour crosstalk matrix. */
  matrix: number[];
  /** Additive colour pushed into shadows / highlights. */
  shadowTint: RGB;
  highlightTint: RGB;
  /** When set, the stock is monochrome and these are the channel mix weights. */
  mono: RGB | null;
  /** Grain amplitude at box speed (0..~0.2). */
  grain: number;
  /** Grain clump size in px at a 1200px short side. */
  grainSize: number;
  /** Share of grain that is per-channel (colour noise) vs luminance. */
  grainChroma: number;
  halation: number;
  halationColor: RGB;
  bloom: number;
  vignette: number;
  /** Chromatic aberration in px at a 1200px short side. */
  chroma: number;
  /** Amount of dust & scratches drawn on develop. */
  dust: number;
}

export interface FilmStock {
  id: string;
  name: string;
  iso: number;
  kind: FilmKind;
  pro: boolean;
  /** Canister colours for the UI. Descriptions live in i18n under `stock.<id>`. */
  canister: [string, string];
  defaultBorder: BorderStyle;
  defaultAspect: Aspect;
  /** Probability that a frame gets a light leak at capture time. */
  leakChance: number;
  /** Disposable-style stocks fire the flash look by default. */
  defaultFlash: boolean;
  /** Preset expiry baked into the stock (0..1). */
  baseExpired: number;
  look: FilmLook;
}

/** User-editable, non-destructive develop recipe stored with every frame. */
export interface DevelopSettings {
  stockId: string;
  /** Push (+) / pull (-) processing in stops, -2..2. */
  push: number;
  /** Additional expiry 0..1 on top of the stock's own. */
  expired: number;
  /** Multipliers 0..2. */
  grain: number;
  halation: number;
  /** null = no light leak; otherwise the seed for the leak pattern. */
  leak: number | null;
  flash: boolean;
  dateStamp: boolean;
  border: BorderStyle;
  /** Seed for grain / dust so a frame always re-develops identically. */
  seed: number;
  /** Clockwise quarter turns applied to the negative (0-3). Missing on older frames. */
  rotate?: number;
}

export interface LightLeak {
  x: number;
  y: number;
  radius: number;
  color: RGB;
  intensity: number;
}

/** Fully-resolved values that both renderers consume. */
export interface ResolvedLook {
  lut: Uint8Array; // 256 * 4 RGBA
  saturation: number;
  matrix: number[];
  shadowTint: RGB;
  highlightTint: RGB;
  mono: RGB | null;
  grain: number;
  grainSize: number;
  grainChroma: number;
  halation: number;
  halationColor: RGB;
  bloom: number;
  vignette: number;
  chroma: number;
  flash: number;
  leaks: LightLeak[];
  dust: number;
  seed: number;
}
