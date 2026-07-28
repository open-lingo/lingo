/**
 * Shared JA per-module content-lint harness — Gate 2 of
 * `docs/retrospective-2026-07-17.md` §4, carrying Gates 5-7 (§4 Tier 2).
 *
 * Consumed by the per-module test files at `../curriculum/m{N}.test.ts`
 * (ES/KO convention — ES ships 17 of these, KO 26; JA had zero, and every
 * m29 QA defect landed in JA). Each per-module file calls
 * `registerJaModuleContentLints("mN")` and then adds its own
 * module-specific spot assertions.
 *
 * What the shared harness enforces per module:
 *
 *   1. Pathway integrity — the module exists in the JA course mock and every
 *      pathway node resolves to non-empty lesson content (ES m5.test.ts
 *      headline guard).
 *   2. Unique lesson ids / unique step ids per lesson.
 *   3. The spine's authoring lints: passive-card follow-up spacing,
 *      no `explanation` on passive steps, explanation-doesn't-leak-answer
 *      (`curriculumAssertions.ts`) — none of which ran for any JA module
 *      before this file.
 *   4. GATE 5 — MCQ distractor quality (defects #3/#4/#5 of the m29 QA):
 *      see `lintMcqDistractors`.
 *   5. GATE 6 — grammarRule antiPattern minimal-pair (defect #8):
 *      see `lintAntiPatternMinimalPairs`.
 *   6. GATE 7 — sentence-complexity ratchet (defect #7), m12+:
 *      see `lintSentenceComplexity`.
 *
 * NOT duplicated here (already enforced elsewhere):
 *   - info-step ban, phrase_card ban, ends-gradeable, atom attribution,
 *     moduleId round-trip — `__tests__/moduleConformance.test.ts` (Gates 1/3/8).
 *   - word-level listening ratchet — `listeningGranularity.test.ts`.
 *   - density band / atom coverage / MCQ slot distribution — the
 *     `features/lesson/data/*.test.ts` hard guards.
 */
import { describe, it, expect } from "vitest";
// Evaluate the full atom registry up front (same reason as es/curriculum
// tests: keeps factory-time surface resolution out of mid-cycle states).
import "../courseAtoms";
import { JA_COURSE_ATOMS } from "../courseAtoms";
import { VERB_ENTRIES, ADJ_ENTRIES } from "../conjugationTables";
import { conjugateVerb } from "../conjugationEngine";
import type { ChainForm } from "../conjugationEngine";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { lessonRoutePath } from "@/shared/domain/lessonRoute";
import {
  getTrainerType,
  isSelectionAhead,
} from "@/features/languages/ja/conjugation/trainerRegistry";
import {
  buildTrainerSession,
  buildCombinedSession,
} from "@/features/languages/ja/conjugation/trainerSession";

/**
 * The module each conjugated form is actually TAUGHT in, by the shipped
 * curriculum. Deliberately hand-written and not derived from
 * `n5-grammar-points.json` — that file is what drifted out of step with the
 * course in the first place, so deriving from it would make this guard agree
 * with the bug it exists to catch.
 */
const FORM_TAUGHT_AT: Record<string, number> = {
  nai: 6, // m6 — る/う/irregular ない cards
  masu: 7,
  "masu-neg": 7, // m7 — ません
  te: 8, // m8 — the て table
  ta: 11, // m11 — た
  "masu-past": 11, // m11 — ました
  negative: 12, // m12 — い-adjective くない
  past: 12, // m12 — かった
  "past-negative": 12, // m12 — くなかった
  tai: 13,
  "tai-neg": 13,
  "tai-past": 13,
  "tai-neg-past": 13, // m13 — all four たい cells
  "masu-past-neg": 16, // m16 — ませんでした
  "nai-past": 16, // m16 — なかった
};
import type { LessonContent, LessonStep } from "@/features/lesson/types";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  checkPassiveCardFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";

// ───────────────────────────────────────────────────────────────────────
// Lesson access (memoized — every per-module file shares one walk)
// ───────────────────────────────────────────────────────────────────────

let lessonsByModule: Map<string, LessonContent[]> | null = null;

function jaLessonsByModule(): Map<string, LessonContent[]> {
  if (lessonsByModule) return lessonsByModule;
  const out = new Map<string, LessonContent[]>();
  for (const id of getAvailableMockLessonIds()) {
    const l = getMockLessonContent(id);
    if (!l || l.languageId !== "ja") continue;
    const list = out.get(l.moduleId) ?? [];
    list.push(l);
    out.set(l.moduleId, list);
  }
  lessonsByModule = out;
  return out;
}

/** Every authored JA lesson tagged with this moduleId. */
export function getJaModuleLessons(moduleId: string): LessonContent[] {
  return jaLessonsByModule().get(moduleId) ?? [];
}

/** grammarPointIds taught by grammar_rule steps in this module. */
export function moduleGrammarPointIds(moduleId: string): string[] {
  const out = new Set<string>();
  for (const l of getJaModuleLessons(moduleId)) {
    for (const s of l.steps) {
      if (s.type === "grammar_rule" && s.grammarPointId) out.add(s.grammarPointId);
    }
  }
  return [...out];
}

/** JSON of every step in the module — for surface-presence spot checks. */
export function moduleCorpus(moduleId: string): string {
  return getJaModuleLessons(moduleId)
    .map((l) => JSON.stringify(l.steps))
    .join("\n");
}

// ───────────────────────────────────────────────────────────────────────
// GATE 5 — MCQ distractor lint
// ───────────────────────────────────────────────────────────────────────

const CHAIN_FORMS: ChainForm[] = [
  "masu", "masu-neg", "masu-past", "masu-past-neg", "te", "ta", "nai",
  "tai", "nai-past", "tai-neg", "tai-past", "tai-neg-past",
];

let realFormLexicon: Set<string> | null = null;

