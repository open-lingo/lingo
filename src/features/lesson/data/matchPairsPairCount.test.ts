import { describe, expect, it } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "./mockLessons";
import {
  MATCH_PAIRS_FLOOR,
  matchGridShape,
  pickNonColliding,
} from "./matchPairsFloor";

/**
 * match_pairs floor (Spencer 2026-06-13): a learner must not be able to
 * brute-force the last match by elimination, so every paddable grid offers
 * at least MATCH_PAIRS_FLOOR (6) pairs. Backfill is shape-aware and runs as
 * a central pass in getMockLessonContent.
 *
 * Two principled non-violations:
 *   - "other"-shape grids are EXEMPT: number grids (いち→1), the m7
 *     dictionary→masu conjugation grid, Korean blocks — closed/bespoke sets
 *     with no honest same-shape backfill.
 *   - POOL_EXHAUSTED: a romaji grid in the very first vowel lesson, where
 *     the only kana that exist in the course yet are the 5 vowels already
 *     in the grid — 5 is its natural ceiling, not an elimination hole.
 */
const POOL_EXHAUSTED = new Set<string>(["ja-vowel-3-match"]);

function allLessonIds(): string[] {
  const course = getMockCourse("ja");
  const ids: string[] = [];
  type LessonRef = { id: string };
  type ModuleShape = {
    lessons?: LessonRef[];
    lessonGroups?: { lessons?: LessonRef[] }[];
  };
  for (const mod of course.modules as unknown as ModuleShape[]) {
    for (const l of mod.lessons ?? []) ids.push(l.id);
    for (const g of mod.lessonGroups ?? []) {
      for (const l of g.lessons ?? []) ids.push(l.id);
    }
  }
  return ids;
}

