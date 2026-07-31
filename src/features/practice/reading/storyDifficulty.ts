/**
 * Reading practice — story difficulty metric (pure).
 *
 * A story's difficulty is PRIMARILY its unlock module (later modules use harder
 * grammar/vocab), refined by its length/density: a long or vocab-dense story
 * reads one tier harder than its module suggests, and a very short, sparse one
 * reads one tier easier. Kept dependency-free (no dictionary / React) so the
 * preview modal can render it and it is trivially unit-testable.
 */
import type { Story } from "@/features/practice/content";

export type DifficultyTier = "beginner" | "intermediate" | "advanced";

/** Tiers in ascending order; index doubles as the 0-based level. */
const TIERS: DifficultyTier[] = ["beginner", "intermediate", "advanced"];

export interface StoryDifficulty {
  tier: DifficultyTier;
  /** 1..3 — how many dots to fill in the level indicator. */
  level: number;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Base tier purely from the story's unlock module (≤8 / 9–17 / 18+). */
function moduleTierIndex(module: number): number {
  if (module <= 8) return 0;
  if (module <= 17) return 1;
  return 2;
}

/**
 * Difficulty of a story. `contentWordCount` (unique content words the story
 * actually uses, from `extractStoryWords`) sharpens the length refinement; omit
 * it to grade on sentence count alone.
 */
export function storyDifficulty(
  story: Pick<Story, "module" | "sentences">,
  opts: { contentWordCount?: number } = {},
): StoryDifficulty {
  const base = moduleTierIndex(story.module);
  const sentences = story.sentences.length;
  const words = opts.contentWordCount ?? 0;

  let adjust = 0;
  if (sentences >= 8 || words >= 18) adjust = 1;
  else if (sentences <= 3 && words <= 6) adjust = -1;

  const idx = clamp(base + adjust, 0, TIERS.length - 1);
  return { tier: TIERS[idx], level: idx + 1 };
}
