import { describe, expect, it } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "./mockLessons";
import { MATCH_PAIRS_FLOOR, matchGridShape } from "./matchPairsFloor";

/**
 * match_pairs floor (Spencer 2026-06-13): a learner must not be able to
 * brute-force the last match by elimination, so every paddable grid offers
 * at least MATCH_PAIRS_FLOOR (6) pairs. Backfill is shape-aware and runs as
 * a central pass in getMockLessonContent.
 *
 * Two principled non-violations:
 *   - "other"-shape grids are EXEMPT: number grids (いち→1), the m7
 *     dictionary→masu conjugation grid, Korean blocks — closed/bespoke sets
 *     with no honest same-shape backfill.
 *   - POOL_EXHAUSTED: a romaji grid in the very first vowel lesson, where
 *     the only kana that exist in the course yet are the 5 vowels already
 *     in the grid — 5 is its natural ceiling, not an elimination hole.
 */
const POOL_EXHAUSTED = new Set<string>(["ja-vowel-3-match"]);

function allLessonIds(): string[] {
  const course = getMockCourse("ja");
  const ids: string[] = [];
  type LessonRef = { id: string };
  type ModuleShape = {
    lessons?: LessonRef[];
    lessonGroups?: { lessons?: LessonRef[] }[];
  };
  for (const mod of course.modules as unknown as ModuleShape[]) {
    for (const l of mod.lessons ?? []) ids.push(l.id);
    for (const g of mod.lessonGroups ?? []) {
      for (const l of g.lessons ?? []) ids.push(l.id);
    }
  }
  return ids;
}

describe("match_pairs floor of 6", () => {
  it("every paddable grid offers at least 6 pairs", () => {
    const violations: string[] = [];
    for (const id of allLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        if (s.type !== "match_pairs") continue;
        const shape = matchGridShape(s.pairs);
        if (shape === "other") continue; // exempt
        if (POOL_EXHAUSTED.has(s.id)) continue;
        if (s.pairs.length < MATCH_PAIRS_FLOOR) {
          violations.push(
            `${id}/${s.id}: ${s.pairs.length} pairs (${shape})`,
          );
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("backfilled pairs never duplicate a source within a grid", () => {
    const dupes: string[] = [];
    for (const id of allLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        if (s.type !== "match_pairs") continue;
        const sources = s.pairs.map((p: { source: string }) => p.source);
        if (new Set(sources).size !== sources.length) {
          dupes.push(`${id}/${s.id}: duplicate source`);
        }
      }
    }
    expect(dupes, dupes.join("\n")).toEqual([]);
  });
});
