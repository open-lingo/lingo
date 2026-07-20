/**
 * m4-neo module guards — the shared authoring bar (moduleBarGuards) plus
 * the cross-half checks neither authoring agent could run alone:
 * review-lesson freshness vs lessons 1-11 and registration integrity.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { M4_NEO_LESSONS, M4_NEO_REVIEW } from "./m4-neo";

registerJaModuleContentLints("m4");

registerModuleBarGuards({
  moduleLabel: "m4-neo",
  lessons: M4_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3"],
  canon: COURSE_CANON,
  minLessons: 12,
});

describe("m4-neo cross-half checks", () => {
  it("all 12 lessons registered under deep-link ids in order", () => {
    const ids = M4_NEO_LESSONS.map((l) => l.id);
    expect(ids).toEqual([
      "ja-m4-neo-1", "ja-m4-neo-2", "ja-m4-neo-3", "ja-m4-neo-4",
      "ja-m4-neo-5", "ja-m4-neo-6", "ja-m4-neo-7", "ja-m4-neo-8",
      "ja-m4-neo-9", "ja-m4-neo-10", "ja-m4-neo-11", "ja-m4-neo-review",
    ]);
    for (const id of ids) {
      expect(getMockLessonContent(id)?.id, id).toBe(id);
    }
  });

  it("review reuses no earlier audioText verbatim (fresh-sentence rule, whole module)", () => {
    const earlier = new Set<string>();
    for (const lesson of M4_NEO_LESSONS) {
      if (lesson.id === "ja-m4-neo-review") continue;
      for (const s of lesson.steps as any[]) {
        for (const t of [s.audioText, s.target, s.targetPhrase]) {
          if (typeof t === "string") earlier.add(t.replace(/[。\s　]/g, ""));
        }
      }
    }
    const reused: string[] = [];
    for (const s of M4_NEO_REVIEW.steps as any[]) {
      for (const t of [s.audioText, s.target, s.targetPhrase]) {
        if (typeof t !== "string") continue;
        const norm = t.replace(/[。\s　]/g, "");
        // Single words are shared review vocab, not authored sentences.
        if (norm.length > 6 && earlier.has(norm)) reused.push(t);
      }
    }
    expect(reused, `review reuses: ${reused.join(", ")}`).toEqual([]);
  });
});
