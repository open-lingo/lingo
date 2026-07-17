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
      const derivationCued =
        /\b(convert|form)\b/i.test(prompt) && JA_CHARS.test(prompt);
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
export const COMPLEXITY_FLOORS: Record<string, number> = {
  m12: 0.12, m13: 0.60, m14: 0.15, m15: 0.37, m16: 0.60, m17: 0.60,
  m18: 0.57, m19: 0.49, m20: 0.53, m21: 0.40, m22: 0.56, m23: 0.44,
  m24: 0.58, m25: 0.71, m26: 0.63, m27: 0.60, m29: 0.39,
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

    it("every pathway node resolves to non-empty lesson content", () => {
      const course = getMockCourse("ja");
      const mod = course.modules.find((m) => m.id === moduleId);
      expect(mod, `course mock has no module ${moduleId}`).toBeDefined();
      for (const lesson of mod!.lessons) {
        const content = getMockLessonContent(lesson.id);
        expect(content, `${moduleId} pathway node '${lesson.id}' has no content`).not.toBeNull();
        expect(content?.steps.length ?? 0, `${lesson.id} is empty`).toBeGreaterThan(0);
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
