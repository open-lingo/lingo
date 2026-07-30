/**
 * Small seeded PRNG + deterministic helpers for the practice generator.
 *
 * The generator never calls `Math.random` in its logic — all randomness flows
 * from a seed so a session is stable (same seed → same items) yet fresh across
 * sessions (a new seed → new items). When no seed is supplied we derive one from
 * the wall clock (fresh per call) and thread it through the same deterministic
 * machinery.
 */

export type Rng = () => number;

/** mulberry32 — a fast, well-distributed 32-bit seeded generator. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic string → 32-bit seed (FNV-1a). */
export function hashStringToSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Build an RNG from an optional seed. A number seeds directly; a string is
 * hashed; `undefined` falls back to the wall clock (fresh each call — never
 * `Math.random`).
 */
export function makeRng(seed?: number | string): Rng {
  if (typeof seed === "number") return mulberry32(seed);
  if (typeof seed === "string") return mulberry32(hashStringToSeed(seed));
  return mulberry32(Date.now() >>> 0);
}

/** Fisher-Yates shuffle using the supplied RNG. Returns a new array. */
export function seededShuffle<T>(arr: readonly T[], rng: Rng): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Uniform pick from a non-empty array. */
export function pick<T>(arr: readonly T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Weighted pick — probability proportional to `weightOf(item)` (floored at a
 * tiny epsilon so every candidate stays reachable). Falls back to a uniform
 * pick if all weights are non-positive.
 */
export function weightedPick<T>(
  items: readonly T[],
  weightOf: (item: T) => number,
  rng: Rng,
): T {
  let total = 0;
  const weights = items.map((it) => {
    const w = Math.max(0.0001, weightOf(it));
    total += w;
    return w;
  });
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}
