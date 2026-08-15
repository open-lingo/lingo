/**
 * Central build_sentence / listening_build DISTRACTOR FLOOR pass (Spencer
 * QA 2026-07-16): "for any build sentence thing, we need a few more
 * distractors, we give them the answer a little too easy."
 *
 * Both step types ship a flat `tiles` pool (answer tiles + distractor
 * tiles) plus a separate `correctOrder` (the answer, as an ordered
 * sub-sequence of `tiles`). BuildSentenceStepView / ListeningBuildStepView
 * shuffle `step.tiles` at RENDER time (`seededShuffle(step.tiles, step.id)`)
 * and grade by comparing the placed sequence to `correctOrder` — neither
 * view pads the pool itself, so `distractorCount = tiles.length -
 * correctOrder.length` is exactly what the learner sees as "wrong" tiles.
 * The audit (`buildTileDistractorAudit.test.ts`, run 2026-07-16) found
 * es/ko NEVER shipped 3+ distractors on a word-level build (0/116 es,
 * 0/58 ko) and ja had 422/1861 word-level steps at 0-1 distractors —
 * confirming the critique.
 *
 * Rather than hand-edit every `build()` / `listeningBuildSentence()` call
 * site across 3 languages, this is a single post-pass in
 * `getMockLessonContent` that tops up any short pool — mirrors
 * `matchPairsFloor.ts`'s shape-aware design (same author, same problem
 * shape: a short pool padded from a language-keyed, prior-only source).
 *
 * SCOPE — WORD granularity only. CHARACTER-granularity builds (M1/M2 kana
 * and hangul decoding: assembling a word from individual glyphs) are a
 * different pedagogical shape — script acquisition, not sentence
 * production — and the audit shows they're already well-stocked (70/72 ja,
 * 62/62 ko character-granularity steps already have 3+ distractors). See
 * `isPaddableStep`.
 *
 * Floor scales down for tiny answers (`minDistractorsFor`): a 1-2 tile
 * answer aims for 2 distractors; a 3+ tile answer aims for 3 (task spec:
 * "aim >= 3 where the sentence has >= 3 answer tiles; scale down for tiny
 * sentences"). Fill draws from the SAME-LANGUAGE course-atom registry,
 * PRIOR-ONLY (`getAtomsUpToModule`, at-or-before this lesson's module —
 * the same "never introduce a not-yet-taught word" invariant matchPairsFloor
 * enforces; for JA the pool is additionally intersected with
 * `getJaTaughtKanaBeforeModule`, the IR-priorVocab truthful taught set,
 * because registry `fromModule` tags are stale old-course provenance and
 * were leaking never-taught words into banks — B088), excludes phrase-kind
 * atoms (multi-word surfaces read oddly as
 * a single tile) and multi-word surfaces generally, and never picks a
 * candidate whose text already appears among the step's existing tiles
 * (case-insensitive) — a "distractor" that duplicates an answer tile isn't
 * a distractor, it's a free extra correct tile (task invariant).
 *
 * Deterministic: fill order is seeded on the step id via the existing
 * `seededShuffle` (same PRNG family as `seededRng.ts`'s `mulberry32`, and
 * the exact function the render-time tile shuffle and matchPairsFloor's
 * fill already use), so content/snapshot tests stay stable.
 */
import type { LessonContent, LessonStep } from "../types";
import { getAtomsUpToModule } from "./lessonAtomIndex";
import { getJaTaughtKanaBeforeModule } from "@/features/languages/ja/curriculum/taughtVocab";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import {
  particleContrastsFor,
  siblingsOf,
} from "@/features/languages/ja/jaSiblingSets";

/** Languages with a wired atom pool (`getAtomsUpToModule`) to draw fill
 *  distractors from. Any other language's lesson returns UNTOUCHED — a
 *  short pool beats one "fixed" with another language's vocabulary. */
const POOLED_LANGUAGES = new Set(["ja", "es", "ko"]);

