/**
 * SHARED step taxonomy — the single source of truth for both the compiler
 * (`moduleCompiler.ts`) and the authoring guards
 * (`ja/__tests__/moduleBarGuards.ts`).
 *
 * These lived as hand-copied twins for a day and it cost a full debugging
 * cycle: the compiler placed debuts against its own idea of "intro-capable"
 * and its own kana projection, then the guard rejected the result using a
 * slightly different pair. Compiling against a different projection than the
 * guard reads is why "fixed" orderings kept failing. Drift here is silent —
 * so there is exactly one copy.
 */

/** Tap-to-select step types. Three in a row is a bar violation (inv 25):
 *  the learner should be producing, not tapping. */
export const SELECTION_TYPES: ReadonlySet<string> = new Set([
  "listening_comprehension",
  "word_image_mcq",
  "sentence_mcq",
  "particle_cloze",
  "self_explanation_mcq",
  "multiple_choice",
]);

/** Step types that may carry a word's FIRST appearance. */
export const INTRO_TYPES: ReadonlySet<string> = new Set([
  "listening_comprehension",
  "dialogue_listen",
  "grammar_rule",
  "build_sentence",
  "word_image_mcq",
  "particle_cloze",
]);

/** Intro-capable set under TEACH-FIRST (inv 33): a dialogue is never a
 *  word's first exposure. Every IR-compiled module runs with
 *  `requireTeachFirst`, so this — not `INTRO_TYPES` — is what the compiler
 *  places debuts against. */
export const TEACH_FIRST_INTRO_TYPES: ReadonlySet<string> = new Set(
  [...INTRO_TYPES].filter((t) => t !== "dialogue_listen"),
);

const KANA_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}ー、。？！　 ]+$/u;

/** Every kana-only string reachable in `value`, excluding `id` fields. */
export function kanaSurfaces(value: unknown): string[] {
  const out: string[] = [];
  const walk = (v: unknown, key: string) => {
    if (typeof v === "string") {
      if (key !== "id" && KANA_ONLY.test(v)) out.push(v);
    } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === "object")
      Object.entries(v).forEach(([k, x]) => walk(x, k));
  };
  walk(value, "");
  return out;
}

/**
 * The kana surfaces a step actually TEACHES — `kanaSurfaces` minus the
 * fields that carry text the learner is never meant to absorb:
 * - `acceptedAnswers` — grading-only variants whose spaceless forms
 *   mis-segment (はこ out of は + こ across a word boundary).
 * - `grammar_rule.antiPattern` — a deliberate non-word (あらない for the
 *   irregular ある→ない contrast, inv 12).
 * - `conjugation_transform.distractors` — deliberate formation errors
 *   (たべらない, のむない) that are never taught and never valid.
 * - `kanji_reading.options` — deliberate MIS-readings of the tested glyph
 *   (じん for 人, じきべる for 食べる: a valid-but-wrong on/kun, a wrong
 *   okurigana stem, a rendaku slip — `readingDistractors`, guide §13.7).
 *   Same class as the transform distractors and the same reason: they are
 *   non-words the learner must reject, so counting them as vocabulary
 *   reported じん as an untracked word and き (out of じきべる) as debuting
 *   on a kanji step. The CORRECT reading is still visible via the step's
 *   `reading` + `audioText`, so nothing real is hidden.
 *
 * This is the projection provenance and debut-placement both read.
 */
export function jaSurfaces(step: { type?: string } & Record<string, unknown>): string[] {
  const scrubbed: Record<string, unknown> = { ...step };
  scrubbed.acceptedAnswers = undefined;
  if (step.type === "grammar_rule") scrubbed.antiPattern = undefined;
  if (step.type === "conjugation_transform") scrubbed.distractors = undefined;
  if (step.type === "kanji_reading") scrubbed.options = undefined;
  return kanaSurfaces(scrubbed);
}
