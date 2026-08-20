/**
 * ES prompt-comprehensibility instrument + ratchet.
 *
 * The 2026-07-16 rewrite's de-leak rule ("make the learner read Spanish to
 * choose") pushed MCQ prompts into Spanish with no comprehensibility bound —
 * es-m2-2 asks "Diego pregunta '¿quién eres?' Ana se señala a sí misma" at
 * module 2, where none of pregunta/señala/misma is taught. JA machine-enforces
 * "would they know this word yet" (grammarReviewPools comprehensibility gate);
 * this is the ES twin for LEARNER-FACING SPANISH PROMPT PROSE.
 * Walk + rationale: docs/es-authoring-scope-2026-08-09.md §1b finding 2.
 *
 * Model (deliberately blunt, stable, and inflation-tolerant — this is a
 * ratchet + worklist generator, not a precision linter):
 *   known(lesson) = atom surfaces with fromModule ≤ lesson's module
 *                   (each word of multi-word surfaces too)
 *                 + closed-class function words (allowlist below)
 *                 + the course cast's proper names.
 *   A prompt counts as Spanish when it carries Spanish orthography (¿¡, ñ,
 *   accented vowels) or ≥3 Spanish function-word tokens.
 *   Every alphabetic token of a Spanish prompt not in known(lesson) is one
 *   unit of debt. Conjugated forms of taught verbs DO inflate this (dice ←
 *   decir) — acceptable: the number only has to be comparable to itself.
 *
 * RATCHET: MAX_UNKNOWN_TOKEN_OCCURRENCES pins today's debt. The Phase 1
 * prompt de-escalation pass (scope doc) lowers it module by module — never
 * raise it for new content; write early-module prompts from taught words.
 *
 * Worklist: EMIT_ES_COMPREHENSIBILITY_REPORT=1 dumps per-lesson unknown
 * tokens (worst-first) to /tmp/es-prompt-comprehensibility.json.
 */
import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { ES_ALL_LESSONS } from "../curriculum";
import { getEsCourseAtoms } from "../courseAtoms";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import type { LessonStep } from "@/features/lesson/types";

// Measured 2026-08-18, m19 wave (worst offenders unchanged: m9-4 31, m2-8 20,
// m2-2 17, m8-3 17; m1–m6 still carry the bulk). Down from 470, and the drop is
// NOT a de-escalation pass — it is the instrument getting more honest: the
// hand-written MODULE_ORDER above is now derived, so m18/m19 are credited with
// their own atoms instead of being billed for every Spanish word they teach.
// The Phase 1 de-escalation pass lowers this module by module.
const MAX_UNKNOWN_TOKEN_OCCURRENCES = 467;

/**
 * DERIVED, not restated. This list was written out by hand and stopped at m17,
 * so `atomWordsByModule.get("m18")` and `.get("m19")` were both `undefined` and
 * `known` fell back to the empty set — meaning every Spanish token in those two
 * modules' prompts was billed as untaught, including words the modules
 * themselves teach. The instrument was measuring its own staleness.
 *
 * Same defect class as the hardcoded `/^m(1[0-6]|[1-9])$/` in
 * moduleConformance, and the same fix: there is one module order, it lives in
 * grammarHelpers, and a new module must not require remembering this file.
 */
const MODULE_ORDER: readonly string[] = ES_MODULE_ORDER;

/** Closed-class Spanish function words + copulas/hay a learner meets in m1–m2
 *  chrome. Deliberately NO content verbs/nouns — those are the debt. */
const FUNCTION_WORDS = new Set(
  (
    "el la los las un una unos unas lo al del " +
    "yo tú tu usted él ella ellos ellas nosotros nosotras vosotros ustedes " +
    "me te se le les nos os mi mis su sus nuestro nuestra " +
    "de a en con por para sin sobre entre desde hasta " +
    "y e o u pero que si no sí ni como más menos muy también solo " +
    "qué quién quiénes cuál cuáles cómo dónde cuándo cuánto cuánta cuántos cuántas " +
    "es son está están soy eres hay ser estar " +
    "este esta esto ese esa eso aquí allí"
  ).split(/\s+/),
);

/** Course cast + common Spanish given names used in carriers. */
const PROPER_NAMES = new Set([
  "ana", "diego", "carlos", "maría", "maria", "sofía", "sofia", "luis",
  "elena", "pedro", "juan", "rosa", "miguel", "carmen", "lupita", "jorge",
  "méxico", "mexico", "españa", "espana", "colombia", "perú", "peru",
]);

