/**
 * KO M1 curriculum — row lessons + the cross-row capstone tail.
 *
 * Lesson-count pin (R4 re-author 2026-09-01): before the capstone landed,
 * m1's rows were tested only within themselves — no cross-row confusable
 * work anywhere. The pin catches silent drift if the row table or the tail
 * gets re-edited; update the expected counts only on an intentional layout
 * change (m2.test.ts is the sibling pattern).
 */
import { describe, it, expect } from "vitest";
import { buildAllKoreanRowLessons, KO_M1_ROWS } from "./m1-rows";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

describe("KO M1 curriculum", () => {
  it("builds 9 rows × 3 sub-lessons + 2 capstone lessons = 29", () => {
    const lessons = buildAllKoreanRowLessons();
    expect(KO_M1_ROWS.length).toBe(9);
    expect(lessons.length).toBe(29);
    expect(lessons.every((l) => l.moduleId === "m1")).toBe(true);
    expect(lessons.every((l) => l.languageId === "ko")).toBe(true);
  });

  it("the capstone is the module tail — confusables then the mixed read, last", () => {
    const ids = buildAllKoreanRowLessons().map((l) => l.id);
    // Review-after placement (interleave law): the cross-row work follows
    // the full row march, mirroring m2's bt-review tail.
    expect(ids[ids.length - 2]).toBe("ko-m1-mix-1");
    expect(ids[ids.length - 1]).toBe("ko-m1-mix-2");
  });

  it("capstone glyph drills stay inside m1's taught inventory", () => {
    // Census guard: every block surfaced by the two capstone lessons must be
    // an m1-taught block (vowel blocks or one of the 9 rows × 6) — no m2
    // aspirated/tense/compound glyphs may leak back into m1.
    const taught = new Set([
      "아", "어", "오", "우", "으", "이",
      ...KO_M1_ROWS.flatMap((r) => r.blocks.map((b) => b.block)),
    ]);
    const capstones = buildAllKoreanRowLessons().filter((l) =>
      l.id.startsWith("ko-m1-mix-"),
    );
    expect(capstones.length).toBe(2);
    for (const lesson of capstones) {
      for (const step of lesson.steps) {
        const s = step as unknown as {
          payload?: { symbol?: string };
          options?: { symbol?: string; word?: string }[];
          pairs?: { source: string }[];
          tiles?: string[];
          targetSentence?: string;
        };
        const blocks: string[] = [];
        if (s.payload?.symbol) blocks.push(s.payload.symbol);
        for (const o of s.options ?? []) {
          if (o.symbol) blocks.push(o.symbol);
          if (o.word) blocks.push(...Array.from(o.word));
        }
        for (const p of s.pairs ?? []) blocks.push(p.source);
        for (const t of s.tiles ?? []) blocks.push(...Array.from(t));
        if (s.targetSentence) blocks.push(...Array.from(s.targetSentence));
        for (const b of blocks) {
          if (!/[가-힣]/.test(b)) continue;
          expect(taught.has(b), `${lesson.id}/${step.id}: untaught block "${b}"`).toBe(true);
        }
      }
    }
  });

  it("lesson ids are unique", () => {
    const lessons = buildAllKoreanRowLessons();
    const ids = new Set(lessons.map((l) => l.id));
    expect(ids.size).toBe(lessons.length);
  });

  it("every M1 pathway node resolves to lesson content", () => {
    const course = getMockCourse("ko");
    const m1 = course.modules.find((m) => m.id === "m1");
    expect(m1).toBeDefined();
    // intro + 2 vowel lessons + 27 row lessons + 2 capstone lessons.
    expect(m1!.lessons.length).toBe(32);
    for (const lesson of m1!.lessons) {
      const content = getMockLessonContent(lesson.id);
      expect(content, `M1 pathway node '${lesson.id}' has no content`).not.toBeNull();
      expect(content?.steps.length ?? 0).toBeGreaterThan(0);
    }
  });
});
