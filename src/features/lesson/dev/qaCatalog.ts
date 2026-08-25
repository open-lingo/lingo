import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "../data/mockLessons";
import type { StepType } from "../types";

/**
 * Exhaustiveness guard: adding a StepType to the union without listing it
 * here is a compile error, so the QA test-drive page can never silently
 * miss a step type.
 */
const STEP_TYPE_ORDER: Record<StepType, number> = {
  info: 0,
  multiple_choice: 2,
  build_sentence: 3,
  match_pairs: 4,
  fill_blank: 5,
  translate: 6,
  listening_comprehension: 7,
  listening_build: 8,
  speaking: 9,
  symbol_intro: 10,
  symbol_trace: 11,
  symbol_recognition: 12,
  symbol_production: 13,
  symbol_to_sound: 14,
  word_image_mcq: 15,
  phrase_card: 16,
  pretest_mcq: 16.5,
  tap_the_word: 16.6,
  word_map: 16.7,
  grammar_rule: 17,
  particle_cloze: 18,
  agreement_cloze: 19,
  aspect_choice_cloze: 19.5,
  gender_sort: 19.6,
  agreement_chain: 19.7,
  stress_pattern: 8.6,
  silent_letter: 8.7,
  liaison_listen: 8.5,
  conjugation_cloze: 24,
  conjugation_transform: 25,
  kanji_reveal: 24.5,
  kanji_reading: 23,
  self_explanation_mcq: 20,
  dialogue_listen: 21,
  dialogue_sim: 21.5,
  row_test: 22,
};

export const ALL_STEP_TYPES = (
  Object.keys(STEP_TYPE_ORDER) as StepType[]
).sort((a, b) => STEP_TYPE_ORDER[a] - STEP_TYPE_ORDER[b]);

/**
 * Step types with zero usage in shipped STATIC lessons as of 2026-07-11.
 * Pinned so the coverage test fails loudly when content starts (or stops)
 * using one, instead of the QA page silently linking nothing.
 *
 * CAVEAT (2026-07-12 audit): "no static lesson" ≠ "unused". The scan only
 * sees the LESSONS index — symbol_production SHIPS via the kana learn flow
 * (alphabetSession generates it for /practice/alphabet/:id/learn). The QA
 * page special-cases it with links to that surface; fill_blank remains
 * genuinely unused everywhere.
 */
export const UNUSED_STEP_TYPES: StepType[] = [
  // No STATIC lesson can use these two: both halves of the kana→kanji
  // switchover beat (B061) are emitted by `buildSrsReviewLesson` at build time,
  // because which word is ready to be introduced is a per-learner FSRS
  // question. `fill_blank` was already pinned here as genuinely unused and is
  // now adopted as the beat's graded half — same pin, different reason.
  // Drive them from /ja/qa/kanji-reveal, not from a lesson link.
  "kanji_reveal",
  "fill_blank",
  "symbol_production",
  // Ships only in the es course (agreement drills, m3+). No ja lesson uses
  // it, so it is "unused" from this ja-scoped pin's perspective — the es QA
  // page covers it via buildStepTypeCoverage("es") (guarded in the test).
  "agreement_cloze",
  // Built ahead of content (2026-08-18 step-type gap analysis): the two
  // Romance gaps the existing types could NOT be parameterized into. Both are
  // es/fr-only by construction and no ja lesson will ever use them, so they
  // are pinned here permanently rather than temporarily — the es/fr QA pages
  // will cover them once a module ships one. Preview fixtures exist today, so
  // the renderers are reachable from /ja/qa/steps regardless.
  //   gender_sort    — lexical gender assignment, n:2, prior to agreement
  //   stress_pattern — heard stress → written accent, accent-stripped stimulus
  "gender_sort",
  "silent_letter",
  "agreement_chain",
  "stress_pattern",
  // Built ahead of content (2026-08-20), then DEMOTED the same day on
  // Spencer's QA walk: "any narrative card is very miserable… you have to
  // read a ton just to press one button, when the same thing can be done
  // with a dialogue simulation." The 1-turn micro-sim is the preferred
  // non-imageable debut (guide §13.2); this stays LAST RESORT for a debut
  // no sim can frame, so it may well stay pinned here forever.
  "pretest_mcq",
  // Built ahead of content (2026-08-20, same wave): active noticing —
  // tap the word(s) in a real sentence that match a deducible cue.
  // Staged demo at /:lang/qa/tap-word; preview fixture exists. Unpin
  // when content ships one.
  "tap_the_word",
  // Built ahead of content (2026-08-20, same wave): interlinear sentence
  // mapping — English words prompted in turn, learner maps each to its
  // target-language word, glosses fill in (match-pairs elimination ramp,
  // sentence-shaped). Staged demo at /:lang/qa/word-map. Unpin when
  // content ships one.
  "word_map",
  // Removed from the ja curriculum 2026-07-16 (info-step audit): all 842
  // recap/preview boilerplate cards were cut and the 20 teaching cards were
  // converted to grammar_rule. ja now ships ZERO info steps, so it is
  // "unused" from this ja-scoped pin — es/ko still ship info and their QA
  // pages cover it via buildStepTypeCoverage("es"/"ko") (guarded in the test).
  "info",
  // Its only host was the survival-phrases sidequest, deleted 2026-07-16
  // in the side-lesson content purge (remake pending). Unpin when a remade
  // lesson ships it — or delete the step type if the remake doesn't.
  "phrase_card",
  // Built ahead of content (n4-scoping-2026-07-16 §3 ACCEPT): the engine-
  // backed conjugated-form-in-sentence drill. No shipped lesson uses it yet —
  // the N4 wave (m31+) will. Pinned so the coverage test fails loudly the
  // moment content starts using it (same pattern as kanji_reading's old pin);
  // unpin then.
  "conjugation_cloze",
  // Its only static host was the m30 "Casual register" pilot, retired
  // 2026-08-09 (spec 2026-08-06 A1) — and two of the pilot's
  // self-explanations were its worst content (walk findings F3/F4: both
  // taught falsehoods). The step TYPE and its view survive; unpin when an
  // authored module ships one.
  "self_explanation_mcq",
  // NEW 2026-08-18, built ahead of content for the es A2 / fr waves. Both are
  // deliberately in no shipped lesson yet: `aspect_choice_cloze` needs the
  // unwritten past-tense tier, and `liaison_listen` needs a French course.
  // Pinned so the coverage test fails loudly the moment content adopts them —
  // same pattern conjugation_cloze used while waiting for N4.
  "aspect_choice_cloze",
  "liaison_listen",
];

