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

  it("M2 has 38 lessons (every row uses the g-row 3-sub + test template)", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    expect(m2).toBeDefined();
    // 2026-05-17 (Spencer extrapolation): every dakuten/yōon row mirrors
    // the g-row template (3 hand-authored sub-lessons + auto row-test).
    //   Voiced rows (g, z, d, b, p): 5 × (3 content + 1 test) = 20
    //   Yōon rows (intro, sh-ch, voiced, rare): 4 × (3 + 1) = 16
    //   Yōon capstone (test-only): 1
    //   Recap: 1
    //   Total = 20 + 16 + 1 + 1 = 38
    expect(m2.lessons.length).toBe(38);
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

  it("M3 has 8 lessons (restructure 2026-05-16)", () => {
    const m3 = course.modules.find((m) => m.id === "m3")!;
    expect(m3).toBeDefined();
    expect(m3.comingSoon).toBeFalsy();
    expect(m3.lessons.length).toBe(8);
    for (let i = 1; i <= 8; i++) {
      expect(m3.lessons.some((l) => l.id === `ja-m3-${i}`)).toBe(true);
    }
  });

  it("M3 final lesson is the mastery test", () => {
    const m3 = course.modules.find((m) => m.id === "m3")!;
    const last = m3.lessons[m3.lessons.length - 1];
    expect(last.id).toBe("ja-m3-8");
    expect(last.title).toMatch(/Test|Mastery/i);
  });

  it("M4 has 8 lessons (possessives + pointers)", () => {
    const m4 = course.modules.find((m) => m.id === "m4")!;
    expect(m4.comingSoon).toBeFalsy();
    expect(m4.lessons.length).toBe(8);
  });

  it("M5 has 8 lessons (numbers + counters)", () => {
    const m5 = course.modules.find((m) => m.id === "m5")!;
    expect(m5.comingSoon).toBeFalsy();
    expect(m5.lessons.length).toBe(8);
  });

  it("M6 has 9 lessons (locations + に/で/が)", () => {
    const m6 = course.modules.find((m) => m.id === "m6")!;
    expect(m6.comingSoon).toBeFalsy();
    expect(m6.lessons.length).toBe(9);
  });

  it("M7 has 9 lessons (verbs + を)", () => {
    const m7 = course.modules.find((m) => m.id === "m7")!;
    expect(m7.comingSoon).toBeFalsy();
    expect(m7.lessons.length).toBe(9);
  });

  it("4 inter-module review modules exist (m3-review..m6-review)", () => {
    for (const id of ["m3-review", "m4-review", "m5-review", "m6-review"]) {
      const m = course.modules.find((x) => x.id === id);
      expect(m, `${id} review module missing`).toBeDefined();
      expect(m!.lessons.length).toBe(4); // 3 review lessons + 1 mastery test
      for (const l of m!.lessons) {
        expect(l.kind).toBe("module_review");
      }
    }
  });

  it("review modules are interleaved between content modules in order", () => {
    const order = course.modules.map((m) => m.id);
    expect(order.slice(2)).toEqual([
      "m3", "m3-review",
      "m4", "m4-review",
      "m5", "m5-review",
      "m6", "m6-review",
      "m7",
    ]);
  });

  it("yōon-capstone is the final yōon node before recap", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    const yoonIds = m2.lessons.filter((l) => l.id.includes("yoon-"));
    // 2026-05-17: yōon rows now use g-row template too —
    //   intro (3 content + test) + sh-ch (3 + test) + voiced (3 + test)
    //   + rare (3 + test) + capstone (test only) = 17
    expect(yoonIds.length).toBe(17);
    expect(yoonIds[yoonIds.length - 1].id).toBe("ja-m1-yoon-capstone-test");
  });
});
