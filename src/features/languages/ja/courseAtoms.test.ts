/**
 * Sanity tests for ja-course-atoms.ts.
 *
 * Guards:
 *   - No duplicate atom IDs across the deck (atom IDs are stable forever).
 *   - Every M3_M7_REVIEW_POOL kana has a corresponding CourseAtom entry —
 *     the future migration that wires the review pool to read from this
 *     deck depends on every pool atom being represented.
 *   - Every non-"future" atom has a non-empty `introducedByLessonId`
 *     (warning-only — particles intentionally have none until lesson-step
 *     attribution lands, so this is a console.warn, not a failure).
 */
import { describe, expect, it } from "vitest";

import { M3_M7_REVIEW_POOL } from "@/features/languages/ja/grammarHelpers";
import {
  courseAtomToFlashcard,
  JA_COURSE_ATOMS,
  JA_COURSE_ATOMS_BY_KANA,
} from "./courseAtoms";

describe("ja-course-atoms", () => {
  it("has no duplicate IDs", () => {
    const seen = new Map<string, string>();
    const dupes: Array<{ id: string; first: string; second: string }> = [];
    for (const atom of JA_COURSE_ATOMS) {
      const prior = seen.get(atom.id);
      if (prior !== undefined) {
        dupes.push({ id: atom.id, first: prior, second: atom.kana });
      } else {
        seen.set(atom.id, atom.kana);
      }
    }
    if (dupes.length > 0) {
      // Surface the offending entries so the failure is actionable.
      // eslint-disable-next-line no-console
      console.error("Duplicate CourseAtom IDs:", dupes);
    }
    expect(dupes).toEqual([]);
  });

  it("covers every kana in M3_M7_REVIEW_POOL", () => {
    const missing: string[] = [];
    for (const ra of M3_M7_REVIEW_POOL) {
      if (!JA_COURSE_ATOMS_BY_KANA.has(ra.kana)) {
        missing.push(ra.kana);
      }
    }
    if (missing.length > 0) {
      // eslint-disable-next-line no-console
      console.error(
        "M3_M7_REVIEW_POOL kanas missing from JA_COURSE_ATOMS:",
        missing,
      );
    }
    expect(missing).toEqual([]);
  });

  it("warns on non-future atoms without introducedByLessonId", () => {
    const orphans = JA_COURSE_ATOMS.filter(
      (a) =>
        a.fromModule !== "future" &&
        a.kind !== "particle" &&
        !a.introducedByLessonId,
    );
    if (orphans.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `[ja-course-atoms] ${orphans.length} non-future, non-particle atom(s) lack introducedByLessonId:`,
        orphans.slice(0, 10).map((a) => ({ id: a.id, kana: a.kana, fromModule: a.fromModule })),
      );
    }
    // Warn-only — not a hard failure per the brief.
    expect(true).toBe(true);
  });

  it("indexes by kana and id match the array", () => {
    expect(JA_COURSE_ATOMS_BY_KANA.size).toBeLessThanOrEqual(JA_COURSE_ATOMS.length);
    for (const atom of JA_COURSE_ATOMS) {
      const found = JA_COURSE_ATOMS_BY_KANA.get(atom.kana);
      // Kana collisions resolved by disambiguated IDs — the by-kana map
      // picks the last occurrence, so the lookup just needs to return SOME
      // atom matching that kana.
      expect(found?.kana).toBe(atom.kana);
    }
  });
});

describe("courseAtomToFlashcard reading", () => {
  it("puts the kanji on the front and carries the kana as a reading", () => {
    const gakkou = JA_COURSE_ATOMS_BY_KANA.get("がっこう")!;
    const card = courseAtomToFlashcard(gakkou);
    expect(card.front).toBe("学校");
    expect(card.reading).toEqual({ surface: "学校", kana: "がっこう" });
    expect(card.front).not.toContain("(");
  });

  it("leaves kana-only atoms without a reading", () => {
    const kana = JA_COURSE_ATOMS_BY_KANA.get("これ")!;
    const card = courseAtomToFlashcard(kana);
    expect(card.front).toBe("これ");
    expect(card.reading).toBeUndefined();
  });

  it("never emits the old parenthesised front for any atom", () => {
    for (const atom of JA_COURSE_ATOMS_BY_KANA.values()) {
      expect(courseAtomToFlashcard(atom).front).not.toMatch(/\(.+\)$/);
    }
  });
});
