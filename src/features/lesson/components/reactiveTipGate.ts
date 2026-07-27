import type { ReactiveGrammarTip } from "../types";
import { normalizeTypedAnswer } from "@/shared/speech";

/**
 * Verify a reactive grammar tip against the learner's ACTUAL typed answer
 * before flashing it (Spencer m6 walk 2026-07-23: a missing topic-は got
 * the たべるない anti-pattern card — "we need to verify their actual
 * error, this is unhelpful").
 *
 * The tip's characteristic mistake is the longest space-delimited chunk of
 * `wrongJa` that does not occur in `rightJa` (punctuation stripped) — e.g.
 * ✗ごはんを たべるない。 vs ✓ごはんを たべない。 → たべるない. The card
 * only fires when that chunk actually appears in the learner's answer.
 *
 * Deterministic on purpose: no model call in the grading path. Steps that
 * can't supply an answer text (tile builds, MCQs) skip this gate and keep
 * the old always-fire behavior.
 */
export function tipWrongCore(
  tip: Pick<ReactiveGrammarTip, "wrongJa" | "rightJa">,
): string | null {
  const strip = (s: string) => s.replace(/[。．.、,\s]/g, "");
  const right = strip(tip.rightJa);
  const chunks = tip.wrongJa.split(/\s+/).map(strip).filter(Boolean);
  const alien = chunks.filter((c) => !right.includes(c));
  if (alien.length === 0) return null;
  return alien.sort((a, b) => b.length - a.length)[0];
}

export function typedAnswerExhibitsTipError(
  tip: Pick<ReactiveGrammarTip, "wrongJa" | "rightJa">,
  answerText: string,
): boolean {
  const core = tipWrongCore(tip);
  // Unverifiable tip (wrongJa ⊆ rightJa chunk-wise) — keep legacy behavior
  // rather than silently never showing it.
  if (!core) return true;
  return normalizeTypedAnswer(answerText).includes(normalizeTypedAnswer(core));
}
