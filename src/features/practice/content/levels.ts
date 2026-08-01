/**
 * Story difficulty bands.
 *
 * `Story.level` is INDEPENDENT of `Story.module`. Module decides WHEN a story
 * unlocks; level decides HOW HARD it is. Keeping them apart is what lets a
 * module carry both a comfortable read and a stretch read, so the learner
 * always has somewhere to warm up and somewhere to push.
 *
 * The gloss budget is the number of above-level words a story may declare (see
 * `gate.ts`). It is deliberately tight relative to sentence count: the budget
 * is an on-ramp for new vocabulary, not a licence to dump a word list into a
 * narrative.
 */
import type { StoryLevel } from "./types";

export interface LevelBand {
  level: StoryLevel;
  /** Display name shown on the difficulty chip. */
  name: string;
  minSentences: number;
  maxSentences: number;
  /** Maximum declared above-level words. */
  maxGlosses: number;
  /** Authoring guidance — what syntax this level is allowed to reach for. */
  shape: string;
}

export const LEVEL_BANDS: LevelBand[] = [
  { level: 1, name: "Starter",   minSentences: 4,  maxSentences: 6,  maxGlosses: 1, shape: "simple SVO" },
  { level: 2, name: "Easy",      minSentences: 7,  maxSentences: 10, maxGlosses: 2, shape: "+ connectives" },
  { level: 3, name: "Steady",    minSentences: 11, maxSentences: 16, maxGlosses: 4, shape: "+ subordinate clauses, dialogue" },
  { level: 4, name: "Stretch",   minSentences: 17, maxSentences: 24, maxGlosses: 6, shape: "+ narration, culture notes" },
  { level: 5, name: "Challenge", minSentences: 25, maxSentences: 35, maxGlosses: 8, shape: "+ register shifts, multi-scene" },
];

const BY_LEVEL = new Map<StoryLevel, LevelBand>(LEVEL_BANDS.map((b) => [b.level, b]));

export function levelBand(level: StoryLevel): LevelBand {
  const band = BY_LEVEL.get(level);
  if (!band) throw new Error(`unknown story level: ${level}`);
  return band;
}

/**
 * Highest level authorable at a module. An m3 learner has roughly forty atoms;
 * a 30-sentence story built from them is mush, so the ceiling rises with the
 * size of the pool. Lower levels stay available forever.
 */
export function levelCeiling(module: number): StoryLevel {
  if (module >= 21) return 5;
  if (module >= 13) return 4;
  if (module >= 7) return 3;
  return 2;
}
