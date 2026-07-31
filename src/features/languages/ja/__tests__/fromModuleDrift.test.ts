import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { JA_COURSE_ATOMS } from "../courseAtoms";
import { parseModuleIndex } from "@/shared/settings/romanizationAutoFlip";

/**
 * FROMMODULE TRUTH TABLE (stale-reference audit 2026-07-29, regression
 * class 2 — the systematic version of the ちち/どようび finds).
 *
 * `atom.fromModule` is OLD-course provenance (docs/authoring-workflow.md:
 * "the old tags are ruining us"), but it is still LOAD-BEARING in live code:
 *   - the D2 content-review SRS gate (`shouldWriteContentReviewAtom`) writes
 *     only when fromModule is strictly earlier than the lesson's module,
 *   - the grammar-review comprehensibility gate resolves "would the learner
 *     know this word yet?" through fromModule,
 *   - the module-fallback unlock path buckets atoms by fromModule.
 *
 * This test derives each atom's FIRST-EXERCISED module by walking the live
 * map in course order (any step whose `exercisedAtoms` names the atom — the
 * same instrument as atomExposureAudit.test.ts) and diffs it against
 * fromModule. Two failure directions, ratcheted separately:
 *
 *   - EARLY-TAG (fromModule < first-exercised): the gates believe the word
 *     is known EARLIER than the live course teaches it → comprehensibility-
 *     gate dishonesty (B070 class) and premature D2 writes.
 *   - LATE-TAG (fromModule > first-exercised): the word is exercised before
 *     its claimed home → D2 never writes for it in its real home module and
 *     the fallback unlock fires late or never (B068 residual class).
 *
 * DO NOT mass-edit courseAtoms.ts to clear these: the vocab-pack wave
 * re-homes fromModule per pack (memory: lingle-vocab-coverage-wave). Lower
 * the pins as packs land. Full table:
 *   STALE_REPORT=1 npx vitest run fromModuleDrift
 * → /tmp/ja-frommodule-drift.txt
 */

type DriftRow = {
  atomId: string;
  kana: string;
  fromModule: string;
  fromIdx: number;
  firstIdx: number;
  firstLessonId: string;
  direction: "early-tag" | "late-tag";
};

function computeDrift(): { rows: DriftRow[]; exercisedAtomCount: number } {
  const course = getMockCourse("ja");
  // First-exercised module per atom, walking the map in learner order.
  const first = new Map<string, { moduleIdx: number; lessonId: string }>();
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const content = getMockLessonContent(lesson.id);
      if (!content) continue;
      const moduleIdx = parseModuleIndex(mod.id);
      if (moduleIdx <= 0) continue;
      for (const step of content.steps) {
        const ex = (step as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
        for (const raw of ex) {
          const atomId = raw.replace(/^ja:/, "");
          if (!first.has(atomId)) first.set(atomId, { moduleIdx, lessonId: lesson.id });
        }
      }
    }
  }

  const rows: DriftRow[] = [];
  for (const atom of JA_COURSE_ATOMS) {
    const hit = first.get(atom.id);
    if (!hit) continue; // never exercised — atomExposureAudit's territory
    const fromIdx = /^m(\d+)$/.exec(atom.fromModule)
      ? parseInt(atom.fromModule.slice(1), 10)
      : -1;
    if (fromIdx < 0) continue; // "future"/"sidequest-survival" — not module-tagged
    if (fromIdx === hit.moduleIdx) continue;
    rows.push({
      atomId: atom.id,
      kana: atom.kana,
      fromModule: atom.fromModule,
      fromIdx,
      firstIdx: hit.moduleIdx,
      firstLessonId: hit.lessonId,
      direction: fromIdx < hit.moduleIdx ? "early-tag" : "late-tag",
    });
  }
  return { rows, exercisedAtomCount: first.size };
}

describe("fromModule vs live first-exercised module (truth table)", () => {
  const { rows, exercisedAtomCount } = computeDrift();

  it("instrument control: the walk exercises a real population and flags a known mismatch", () => {
    // Population guard — an empty walk would make every ratchet vacuous.
    expect(exercisedAtomCount).toBeGreaterThan(400);
    // Positive control (verified by hand 2026-07-29): ちち is tagged m8 but
    // the live course first exercises it in m17 (family lessons). If the
    // pack wave re-homes it, swap in another verified row before deleting.
    const chichi = rows.find((r) => r.kana === "ちち");
    expect(
      chichi,
      "ちち (fromModule m8, first exercised m17) disappeared from the drift " +
        "table — if it was legitimately re-homed, update this control to " +
        "another verified mismatch so the detector stays positive-controlled.",
    ).toBeDefined();
  });

  it("EARLY-TAG (gate-dishonesty) count only goes DOWN", () => {
    const early = rows.filter((r) => r.direction === "early-tag");
    // Measured 196 on 2026-07-29 (mid m11-pack wave). Pinned with small
    // headroom because pack landings transiently shift first-exercised
    // modules; tighten to the measured value once the wave settles.
    // Measured 194 on 2026-07-29 after packs 1-4's re-homes (was 196 at
    // first measurement). The pack wave lowers this per pack -- re-pin down.
    // Measured 193 on 2026-07-30 after the m16 packs 5-6 re-homes.
    const MAX_EARLY_TAG = 193;
    expect(
      early.length,
      `early-tagged atoms (fromModule earlier than the live course teaches):\n` +
        early
          .map((r) => `${r.kana}\t${r.atomId}\t${r.fromModule}→first m${r.firstIdx} (${r.firstLessonId})`)
          .join("\n"),
    ).toBeLessThanOrEqual(MAX_EARLY_TAG);
  });

  it("LATE-TAG (unlock-blocker) count only goes DOWN", () => {
    const late = rows.filter((r) => r.direction === "late-tag");
    // Measured 44 on 2026-07-29 (mid m11-pack wave); headroom as above.
    // Measured 44 on 2026-07-29 (stable across packs 1-4).
    const MAX_LATE_TAG = 44;
    expect(
      late.length,
      `late-tagged atoms (exercised before their claimed fromModule home):\n` +
        late
          .map((r) => `${r.kana}\t${r.atomId}\t${r.fromModule}→first m${r.firstIdx} (${r.firstLessonId})`)
          .join("\n"),
    ).toBeLessThanOrEqual(MAX_LATE_TAG);
  });

  it("report: full truth table when STALE_REPORT=1", () => {
    if (!process.env.STALE_REPORT) return;
    const sorted = [...rows].sort(
      (a, b) => Math.abs(b.firstIdx - b.fromIdx) - Math.abs(a.firstIdx - a.fromIdx),
    );
    writeFileSync(
      "/tmp/ja-frommodule-drift.txt",
      [
        `fromModule ≠ first-exercised module: ${rows.length} atoms ` +
          `(early-tag ${rows.filter((r) => r.direction === "early-tag").length}, ` +
          `late-tag ${rows.filter((r) => r.direction === "late-tag").length}) ` +
          `of ${exercisedAtomCount} exercised`,
        "sorted by |drift|; early-tag = gate-dishonesty, late-tag = unlock-blocker",
        "",
        ...sorted.map(
          (r) =>
            `${r.direction}\t${r.kana}\t${r.atomId}\ttag ${r.fromModule} vs live m${r.firstIdx}\t(${r.firstLessonId})`,
        ),
      ].join("\n"),
    );
    expect(true).toBe(true);
  });
});
