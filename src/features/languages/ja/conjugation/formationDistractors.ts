/**
 * Formation-distractor generator (Task 5) — extracted from trainerSession.ts
 * into a PURE leaf module (imports only the conjugation tables/engine) so the
 * lesson-side `conjugationCloze` factory (grammarHelpers.ts) can use it
 * without the trainer's SRS/localStorage dependency chain — importing
 * trainerSession there closed an import cycle (grammarHelpers →
 * trainerSession → grammarSrs → lessonAtomIndex → language registry →
 * curriculum → grammarHelpers) that left the factory undefined at runtime.
 *
 * Still the SINGLE source: trainerSession re-exports it, and every consumer
 * (trainer sessions, ConjugationPracticePage, conjugationCloze) shares this
 * one implementation. Do not duplicate.
 */
import type { VerbGroup } from "../conjugationTables";
import { conjugateVerb, type ChainForm } from "../conjugationEngine";

// Distractors are SAME-VERB, SAME-ENDING-FAMILY rule misapplications: every
// option shares the verb's stem AND the target form's ending shape, so only
// formation knowledge (not surface pattern-matching) separates them. The old
// same-form-OTHER-verb path is retired for verbs — it let learners solve by
// elimination ("the only one starting with み and ending in ない").

/** う → あ *without* the う → わ exception — the classic beginner nai error. */
const U_TO_A_NAIVE: Record<string, string> = {
  う: "あ",
  く: "か",
  ぐ: "が",
  す: "さ",
  つ: "た",
  ぬ: "な",
  ぶ: "ば",
  む: "ま",
  る: "ら",
};

/** The stacked members that share a target form's ending family. */
function verbFamilyMembers(form: ChainForm): ChainForm[] {
  switch (form) {
    case "masu":
    case "masu-neg":
    case "masu-past":
    case "masu-past-neg":
      return ["masu", "masu-neg", "masu-past", "masu-past-neg"];
    case "nai":
    case "nai-past":
      return ["nai", "nai-past"];
    case "tai":
    case "tai-neg":
    case "tai-past":
    case "tai-neg-past":
      return ["tai", "tai-neg", "tai-past", "tai-neg-past"];
    case "te":
      return ["te"];
    case "ta":
      return ["ta"];
  }
}

/** The plain suffix bolted onto a stem — also the attach-to-dictionary tail. */
const CHAIN_SUFFIX: Record<ChainForm, string> = {
  masu: "ます",
  "masu-neg": "ません",
  "masu-past": "ました",
  "masu-past-neg": "ませんでした",
  te: "て",
  ta: "た",
  nai: "ない",
  tai: "たい",
  "nai-past": "なかった",
  "tai-neg": "たくない",
  "tai-past": "たかった",
  "tai-neg-past": "たくなかった",
};

/** Wrong sound-change candidates (te/ta/nai families, godan/ichidan verbs). */
function wrongSoundChangeCandidates(
  dictionary: string,
  group: VerbGroup,
  form: ChainForm,
): string[] {
  if (group === "irregular") return [];
  const base = dictionary.slice(0, -1);
  const masuStem = conjugateVerb(dictionary, group, "masu").slice(0, -2); // drop ます
  const out: string[] = [];
  if (form === "te" || form === "ta") {
    const rows = form === "ta" ? ["った", "んだ", "いた", "いだ", "した"] : ["って", "んで", "いて", "いで", "して"];
    for (const r of rows) out.push(base + r);
    out.push(masuStem + (form === "ta" ? "た" : "て")); // のむ → のみて
  } else if (form === "nai" || form === "nai-past") {
    const tail = form === "nai-past" ? "なかった" : "ない";
    if (group === "godan") {
      const last = dictionary.slice(-1);
      out.push(base + (U_TO_A_NAIVE[last] ?? last) + tail); // かう → かあない
    }
    out.push(masuStem + tail); // のむ → のみない
  }
  return out;
}

/**
 * Same-verb, same-ending-family rule misapplications (Task 5). Returns up to 3
 * distinct distractors, none equal to `correct`; never falls back to another
 * verb. Ordered so the most confusable errors come first.
 */
/**
 * Distractor picker for the TRANSFORM CARD's stage-1/2 MCQ (Fable sweep
 * 2026-07-24). Differs from the trainer/cloze ordering in two ways:
 *  - ATTACH-TO-DICTIONARY ranks FIRST (たべるない) — it's the exact error
 *    the rule card's anti-pattern warns about, and the general ordering
 *    buried it below family-tense forms (なかった) whose tense can never
 *    match the card's gloss, letting learners meta-game by elimination.
 *  - `exclude` filters candidates that are REAL registered words: いない
 *    was served as a WRONG option in L2 (いく → ×いない), training an
 *    error against the very word L6 then teaches as correct.
 */
export function transformDrillDistractors(
  dictionary: string,
  group: VerbGroup,
  form: ChainForm,
  correct: string,
  exclude: ReadonlySet<string>,
): string[] {
  const ranked = [
    dictionary + CHAIN_SUFFIX[form],
    ...(group === "irregular"
      ? [conjugateVerb(dictionary, "godan", form), conjugateVerb(dictionary, "ichidan", form)]
      : [conjugateVerb(dictionary, group === "godan" ? "ichidan" : "godan", form)]),
    ...generateFormationDistractors(dictionary, group, form, correct),
  ];
  const out: string[] = [];
  const seen = new Set<string>([correct]);
  for (const c of ranked) {
    if (!c || seen.has(c) || exclude.has(c)) continue;
    seen.add(c);
    out.push(c);
    if (out.length >= 2) break;
  }
  return out;
}

export function generateFormationDistractors(
  dictionary: string,
  group: VerbGroup,
  form: ChainForm,
  correct: string,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>([correct]);
  const push = (s: string | undefined) => {
    if (s && !seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  };

  const conjugateAsOtherClass = (f: ChainForm): string[] =>
    group === "irregular"
      ? [conjugateVerb(dictionary, "godan", f), conjugateVerb(dictionary, "ichidan", f)]
      : [conjugateVerb(dictionary, group === "godan" ? "ichidan" : "godan", f)];

  // (3) wrong sound-change (the hardest to catch by elimination).
  for (const c of wrongSoundChangeCandidates(dictionary, group, form)) push(c);
  // (1) wrong-class: apply the other class's rule to the same form.
  for (const c of conjugateAsOtherClass(form)) push(c);
  // (4) wrong tense/polarity WITHIN the family (real sibling forms are fair game).
  for (const sib of verbFamilyMembers(form)) {
    if (sib !== form) push(conjugateVerb(dictionary, group, sib));
  }
  // Fallbacks for short verbs — never other-verb options, only more of the same.
  for (const sib of verbFamilyMembers(form)) {
    if (sib !== form) for (const c of conjugateAsOtherClass(sib)) push(c);
  }
  // (2) attach-to-dictionary: bolt the plain suffix on the dictionary form.
  push(dictionary + CHAIN_SUFFIX[form]);
  for (const sib of verbFamilyMembers(form)) {
    if (sib !== form) push(dictionary + CHAIN_SUFFIX[sib]);
  }

  return out.slice(0, 3);
}
