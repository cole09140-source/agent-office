/** Mulberry32 — tiny, fast, deterministic PRNG. Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0] >>> 0;
  }
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/** PCG integer hash (same as the shader's `pcg`). */
export function pcg(v: number): number {
  const state = (Math.imul(v >>> 0, 747796405) + 2891336453) >>> 0;
  const word = Math.imul(((state >>> ((state >>> 28) + 4)) ^ state) >>> 0, 277803737) >>> 0;
  return ((word >>> 22) ^ word) >>> 0;
}

/**
 * Lattice hash shared with the fragment shader. Integer-based so it is stable
 * on low-precision mobile GPUs (sin-based hashes band at large arguments).
 * x, y are integer lattice coordinates (≥ -32768). Returns [0, 1].
 */
export function hash2(x: number, y: number, seed: number): number {
  return lattice(x, y, seedHash(seed)) / 4294967295;
}

export function seedHash(seed: number): number {
  return pcg(Math.floor(seed * 1000) >>> 0);
}

/** 32-bit lattice hash; each byte feeds one grain channel (mirrors shader `lat`). */
export function lattice(x: number, y: number, hs: number): number {
  return pcg((x + 32768 + pcg((y + 32768 + hs) >>> 0)) >>> 0);
}
