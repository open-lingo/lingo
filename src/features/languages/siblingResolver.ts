/**
 * Semantic-sibling resolver — the language-agnostic seam over the per-language
 * "these words are genuinely confusable with each other" sets.
 *
 * Distractor quality is the whole ballgame for any pick-one exercise: Little &
 * Bjork (2015) found COMPETITIVE distractors buy ~10 points of learning at no
 * measured cost in wrong-answer intrusions, while non-competitive ones are
 * statistically identical to never having shown the item at all. Random
 * same-part-of-speech words are that inert condition — the learner eliminates
 * nonsense without ever reading the stem.
 *
 * JA already made this ruling for build tiles in July 2026 (`jaSiblingSets.ts`);
 * this resolver lets the cloze builder reuse it rather than inventing a parallel
 * notion of confusability.
 *
 * ⚠️ ONLY JA has sibling sets today. Languages with no registry entry return
 * `[]`, and callers are expected to DEGRADE HONESTLY — skip the item rather than
 * fall back to random distractors. Authoring KO sibling sets is the tracked gap.
 */
import { siblingsOf as jaSiblingsOf } from "./ja/jaSiblingSets";

type SiblingLookup = (surface: string) => readonly string[];

const REGISTRY: Record<string, SiblingLookup> = {
  ja: jaSiblingsOf,
};

/** True when the language ships sibling sets at all. */
export function hasSiblingSets(languageId: string): boolean {
  return languageId in REGISTRY;
}

/**
 * Same-category surfaces for `surface`, excluding itself. `[]` when the word is
 * uncategorised OR the language has no sets — the caller cannot tell those apart
 * and shouldn't need to: both mean "no competitive distractor available here".
 */
export function getSiblingSurfaces(
  languageId: string,
  surface: string,
): readonly string[] {
  return REGISTRY[languageId]?.(surface) ?? [];
}