/**
 * Every REAL Japanese surface the course knows: all atom kana/kanji variants
 * plus every conjugated form (table columns + stacked chain forms) of every
 * verb/adjective in the conjugation tables. Used to reject invented
 * mutations (のみる / のむる / てつだあない) shipping as picker tiles.
 */
export function getRealFormLexicon(): Set<string> {
  if (realFormLexicon) return realFormLexicon;
  const lex = new Set<string>();
  for (const a of JA_COURSE_ATOMS) {
    for (const s of a.kana.split(/[/、]/)) lex.add(s.trim());
    if (a.kanji) for (const s of a.kanji.split(/[/、]/)) lex.add(s.trim());
  }
  for (const v of VERB_ENTRIES) {
    lex.add(v.dictionary);
    if (v.kanji) lex.add(v.kanji);
    for (const f of Object.values(v.forms)) lex.add(f);
    for (const cf of CHAIN_FORMS) lex.add(conjugateVerb(v.dictionary, v.group, cf));
  }
  for (const adj of ADJ_ENTRIES) {
    lex.add(adj.dictionary);
    if (adj.kanji) lex.add(adj.kanji);
    for (const f of Object.values(adj.forms)) lex.add(f);
  }
  // STEMS ARE REAL SURFACES TOO.
  //
  // The lexicon held only whole conjugated outputs, so any construction that
  // attaches to a STEM read as an invented mutation and the unbuildable gate
  // rejected the sentence. That has already cost two spine items — m12
  // deferred 〜く なる and m13 deferred 〜に いく, both for tooling reasons
  // rather than curriculum ones — and it would have blocked 〜ながら,
  // 〜やすい/にくい, 〜すぎる and 〜たがる later, which is most of N4's m36.
  //
  // A stem is not a standalone word, so this does loosen the invented-form
  // check slightly. That is the deliberate trade: the guard exists to catch
  // のみる/のむる, and a bare ます-stem is not that shape.
  for (const v of VERB_ENTRIES) {
    const masu = conjugateVerb(v.dictionary, v.group, "masu");
    if (masu.endsWith("ます")) lex.add(masu.slice(0, -2));
  }
  for (const adj of ADJ_ENTRIES) {
    if (adj.type !== "i-adj") continue;
    // いい is irregular in every stem it forms: よく, never いく (which is a
    // different verb entirely).
    if (adj.dictionary === "いい") lex.add("よく");
    else if (adj.dictionary.endsWith("い")) lex.add(`${adj.dictionary.slice(0, -1)}く`);
  }

  lex.delete("");
  realFormLexicon = lex;
  return lex;
}

let inventedForms: Set<string> | null = null;

/**
 * Known INVENTED-form shapes, generated from the verb registry: for every
 * verb, masu-stem + る (のみ→のみる) and dictionary + る (のむ→のむる) — the
 * two mutation classes that actually shipped (QA fix 5910e13 / defect #7),
 * minus anything that collides with a real lexicon surface (みる is real).
 * Unlike a lexicon-membership check, this blocklist applies to EVERY option
 * and tile bank (multi-tile sentence builds included — mutation-testing
 * showed のみる passed the single-answer-only real-form rule as a build
 * tile) with near-zero false-positive risk. Derivation drills (prompt cues
 * a conversion with the JA form quoted) stay exempt: wrong-derivation
 * non-words are their tested contrast.
 */
export function getInventedFormBlocklist(): Set<string> {
  if (inventedForms) return inventedForms;
  const lex = getRealFormLexicon();
  const bad = new Set<string>();
  for (const v of VERB_ENTRIES) {
    const masu = conjugateVerb(v.dictionary, v.group, "masu");
    if (masu.endsWith("ます")) bad.add(masu.slice(0, -2) + "る");
    bad.add(v.dictionary + "る");
  }
  for (const s of [...bad]) if (lex.has(s) || s.length < 3) bad.delete(s);
  inventedForms = bad;
  return bad;
}

const JA_CHARS = /[぀-ヿ一-鿿]/;
const JA_TOKEN = /[぀-ヿ一-鿿]+/g;

export type LintFailure = { lessonId: string; stepId: string; problem: string };

type ChoiceSet = { stepId: string; prompt: string; options: string[]; correct: string | undefined };

/** Normalize a step's answer options into { prompt, options, correct }. */
function choiceSets(step: LessonStep): ChoiceSet[] {
  switch (step.type) {
    case "multiple_choice":
      return [{
        stepId: step.id,
        prompt: step.prompt,
        options: step.options.map((o) => o.text),
        correct: step.options.find((o) => o.id === step.correctOptionId)?.text,
      }];
    case "listening_comprehension":
      return [{
        stepId: step.id,
        prompt: step.question,
        options: step.options.map((o) => o.text),
        correct: step.options.find((o) => o.id === step.correctOptionId)?.text,
      }];
    case "word_image_mcq":
      return [{
        stepId: step.id,
        prompt: step.meaningEn,
        options: step.options.map((o) => o.word),
        correct: step.options.find((o) => o.id === step.correctOptionId)?.word,
      }];
    case "kanji_reading":
      return [{
        stepId: step.id,
        prompt: step.kanji,
        options: step.options.map((o) => o.text),
        correct: step.options.find((o) => o.id === step.correctOptionId)?.text,
      }];
    case "self_explanation_mcq":
      return [{
        stepId: step.id,
        prompt: step.question,
        options: step.options.map((o) => o.text),
        correct: step.options.find((o) => o.id === step.correctOptionId)?.text,
      }];
    case "particle_cloze":
      return [{
        stepId: step.id,
        prompt: `${step.prompt.before} ___ ${step.prompt.after}`,
        options: step.options,
        correct: step.correctParticle,
      }];
    case "dialogue_listen":
      return step.questions.map((q) => ({
        stepId: `${step.id}#${q.id}`,
        prompt: q.prompt,
        options: q.options.map((o) => o.text),
        correct: q.options.find((o) => o.id === q.correctOptionId)?.text,
      }));
    default:
      return [];
  }
}

