import { describe, expect, it } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import type { BuildSentenceStep, LessonContent } from "../types";
import { getMockLessonContent } from "./mockLessons";
import { minDistractorsFor, padBuildTileFloor } from "./buildTileFloor";

/**
 * build_sentence / listening_build distractor floor (Spencer QA
 * 2026-07-16: "we give them the answer a little too easy... can we add
 * more [distractors]"). Backfill is a central pass in getMockLessonContent
 * — see buildTileFloor.ts header for the full design note. This file
 * mirrors matchPairsPairCount.test.ts / matchPairsFloorDispatch.test.ts's
 * split: whole-course sweep (the regression gate) + synthetic-lesson unit
 * tests (the contract, independent of live content drifting).
 */

function languageLessonIds(languageId: string): string[] {
  const course = getMockCourse(languageId);
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

describe("minDistractorsFor", () => {
  it("scales down for 2-tile answers, fills the picker grid at 1, caps at 3", () => {
    expect(minDistractorsFor(0)).toBe(0);
    // 1-tile answers render as the MCQ-shaped picker, which needs 4 options
    // to paint a 2x2 grid instead of giant stretched rows (2026-07-24).
    expect(minDistractorsFor(1)).toBe(3);
    expect(minDistractorsFor(2)).toBe(2);
    expect(minDistractorsFor(3)).toBe(3);
    expect(minDistractorsFor(4)).toBe(3);
    expect(minDistractorsFor(9)).toBe(3);
  });
});

describe("word-granularity build tile floor — whole-course sweep", () => {
  it.each(["ja", "es", "ko"])(
    "every word-granularity build_sentence/listening_build step in %s meets its floor",
    (languageId) => {
      const violations: string[] = [];
      for (const id of languageLessonIds(languageId)) {
        const lesson = getMockLessonContent(id);
        if (!lesson) continue;
        for (const s of lesson.steps as unknown as Array<Record<string, unknown>>) {
          if (s.type !== "build_sentence" && s.type !== "listening_build") continue;
          if (s.granularity !== "word") continue;
          const tiles = s.tiles as string[];
          const correctOrder = s.correctOrder as string[];
          const distractors = tiles.length - correctOrder.length;
          const floor = minDistractorsFor(correctOrder.length);
          if (distractors < floor) {
            violations.push(
              `${id}/${s.id as string}: answer=${correctOrder.length} distractors=${distractors} floor=${floor}`,
            );
          }
        }
      }
      expect(violations, violations.join("\n")).toEqual([]);
    },
  );

  // A tile bank may legitimately repeat a token the SAME number of times
  // correctOrder needs it (いいえ needs two い tiles; a たり…たりする build
  // needs two たり tiles) — that's not a duplicate-distractor bug. The real
  // bug (task invariant: "distractors must never duplicate an answer
  // tile") is a tile appearing MORE times than correctOrder needs — a
  // "distractor" that's actually just a free extra correct tile, since
  // grading compares placed TEXT, not tile identity.
  //
  // No exemptions: the ja-m23 double-が authoring bugs flagged when this
  // gate landed (2026-07-16) were fixed the same day (duplicate が →
  // を distractor), so every step must now pass clean.
  const PRE_EXISTING_OVERSUPPLY_EXEMPTIONS = new Set<string>([]);

  it("no word-granularity build tile is oversupplied beyond what correctOrder needs", () => {
    const violations: string[] = [];
    for (const languageId of ["ja", "es", "ko"]) {
      for (const id of languageLessonIds(languageId)) {
        const lesson = getMockLessonContent(id);
        if (!lesson) continue;
        for (const s of lesson.steps as unknown as Array<Record<string, unknown>>) {
          if (s.type !== "build_sentence" && s.type !== "listening_build") continue;
          if (s.granularity !== "word") continue;
          const key = `${id}/${s.id as string}`;
          if (PRE_EXISTING_OVERSUPPLY_EXEMPTIONS.has(key)) continue;
          const tiles = s.tiles as string[];
          const correctOrder = s.correctOrder as string[];
          const needed = new Map<string, number>();
          for (const t of correctOrder) {
            const k = t.toLowerCase();
            needed.set(k, (needed.get(k) ?? 0) + 1);
          }
          const have = new Map<string, number>();
          for (const t of tiles) {
            const k = t.toLowerCase();
            have.set(k, (have.get(k) ?? 0) + 1);
          }
          // A pure distractor (needed = 0) must appear at most once; an
          // answer token must never exceed the count correctOrder needs.
          for (const [tile, count] of have) {
            const need = needed.get(tile) ?? 0;
            if (need === 0 && count > 1) {
              violations.push(`${key}: distractor "${tile}" x${count}`);
            } else if (need > 0 && count > need) {
              violations.push(`${key}: answer-token "${tile}" needed=${need} have=${count}`);
            }
          }
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});

function buildLesson(
  languageId: string,
  moduleId: string,
  step: BuildSentenceStep,
): LessonContent {
  return {
    id: `${languageId}-${moduleId}-pad-test`,
    moduleId,
    courseId: "mock-1",
    languageId,
    title: "pad test",
    steps: [step],
  };
}

describe("padBuildTileFloor — synthetic-lesson contract", () => {
  it("tops up a ja 3-tile-answer step with only 1 distractor to the 3-distractor floor", () => {
    const step: BuildSentenceStep = {
      id: "ja-pad-test-build",
      type: "build_sentence",
      prompt: "Build it",
      targetSentence: "いち に さん",
      tiles: ["いち", "に", "さん", "ねこ"],
      correctOrder: ["いち", "に", "さん"],
      granularity: "word",
    };
    const lesson = buildLesson("ja", "m5", step);
    const padded = padBuildTileFloor(lesson);
    const result = padded.steps[0] as BuildSentenceStep;
    expect(result.correctOrder).toEqual(step.correctOrder); // answer untouched
    expect(result.tiles.length - result.correctOrder.length).toBe(3);
    // Original tiles preserved verbatim (padding only appends).
    expect(result.tiles.slice(0, 4)).toEqual(step.tiles);
    // No fill duplicates an existing tile.
    const lower = result.tiles.map((t) => t.toLowerCase());
    expect(new Set(lower).size).toBe(lower.length);
  });

  it("does not touch a step already at/above its floor", () => {
    const step: BuildSentenceStep = {
      id: "ja-pad-test-build-2",
      type: "build_sentence",
      prompt: "Build it",
      targetSentence: "いち",
      tiles: ["に", "いち", "さん", "よん"],
      correctOrder: ["いち"],
      granularity: "word",
    };
    const lesson = buildLesson("ja", "m5", step);
    const padded = padBuildTileFloor(lesson);
    expect(padded).toBe(lesson); // identity — no change
  });

  it("leaves character-granularity steps untouched (alphabet acquisition is out of scope)", () => {
    const step: BuildSentenceStep = {
      id: "ja-pad-test-char",
      type: "build_sentence",
      prompt: "Spell it",
      targetSentence: "いち",
      tiles: ["い", "ち"],
      correctOrder: ["い", "ち"],
      granularity: "character",
    };
    const lesson = buildLesson("ja", "m1", step);
    const padded = padBuildTileFloor(lesson);
    expect(padded).toBe(lesson); // identity — no change
  });

  it("leaves a language with no wired atom pool untouched", () => {
    const step: BuildSentenceStep = {
      id: "fr-pad-test-build",
      type: "build_sentence",
      prompt: "Build it",
      targetSentence: "un deux trois",
      tiles: ["un", "deux", "trois"],
      correctOrder: ["un", "deux", "trois"],
      granularity: "word",
    };
    const lesson = buildLesson("fr", "m1", step);
    const padded = padBuildTileFloor(lesson);
    expect(padded).toBe(lesson); // identity — not a pooled language
  });
});