export type QaLessonPick = {
  lessonId: string;
  title: string;
  moduleId: string;
  /** Occurrences of the step type inside this lesson. */
  count: number;
};

export type StepTypeCoverage = {
  type: StepType;
  /** How many distinct lessons contain at least one step of this type. */
  totalLessons: number;
  /**
   * Up to two representative lessons: the densest early-module example
   * and a late-module example, so both ends of the course get exercised.
   */
  picks: QaLessonPick[];
};

/**
 * null for off-spine moduleIds (sidequests). They must rank LAST in both
 * the early and late orderings — returning 0 made every sidequest sort as
 * "module 0" and hijack the early pick for six step types (2026-07-12
 * audit). They stay eligible as a last resort: phrase_card ships only in
 * the survival-phrases sidequest today.
 */
function moduleNum(moduleId: string): number | null {
  const m = /^m(\d+)$/.exec(moduleId);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Scans every static lesson and, for each step type, selects 1-2 real
 * lessons a human can play to see that step type in production context.
 *
 * `languageId` filter is load-bearing: the LESSONS index holds BOTH ja and
 * ko curricula, and lesson routes render whatever id they're given under
 * any `/:lang/` prefix — without the filter the ja QA page links Korean
 * lessons (found live: /ja/learn/lessons/ko-m3-4).
 */
export function buildStepTypeCoverage(languageId: string): StepTypeCoverage[] {
  const byType = new Map<StepType, QaLessonPick[]>();
  for (const type of ALL_STEP_TYPES) byType.set(type, []);

  for (const lessonId of getAvailableMockLessonIds()) {
    const content = getMockLessonContent(lessonId);
    if (!content || content.languageId !== languageId) continue;
    const counts = new Map<StepType, number>();
    for (const step of content.steps) {
      counts.set(step.type, (counts.get(step.type) ?? 0) + 1);
    }
    for (const [type, count] of counts) {
      byType.get(type)?.push({
        lessonId,
        title: content.title,
        moduleId: content.moduleId,
        count,
      });
    }
  }

  return ALL_STEP_TYPES.map((type) => {
    const candidates = byType.get(type) ?? [];
    const earlyFirst = [...candidates].sort(
      (a, b) =>
        (moduleNum(a.moduleId) ?? Infinity) -
          (moduleNum(b.moduleId) ?? Infinity) ||
        b.count - a.count ||
        a.lessonId.localeCompare(b.lessonId),
    );
    const lateFirst = [...candidates].sort(
      (a, b) =>
        (moduleNum(b.moduleId) ?? -Infinity) -
          (moduleNum(a.moduleId) ?? -Infinity) ||
        b.count - a.count ||
        a.lessonId.localeCompare(b.lessonId),
    );
    const first = earlyFirst[0];
    const second = first
      ? lateFirst.find((p) => p.lessonId !== first.lessonId)
      : undefined;
    return {
      type,
      totalLessons: candidates.length,
      picks: first ? (second ? [first, second] : [first]) : [],
    };
  });
}