/**
 * Distractor floor as a function of answer length. Full floor (3) once the
 * answer has 3+ tiles; scaled down to 2 for 1-2 tile "tiny" answers (a
 * single-word pick already has a real floor from prior authoring — see the
 * audit — 2 is a modest, non-disruptive bump for the rest).
 */
export function minDistractorsFor(answerCount: number): number {
  if (answerCount <= 0) return 0;
  // A 1-tile answer renders as the MCQ-shaped single-answer picker
  // (BuildSentenceStepView `isSingleAnswerPicker`), which wants exactly 4
  // options to paint a 2x2 grid — 3 options stretched into giant rows
  // (Spencer 2026-07-24). Three distractors is also the honest floor for a
  // one-word pick: with two, elimination does the work.
  if (answerCount === 1) return 3;
  return Math.min(3, Math.max(2, answerCount));
}

type TileStep = LessonStep & { type: "build_sentence" | "listening_build" };

/** Word-granularity build_sentence / listening_build only — see header. */
function isPaddableStep(step: LessonStep): step is TileStep {
  return (
    (step.type === "build_sentence" || step.type === "listening_build") &&
    step.granularity === "word"
  );
}

/**
 * Pad every short, paddable build_sentence/listening_build tile pool in
 * `lesson` up to its distractor floor. Returns a new lesson when anything
 * changed, else the original (cheap identity for callers that compare
 * references, matching padMatchPairsFloor's contract).
 */
export function padBuildTileFloor(lesson: LessonContent): LessonContent {
  if (!POOLED_LANGUAGES.has(lesson.languageId)) return lesson;
  let changed = false;
  const steps = lesson.steps.map((step) => {
    if (!isPaddableStep(step)) return step;
    const answerCount = step.correctOrder.length;
    const have = step.tiles.length - answerCount;
    const need = minDistractorsFor(answerCount) - have;
    if (need <= 0) return step;
    const fill = pickFillTiles(step, need, lesson.moduleId, lesson.languageId, lesson.id);
    if (fill.length === 0) return step;
    changed = true;
    return { ...step, tiles: [...step.tiles, ...fill] };
  });
  return changed ? { ...lesson, steps } : lesson;
}

/**
 * Pick up to `need` distractor tile candidates for `step` from the
 * language's prior-taught atom pool. Excludes phrase-kind atoms,
 * multi-word surfaces, and anything already present in `step.tiles`
 * (case-insensitive) — never a duplicate of an answer tile or an existing
 * distractor. Deterministic (seeded on the step id).
 */
/** JA deictic sets — never useful as fill on tiny answers, where they read
 *  as a plausible object for the English prompt's "it/that" (Fable sweep
 *  2026-07-24: "Build: I won't do it." with それ in the bank → a learner
 *  faithfully rendering "it" is marked wrong). */
const JA_DEICTICS = new Set(["これ", "それ", "あれ", "どれ", "ここ", "そこ", "あそこ", "どこ"]);
const NEO_LESSON_RE = /-neo-(\d+|challenge|review)$/;
const neoIndex = (lessonId: string): number | null => {
  const m = NEO_LESSON_RE.exec(lessonId);
  if (!m) return null;
  if (m[1] === "challenge") return 98;
  if (m[1] === "review") return 99;
  return parseInt(m[1], 10);
};

