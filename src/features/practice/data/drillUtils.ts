/**
 * Pure helpers for the Listen & choose and Type-it drills.
 * Kept out of the page components so option generation and answer
 * normalization stay unit-testable.
 */
import type { SpeakingPrompt } from "./ja-speaking-prompts";
import { typedAnswerKey } from "@/shared/speech/loose-match";

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
 * Normalize a typed answer for comparison: NFKC, lowercase, all whitespace
 * (incl. full-width) removed, edge punctuation stripped on both ends. JA
 * prompt text carries didactic spaces ("みずを ください") the learner
 * shouldn't be punished for omitting.
 *
 * Delegates to the shared `typedAnswerKey` (src/shared/speech/loose-match.ts)
 * used by lesson grading and accepted-answer dedupe, rather than keeping a
 * second, drill-only normaliser in sync by hand. `typedAnswerKey` is a
 * strict superset of what this used to do: same NFC-vs-NFKC/whitespace/
 * lowercase handling, a wider trailing-punctuation set, and it additionally
 * strips leading edge punctuation — every case this function used to
 * normalize still normalizes the same way, and a few more do too.
 */
export function normalizeTypedAnswer(text: string): string {
  return typedAnswerKey(text);
}
