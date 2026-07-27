/**
 * Curriculum lesson-count guard (M2 compact restructure 2026-05-16,
 * yoon-capstone removed 2026-05-17 per Hannah audit, per-row row-tests
 * retired 2026-07-20 — module mastery now gates on the recap).
 *
 * Per spec:
 *   M1 = pure hiragana → 31 lessons (3 vowels + 9 rows × 3 content + recap).
 *        Hand-authored end-to-end.
 *   M2 = dakuten/handakuten + yōon + recap → 28 lessons.
 *        Each voiced row (g/z/d/b/p): 3 content = 3 × 5 = 15.
 *        Each yōon row (intro/sh-ch/voiced/rare): 3 content = 3 × 4 = 12.
 *        + recap = 1 → 28.
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

  it("M1 has 31 lessons (pure hiragana, no yōon)", () => {
    const m1 = course.modules.find((m) => m.id === "m1")!;
    expect(m1).toBeDefined();
    // 3 vowels (a-i-u / e-o / full review)
    //   + (9 × 3-node rows: ka/sa/ta/na/ha/ma/ya/ra/wa)
    //   + 1 recap
    // = 3 + 27 + 1 = 31
    expect(m1.lessons.length).toBe(31);
    // No yōon ids leak into m1.
    for (const lesson of m1.lessons) {
      expect(lesson.id.includes("yoon-")).toBe(false);
    }
    // Per-row row-tests were retired 2026-07-20 — no -test node survives.
    for (const lesson of m1.lessons) {
      expect(lesson.id.endsWith("-test")).toBe(false);
    }
  });

  it("M2 has 28 lessons (every row uses the g-row 3-sub template)", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    expect(m2).toBeDefined();
    // 2026-05-17: every dakuten/yōon row mirrors the g-row template
    // (3 hand-authored sub-lessons). Hannah audit removed the standalone
    // yoon-capstone — its cross-row coverage is absorbed by m2-recap, which
    // pulls items from every yōon row already. Per-row row-tests were
    // retired 2026-07-20 (mastery gates on the recap).
    //   Voiced rows (g, z, d, b, p): 5 × 3 content = 15
    //   Yōon rows (intro, sh-ch, voiced, rare): 4 × 3 content = 12
    //   Recap: 1
    //   Total = 15 + 12 + 1 = 28
    expect(m2.lessons.length).toBe(28);
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

  it("no voiced row has a per-row row-test (retired 2026-07-20)", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    for (const rowId of ["g", "z", "d", "b", "p"]) {
      const testId = `ja-m1-${rowId}-test`;
      expect(
        m2.lessons.some((l) => l.id === testId),
        `${rowId} row should no longer have a -test lesson`,
      ).toBe(false);
    }
  });

  it("no yōon row has a per-row row-test (retired 2026-07-20)", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    for (const rowId of ["yoon-intro", "yoon-sh-ch", "yoon-voiced", "yoon-rare"]) {
      const testId = `ja-m1-${rowId}-test`;
      expect(
        m2.lessons.some((l) => l.id === testId),
        `${rowId} should no longer have a -test lesson`,
      ).toBe(false);
    }
  });

  // ── Rewrite spine (draft-3, 2026-07-19) ────────────────────────────────
  // The old m3-m28 map (First sentences … N5 Mastery) was replaced by the
  // dict-form-first spine (src/features/lesson/dev/spinePlan.ts). The old
  // per-module count/katakana-lead assertions moved out with it — the old
  // lessons stay registered in mockLessons (deep-link only), which the
  // lesson-data suites still cover.

  it("M3 is the m3-neo pilot (7 lessons, ends on the review)", () => {
    const m3 = course.modules.find((m) => m.id === "m3")!;
    expect(m3).toBeDefined();
    expect(m3.comingSoon).toBeFalsy();
    expect(m3.lessons.map((l) => l.id)).toEqual([
      "ja-m3-neo-1",
      "ja-m3-neo-2",
      "ja-m3-neo-3",
      "ja-m3-neo-4",
      "ja-m3-neo-5",
      "ja-m3-neo-6",
      "ja-m3-neo-review",
    ]);
    expect(m3.lessons[m3.lessons.length - 1].title).toMatch(/review/i);
  });

  it("m24-m29 are comingSoon spine placeholders (visible, zero lessons)", () => {
    // m4/m5/m6 (2026-07-20), m7-m11 (2026-07-26, the first modules on the
    // 11+3+1 shape), m12 (tile s09), m13 (tile n05), m14 (2026-07-27, tile
    // n06b), m15 (2026-07-27, tile s11), m16 (2026-07-27, tile s13), m17
    // (2026-07-27, tile n07), m18 (2026-07-27, tile n08), m19 (2026-07-27,
    // tile s15), m20 (2026-07-27, tile n09), m21 (2026-07-27, tile s19),
    // m22 (2026-07-27, tile s17) and m23 (2026-07-27, tile s22) are authored
    // via the compiler pipeline. The frontier advances as rewrite cycles land
    // modules.
    for (let n = 24; n <= 29; n++) {
      const mod = course.modules.find((m) => m.id === `m${n}`)!;
      expect(mod, `m${n} missing`).toBeDefined();
      expect(mod.comingSoon, `m${n} must be comingSoon`).toBe(true);
      expect(mod.lessons.length, `m${n} must have no lessons yet`).toBe(0);
      expect(mod.tier ?? "n5", `m${n} is an N5 station`).toBe("n5");
    }
  });

  it("spine milestones land on the ladder-critical module numbers", () => {
    // parseModuleIndex drives the romaji/kanji ladders off the module
    // NUMBER, so the spine deliberately lands the ます/です register module
    // on m7 (hiragana-romaji cutoff) and navigation on m19 (katakana
    // cutoff re-anchor). m29 is the N5 capstone (tile s25).
    const byId = new Map(course.modules.map((m) => [m.id, m]));
    // m7 is authored now; its ます/です identity lives in the eyebrow.
    expect(`${byId.get("m7")!.title} ${byId.get("m7")!.eyebrow}`).toContain("ます");
    expect(byId.get("m19")!.title).toMatch(/Getting around/);
    expect(byId.get("m29")!.title).toMatch(/capstone/i);
  });

  it("N4 tier is m30 only (old m29 pilot absorbed by the spine renumber)", () => {
    const n4 = course.modules.filter((m) => m.tier === "n4");
    expect(n4.map((m) => m.id)).toEqual(["m30"]);
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
    // Asserts the invariant the name describes — consecutive m3..mN, nothing
    // interleaved — rather than a hardcoded snapshot of the list. The snapshot
    // form ended at m28 and had to be edited every time the course grew, which
    // makes a real regression (a gap, a stray `m5-review`) look identical to
    // "someone added a module". Content modules follow the two kana modules.
    const order = course.modules.map((m) => m.id).slice(2);
    const expected = order.map((_, i) => `m${i + 3}`);
    expect(order).toEqual(expected);
  });

  it("yoon-rare-3 is the final yōon node before recap", () => {
    const m2 = course.modules.find((m) => m.id === "m2")!;
    const yoonIds = m2.lessons.filter((l) => l.id.includes("yoon-"));
    // 2026-05-17 (Hannah audit): standalone yoon-capstone removed.
    // 2026-07-20: per-row row-tests retired —
    //   intro (3 content) + sh-ch (3) + voiced (3) + rare (3) = 12. The
    //   final yōon node is now yoon-rare-3 (the last content sub-lesson).
    //   m2-recap follows it as the climax + ★ mastery gate.
    expect(yoonIds.length).toBe(12);
    expect(yoonIds[yoonIds.length - 1].id).toBe("ja-m1-yoon-rare-3");
    // No yoon-capstone lesson should exist anywhere in M2.
    expect(
      m2.lessons.some((l) => l.id.includes("yoon-capstone")),
      "yoon-capstone lesson should have been removed",
    ).toBe(false);
  });
});
