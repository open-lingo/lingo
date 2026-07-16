/**
 * mulberry32 — a tiny, fast, well-distributed 32-bit seeded PRNG.
 *
 * Returns a `() => number` in [0, 1). Same seed → same sequence, so a
 * consumer that seeds once (e.g. per test-out attempt) gets a stable-within-
 * attempt stream of randomness while still varying between attempts.
 *
 * Distinct from `seededShuffle` (which hashes a *string* seed into a one-shot
 * Fisher-Yates order): this exposes a reusable generator you can thread into
 * multiple draws within one attempt.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
