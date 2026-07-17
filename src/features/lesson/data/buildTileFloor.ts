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
 * enforces), excludes phrase-kind atoms (multi-word surfaces read oddly as
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
import { seededShuffle } from "@/shared/utils/seededShuffle";

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
    const fill = pickFillTiles(step, need, lesson.moduleId, lesson.languageId);
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
function pickFillTiles(
  step: TileStep,
  need: number,
  moduleId: string,
  languageId: string,
): string[] {
  const used = new Set(step.tiles.map((t) => t.toLowerCase()));
  const pool = getAtomsUpToModule(moduleId, languageId).filter(
    (a) =>
      a.kind !== "phrase" &&
      !/\s/.test(a.kana) &&
      a.kana.length > 0 &&
      !used.has(a.kana.toLowerCase()),
  );
  if (pool.length === 0) return [];
  const shuffled = seededShuffle(pool, step.id);
  const picked: string[] = [];
  const seen = new Set<string>();
  for (const atom of shuffled) {
    if (picked.length >= need) break;
    const key = atom.kana.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(atom.kana);
  }
  return picked;
}