/**
 * GATE 5 — distractor quality on every choice-bearing step.
 *
 * Enforced (high-confidence subset of retrospective Gate 5):
 *   (a) options are non-empty and unique — kills duplicate distractors and
 *       distractor === correct (the correct answer is one of the options);
 *   (b) `correctOptionId` resolves to an option;
 *   (c) no shared identical trailing "(tag)" across ALL options — when every
 *       option carries the same parenthetical it discriminates nothing
 *       (the m29 "(plain)"-on-every-option defect, fix `81ce834`);
 *   (d) echo-back: no distractor equals a full Japanese token quoted in the
 *       prompt (the m29 のみます-echoed-back defect, fix `25b1f46`);
 *   (e) single-answer build/listening pickers: tiles unique, correct tile
 *       present — and for MEANING-CUED form pickers ("Pick the dictionary
 *       form of: to hurry" — English cue, no Japanese in the prompt) every
 *       tile must be a REAL form from the lexicon (atom registry +
 *       conjugation tables), the shape fix `5910e13` established:
 *       cross-verb real forms, never invented mutations.
 *
 * Deliberately NOT enforced (documented limitation):
 *   - DERIVATION pickers, where the prompt quotes the Japanese source form
 *     ("Convert のむ to て-form", "Which is the dictionary form of
 *     のみます?") legitimately offer wrong-derivation NON-words (のみて /
 *     のみる / のむる) — that IS the pedagogy, and QA fix `25b1f46`
 *     explicitly chose those shapes. Detecting a "trivially eliminable"
 *     wrong derivation needs register-level semantics (retrospective
 *     defect #6 territory) and stays manual.
 *   - The "not all distractors share the correct answer's lemma" heuristic
 *     (retrospective 5d) — fuzzy, skipped.
 */
export function lintMcqDistractors(lesson: LessonContent): LintFailure[] {
  const failures: LintFailure[] = [];
  const lex = getRealFormLexicon();
  const fail = (stepId: string, problem: string) =>
    failures.push({ lessonId: lesson.id, stepId, problem });

  for (const step of lesson.steps) {
    for (const cs of choiceSets(step)) {
      if (cs.options.some((o) => !o || !o.trim())) fail(cs.stepId, "empty option text");
      if (new Set(cs.options.map((o) => o.trim())).size !== cs.options.length) {
        fail(cs.stepId, `duplicate options: [${cs.options.join(" | ")}]`);
      }
      if (cs.correct === undefined) fail(cs.stepId, "correctOptionId resolves to no option");
      if (cs.options.length >= 2) {
        const tags = cs.options.map((o) => /\(([^)]*)\)\s*$/.exec(o.trim())?.[1]);
        if (tags.every((t) => t !== undefined) && new Set(tags).size === 1) {
          fail(cs.stepId, `every option carries the same trailing "(${tags[0]})" — tag discriminates nothing`);
        }
      }
      const promptTokens = new Set(cs.prompt.match(JA_TOKEN) ?? []);
      for (const o of cs.options) {
        if (o === cs.correct) continue;
        const w = o.trim().replace(/[。！？]$/, "");
        if (w.length >= 2 && promptTokens.has(w)) {
          fail(cs.stepId, `distractor "${o}" echoes a word quoted in the prompt`);
        }
      }
    }

    if (
      (step.type === "build_sentence" || step.type === "listening_build") &&
      step.correctOrder.length === 1
    ) {
      if (new Set(step.tiles).size !== step.tiles.length) {
        fail(step.id, `duplicate picker tiles: [${step.tiles.join(" | ")}]`);
      }
      if (!step.tiles.includes(step.correctOrder[0])) {
        fail(step.id, "correct tile missing from picker tiles");
      }
      const meaningCued = /\bform\b/i.test(step.prompt) && !JA_CHARS.test(step.prompt);
      if (meaningCued) {
        const invented = step.tiles.filter((t) => !lex.has(t.replace(/。$/, "")));
        if (invented.length > 0) {
          fail(
            step.id,
            `meaning-cued form picker offers invented forms [${invented.join(", ")}] — ` +
              "distractors must be real forms of registry verbs (QA fix 5910e13)",
          );
        }
      }
    }

    // (f) invented-form blocklist — EVERY option and tile bank, including
    // multi-tile sentence builds the single-answer rule above can't see
    // (mutation-testing showed のみる passing as a build tile). Derivation
    // drills (JA source form quoted in a conversion prompt) stay exempt.
    {
      const bad = getInventedFormBlocklist();
      const prompt =
        "prompt" in step && typeof step.prompt === "string"
          ? step.prompt
          : "prompt" in step && step.prompt && typeof step.prompt === "object"
            ? Object.values(step.prompt).join(" ")
            : "";
      // conjugation_cloze is a derivation drill BY TYPE: its options are
      // engine-generated wrong-derivation shapes (generateFormationDistractors
      // via the conjugationCloze factory), so non-words are its tested
      // contrast — exempt explicitly rather than relying on the prompt-shape
      // heuristic (its prompt is a sentence frame, not a "convert X" cue).
      const derivationCued =
        step.type === "conjugation_cloze" ||
        (/\b(convert|form)\b/i.test(prompt) && JA_CHARS.test(prompt));
      if (!derivationCued) {
        const surfaces: string[] = [];
        if ("tiles" in step && Array.isArray(step.tiles)) surfaces.push(...step.tiles);
        if ("options" in step && Array.isArray(step.options)) {
          for (const o of step.options) {
            const t = typeof o === "string" ? o : (o as { text?: unknown }).text;
            if (typeof t === "string") surfaces.push(t);
          }
        }
        for (const s of surfaces) {
          if (typeof s !== "string") continue;
          if (bad.has(s.replace(/[。、]/g, "").trim())) {
            fail(
              ("id" in step ? (step.id as string) : lesson.id),
              `invented verb form "${s}" offered outside a derivation drill ` +
                "(masu-stem+る / dict+る mutation — QA fix 5910e13 class)",
            );
          }
        }
      }
    }
  }
  return failures;
}

