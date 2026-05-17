/**
 * Curriculum lesson-count guard (M2 compact restructure 2026-05-16).
 *
 * Per spec:
 *   M1 = pure hiragana → 39 lessons (vowels + 9 rows × 4 nodes + recap).
 *        Hand-authored end-to-end.
 *   M2 = compact dakuten/handakuten + compact yōon + recap → 20 lessons.
 *        Each voiced row (g/z/d/b/p) = 1 content + 1 test = 10.
 *        Each yōon row (intro/sh-ch/voiced/rare) = 1 content + 1 test = 8.
 *        + yoon-capstone test-only = 1, + recap = 1 → 20.
 *
 * Hard-coded counts catch silent drift if the catalog gets re-edited.
 * Update the expected counts (and bump the spec) if intentionally changing
 * the row/sub-lesson layout.
 */
import { describe, it, expect } from "vitest";
import { getMockCourse } from "./mockCourse";

describe("curriculum lesson counts", () => {
  const course = getMockCourse("ja");

  it("M1 has 39 lessons (pure hiragana, no yōon)", () => {
    const m1 = course.modules.find((m) => m.id === "m1")!;
    expect(m1).toBeDefined();
    // 2 vowels (split 1/2 + 2/2)
    //   + (9 × 4-node rows: ka/sa/ta/na/ha/ma/ya/ra/wa)
    //   + 1 recap
    // = 2 + 36 + 1 = 39
    expect(m1.lessons.length).toBe(39);
    // No yōon ids leak into m1.
    for (const lesson of m1.lessons) {
      expect(lesson.id.includes("yoon-")).toBe(false);
    }
  });

  it("M2 has 20 lessons (5 voiced × 2 + 4 yōon × 2 + capstone + recap)", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    expect(m2).toBeDefined();
    // Voiced rows: 5 × (1 content + 1 test) = 10
    // Yōon rows: 4 × (1 content + 1 test) = 8
    // Yōon capstone (test-only): 1
    // Recap: 1
    // Total = 10 + 8 + 1 + 1 = 20
    expect(m2.lessons.length).toBe(20);
    // Dakuten cluster comes before yōon cluster.
    const yoonIdx = m2.lessons.findIndex((l) => l.id.includes("yoon-"));
    const lastDakutenIdx = Math.max(
      ...m2.lessons
        .map((l, i) =>
          /^ja-m1-(g|z|d|b|p)-/.test(l.id) ? i : -1,
        )
        .filter((i) => i >= 0),
    );
    expect(yoonIdx).toBeGreaterThan(lastDakutenIdx);
  });

  it("each voiced row has its own row-test", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    for (const rowId of ["g", "z", "d", "b", "p"]) {
      const testId = `ja-m1-${rowId}-test`;
      expect(
        m2.lessons.some((l) => l.id === testId),
        `${rowId} row missing -test lesson`,
      ).toBe(true);
    }
  });

  it("each non-capstone yōon row has its own row-test", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    for (const rowId of ["yoon-intro", "yoon-sh-ch", "yoon-voiced", "yoon-rare"]) {
      const testId = `ja-m1-${rowId}-test`;
      expect(
        m2.lessons.some((l) => l.id === testId),
        `${rowId} missing -test lesson`,
      ).toBe(true);
    }
  });

  it("M3 has 10 lessons (grammar spine, no longer comingSoon)", () => {
    const m3 = course.modules.find((m) => m.id === "m3")!;
    expect(m3).toBeDefined();
    expect(m3.comingSoon).toBeFalsy();
    expect(m3.lessons.length).toBe(10);
    for (let i = 1; i <= 10; i++) {
      expect(m3.lessons.some((l) => l.id === `ja-m3-${i}`)).toBe(true);
    }
  });

  it("M3 final lesson is the mastery test", () => {
    const m3 = course.modules.find((m) => m.id === "m3")!;
    const last = m3.lessons[m3.lessons.length - 1];
    expect(last.id).toBe("ja-m3-10");
    expect(last.title).toMatch(/Test|Mastery/i);
  });

  it("yōon-capstone is the final yōon node before recap", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    const yoonIds = m2.lessons.filter((l) => l.id.includes("yoon-"));
    // intro (content + test) + sh-ch (content + test) + voiced (content + test)
    //   + rare (content + test) + capstone (test only) = 9
    expect(yoonIds.length).toBe(9);
    expect(yoonIds[yoonIds.length - 1].id).toBe("ja-m1-yoon-capstone-test");
  });
});
