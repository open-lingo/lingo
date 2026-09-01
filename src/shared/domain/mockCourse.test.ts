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
import { allStories } from "@/features/practice/content";

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
    // The story capstone (2026-07-31) sits AFTER the taught lessons — assert
    // the lesson spine separately so it stays pinned to the content.
    const taught = m3.lessons.filter((l) => l.kind !== "story");
    expect(taught.map((l) => l.id)).toEqual([
      "ja-m3-neo-1",
      "ja-m3-neo-2",
      "ja-m3-neo-3",
      "ja-m3-neo-4",
      "ja-m3-neo-5",
      "ja-m3-neo-6",
      "ja-m3-neo-review",
    ]);
    expect(taught[taught.length - 1].title).toMatch(/review/i);
    expect(m3.lessons[m3.lessons.length - 1].id).toBe("story:ja-m3-about-me");
  });

  it("the N5 map has NO comingSoon placeholders left — m29 finished the spine", () => {
    // 2026-07-27: m29 (tile s25, the N5 capstone) was the last unauthored
    // spine tile, so `SPINE_COMING_SOON` and its placeholder mapping were
    // DELETED from mockCourse rather than sliced to an empty tail. This test
    // was "m28-m29 are comingSoon spine placeholders" and then "m29 is a
    // comingSoon spine placeholder"; it now asserts the opposite, because
    // reality changed and the expectation follows reality.
    const n5 = course.modules.filter((m) => (m.tier ?? "n5") === "n5");
    expect(n5.length, "no N5 modules found — the map shape moved").toBeGreaterThan(20);
    const stillComingSoon = n5.filter((m) => m.comingSoon).map((m) => m.id);
    expect(stillComingSoon, stillComingSoon.join(", ")).toEqual([]);
  });

  it("m29 is the authored N5 capstone (14 lessons, challenge last)", () => {
    // 14 since 2026-08-26: ja-m29-neo-14 is the F18 freq-gap ender insert.
    const m29 = course.modules.find((m) => m.id === "m29")!;
    expect(m29, "m29 missing").toBeDefined();
    expect(m29.comingSoon).toBeFalsy();
    expect(m29.tier ?? "n5").toBe("n5");
    const taught = m29.lessons.filter((l) => l.kind !== "story");
    expect(taught).toHaveLength(14);
    expect(taught[taught.length - 1].id).toBe("ja-m29-neo-challenge");
    // …then the capstone read, which is the module's last node.
    expect(m29.lessons[m29.lessons.length - 1].id).toBe("story:ja-m29-cleaning-day");
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

  it("N4 tier is m30 = n4-01 .. m38 = n4-09, all authored", () => {
    const n4 = course.modules.filter((m) => m.tier === "n4");
    expect(n4.map((m) => m.id)).toEqual(["m30", "m31", "m32", "m33", "m34", "m35", "m36", "m37", "m38"]);
    // Spec A1 retired the July pilot and left a locked, lesson-less station;
    // spec A3 authored m30 = n4-01 「て + helper I: 〜てみる / 〜ておく」 in its
    // place (2026-08-14), m31 = n4-02 「Give & receive I:
    // あげる・くれる・もらう」 followed on 2026-08-15, m32 = n4-03
    // 「Conditionals I: たら (と as the contrast)」 on 2026-08-18, m33 =
    // n4-04 「Transitivity I: 自動詞/他動詞 — が vs を」 on 2026-08-19, m34 =
    // n4-05 「Volitional: よう/おう + とおもう, ことにする」 on 2026-08-24, m35 =
    // n4-06 「Give & receive II: 〜てあげる/てくれる/てもらう + asking
    // favors」, m36 = n4-07 「Looks like: 〜そう/がる/やすい・にくい/ながら」
    // (registration landing 2026-08-25), m37 = n4-08
    // 「Conditionals II: ば + なら」 (registration landing 2026-08-25), and
    // m38 = n4-09 「て + helper II: 〜てしまう/ちゃう + 〜ていく/〜てくる」
    // (registration landing 2026-08-25). Shape is inv 25 for all nine: 3
    // review lessons and challenge LAST. m30-m32 run 13 lessons (9
    // teaching); m33 runs 14 (10 teaching) because nine transitivity pairs
    // need a fourth teaching block; m34-m38 run 12 (8 teaching) — inv 25's
    // ceiling is 15. A tile may also carry story rows (m32 does) — reading
    // attachments, not lessons, so they are filtered out first.
    const LESSON_COUNT: Record<string, number> = { m30: 13, m31: 13, m32: 13, m33: 14, m34: 12, m35: 12, m36: 12, m37: 12, m38: 12 };
    for (const m of n4) {
      const lessons = m.lessons.filter((l) => l.kind !== "story");
      expect(m.comingSoon, `${m.id} is flagged comingSoon`).toBeUndefined();
      expect(lessons, `${m.id} lesson count`).toHaveLength(LESSON_COUNT[m.id]);
      expect(
        lessons.filter((l) => /-review(-\d+)?$/.test(l.id)),
        `${m.id} review count`,
      ).toHaveLength(3);
      expect(lessons[lessons.length - 1].id).toBe(`ja-${m.id}-neo-challenge`);
    }
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

/**
 * Story capstone nodes (2026-07-31) — one promoted read per module, LAST in
 * the module so it reads as the capstone.
 *
 * These are MANDATORY rows: `getModuleStatus` counts every non-review row, so
 * a node whose story does not resolve is a module the learner can never
 * finish. And a story authored above its module's level would be an
 * unreadable wall, since the pathway hands it to them at that module.
 */
describe("story pathway nodes", () => {
  for (const langId of ["ja", "ko"]) {
    describe(langId, () => {
      const course = getMockCourse(langId);
      const stories = allStories(langId);
      const rows = course.modules.flatMap((m) =>
        (m.lessons ?? []).filter((l) => l.kind === "story").map((l) => ({ mod: m, row: l })),
      );

      it("the course promotes story nodes at all", () => {
        expect(rows.length).toBeGreaterThan(0);
      });

      it("every story node resolves to authored content at or below its module", () => {
        for (const { mod, row } of rows) {
          const story = stories.find((s) => s.id === row.storyId);
          expect(story, `${row.id} points at a story that does not exist`).toBeDefined();
          expect(
            story!.module,
            `${row.id} promotes a story authored for m${story!.module} into ${mod.id}`,
          ).toBeLessThanOrEqual(parseInt(mod.id.slice(1), 10));
        }
      });

      it("the row id is the story id under the `story:` namespace", () => {
        for (const { row } of rows) {
          expect(row.id).toBe(`story:${row.storyId}`);
        }
      });

      it("at most one per module, and always the module's last node", () => {
        for (const mod of course.modules) {
          const lessons = mod.lessons ?? [];
          const storyRows = lessons.filter((l) => l.kind === "story");
          expect(storyRows.length, `${mod.id} has ${storyRows.length} story nodes`).toBeLessThan(2);
          if (storyRows.length === 1) {
            expect(lessons[lessons.length - 1].id, `${mod.id}'s story is not last`).toBe(
              storyRows[0].id,
            );
          }
        }
      });
    });
  }
});
