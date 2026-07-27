/**
 * m6-neo module guards — the shared authoring bar with NEO-PROVENANCE:
 * `priorLessons` derives "already known" from the actual m3/m4/m5-neo intro
 * steps (not stale fromModule tags), and `requireTeachFirst` forbids a word's
 * first exposure being a dialogue (invariant 33). m6 is compiled from
 * ir/m6.ir.json — this bar is what makes the compiler output trustworthy.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { M6_NEO_LESSONS } from "./m6-neo";
import { M3_NEO_LESSONS } from "./m3-neo";
import { M4_NEO_LESSONS } from "./m4-neo";
import { M5_NEO_LESSONS } from "./m5-neo";

registerJaModuleContentLints("m6");

registerModuleBarGuards({
  moduleLabel: "m6-neo",
  lessons: M6_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5"],
  priorLessons: [...M3_NEO_LESSONS, ...M4_NEO_LESSONS, ...M5_NEO_LESSONS],
  canon: COURSE_CANON,
  minLessons: 12,
  requireCapstone: true,
  requireImageFirst: true,
  requireTeachFirst: true,
});

describe("m6-neo (compiler-pipeline module)", () => {
  it("compiles 13 lessons under deep-link ids in order", () => {
    const ids = M6_NEO_LESSONS.map((l) => l.id);
    expect(ids).toEqual([
      "ja-m6-neo-1", "ja-m6-neo-2", "ja-m6-neo-3", "ja-m6-neo-4",
      "ja-m6-neo-5", "ja-m6-neo-6", "ja-m6-neo-7", "ja-m6-neo-8",
      "ja-m6-neo-9", "ja-m6-neo-10", "ja-m6-neo-11",
      // End-of-module stretch (Spencer 2026-07-24): the old modules'
      // "final challenge" pattern, revived — all m6 concepts combined.
      "ja-m6-neo-challenge",
      "ja-m6-neo-review",
    ]);
    for (const id of ids) {
      expect(getMockLessonContent(id)?.id, id).toBe(id);
    }
  });
});