describe("match_pairs floor of 6", () => {
  it("every paddable grid offers at least 6 pairs", () => {
    const violations: string[] = [];
    for (const id of allLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        if (s.type !== "match_pairs") continue;
        const shape = matchGridShape(s.pairs);
        if (shape === "other") continue; // exempt
        if (POOL_EXHAUSTED.has(s.id)) continue;
        if (s.pairs.length < MATCH_PAIRS_FLOOR) {
          violations.push(
            `${id}/${s.id}: ${s.pairs.length} pairs (${shape})`,
          );
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("backfilled pairs never duplicate a source within a grid", () => {
    const dupes: string[] = [];
    for (const id of allLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        if (s.type !== "match_pairs") continue;
        const sources = s.pairs.map((p: { source: string }) => p.source);
        if (new Set(sources).size !== sources.length) {
          dupes.push(`${id}/${s.id}: duplicate source`);
        }
      }
    }
    expect(dupes, dupes.join("\n")).toEqual([]);
  });

  it("no grid renders two pairs with identical target text (elimination ambiguity)", () => {
    const dupes: string[] = [];
    for (const id of allLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        if (s.type !== "match_pairs") continue;
        const targets = s.pairs.map((p: { target: string }) =>
          p.target.toLowerCase(),
        );
        if (new Set(targets).size !== targets.length) {
          dupes.push(`${id}/${s.id}: duplicate target`);
        }
      }
    }
    expect(dupes, dupes.join("\n")).toEqual([]);
  });
});

describe("match_pairs floor of 6 — es (language-keyed pool)", () => {
  // es ships ZERO match grids as of 2026-07-15 (the step factory landed
  // ahead of content), so these sweeps hold vacuously today — and start
  // enforcing the floor + same-language-fill invariants the moment the
  // first authored grid lands. Guard chars: any kana/kanji/hangul in an
  // es grid means a cross-language fill leaked in (the pre-dispatch
  // padder drew every language's meaning fills from the JA pool).
  const NON_LATIN = /[\u3040-\u30ff\u31f0-\u31ff\u3400-\u9fff\uac00-\ud7af]/;

  function esLessonIds(): string[] {
    const course = getMockCourse("es");
    const ids: string[] = [];
    type LessonRef = { id: string };
    type ModuleShape = {
      lessons?: LessonRef[];
      lessonGroups?: { lessons?: LessonRef[] }[];
    };
    for (const mod of course.modules as unknown as ModuleShape[]) {
      for (const l of mod.lessons ?? []) ids.push(l.id);
      for (const g of mod.lessonGroups ?? []) {
        for (const l of g.lessons ?? []) ids.push(l.id);
      }
    }
    return ids;
  }

  it("every paddable es grid offers at least 6 pairs", () => {
    const violations: string[] = [];
    for (const id of esLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        if (s.type !== "match_pairs") continue;
        const shape = matchGridShape(s.pairs);
        if (shape === "other") continue; // exempt
        if (s.pairs.length < MATCH_PAIRS_FLOOR) {
          violations.push(
            `${id}/${s.id}: ${s.pairs.length} pairs (${shape})`,
          );
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("no es grid carries a cross-language (kana/kanji/hangul) pair", () => {
    const leaks: string[] = [];
    for (const id of esLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        if (s.type !== "match_pairs") continue;
        for (const p of s.pairs as { source: string; target: string }[]) {
          if (NON_LATIN.test(p.source + p.target)) {
            leaks.push(`${id}/${s.id}: "${p.source}" => "${p.target}"`);
          }
        }
      }
    }
    expect(leaks, leaks.join("\n")).toEqual([]);
  });
});

describe("matchGridShape (structural, romanization-variant tolerant)", () => {
  it("classifies kana→sound grids as romaji even when the authored romanization differs from the table", () => {
    // m12's authored grid: KANA_ROMAJI says ヲ→"o" but the lesson writes
    // "wo" — strict equality reclassified this as "meaning" and padded
    // vocab sentences into a "match the sounds" prompt.
    expect(
      matchGridShape([
        { id: "1", source: "ワ", target: "wa" },
        { id: "2", source: "ヲ", target: "wo" },
        { id: "3", source: "ン", target: "n" },
      ]),
    ).toBe("romaji");
  });

  it("keeps short-gloss vocab grids as meaning (word sources aren't kana-table keys)", () => {
    expect(
      matchGridShape([
        { id: "1", source: "うみ", target: "sea" },
        { id: "2", source: "やま", target: "big" },
      ]),
    ).toBe("meaning");
  });

  it("the live m12 grid now pads with sound pairs, not vocab glosses", () => {
    const lesson = getMockLessonContent("ja-m12-kata");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const step = lesson?.steps.find((s) => s.type === "match_pairs") as any;
    expect(step).toBeTruthy();
    for (const p of step.pairs) {
      expect(
        /^[a-z]{1,4}$/.test(p.target),
        `${p.source}=>${p.target} should be a sound pair`,
      ).toBe(true);
    }
  });
});

describe("pickNonColliding (fill uniqueness under any SRS ranking)", () => {
  // The live bug (QA 2026-07-11): SRS-weakness ranking surfaced BOTH
  // homophone atoms (花/鼻 — kana はな) into one padded m12 grid: a 50/50
  // tile inside a 3-strike step. The whole-course sweeps above can't catch
  // it because the ranking is store-dependent; the picker must enforce
  // uniqueness itself.
  const atoms = [
    { kana: "はな", meaningEn: "flower" },
    { kana: "はな", meaningEn: "nose" },
    { kana: "やま", meaningEn: "mountain" },
    { kana: "かわ", meaningEn: "Flower" }, // target-collides with #1 (case)
    { kana: "うみ", meaningEn: "sea" },
  ];

  it("never picks two fills sharing source or target text", () => {
    const picked = pickNonColliding(
      atoms,
      4,
      new Set<string>(),
      new Set<string>(),
      (a) => a.kana,
      (a) => a.meaningEn,
    );
    expect(picked.map((a) => a.kana)).toEqual(["はな", "やま", "うみ"]);
  });

  it("never picks a fill colliding with existing grid sources or targets", () => {
    const picked = pickNonColliding(
      atoms,
      5,
      new Set(["はな"]),
      new Set(["mountain"]),
      (a) => a.kana,
      (a) => a.meaningEn,
    );
    expect(picked.map((a) => a.meaningEn)).toEqual(["Flower", "sea"]);
  });
});
