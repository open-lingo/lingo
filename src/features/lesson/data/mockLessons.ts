import type { LessonContent, LessonStep } from "../types";
// Test/emit runtime only: resolves to lessonRegistry.eager.ts under vitest,
// to an empty module in every real build (plugin in vite.config.ts).
import "virtual:lesson-registry-bootstrap";
import {
  getRegisteredLesson,
  getRegisteredLessonIds,
  getRegisteredLessons,
  getContentRevision,
} from "./lessonRegistry";
import { withKanaReviewTail } from "./kanaReviewTails";
import { withDynamicReviewPrefix } from "./dynamicReviewPrefix";
import { padMatchPairsFloor, type MatchPadContext } from "./matchPairsFloor";
import { padBuildTileFloor } from "./buildTileFloor";
import { applyKanjiSurfaces } from "@/features/languages/ja/secondScript/applyKanjiSurfaces";
import { deriveGrammarMicroSteps } from "./deriveGrammarMicroSteps";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { ALL_ROWS } from "./hiraganaCurriculum";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { buildReviewTailSteps } from "./buildReviewTailSteps";
import { buildSrsReviewLesson } from "./buildSrsReviewLesson";
import { getCachedFeatureFlags } from "@/shared/config/featureFlags";
import { recordReviewStepsServed } from "./reviewGridTelemetry";

function rowIdOf(lessonId: string): string | null {
  const m = /^ja-m\d+-(.+)-(\d+|test|recap)$/.exec(lessonId);
  return m ? m[1] : null;
}

/**
 * Augment a lesson with the cross-row review tail (Phase 2). Tail items
 * sit just before the final wrap-up info step so the user's last
 * interaction is a retrieval (Karpicke recency).
 *
 * The tail is skipped for:
 *   - lessons that aren't JA sub-lessons (legacy m1-l1 etc.)
 *   - row-test lessons (they ARE the review)
 *   - recap lessons (whole-module review)
 *   - cases where `buildReviewTailSteps` returns [] (empty cross-row pool)
 */
function augmentWithReviewTail(lesson: LessonContent): LessonContent {
  const id = lesson.id;
  // Skip row-test and recap lessons — they're already review-heavy.
  if (id.endsWith("-test") || id.endsWith("-recap")) return lesson;
  const rowId = rowIdOf(id);
  if (!rowId) return lesson;
  // Skip review tail for ids that look like sub-lessons but whose rowId
  // isn't an actual curriculum row (e.g. vowels `ja-m1-l1-1` — the "l1"
  // pseudo-row exists in the pathway but not in HIRAGANA_ROWS).
  if (!ALL_ROWS.some((r) => r.id === rowId)) return lesson;

  const priorLessonIds = new Set(getMockCompletedLessonIds());
  // The current lesson MUST be excluded from the prior set even when
  // revisiting — the tail draws from OTHER rows, not this one.
  priorLessonIds.delete(id);

  const tail = buildReviewTailSteps({
    currentLessonId: id,
    currentRowId: rowId,
    priorLessonIds,
  });
  if (tail.length === 0) return lesson;

  // Insert tail just BEFORE the trailing wrap-up info step (if any).
  const steps: LessonStep[] = [...lesson.steps];
  const lastIdx = steps.length - 1;
  const last = steps[lastIdx];
  if (last && last.type === "info" && last.id.endsWith("-info-end")) {
    steps.splice(lastIdx, 0, ...tail);
  } else {
    steps.push(...tail);
  }
  return { ...lesson, steps };
}

/**
 * Modules where the tile-pick `build_sentence` step has outlived its
 * pedagogical purpose. Per Spencer's note (#R1-defer-G, 2026-05-17):
 * "[build_sentence] needs to disappear around module 5 — once we get more
 * than 5 mora words in the mix, it feels redundant." Once learners are
 * confidently assembling 5+ mora words the tile-assembly step adds no
 * value over translate/MCQ. M1-M4 keep it; their words are short enough
 * that production-via-tiles is still scaffolding, not busywork.
 *
 * Review pseudo-modules inherit their source module's status — a
 * `m5-review` lesson reviews M5 content, so it sunsets too.
 */
// 2026-05-18 rebuild: M5-M7 sunset removed — the rebuild made the runtime
// strip unnecessary. (Earlier note claimed M5-M7 use translateStep; as of
// 2026-07-12 the earliest translate is M11 — content drifted since.)
// Empty set kept as a future safety net — re-populate if a downstream
// module legitimately needs the strip path.
const BUILD_SENTENCE_SUNSET_MODULES = new Set<string>();

export function isSunsetModuleForBuildSentence(moduleId: string): boolean {
  if (BUILD_SENTENCE_SUNSET_MODULES.has(moduleId)) return true;
  const source = /^(.+)-review$/.exec(moduleId)?.[1];
  return source !== undefined && BUILD_SENTENCE_SUNSET_MODULES.has(source);
}

