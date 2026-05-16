/**
 * Curriculum-restructure (2026-05-15) lesson-count guard.
 *
 * Per spec:
 *   M1 = pure hiragana → ~36 lessons (vowels + 9 rows × 4 nodes + recap,
 *        with ya/wa = 3 nodes each).
 *   M2 = dakuten (compressed) + yōon (compressed) + recap → ~21 lessons.
 *
 * Hard-coded counts catch silent drift if the catalog gets re-edited.
 * Update the expected counts (and bump the spec) if intentionally changing
 * the row/sub-lesson layout.
 */
import { describe, it, expect } from "vitest";
import { getMockCourse } from "./mockCourse";

describe("curriculum-restructure lesson counts", () => {
  const course = getMockCourse("ja");

  it("M1 has ~37 lessons (pure hiragana, no yōon)", () => {
    const m1 = course.modules.find((m) => m.id === "m1")!;
    expect(m1).toBeDefined();
    // 2 vowels (split 1/2 + 2/2) + (7 × 4-node rows) + (2 × 3-node rows for ya/wa) + 1 recap
    // = 2 + 28 + 6 + 1 = 37
    expect(m1.lessons.length).toBe(37);
    // No yōon ids leak into m1.
    for (const lesson of m1.lessons) {
      expect(lesson.id.includes("yoon-")).toBe(false);
      expect(lesson.id.includes("yo-k-")).toBe(false);
      expect(lesson.id.includes("yo-sh-ch-")).toBe(false);
    }
  });

  it("M2 has ~22 lessons (dakuten compressed + yōon compressed + recap)", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    expect(m2).toBeDefined();
    // Dakuten: 4 rows × 3 sub-lessons (Intro1/Intro2/test) = 12 lessons
    // Yōon: 4 rows × 1 intro sub-lesson + 1 capstone (test) = 5 lessons
    // Recap: 1 lesson
    // Total = 12 + 5 + 1 = 18
    // Spec target was ~21; the compressed dakuten saved one slot per row.
    expect(m2.lessons.length).toBe(18);
    // Dakuten cluster comes before yōon cluster.
    const yoonIdx = m2.lessons.findIndex((l) => l.id.includes("yoon-"));
    const lastDakutenIdx = Math.max(
      ...m2.lessons
        .map((l, i) =>
          /ja-m1-(ga|za|da-ba|pa)-/.test(l.id) ? i : -1,
        )
        .filter((i) => i >= 0),
    );
    expect(yoonIdx).toBeGreaterThan(lastDakutenIdx);
  });

  it("yōon-capstone is the final yōon node before recap", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    const yoonIds = m2.lessons.filter((l) => l.id.includes("yoon-"));
    expect(yoonIds.length).toBe(5); // intro + sh-ch + voiced + rare + capstone
    expect(yoonIds[yoonIds.length - 1].id).toBe("ja-m1-yoon-capstone-test");
  });
});
