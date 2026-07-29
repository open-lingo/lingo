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
import { VERB_ENTRIES, ADJ_ENTRIES, type VerbGroup } from "../conjugationTables";
import {
  conjugateVerb,
  conjugateIAdj,
  type ChainForm,
  type IAdjForm,
} from "../conjugationEngine";

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

/** Plain い-adjective suffix — also the attach-to-dictionary error shape. */
const ADJ_SUFFIX: Record<IAdjForm, string> = {
  negative: "くない",
  past: "かった",
  "past-negative": "くなかった",
};

/**
 * い-adjective formation distractors — misapplied くない/かった rules on the
 * SAME adjective (attach-to-dictionary たかいくない, wrong polarity/tense).
 * Same anti-elimination guarantees as the verb generator.
 *
 * Lives here, in the PURE leaf, for the same reason the verb generator does:
 * `grammarHelpers.conjugationTransform` needs it for the m12 い-adjective
 * ramp, and importing `trainerSession` there closes an import cycle back
 * into the curriculum. `trainerSession` re-exports it — still ONE source.
 */

/** Same rule as `collidesWithAnotherVerb`, over the adjective table. */
let foreignAdjForms: Map<string, Set<string>> | null = null;
function collidesWithAnotherAdj(surface: string, dictionary: string): boolean {
  if (!foreignAdjForms) {
    foreignAdjForms = new Map();
    for (const entry of ADJ_ENTRIES) {
      for (const s of [entry.dictionary, ...Object.values(entry.forms)]) {
        if (!s) continue;
        const set = foreignAdjForms.get(s) ?? new Set<string>();
        set.add(entry.dictionary);
        foreignAdjForms.set(s, set);
      }
    }
  }
  const owners = foreignAdjForms.get(surface);
  if (!owners) return false;
  for (const owner of owners) if (owner !== dictionary) return true;
  return false;
}

export function generateIAdjFormationDistractors(
  dictionary: string,
  form: IAdjForm,
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
  const siblings: IAdjForm[] = ["negative", "past", "past-negative"];

  // (4) wrong polarity/tense within the family (real sibling forms).
  for (const sib of siblings) if (sib !== form) push(conjugateIAdj(dictionary, sib));
  // (2) attach-to-dictionary: たかい + くない → たかいくない.
  push(dictionary + ADJ_SUFFIX[form]);
  for (const sib of siblings) if (sib !== form) push(dictionary + ADJ_SUFFIX[sib]);
  // Fallback: stem + every ending (dedup drops correct + sibling repeats).
  const stem = dictionary.slice(0, -1);
  for (const e of ["くない", "かった", "くなかった"]) push(stem + e);

  // Prefer options that are not a real form of some other adjective —
  // stable, so the priority order above survives inside each half. Same
  // rule as the verb generator (Spencer: prefer it not, never ban it).
  const clean = out.filter((c) => !collidesWithAnotherAdj(c, dictionary));
  const colliding = out.filter((c) => collidesWithAnotherAdj(c, dictionary));
  return [...clean, ...colliding].slice(0, 3);
}

/**
 * Transform-card picker for い-adjectives — the adjective twin of
 * `transformDrillDistractors`. ATTACH-TO-DICTIONARY ranks FIRST (たかいくない
 * is exactly the error the rule card's anti-pattern warns about), then the
 * regular-stem misapplication for the suppletive いい (いくない beside the
 * correct よくない), then the family siblings. `exclude` drops candidates that
 * are REAL registered words, so a wrong option can never be a word the course
 * teaches as correct somewhere else.
 */
export function transformDrillIAdjDistractors(
  dictionary: string,
  form: IAdjForm,
  correct: string,
  exclude: ReadonlySet<string>,
): string[] {
  const ranked = [
    dictionary + ADJ_SUFFIX[form],
    // いい's stem is suppletive (よ-); applying the REGULAR rule to it is the
    // one formation error the family-sibling list can't produce.
    dictionary.slice(0, -1) + ADJ_SUFFIX[form],
    ...generateIAdjFormationDistractors(dictionary, form, correct),
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


/**
 * Every surface that is a real form of some OTHER verb, mapped to the
 * dictionary forms that own it.
 *
 * Most distractors here are real forms ON PURPOSE — the sibling-form family
 * (のみたかった against のみたい) is the whole point, and those belong to the
 * SAME verb, so they read as "wrong cell", which is the confusion being
 * tested. A collision with a DIFFERENT verb is a different thing: しる drilled
 * to しりたい offered したい, which is する's たい form — a right answer to a
 * question nobody asked, and it teaches nothing about しる. Spencer
 * 2026-07-28: "fine if the distractor is accidentally a real word but prefer
 * it not", so these sink to the back of the candidate list rather than being
 * banned — a short verb with few candidates still gets three options.
 */
let foreignForms: Map<string, Set<string>> | null = null;
function ownersOf(surface: string): Set<string> {
  if (!foreignForms) {
    foreignForms = new Map();
    for (const entry of VERB_ENTRIES) {
      const surfaces = [entry.dictionary, ...Object.values(entry.forms)];
      for (const s of surfaces) {
        if (!s) continue;
        const set = foreignForms.get(s) ?? new Set<string>();
        set.add(entry.dictionary);
        foreignForms.set(s, set);
      }
    }
  }
  return foreignForms.get(surface) ?? new Set();
}

/** True when `surface` is a real form of a verb OTHER than `dictionary`. */
function collidesWithAnotherVerb(surface: string, dictionary: string): boolean {
  const owners = ownersOf(surface);
  for (const owner of owners) if (owner !== dictionary) return true;
  return false;
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

  // Prefer options that are not a real form of some other verb — stable, so
  // the priority order above is preserved within each half.
  const clean = out.filter((c) => !collidesWithAnotherVerb(c, dictionary));
  const colliding = out.filter((c) => collidesWithAnotherVerb(c, dictionary));
  return [...clean, ...colliding].slice(0, 3);
}