// ───────────────────────────────────────────────────────────────────────
// GATE 6 — grammarRule antiPattern minimal-pair lint
// ───────────────────────────────────────────────────────────────────────

/**
 * Pre-Gate-6 grammar rules whose antiPattern is a FULL SENTENCE but not a
 * minimal pair of examples[0].ja (a different sentence illustrating the
 * error). The derived spot-the-mistake step still functions for these —
 * both options are complete sentences — it just discriminates less sharply
 * than a true minimal pair. Grandfathered as-shipped, SHRINK-ONLY: fix one,
 * remove it here; never add to this list (author a minimal pair instead —
 * m26/m27/m29 show the required shape).
 */
const ANTIPATTERN_MINIMAL_PAIR_GRANDFATHERED = new Set<string>([
  "ja-m6-3-1-rule-de",
  "ja-m8-rule-i-adj",
  "ja-m8-rule-to",
  "ja-m8-rule-kochira",
  "ja-m12-rule-clock-hours",
  "ja-m12-rule-minutes",
  "ja-m13-rule-frequency",
  "ja-m16-rule-te-wa-ikemasen",
  "ja-m19-rule-family-register",
  "ja-m19-rule-sai-counter",
  "ja-m20-rule-node",
  "ja-m20-rule-node-vs-kara",
  "ja-m22-rule-naka-de-ichiban",
  "ja-m24-rule-kai-counter",
  "ja-m26-rule-n-desu",
]);

/** Share of `a`'s characters present in `b` (multiset), over the longer
 *  length; whitespace/punctuation stripped. 1.0 = anagram-identical. */
export function charOverlapRatio(a: string, b: string): number {
  const norm = (s: string) => s.replace(/[\s、。！？?!]/g, "");
  const na = norm(a);
  const nb = norm(b);
  const counts = new Map<string, number>();
  for (const c of nb) counts.set(c, (counts.get(c) ?? 0) + 1);
  let shared = 0;
  for (const c of na) {
    const n = counts.get(c) ?? 0;
    if (n > 0) {
      shared++;
      counts.set(c, n - 1);
    }
  }
  return shared / Math.max(na.length, nb.length, 1);
}

/**
 * GATE 6 — every grammar_rule antiPattern must form a full-sentence minimal
 * pair with examples[0].ja, because `deriveGrammarMicroSteps` pairs exactly
 * those two strings in the auto-injected "one of these is wrong" spot step.
 * A bare fragment (のみる) against a full sentence is a giveaway that tests
 * nothing (m29 defect #8, fix `ded0850`).
 *
 * Enforced, for rules whose examples[0].ja is sentence-cued (ends 。！？):
 *   (a) antiPattern.ja is itself a complete sentence (ends 。！？ or か);
 *   (b) antiPattern.ja shares ≥50% of its characters with examples[0].ja
 *       (calibrated: every m29 minimal pair scores ≥0.55; a bare fragment
 *       scores ≤0.2; the borderline legitimate pairs in m4/m5/m11/m23 sit
 *       at exactly 0.50).
 *
 * Word-format and conversion-format rules (examples[0].ja is "かう → かって"
 * or a bare word — no sentence-final punctuation) are exempt: their
 * antiPatterns are word-level minimal pairs by design.
 */
export function lintAntiPatternMinimalPairs(lesson: LessonContent): LintFailure[] {
  const failures: LintFailure[] = [];
  for (const step of lesson.steps) {
    if (step.type !== "grammar_rule" || !step.antiPattern) continue;
    if (ANTIPATTERN_MINIMAL_PAIR_GRANDFATHERED.has(step.id)) continue;
    const ex = step.examples[0]?.ja?.trim() ?? "";
    if (!/[。！？?!]$/.test(ex)) continue; // word/conversion-format rule
    const ap = step.antiPattern.ja.trim();
    if (!/[。！？?!か]$/.test(ap)) {
      failures.push({
        lessonId: lesson.id,
        stepId: step.id,
        problem: `antiPattern.ja "${ap}" is not a complete sentence (examples[0] is: "${ex}")`,
      });
      continue;
    }
    const ratio = charOverlapRatio(ap, ex);
    if (ratio < 0.5) {
      failures.push({
        lessonId: lesson.id,
        stepId: step.id,
        problem:
          `antiPattern.ja "${ap}" is not a minimal pair of examples[0].ja "${ex}" ` +
          `(char overlap ${ratio.toFixed(2)} < 0.50)`,
      });
    }
  }
  return failures;
}

// ───────────────────────────────────────────────────────────────────────
// GATE 7 — sentence-complexity ratchet (m12+)
// ───────────────────────────────────────────────────────────────────────

/**
 * Minimum share of the module's production-sentence pool (speaking targets,
 * listening_build targets, build_sentence targets — review-tail "-rev" and
 * coverage-backfill "-cov-" steps excluded) that must be multi-clause or
 * extended. RATCHET values: calibrated 2026-07-17 to ~1-2 sentences below
 * each module's CURRENT share, so today's content passes and any slide back
 * toward bare object-を-verb texture (m29 defect #7, fix `61877eb`) fails.
 * Raise a floor when a module's sentences are enriched; NEVER lower one.
 *
 * Measured shares at calibration:
 *   m12 .13  m13 .63  m14 .17  m15 .39  m16 .63  m17 .62  m18 .60  m19 .51
 *   m20 .55  m21 .42  m22 .58  m23 .46  m24 .60  m25 .73  m26 .66  m27 .63
 *   m29 .41
 * (m12/m14 are legitimately drill-heavy — clock-time and て-form conversion
 * pickers dominate their pools — hence the low floors.)
 */