/** English tokens that appear in bilingual prompts ("'reunión' — the meeting.
 *  Pick the form that fits"). They are prompt chrome, not Spanish debt — skip
 *  them so the ratchet measures untaught SPANISH. Residual English content
 *  words still leak through; acceptable, the metric only competes with
 *  itself. */
const ENGLISH_STOPWORDS = new Set(
  (
    "the a an and or but not is are was were be been do does did what which " +
    "who whom whose when where why how this that these those it its they them " +
    "their there here you your yours he she his her we our us i my mine me " +
    "to of in on at by for with from into about as if then than so because " +
    "pick choose select say says said ask asks asked answer answers reply " +
    "means meaning form forms word words phrase phrases sentence fits fit " +
    "natural correct right wrong one two just only also very want wants " +
    "wanted did give gives gave reason stranger friend someone person day " +
    "tomorrow today meeting each other another new old first time " +
    // Grammar metalanguage. The list already carries form/forms/word/sentence
    // for the same reason: a bilingual prompt like "Pick the él/ella preterite
    // of hablar" is classified Spanish (it has an accent in it) and then bills
    // its English grammar term as untaught SPANISH. That is the instrument
    // mis-reading its own input, not debt — so the terms join the chrome list
    // and MAX_UNKNOWN_TOKEN_OCCURRENCES does not move.
    "preterite present past tense verb verbs ending endings subject stem " +
    // m19's turn: "Pick the él/ella imperfect of escribir" is classified
    // Spanish by the accent in «él/ella» and then bills the English word
    // "imperfect" as untaught Spanish, exactly as "preterite" did for m17.
    "imperfect imperfective aspect habit habitual occasion marker"
  ).split(/\s+/),
);

const SPANISH_MARK = /[¿¡ñáéíóúü]/i;

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-záéíóúñü\s'-]/gi, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function looksSpanish(prompt: string): boolean {
  if (SPANISH_MARK.test(prompt)) return true;
  const fn = tokens(prompt).filter((t) => FUNCTION_WORDS.has(t)).length;
  return fn >= 3;
}

// known surfaces per module prefix, cumulative
const atomWordsByModule = new Map<string, Set<string>>();
{
  const cumulative = new Set<string>();
  const atoms = getEsCourseAtoms();
  for (const m of MODULE_ORDER) {
    for (const a of atoms) {
      if (a.fromModule !== m) continue;
      for (const w of tokens(a.surface)) cumulative.add(w);
    }
    atomWordsByModule.set(m, new Set(cumulative));
  }
}

function moduleOf(lessonId: string): string {
  return /^es-(m\d+)-/.exec(lessonId)?.[1] ?? "m16";
}

type LessonDebt = { id: string; unknown: string[]; prompts: number };

function measure(): { total: number; perLesson: LessonDebt[] } {
  const perLesson: LessonDebt[] = [];
  let total = 0;
  for (const lesson of ES_ALL_LESSONS) {
    const known = atomWordsByModule.get(moduleOf(lesson.id)) ?? new Set();
    const unknown: string[] = [];
    let prompts = 0;
    for (const step of lesson.steps as LessonStep[]) {
      if (step.type !== "multiple_choice") continue;
      const prompt = (step as { prompt?: string }).prompt;
      if (!prompt || !looksSpanish(prompt)) continue;
      prompts++;
      for (const t of tokens(prompt)) {
        if (FUNCTION_WORDS.has(t) || PROPER_NAMES.has(t) || known.has(t)) continue;
        if (ENGLISH_STOPWORDS.has(t)) continue;
        unknown.push(t);
      }
    }
    if (unknown.length) perLesson.push({ id: lesson.id, unknown, prompts });
    total += unknown.length;
  }
  perLesson.sort((a, b) => b.unknown.length - a.unknown.length);
  return { total, perLesson };
}

describe("es prompt comprehensibility", () => {
  it(`unknown-word debt in Spanish prompts stays ≤ ${MAX_UNKNOWN_TOKEN_OCCURRENCES}`, () => {
    const { total, perLesson } = measure();
    if (process.env.EMIT_ES_COMPREHENSIBILITY_REPORT === "1") {
      writeFileSync(
        "/tmp/es-prompt-comprehensibility.json",
        JSON.stringify({ total, perLesson }, null, 1),
      );
    }
    const worst = perLesson
      .slice(0, 5)
      .map((l) => `${l.id}(${l.unknown.length})`)
      .join(", ");
    expect(
      total,
      `${total} untaught-word occurrences in Spanish-language prompts (worst: ${worst}). ` +
        "Write early-module prompts from taught vocabulary; ratchet this DOWN with the de-escalation pass, never up.",
    ).toBeLessThanOrEqual(MAX_UNKNOWN_TOKEN_OCCURRENCES);
  });
});
