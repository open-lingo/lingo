/**
 * Curriculum lesson-count guard (M2 compact restructure 2026-05-16,
 * yoon-capstone removed 2026-05-17 per Hannah audit).
 *
 * Per spec:
 *   M1 = pure hiragana → 39 lessons (vowels + 9 rows × 4 nodes + recap).
 *        Hand-authored end-to-end.
 *   M2 = dakuten/handakuten + yōon + recap → 37 lessons.
 *        Each voiced row (g/z/d/b/p): 3 content + 1 test = 4 × 5 = 20.
 *        Each yōon row (intro/sh-ch/voiced/rare): 3 + 1 = 4 × 4 = 16.
 *        + recap = 1 → 37.
 *        (Hannah audit 2026-05-17: standalone yoon-capstone removed; the
 *        m2-recap pool already pulls items from every yōon row.)
 *
 * Hard-coded counts catch silent drift if the catalog gets re-edited.
 * Update the expected counts (and bump the spec) if intentionally changing
 * the row/sub-lesson layout.
 */
import { describe, it, expect } from "vitest";
import { getMockCourse } from "./mockCourse";

describe("curriculum lesson counts", () => {
  const course = getMockCourse("ja");

  it("M1 has 40 lessons (pure hiragana, no yōon)", () => {
    const m1 = course.modules.find((m) => m.id === "m1")!;
    expect(m1).toBeDefined();
    // 3 vowels (a-i-u / e-o / full review)
    //   + (9 × 4-node rows: ka/sa/ta/na/ha/ma/ya/ra/wa)
    //   + 1 recap
    // = 3 + 36 + 1 = 40
    expect(m1.lessons.length).toBe(40);
    // No yōon ids leak into m1.
    for (const lesson of m1.lessons) {
      expect(lesson.id.includes("yoon-")).toBe(false);
    }
  });

  it("M2 has 37 lessons (every row uses the g-row 3-sub + test template)", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    expect(m2).toBeDefined();
    // 2026-05-17: every dakuten/yōon row mirrors the g-row template
    // (3 hand-authored sub-lessons + auto row-test). Hannah audit removed
    // the standalone yoon-capstone — its cross-row coverage is absorbed by
    // m2-recap, which pulls items from every yōon row already.
    //   Voiced rows (g, z, d, b, p): 5 × (3 content + 1 test) = 20
    //   Yōon rows (intro, sh-ch, voiced, rare): 4 × (3 + 1) = 16
    //   Recap: 1
    //   Total = 20 + 16 + 1 = 37
    expect(m2.lessons.length).toBe(37);
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

  it("M3 has 16 sub-lessons (sub-lesson restructure 2026-05-24)", () => {
    const m3 = course.modules.find((m) => m.id === "m3")!;
    expect(m3).toBeDefined();
    expect(m3.comingSoon).toBeFalsy();
    expect(m3.lessons.length).toBe(16);
  });

  it("M3 ends with review lessons", () => {
    const m3 = course.modules.find((m) => m.id === "m3")!;
    const last = m3.lessons[m3.lessons.length - 1];
    expect(last.title).toMatch(/Review/i);
  });

  it("M4 has 16 sub-lessons (possessives + pointers)", () => {
    const m4 = course.modules.find((m) => m.id === "m4")!;
    expect(m4.comingSoon).toBeFalsy();
    expect(m4.lessons.length).toBe(16);
  });

  it("M5 has 16 sub-lessons (numbers + counters)", () => {
    const m5 = course.modules.find((m) => m.id === "m5")!;
    expect(m5.comingSoon).toBeFalsy();
    expect(m5.lessons.length).toBe(16);
  });

  it("M6 has 18 sub-lessons (locations + に/で/が)", () => {
    const m6 = course.modules.find((m) => m.id === "m6")!;
    expect(m6.comingSoon).toBeFalsy();
    expect(m6.lessons.length).toBe(18);
  });

  it("M7 has 18 sub-lessons (verbs + を)", () => {
    const m7 = course.modules.find((m) => m.id === "m7")!;
    expect(m7.comingSoon).toBeFalsy();
    expect(m7.lessons.length).toBe(18);
  });

  it("no standalone inter-module Review pseudo-modules exist (removed 2026-05-18)", () => {
    // Compounding review now lives inside every M3-M7 sub-lesson tail per
    // docs/m3-m7-rebuild-spec-2026-05-18.md §3 — the standalone Review
    // pathway entries were retired as dead weight.
    for (const id of ["m3-review", "m4-review", "m5-review", "m6-review"]) {
      expect(course.modules.find((x) => x.id === id)).toBeUndefined();
    }
  });

  it("content modules sit in order with no review interleave", () => {
    const order = course.modules.map((m) => m.id);
    expect(order.slice(2)).toEqual(["m3", "m4", "m5", "m6", "m7"]);
  });

  it("yoon-rare-test is the final yōon node before recap", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    const yoonIds = m2.lessons.filter((l) => l.id.includes("yoon-"));
    // 2026-05-17 (Hannah audit): standalone yoon-capstone removed —
    //   intro (3 content + test) + sh-ch (3 + test) + voiced (3 + test)
    //   + rare (3 + test) = 16. The final yōon node is now yoon-rare-test
    //   (the last per-row test). m2-recap follows it as the climax beat.
    expect(yoonIds.length).toBe(16);
    expect(yoonIds[yoonIds.length - 1].id).toBe("ja-m1-yoon-rare-test");
    // No yoon-capstone lesson should exist anywhere in M2.
    expect(
      m2.lessons.some((l) => l.id.includes("yoon-capstone")),
      "yoon-capstone lesson should have been removed",
    ).toBe(false);
  });
});