// m14 RECALIBRATED 2026-07-27: the 0.15 floor was measured on the OLD m14
// (te-form conversion pickers, now archived). The neo module — spine tile
// n06b — measures 71/90 = .789, because ている sentences carry a time word
// plus a place phrase and L9 builds two-clause て-links. Floor set three
// sentences below that measurement, per this block's own rule.
// m16 RECALIBRATED 2026-07-27: the 0.63 floor was measured on the OLD m16
// (てもいい / てはいけません pickers, now archived). The neo module — spine tile
// s13 — measures 77/87 = .885, because から / ので / けど ARE three of the
// connectives `isComplexSentence` counts: a reason clause plus a result clause
// is two clauses by construction. Floor set three sentences below that
// measurement, per this block's own rule.
// m15 RECALIBRATED 2026-07-27: the 0.39 floor was measured on the OLD m15
// (たい/ほしい + てもいい pickers, now archived). The neo module — spine tile
// s11 — measures 77/88 = .875, because a relative clause IS a second clause:
// every 〜 ひと / 〜 とき / 〜 まえに / 〜てから beat is two clauses by
// construction. Floor set three sentences below that measurement, per this
// block's own rule.
// m17 RECALIBRATED 2026-07-27: the 0.60 floor was measured on the OLD m17
// (transportation & directions, now archived). The neo module — spine tile
// n07 — measures 71/90 = .789. Family talk is naturally flat ("my father is a
// teacher"), which is exactly the texture this gate exists to stop, so nearly
// every production sentence carries a second clause on m16's から / ので / けど
// — which is also how people actually talk about their families. Floor set
// three sentences below that measurement, per this block's own rule.
// m19 RECALIBRATED 2026-07-27: the 0.51 floor was measured on the OLD m19
// (people and family vocabulary, now archived). The neo module — spine tile
// s15 — measures 71/86 = .826, because a journey sentence carries a means
// phrase plus a destination plus a time by construction, and most beats hang a
// second clause on m16's から / けど. Floor set three sentences below that
// measurement, per this block's own rule.
// m20 RECALIBRATED 2026-07-27: the 0.53 floor was measured on the OLD m20
// (body and health vocabulary, now archived). The neo module — spine tile
// n09 — measures 69/87 = .793, because a comparison sentence names TWO things
// plus a predicate by construction and most beats hang a second clause on
// m16's から / けど ("cheaper, so I'll buy it"). Floor set three sentences
// below that measurement, per this block's own rule.
export const COMPLEXITY_FLOORS: Record<string, number> = {
  m12: 0.12, m13: 0.60, m14: 0.75, m15: 0.84, m16: 0.85, m17: 0.75,
  // m21 recalibrated 0.40 → 0.70 (2026-07-27). The old value was measured on
  // the ARCHIVED old-course m21 (the rendaku counter table); the neo module
  // measures 64/88 = .727, because a list names two things plus a predicate by
  // construction and most beats hang a clause on m16's から / けど. Raised,
  // never lowered, per this block's own rule.
  // m22 recalibrated 0.56 → 0.86 (2026-07-27). The old value was measured on
  // the ARCHIVED old-course m22 (なかで…いちばん comparisons); the neo module —
  // spine tile s17 — measures 77/86 = .895. A symptom sentence is three tiles
  // long by construction, which is exactly the flat texture this gate exists to
  // stop, so nearly every production beat hangs a reason clause on m16's から /
  // けど — which is also how a symptom is actually spoken, because you say what
  // hurts in order to say what you will do about it. Floor set three sentences
  // below the measurement, per this block's own rule. Raised, never lowered.
  // m23 recalibrated 0.44 → 0.90 (2026-07-27). The old value was measured on
  // the ARCHIVED old-course m23 (the potential-form drills); the neo module —
  // spine tile s22 — measures 78/83 = .940, the highest in the course, and it
  // is structural rather than decorative: 「〜た ことが ある」 is already a
  // subordinate clause before anything is said about it, and the module's
  // second half is ABOUT stacking clauses (とき, てから/まえに, と おもう). Floor
  // set three sentences below the measurement. Raised, never lowered.
  // m24 recalibrated 0.58 → 0.80 (2026-07-27). The old value was measured on
  // the ARCHIVED old-course m24; the neo module — spine tile s21 — measures
  // 76/91 = .835. A bare ability sentence is three tiles long (「おさけが
  // のめる」), which is exactly the flat texture this gate exists to stop, so
  // nearly every production beat hangs a reason or contrast clause on m16's
  // から / けど — which is also how ability is actually spoken, because you say
  // what you can do in order to say what you will do about it. Floor set three
  // sentences below the measurement. Raised, never lowered.
  // m25 recalibrated 0.71 -> 0.76 (2026-07-27). The old value was measured on
  // the ARCHIVED old-course m25; the neo module -- spine tile n13 -- measures
  // 71/89 = .798. A bare conjecture is three tiles long ("あめでしょう"), which
  // is exactly the flat texture this gate exists to stop and is all a weather
  // module will produce if left alone, so nearly every production beat carries
  // a contrast or a reason on m16's けど / から -- which is also how a forecast
  // is actually spoken, because you say what the morning will do in order to
  // say what the evening will do. Floor set three sentences below the
  // measurement. Raised, never lowered.
  // m26 recalibrated 0.63 -> 0.89 (2026-07-27). The old value was measured on
  // the ARCHIVED old-course m26 (a "problems" module) — the THIRD floor in a
  // row to have been measured on archived content, after m22 and m25. The neo
  // module -- spine tile n14 -- measures 80/86 = .930, the highest in the
  // course, and it is structural rather than decorative: a superlative names a
  // SET, a winner and a predicate before any connective is added
  // ("たべものの なかで すしが いちばん おいしい" is eight tiles on its own), and
  // most beats then hang a reason or a concession on m16's から / けど, which
  // is also how a preference is actually stated. Floor set three sentences
  // below the measurement, per this block's own rule. Raised, never lowered.
  // m27 recalibrated 0.60 -> 0.71 (2026-07-27). The old value was measured on
  // the ARCHIVED old-course m27 — the FOURTH floor in a row to have been
  // measured on archived content, after m22, m25 and m26. The neo module —
  // spine tile s23 — measures 66/88 = .750. It sits BELOW its neighbours on
  // purpose: this module's headline sentences are deliberately short, because
  // んだ's whole claim is that it attaches to the plain sentence you would
  // have said anyway (「ねつが あるんだ」 is four tiles and is the module's
  // thesis), and 「たかすぎる」 is a complete utterance in three. The ramp is
  // carried by the beats that hang a reason or a concession on m16's から /
  // けど — which is also how an explanation is actually spoken, since a reason
  // plus a consequence is two clauses by construction. Floor set three
  // sentences below the measurement ((66-3)/88 = .716), per this block's own
  // rule. Raised, never lowered.
  // m28 is the FIRST measurement in this block rather than a recalibration:
  // the ARCHIVED course had no m28 at all (its numbering ran m27→m29), so
  // there was no bogus archived value to inherit — the first time that has
  // been true since m21. Measured on the finished neo module — spine tile s24
  // — at 78/84 = .929, the joint-highest in the course with m26, and it is
  // structural rather than decorative: an obligation is a REASON plus a duty
  // by construction ("おかねが ないから まいにち はたらかなきゃ") and advice is
  // a SITUATION plus a recommendation ("ねつが あるから くすりを のんだ ほうが
  // いい"), so nearly every production beat carries a から / けど / まえに on
  // m15/m16's machinery — which is also how both are actually spoken. Floor
  // set three sentences below the measurement ((78-3)/84 = .893).
  // m29 recalibrated 0.39 -> 0.65 (2026-07-27), the SIXTH archived-course
  // value in this block to need raising after m22, m25, m26, m27 and m19. The
  // 0.39 was measured on an ARCHIVED m29 that was a different module entirely
  // — the N4 "plain form" pilot, whose lessons the spine renumber absorbed
  // into N5's core tiles. The neo module — spine tile s25, the N5 capstone —
  // measures 65/94 = .692. It sits BELOW its neighbours on purpose and the
  // reason is the module's thesis: register is carried by the LAST word, so
  // its headline sentences are deliberately short (「ばんは ちょっと。」 is the
  // whole refusal, in three tiles, and 「かぜが つよいね。」 is the whole ね
  // lesson in four). The ramp is carried by the beats that hang a reason or a
  // concession on m15/m16's から / けど / まえに — which is also how register is
  // actually spoken, because you soften a refusal by giving it a reason. Floor
  // set three sentences below the measurement ((65-3)/94 = .660). Raised,
  // never lowered.
  m18: 0.57, m19: 0.80, m20: 0.76, m21: 0.70, m22: 0.86, m23: 0.90,
  m24: 0.80, m25: 0.76, m26: 0.89, m27: 0.71, m28: 0.89, m29: 0.65,
  // m30: measured 44/103 = 0.427 at stage-2 authoring completion
  // (2026-07-17). Floor set ~1.5 sentences below that measurement.
  m30: 0.41,
};

