/**
 * Build-from-tiles support for the roleplay "tiles" rung.
 *
 * The learner reconstructs their line by tapping word tiles in order. The
 * correct tiles are the line's segmented chunks; a few distractor tiles are
 * drawn from the OTHER learner lines in the same conversation (plausible,
 * same-register words the learner has met). Grading is order-sensitive but
 * punctuation/spacing-insensitive: the assembled tiles must normalize to the
 * target line.
 */
import { normalizeGeneric } from "@/shared/speech/loose-match";
import { segmentLine } from "./conversationLexicon";
import type { Conversation } from "@/features/practice/content";

/** Deterministic small-int hash for a seeded shuffle. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Fisher–Yates seeded by the line text, so the tile order is stable. */
function shuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let state = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1103515245) + 12345) & 0x7fffffff;
    const j = state % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface TilePool {
  /** The line's chunks in the correct order (the answer). */
  answer: string[];
  /** Shuffled correct-plus-distractor tiles for display. */
  tiles: string[];
}

/**
 * Build the shuffled tile pool for `line` within `conv`. Distractors come from
 * the learner's OTHER lines' chunks that aren't already in the answer, capped
 * so the pool stays readable.
 */
export function buildTilePool(
  conv: Conversation,
  lineIndex: number,
  lang: string,
  maxDistractors = 3,
): TilePool {
  const line = conv.lines[lineIndex];
  const answer = segmentLine(line.text, lang).chunks;
  const answerSet = new Set(answer);

  const distractorPool: string[] = [];
  const seen = new Set(answer);
  conv.lines.forEach((other, i) => {
    if (i === lineIndex || other.speaker !== line.speaker) return;
    for (const chunk of segmentLine(other.text, lang).chunks) {
      if (!answerSet.has(chunk) && !seen.has(chunk)) {
        seen.add(chunk);
        distractorPool.push(chunk);
      }
    }
  });

  const seed = hash(line.text);
  const distractors = shuffle(distractorPool, seed).slice(0, maxDistractors);
  const tiles = shuffle([...answer, ...distractors], seed ^ 0x9e3779b9);
  return { answer, tiles };
}

/** True iff the assembled tiles reproduce the target line. */
export function gradeTiles(chosen: string[], target: string): boolean {
  return normalizeGeneric(chosen.join("")) === normalizeGeneric(target);
}
