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
  grammar_rule: 17,
  particle_cloze: 18,
  self_explanation_mcq: 19,
  dialogue_listen: 20,
  row_test: 21,
};

export const ALL_STEP_TYPES = (
  Object.keys(STEP_TYPE_ORDER) as StepType[]
).sort((a, b) => STEP_TYPE_ORDER[a] - STEP_TYPE_ORDER[b]);

/**
 * Step types that exist in the engine (and the fixture previewer) but are
 * not used by any shipped static lesson as of 2026-07-11. Discovered by the
 * qaCatalog coverage scan; pinned here so the coverage test fails loudly
 * when content starts (or stops) using one of these, instead of the QA
 * page silently linking nothing.
 */
export const UNUSED_STEP_TYPES: StepType[] = [
  "fill_blank",
  "symbol_production",
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

function moduleNum(moduleId: string): number {
  const m = /^m(\d+)$/.exec(moduleId);
  return m ? parseInt(m[1], 10) : 0;
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
        moduleNum(a.moduleId) - moduleNum(b.moduleId) ||
        b.count - a.count ||
        a.lessonId.localeCompare(b.lessonId),
    );
    const lateFirst = [...candidates].sort(
      (a, b) =>
        moduleNum(b.moduleId) - moduleNum(a.moduleId) ||
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