const CONNECTIVES = /(から|ので|けど|たら|とき|まえに|あとで|ながら)/;

/** Multi-clause or extended: ≥12 chars (whitespace/punct stripped), a
 *  connective particle, or a て/で clause link. */
export function isComplexSentence(s: string): boolean {
  const stripped = s.replace(/[\s、。]/g, "");
  if (stripped.length >= 12) return true;
  if (CONNECTIVES.test(s)) return true;
  if (/[てで][、 ]/.test(s)) return true;
  return false;
}

export function productionPool(moduleId: string): string[] {
  const pool: string[] = [];
  for (const l of getJaModuleLessons(moduleId)) {
    for (const s of l.steps) {
      if (s.id.includes("-rev") || s.id.includes("-cov-")) continue;
      if (s.type === "speaking") pool.push(s.targetPhrase);
      else if (s.type === "listening_build") pool.push(s.targetSentence);
      else if (s.type === "build_sentence") pool.push(s.targetSentence);
    }
  }
  return pool;
}

export function complexityShare(moduleId: string): { pool: number; complex: number; share: number } {
  const pool = productionPool(moduleId);
  const complex = pool.filter(isComplexSentence).length;
  return { pool: pool.length, complex, share: pool.length ? complex / pool.length : 0 };
}

// ───────────────────────────────────────────────────────────────────────
// GATE 8 — plain-non-past progressive-gloss lint (Spencer QA 2026-07-17)
// ───────────────────────────────────────────────────────────────────────

/**
 * Explicit future-time anchors that license an English futurate progressive
 * on a plain non-past JA verb ("あした くる？" → "Are you coming tomorrow?").
 */
const GATE8_FUTURE_ANCHOR =
  /(あした|あす|あさって|らいしゅう|らいげつ|らいねん|こんど|しゅうまつ|こんばん|のちほど)/;

/**
 * Motion/futurate verbs whose unanchored plain non-past still reads as a
 * natural English futurate progressive ("いく？" → "(Are you) going?",
 * "きますか" → "Are you coming?") per the retrospective's DO-NOT-FLAG rule.
 * Compounds (かえってくる, でかけていく, etc.) share the same stems, so a
 * substring match on the bare stems is sufficient and deliberately broad.
 *
 * くる's NEGATIVE stem is the one case a substring rule cannot reach: こない
 * and こなかった share no characters with くる, so 「こないと おもう」 → "I don't
 * think he's coming" — the natural English for a negated motion futurate, and
 * exactly what invariant 17 licenses — was flagged as a wrong-aspect gloss
 * (m18, 2026-07-27). いかない/かえらない need no entry: they contain their
 * stems already.
 */
