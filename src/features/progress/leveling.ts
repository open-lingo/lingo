/**
 * Leveling curve for player XP → level mapping.
 *
 * MIRRORS THE SERVER — lingo-core/app/progress/xp.py (XP_PER_LEVEL = 500,
 * linear) is authoritative; the server stores `level` on the user row.
 * The previous client-only triangular curve (100·n) disagreed with the
 * server on every surface, so a learner's level depended on which side
 * computed it (2026-06-13 XP reconciliation). A tuned curve later must
 * land on BOTH sides at once.
 */
import { XP_PER_LEVEL } from "./xpRules";

export { XP_PER_LEVEL };

/** XP cost to clear any level — linear curve, constant per level. */
export function xpForLevel(_n: number): number {
  return XP_PER_LEVEL;
}

/** Cumulative XP required to reach (== be at) level `n` from scratch. */
export function totalXpToReachLevel(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 0;
  return XP_PER_LEVEL * (Math.floor(n) - 1);
}

/** Level for a cumulative XP total. Level 1 starts at 0 XP. */
export function currentLevel(totalXp: number): number {
  return Math.max(1, Math.floor(Math.max(0, totalXp) / XP_PER_LEVEL) + 1);
}

export type LevelProgress = {
  level: number;
  /** XP earned inside the current level. */
  intoLevel: number;
  /** XP needed to clear the current level. */
  toNext: number;
  /** 0–100 fill percentage for progress bars. */
  percent: number;
};

export function xpProgressToNextLevel(totalXp: number): LevelProgress {
  const xp = Math.max(0, totalXp);
  const level = currentLevel(xp);
  const intoLevel = xp % XP_PER_LEVEL;
  return {
    level,
    intoLevel,
    toNext: XP_PER_LEVEL,
    percent: Math.min(100, Math.round((intoLevel / XP_PER_LEVEL) * 100)),
  };
}
