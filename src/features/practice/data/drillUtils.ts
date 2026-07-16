/**
 * Pure helpers for the Listen & choose and Type-it drills.
 * Kept out of the page components so option generation and answer
 * normalization stay unit-testable.
 */
import type { SpeakingPrompt } from "./ja-speaking-prompts";

/** Fisher-Yates with injectable RNG for deterministic tests. */
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * MCQ options for "which meaning did you hear?" — the correct prompt's
 * translation plus up to `count - 1` distractor translations from the
 * same pool (deduped; short pools yield fewer options).
 */
export function buildListeningOptions(
  prompts: SpeakingPrompt[],
  correctIdx: number,
  count = 4,
  rand: () => number = Math.random,
): string[] {
  const correct = prompts[correctIdx]?.translation;
  if (!correct) return [];
  const distractors = shuffle(
    [...new Set(prompts.filter((_, i) => i !== correctIdx).map((p) => p.translation))].filter(
      (tr) => tr !== correct,
    ),
    rand,
  ).slice(0, count - 1);
  return shuffle([correct, ...distractors], rand);
}

/**
 * Normalize a typed answer for comparison: NFC, lowercase, all whitespace
 * (incl. full-width) removed, trailing sentence punctuation stripped.
 * JA prompt text carries didactic spaces ("みずを ください") the learner
 * shouldn't be punished for omitting.
 */
export function normalizeTypedAnswer(text: string): string {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[\s　]+/g, "")
    .replace(/[。．.!?！？]+$/u, "");
}