const GATE8_MOTION_FUTURATE_ALLOWLIST =
  /(いく|ゆく|くる|かえる|でかける|もどる|こない|こなかった)/;

/**
 * Any ている/てる/でいる ongoing-aspect marking — plain AND polite forms
 * (のんでいます/かっています, casual contractions てます/でます included) —
 * genuinely ongoing aspect, English progressive is correct.
 */
const GATE8_ONGOING_ASPECT = /(ている|てる|でいる|ています|でいます|てます|でます)/;

const GATE8_PROGRESSIVE_EN = /\b(am|are|is)\s+\w+ing\b/i;

/**
 * A pure copula predicate (sentence-final です, no ます anywhere) has no verb
 * at all to carry aspect — it's either an i-adjective+です ("つまらないです" =
 * "is boring": boring is an ADJECTIVE, not a progressive verb) or a
 * noun-as-hobby predicate ("しゅみは つりです" = "my hobby is fishing": fishing
 * is a gerund-NOUN naming the hobby, not "I am fishing right now"). Both
 * shapes false-positive against the bare `/is \w+ing/` regex — a real GATE 8
 * defect always has a conjugated verb (plain non-past or ます-form), so
 * excluding pure です copulas costs no real coverage.
 */
const GATE8_PURE_COPULA = /です[。！？]?$/;

/**
 * Step ids that trip the GATE 8 heuristic but are judged CORRECT on manual
 * review — every entry must carry a one-line justification. Keep this list
 * as small as honestly possible; the lint is scoped to `listening_comprehension`
 * steps only (the `listeningCompSentence()` factory output) because that is
 * the surface where JA transcript + English gloss are both cleanly available
 * on the step — other step types (build prompts, grammarRule examples) were
 * audited by hand per the 2026-07-17 sweep instead of by this lint.
 */
export const GATE8_PROGRESSIVE_GLOSS_ALLOWLIST: Record<string, string> = {
  "ja-m27-6-1-lc-1":
    "しけんが ちかくなりました (past-tense change-of-state なる, 'has gotten close') " +
    "glossed 'is getting close' — a resultative change-of-state reading, idiomatic " +
    "and correct English for a なりました result, not a mis-primed progressive.",
};

/**
 * GATE 8 — a `listening_comprehension` step whose JA transcript is plain
 * non-past (no 〜ている/〜てる/〜でいる ongoing-aspect marking), has no
 * future-time anchor, and is not a motion/futurate verb, must not be glossed
 * with an English present-progressive ("Are you studying?") on
 * `correctMeaningEn` — that primes learners to expect 〜ている. This is
 * Spencer's live QA catch: にほんごを べんきょうする？ was glossed "Are you
 * studying Japanese?" instead of the correct habitual/intent reading
 * ("You study Japanese?" / "Do you study Japanese?").
 *
 * Deliberately scoped to `listening_comprehension` — the one step type where
 * JA source and English gloss are both plain, unambiguous string fields on
 * the step. Other surfaces (build() prompts, grammarRule examples,
 * antiPattern.en, speaking translations) were reviewed by hand in the
 * 2026-07-17 sweep; teaching this lint their JSON shapes reliably was judged
 * not worth the false-positive risk (documented limitation per the task).
 */
export function lintPlainNonPastProgressiveGloss(lesson: LessonContent): LintFailure[] {
  const failures: LintFailure[] = [];
  for (const step of lesson.steps) {
    if (step.type !== "listening_comprehension") continue;
    const ja = step.transcript ?? "";
    if (!ja) continue;
    if (GATE8_ONGOING_ASPECT.test(ja)) continue;
    if (GATE8_FUTURE_ANCHOR.test(ja)) continue;
    if (GATE8_MOTION_FUTURATE_ALLOWLIST.test(ja)) continue;
    if (GATE8_PURE_COPULA.test(ja) && !ja.includes("ます")) continue;
    if (GATE8_PROGRESSIVE_GLOSS_ALLOWLIST[step.id]) continue;
    const correct = step.options.find((o) => o.id === step.correctOptionId)?.text ?? "";
    if (!correct) continue;
    if (GATE8_PROGRESSIVE_EN.test(correct)) {
      failures.push({
        lessonId: lesson.id,
        stepId: step.id,
        problem:
          `JA "${ja}" is plain non-past with no ている/future-anchor/motion-futurate ` +
          `licensing, but correctMeaningEn "${correct}" uses an English progressive — ` +
          "gloss primes the wrong JA aspect (Spencer QA 2026-07-17)",
      });
    }
  }
  return failures;
}

// ───────────────────────────────────────────────────────────────────────
// The shared per-module registration
// ───────────────────────────────────────────────────────────────────────

const fmt = (failures: LintFailure[]) =>
  failures.map((f) => `${f.lessonId}/${f.stepId}: ${f.problem}`).join("\n  ");

/**
 * Register the shared content-lint suite for one JA module. Call once at the
 * top of `curriculum/mN.test.ts`, then add module-specific assertions.
 */
