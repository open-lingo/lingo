/**
 * Deterministic Fisher-Yates shuffle — FNV-1a seed hash feeding an
 * xorshift32 PRNG. Same seed → same order, so a tile bank shuffled on
 * `step.id` is stable across re-renders, resumes, and test runs while
 * still varying between steps. Mirrors the private copies in
 * `buildReviewTailSteps.ts` / `buildSrsReviewLesson.ts`.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const rand = () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h = h >>> 0;
    return h / 0x100000000;
  };
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
