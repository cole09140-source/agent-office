/**
 * Spot metering for tap-to-expose: the EV (1/3 stops, ±2) that brings a spot's mean brightness
 * (sRGB 0..1) to a mid grey — 18 % in linear light, about 0.46 in sRGB.
 */
export function meterEv(mean: number): number {
  const lin = Math.pow(Math.min(1, Math.max(0.01, mean)), 2.2);
  const stops = Math.log2(0.18 / lin);
  return Math.round(Math.max(-2, Math.min(2, stops)) * 3) / 3 || 0; // no -0
}