function pickFillTiles(
  step: TileStep,
  need: number,
  moduleId: string,
  languageId: string,
  lessonId: string,
): string[] {
  const used = new Set(step.tiles.map((t) => t.toLowerCase()));
  const lessonNeo = neoIndex(lessonId);
  const tinyAnswer = step.correctOrder.length <= 2;
  // B088: registry `fromModule` is stale old-course provenance — the exact
  // trap `moduleCompiler.ts`'s `metBefore` documents and IR priorVocab killed
  // on the compiler side. Trusting it here leaked never-taught words
  // (コンビニ, がっこう, ぷりん …) into live banks as reject-only tiles. For JA,
  // prior-module fill must ALSO be in the truthful taught set; same-module
  // fill keeps the live neo-attribution gate below. A smaller (or
  // category-poorer) floor is acceptable — an untaught distractor is not.
  const taughtBefore =
    languageId === "ja" ? getJaTaughtKanaBeforeModule(moduleId) : null;
  const pool = getAtomsUpToModule(moduleId, languageId).filter(
    (a) =>
      a.kind !== "phrase" &&
      !/\s/.test(a.kana) &&
      a.kana.length > 0 &&
      !used.has(a.kana.toLowerCase()) &&
      // Kana-drill spellings are not words (どあ/ぱん/ぺん/ぴあの — see
      // CourseAtom.kanaDrillOnly). Drawing one as a distractor teaches a
      // misspelling, and どあ was colliding with a live ドア in m6.
      !a.kanaDrillOnly &&
      // Fable sweep 2026-07-24 fill-policy holes for JA:
      //  - POLITE register forms (〜ます/〜です) never fill: あります beside
      //    ある makes correct Japanese a wrong answer.
      //  - Same-module atoms only fill NEO lessons at-or-before their own
      //    neo lesson (and never from the hidden old course): the module-
      //    granular pool was pulling old-m6 あります/ここ into m6-neo-4.
      // The blanket PARTICLE ban that also lived here was LIFTED on
      // 2026-07-24 by Spencer's ruling — see `preferredFill`.
      !(languageId === "ja" && /(ます|です)$/.test(a.kana)) &&
      !(languageId === "ja" && tinyAnswer && JA_DEICTICS.has(a.kana)) &&
      !(taughtBefore !== null && a.fromModule !== moduleId && !taughtBefore.has(a.kana)) &&
      !(
        lessonNeo !== null &&
        a.fromModule === moduleId &&
        (neoIndex(a.introducedByLessonId ?? "") === null ||
          (neoIndex(a.introducedByLessonId ?? "") ?? 999) > lessonNeo)
      ),
  );
  if (pool.length === 0) return [];
  const shuffled = seededShuffle(pool, step.id);
  // SIBLING-FIRST fill (Spencer 2026-07-24): "we want them to have to think
  // for these sentences and not entirely deductively reason their way out.
  // they need to work the right muscle." A random prior atom next to the
  // answer is solvable by elimination; a same-category word is not.
  const preferred =
    languageId === "ja" ? preferredFill(step, shuffled, used) : new Set<string>();
  const ranked = [
    ...shuffled.filter((a) => preferred.has(a.kana)),
    ...shuffled.filter((a) => !preferred.has(a.kana)),
  ];
  const picked: string[] = [];
  const seen = new Set<string>();
  for (const atom of ranked) {
    if (picked.length >= need) break;
    const key = atom.kana.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(atom.kana);
  }
  return picked;
}

/**
 * The kana in `pool` that are semantic siblings (or genuine particle
 * contrasts) of something in the answer — the distractors that force real
 * reading. Everything here is still drawn from the prior-taught pool, so an
 * untaught sibling can never leak in.
 *
 * Particles are included ONLY as `JA_PARTICLE_CONTRASTS` pairs, never as a
 * flat particle list: は↔が is usually defensible Japanese and would mark a
 * correct answer wrong, so that pair is excluded there by design. Offering
 * で against a に answer, by contrast, IS the m6 contrast being taught.
 */
function preferredFill(
  step: TileStep,
  pool: readonly { kana: string }[],
  used: ReadonlySet<string>,
): Set<string> {
  const available = new Set(pool.map((a) => a.kana));
  const wanted = new Set<string>();
  for (const tile of step.correctOrder) {
    for (const sibling of siblingsOf(tile)) wanted.add(sibling);
    for (const contrast of particleContrastsFor(tile)) wanted.add(contrast);
  }
  const out = new Set<string>();
  for (const kana of wanted) {
    if (available.has(kana) && !used.has(kana.toLowerCase())) out.add(kana);
  }
  return out;
}