/**
 * Strip `build_sentence` from `lesson.steps` AND from any nested `row_test`
 * item queue. Returns the original lesson if nothing was filtered (cheap
 * identity-equality for callers that compare references).
 *
 * In dev, warns when a lesson ends up with zero non-info steps post-filter
 * (a smell — Spencer would rather know than ship a degenerate lesson).
 */
function stripBuildSentenceSteps(lesson: LessonContent): LessonContent {
  let changed = false;
  const steps: LessonStep[] = [];
  for (const step of lesson.steps) {
    if (step.type === "build_sentence") {
      changed = true;
      continue;
    }
    if (step.type === "row_test") {
      const filtered = step.items.filter((item) => item.kind !== "build");
      if (filtered.length !== step.items.length) {
        changed = true;
        steps.push({ ...step, items: filtered });
        continue;
      }
    }
    steps.push(step);
  }
  if (!changed) return lesson;
  if (import.meta.env.DEV) {
    const realWork = steps.filter(
      (s) => s.type !== "info" && s.type !== "phrase_card",
    );
    if (realWork.length === 0) {
      console.warn(
        `[mockLessons] ${lesson.id}: zero real-work steps after build_sentence sunset filter`,
      );
    }
  }
  return { ...lesson, steps };
}

/**
 * Heavy, curriculum-wide indexes for the match-pairs floor pass, built
 * once PER LANGUAGE from the RAW LESSONS map (no post-passes → no
 * recursion) and the language's own course order — fill pools are
 * language-keyed, so an es lesson must never pad from ja indexes. Cached
 * per language (the ja fast path stays a single build); `todayMs` is
 * refreshed per call so FSRS overdue scoring stays current.
 */
const matchPadHeavyBits = new Map<string, Omit<MatchPadContext, "todayMs">>();
let matchPadHeavyBitsRev = -1;
function getMatchPadContext(languageId: string): MatchPadContext {
  let bits = matchPadHeavyBits.get(languageId);
  if (matchPadHeavyBitsRev !== getContentRevision()) {
    matchPadHeavyBits.clear();
    matchPadHeavyBitsRev = getContentRevision();
  }
  if (!bits) {
    const rawLessons = getRegisteredLessons();
    const rawById = new Map(rawLessons.map((l) => [l.id, l]));
    const orderedLessonIds: string[] = [];
    const moduleOrder: string[] = [];
    const course = getMockCourse(languageId);
    for (const mod of course.modules) {
      moduleOrder.push(mod.id);
      const m = mod as unknown as {
        lessons?: { id: string }[];
        lessonGroups?: { lessons?: { id: string }[] }[];
      };
      for (const l of m.lessons ?? []) orderedLessonIds.push(l.id);
      for (const g of m.lessonGroups ?? [])
        for (const l of g.lessons ?? []) orderedLessonIds.push(l.id);
    }
    bits = { rawLessons, rawById, orderedLessonIds, moduleOrder };
    matchPadHeavyBits.set(languageId, bits);
  }
  return { ...bits, todayMs: Date.now() };
}

/**
 * The lesson as authored/compiled, BEFORE the runtime padding pipeline
 * (review prefix/tail, match-pairs + build-tile floors, kanji surfaces).
 *
 * Boot-path callers that only read structural facts — step types, module id,
 * `introducesCardIds` — must use this instead of `getMockLessonContent`: the
 * padding pipeline builds a frequency index over EVERY lesson on first use,
 * which on the phone is seconds of main-thread time before Home can paint
 * (docs/handoff-2026-09-11-mobile-qa.md, launch-time profile). Padding never
 * adds or removes `row_test` steps nor touches `introduces*`, so those reads
 * are identical on the raw lesson. Derived SRS review lessons
 * (`ja-mN-review-N`) are not in the table and return null here.
 */
export function getRawMockLesson(lessonId: string): LessonContent | null {
  return getRegisteredLesson(lessonId);
}

export type GetLessonContentOptions = {
  /**
   * Run the match-pairs and build-tile floor passes (default true). Pass
   * `false` for whole-course walks that only READ sentence text (the
   * flashcard sentence miner): the floors only add `match_pairs` steps and
   * widen tile banks — they never write `targetSentence` / `transcript` /
   * `targetPhrase` — but the match-pairs floor builds a frequency index over
   * every lesson on first use, which is the single largest cost on the
   * phone's Home path (launch profile, docs/handoff-2026-09-11-mobile-qa.md).
   */
  floors?: boolean;
  /**
   * A8 (2026-09-17, docs/learning-loop-2026-09-17.md): rank the build-tile
   * floor's non-sibling-preferred distractor candidates by live FSRS
   * due-ness instead of the seeded-shuffle heuristic. Defaults to the
   * synchronously-cached feature flag (`experimental.reviewGridsFromFsrs`,
   * OFF by default) so ordinary callers don't need to know this exists.
   * Pass `false` explicitly to force the heuristic regardless of the flag
   * (used by the byte-identical content:emit check).
   */
  reviewGridsFromFsrs?: boolean;
};

