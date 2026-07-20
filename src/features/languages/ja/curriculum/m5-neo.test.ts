/**
 * m5-neo module guards — the shared authoring bar (with requireCapstone,
 * invariant 26) plus the cross-half checks neither authoring agent could
 * run alone: review freshness vs lessons 1-11 and registration integrity.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { M5_NEO_LESSONS, M5_NEO_REVIEW } from "./m5-neo";

registerJaModuleContentLints("m5");

registerModuleBarGuards({
  moduleLabel: "m5-neo",
  lessons: M5_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4"],
  canon: COURSE_CANON,
  minLessons: 12,
  requireCapstone: true,
  requireImageFirst: true,
});

describe("m5-neo cross-half checks", () => {
  it("all 12 lessons registered under deep-link ids in order", () => {
    const ids = M5_NEO_LESSONS.map((l) => l.id);
    expect(ids).toEqual([
      "ja-m5-neo-1", "ja-m5-neo-2", "ja-m5-neo-3", "ja-m5-neo-4",
      "ja-m5-neo-5", "ja-m5-neo-6", "ja-m5-neo-7", "ja-m5-neo-8",
      "ja-m5-neo-9", "ja-m5-neo-10", "ja-m5-neo-11", "ja-m5-neo-review",
    ]);
    for (const id of ids) {
      expect(getMockLessonContent(id)?.id, id).toBe(id);
    }
  });

  it("review reuses no earlier audioText verbatim (fresh-sentence rule, whole module)", () => {
    const earlier = new Set<string>();
    for (const lesson of M5_NEO_LESSONS) {
      if (lesson.id === "ja-m5-neo-review") continue;
      for (const s of lesson.steps as any[]) {
        for (const t of [s.audioText, s.target, s.targetPhrase]) {
          if (typeof t === "string") earlier.add(t.replace(/[。\s　]/g, ""));
        }
      }
    }
    const reused: string[] = [];
    for (const s of M5_NEO_REVIEW.steps as any[]) {
      for (const t of [s.audioText, s.target, s.targetPhrase]) {
        if (typeof t !== "string") continue;
        const norm = t.replace(/[。\s　]/g, "");
        if (norm.length > 6 && earlier.has(norm)) reused.push(t);
      }
    }
    expect(reused, `review reuses: ${reused.join(", ")}`).toEqual([]);
  });
});