export function registerJaModuleContentLints(moduleId: string): void {
  describe(`JA ${moduleId} shared content lints (Gate 2)`, () => {
    const lessons = getJaModuleLessons(moduleId);

    it("ships authored lesson content", () => {
      expect(lessons.length, `no authored JA lessons tagged ${moduleId}`).toBeGreaterThan(0);
    });

    it("every pathway node resolves — to lesson content, or to a real destination", () => {
      // Most rows are lessons and must compile to steps. A few ROUTE OUT
      // instead (kana learner, conjugation trainer) and legitimately have no
      // lesson content — but "has no content" is then the wrong question, and
      // exempting them would leave a dead node undetectable. Ask each row the
      // question its own kind answers: a lesson needs steps, a routed node
      // needs a destination that exists.
      const course = getMockCourse("ja");
      const mod = course.modules.find((m) => m.id === moduleId);
      expect(mod, `course mock has no module ${moduleId}`).toBeDefined();
      for (const lesson of mod!.lessons) {
        const route = lessonRoutePath(lesson);
        if (route.startsWith("learn/lessons/")) {
          const content = getMockLessonContent(lesson.id);
          expect(content, `${moduleId} pathway node '${lesson.id}' has no content`).not.toBeNull();
          expect(content?.steps.length ?? 0, `${lesson.id} is empty`).toBeGreaterThan(0);
          continue;
        }
        if (lesson.kind === "trainer") {
          const tiles = lesson.trainerTypeIds ?? [];
          expect(tiles.length, `${lesson.id} is a trainer node with no tiles`).toBeGreaterThan(0);
          for (const tile of tiles) {
            expect(
              getTrainerType(tile as never),
              `${lesson.id} selects unknown trainer tile '${tile}'`,
            ).toBeDefined();
          }
          // A drill the learner cannot be graded on is a dead end: the node
          // gates the module, so an "ahead" selection would demand a session
          // that writes nothing. The module number IS the learner's reached
          // module at the point this node sits.
          const reached = parseInt(moduleId.slice(1), 10);
          expect(
            isSelectionAhead(tiles as never, reached),
            `${lesson.id} drills tiles not yet unlocked at ${moduleId} — the session would be practice-only and grade nothing`,
          ).toBe(false);

          // AND EVERY FORM THE SESSION CAN EMIT MUST BE TAUGHT BY NOW.
          //
          // Tile unlock is not enough, because tiles COMBINE. m13's node
          // selected v-tai + nai-form + ta-form to reach the four たい cells;
          // every tile was unlocked, and the combination silently also
          // unlocked ta+nai → なかった, the plain past negative, which is not
          // taught until m16. A simulated learner hit it as a wall: a
          // mandatory gate on a form no card had ever stated. The selection
          // is now checked by what it PRODUCES, not by what it selects.
          const emitted =
            tiles.length === 1
              ? buildTrainerSession(getTrainerType(tiles[0] as never)!, reached)
              : buildCombinedSession(tiles as never, reached, { combos: "on" });
          expect(emitted.length, `${lesson.id} builds no questions`).toBeGreaterThan(0);
          for (const form of new Set(emitted.map((q) => q.form))) {
            const taughtAt = FORM_TAUGHT_AT[form];
            expect(taughtAt, `${lesson.id} drills unknown form '${form}'`).toBeDefined();
            expect(
              taughtAt!,
              `${lesson.id} drills '${form}' but the course does not teach it until m${taughtAt} — the node is mandatory, so this is a wall`,
            ).toBeLessThanOrEqual(reached);
          }
          continue;
        }
        expect(
          lesson.kind === "alphabet" && !!lesson.alphabetId,
          `${lesson.id} routes out of the lesson player with no destination`,
        ).toBe(true);
      }
    });

    it("lesson ids are unique and tagged ja / mock-1", () => {
      expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
      expect(lessons.every((l) => l.languageId === "ja")).toBe(true);
      expect(lessons.every((l) => l.courseId === "mock-1")).toBe(true);
    });

    it("every step id within a lesson is unique", () => {
      for (const lesson of lessons) {
        const ids = lesson.steps.map((s) => s.id);
        expect(new Set(ids).size, `dup step id in ${lesson.id}`).toBe(ids.length);
      }
    });

    it("passes the passive-card follow-up lint (i+2/i+3 spacing)", () => {
      for (const lesson of lessons) {
        const { failures } = checkPassiveCardFollowup(lesson.steps);
        expect(
          failures,
          `${lesson.id}: ${failures.map((f) => `${f.stepId} (${f.reason})`).join("; ")}`,
        ).toEqual([]);
      }
    });

    it("has no explanation on passive steps and no answer leaks", () => {
      for (const lesson of lessons) {
        expect(() => assertNoExplanationOnPassive(lesson.steps)).not.toThrow();
        expect(() => assertExplanationDoesntLeakAnswer(lesson.steps)).not.toThrow();
      }
    });

    it("GATE 5 — MCQ distractor quality", () => {
      const failures = lessons.flatMap((l) => lintMcqDistractors(l));
      expect(failures, `distractor lint failures:\n  ${fmt(failures)}`).toEqual([]);
    });

    it("GATE 6 — grammarRule antiPatterns are full-sentence minimal pairs", () => {
      const failures = lessons.flatMap((l) => lintAntiPatternMinimalPairs(l));
      expect(failures, `antiPattern lint failures:\n  ${fmt(failures)}`).toEqual([]);
    });

    it("GATE 8 — plain non-past verbs aren't glossed with an English progressive", () => {
      const failures = lessons.flatMap((l) => lintPlainNonPastProgressiveGloss(l));
      expect(failures, `progressive-gloss lint failures:\n  ${fmt(failures)}`).toEqual([]);
    });

    if (COMPLEXITY_FLOORS[moduleId] !== undefined) {
      it("GATE 7 — sentence-complexity ratchet holds", () => {
        const floor = COMPLEXITY_FLOORS[moduleId];
        const { pool, complex, share } = complexityShare(moduleId);
        expect(pool, `${moduleId} has an empty production pool`).toBeGreaterThan(0);
        expect(
          share,
          `${moduleId} production-sentence complexity regressed: ` +
            `${complex}/${pool} = ${share.toFixed(3)} < floor ${floor} — ` +
            "new sentences are flatter than the module's shipped texture (guide §4g)",
        ).toBeGreaterThanOrEqual(floor);
      });
    }
  });
}
