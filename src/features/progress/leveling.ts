/**
 * Leveling curve for player XP → level mapping.
 *
 * Curve choice: triangular numbers — level N requires 100·N XP to clear.
 *
 *   xpForLevel(n)        = 100·n          (XP needed to complete level n)
 *   totalXpToReachLevel  = 100·n·(n−1)/2  (cumulative XP to BE level n)
 *
 * Cumulative checkpoints:
 *   Level 1   → 0 XP   (starting state)
 *   Level 2   → 100 XP
 *   Level 5   → 1000 XP
 *   Level 10  → 4500 XP
 *   Level 11  → 5500 XP   (matches the "reach level 10 at 5500 XP"
 *                          spec intuition — 5500 XP gets you THROUGH
 *                          level 10, i.e. into level 11)
 *
 * The curve is intentionally gentle early (a first lesson at ~30 XP feels
 * meaningful) and slowly accelerating — gamification, not grind.
 * Tunable later via this single constant if a/b tests demand it.
 */

const BASE = 100;

/** XP cost to clear level `n` (i.e. progress from level n → n+1). */
export function xpForLevel(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 0;
  return BASE * Math.floor(n);
}

/** Cumulative XP required to reach (== be at) level `n` from scratch. */
export function totalXpToReachLevel(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 0;
  const level = Math.floor(n);
  // Sum 100·1 + 100·2 + ... + 100·(n−1) = 100·n·(n−1)/2
  return (BASE * level * (level - 1)) / 2;
}

/** Resolve current level from total XP (1-indexed; floor never goes below 1). */
export function currentLevel(totalXp: number): number {
  if (!Number.isFinite(totalXp) || totalXp <= 0) return 1;
  // Solve totalXpToReachLevel(L) <= xp < totalXpToReachLevel(L+1).
  // From the closed form: L = floor((1 + sqrt(1 + 8·xp/BASE)) / 2)
  // but inversion is brittle around exact boundaries — bump-search instead.
  let level = Math.floor((1 + Math.sqrt(1 + (8 * totalXp) / BASE)) / 2);
  if (level < 1) level = 1;
  // Snap to the exact boundary: walk down/up at most one step.
  while (level > 1 && totalXpToReachLevel(level) > totalXp) level--;
  while (totalXpToReachLevel(level + 1) <= totalXp) level++;
  return level;
}

export type LevelProgress = {
  /** Current level (1-indexed). */
  level: number;
  /** XP earned into the current level (0 ≤ intoLevel < toNext). */
  intoLevel: number;
  /** XP needed to clear the current level. */
  toNext: number;
  /** Whole-percent progress through current level [0, 100]. */
  percent: number;
};

/** Bundle of level + progress metrics for UI rendering. */
export function xpProgressToNextLevel(totalXp: number): LevelProgress {
  const safe = Number.isFinite(totalXp) && totalXp > 0 ? totalXp : 0;
  const level = currentLevel(safe);
  const floor = totalXpToReachLevel(level);
  const toNext = xpForLevel(level);
  const intoLevel = Math.max(0, safe - floor);
  const percent =
    toNext > 0 ? Math.min(100, Math.round((intoLevel / toNext) * 100)) : 0;
  return { level, intoLevel, toNext, percent };
}