function padFloors(
  lesson: LessonContent,
  languageId: string,
  floors: boolean,
  reviewGridsFromFsrs: boolean,
): LessonContent {
  if (!floors) return lesson;
  return padBuildTileFloor(
    padMatchPairsFloor(lesson, getMatchPadContext(languageId)),
    reviewGridsFromFsrs ? { enabled: true } : undefined,
  );
}

export function getMockLessonContent(
  lessonId: string,
  options: GetLessonContentOptions = {},
): LessonContent | null {
  const floors = options.floors ?? true;
  // Synchronous — see getCachedFeatureFlags's doc comment. Never awaits a
  // fetch, so this function stays synchronous end to end (it always has).
  const reviewGridsFromFsrs =
    options.reviewGridsFromFsrs ?? getCachedFeatureFlags().experimental.reviewGridsFromFsrs;
  const base = getRegisteredLesson(lessonId);
  if (base) {
    const augmented = withKanaReviewTail(
      augmentWithReviewTail(deriveGrammarMicroSteps(base)),
    );
    const shaped = isSunsetModuleForBuildSentence(augmented.moduleId)
      ? stripBuildSentenceSteps(augmented)
      : augmented;
    // B069 phase 1: dedicated review lessons get their dynamic segment
    // (switchover beat + due atoms + due grammar + new-card seats) prepended
    // from live FSRS state HERE — before the pads/kanji passes so dynamic
    // steps get tile floors and kanji surfaces exactly like authored ones.
    // Empty learner state returns `shaped` untouched (byte-identical).
    const withPrefix = withDynamicReviewPrefix(shaped);
    // Kanji surface pass runs on the fully-shaped lesson (needs moduleId),
    // beside the tile/pair pads. It edits ONLY *Annotation display fields, so
    // it commutes with the pads (disjoint fields) — see applyKanjiSurfaces.
    const result = applyKanjiSurfaces(
      padFloors(withPrefix, withPrefix.languageId, floors, reviewGridsFromFsrs),
    );
    recordReviewStepsServed(result);
    return result;
  }

  const reviewMatch = /^ja-(m\d+)-review-([12])$/.exec(lessonId);
  if (reviewMatch) {
    // Reviews inherit the kanji surface layer via the SAME pass: the review
    // lesson's moduleId is where the learner is, so an m10 review of m8 vocab
    // shows kanji with furigana OFF (past the m8+2 window) while m9 vocab
    // (window m9‑m10) still shows furigana — the owner's "reviews bake in m8 &
    // m9 production systematically".
    const result = applyKanjiSurfaces(
      padFloors(
        buildSrsReviewLesson({
          moduleId: reviewMatch[1],
          position: parseInt(reviewMatch[2]) as 1 | 2,
          courseId: "mock-1",
          languageId: "ja",
        }),
        "ja",
        floors,
        reviewGridsFromFsrs,
      ),
    );
    recordReviewStepsServed(result);
    return result;
  }

  return null;
}

// Register a globally-discoverable lookup so cross-feature consumers
// (e.g. mockProgress derivation in shared/domain) can avoid a hard
// import cycle: mockProgress → mockLessons → generatedHiragana → SRS.
// The shape mirrors `__lingo_row_sub_lesson_ids__` used by the
// streamline migration.
if (typeof globalThis !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__lingo_get_lesson_content__ = getMockLessonContent;
}

export function getAvailableMockLessonIds(): string[] {
  return getRegisteredLessonIds();
}

export type LessonLengthRow = {
  id: string;
  title: string;
  stepCount: number;
  estimatedMinutes: number;
  kind?: LessonContent["kind"];
};

export type ModuleLengthRow = {
  moduleId: string;
  lessons: LessonLengthRow[];
  totalLessons: number;
  totalSteps: number;
  totalMinutes: number;
};

/**
 * Dev-tool helper. Walks every registered lesson, groups by moduleId, and
 * returns per-module stats. Used by the `?dev=1` panel button so we can
 * eyeball module length before restructuring. Lesson ids are sorted
 * lexicographically — ja-mN-{slug} sort sensibly for the JA modules.
 */
export function getMockLessonStats(): ModuleLengthRow[] {
  const byModule = new Map<string, LessonLengthRow[]>();
  for (const lesson of getRegisteredLessons()) {
    const row: LessonLengthRow = {
      id: lesson.id,
      title: lesson.title,
      stepCount: lesson.steps.length,
      estimatedMinutes: lesson.estimatedMinutes ?? 0,
      kind: lesson.kind,
    };
    const list = byModule.get(lesson.moduleId) ?? [];
    list.push(row);
    byModule.set(lesson.moduleId, list);
  }
  const out: ModuleLengthRow[] = [];
  for (const [moduleId, lessons] of byModule) {
    lessons.sort((a, b) => a.id.localeCompare(b.id));
    out.push({
      moduleId,
      lessons,
      totalLessons: lessons.length,
      totalSteps: lessons.reduce((sum, l) => sum + l.stepCount, 0),
      totalMinutes: lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0),
    });
  }
  out.sort((a, b) => a.moduleId.localeCompare(b.moduleId));
  return out;
}
