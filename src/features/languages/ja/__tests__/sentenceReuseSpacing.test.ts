/**
 * RULE 2 GATE — sentence-reuse spacing (TestFlight #138 #135, Spencer 2026-09-15).
 *
 *   "one sentence should NEVER be less than two steps between re-uses even if
 *    the step type is different, and ideally we keep the space greater than 2
 *    steps where we can."
 *
 * #138 is the report: *"I was just asked this question in a different font."*
 * The comparison key therefore folds kanji surface (it reads annotation
 * READINGS), whitespace and punctuation — see `normalizeSentenceKey`.
 *
 * HARD = two sentence-level retrieval steps closer than three indices.
 * SOFT = exactly three apart ("ideally … greater than 2"), or a pair involving
 *        an echo step (`speaking` — saying aloud what you just built).
 *
 * The course-wide hard count was 202 before this lane; the fix is in the
 * COMPILER's ordering passes (a sentence term in `sequenceCost`, which
 * `repairAdjacency` descends, plus a within-type preference in `interleave`),
 * not in the content — a module drilling one sentence through several
 * modalities is the design, and the ordering just never knew two steps were
 * the same sentence. The hand-written m1–m5 modules have no compiler, so their
 * pairs were fixed by reordering the authored arrays.
 */
import { describe, it, expect } from "vitest";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import type { LessonStep } from "@/features/lesson/types";
import {
  SENTENCE_REUSE_MIN_GAP,
  findSentenceReuse,
  normalizeSentenceKey,
  primarySentenceOf,
} from "@/features/lesson/data/contentFloors";

/**
 * Hard violations that survive the ordering passes, each with the reason.
 * Keyed `lessonId|firstStepId|secondStepId` so a re-order retires the entry
 * automatically instead of silently covering a different pair.
 *
 * `ja-m31-neo-10` authors ONE sentence — いもうとが ケーキを くれたから
 * よろこんだ — in THREE beats (a listening build, a particle cloze and a
 * listening-comp) inside an 18-step lesson that also pins a rule card and a
 * challenge in its stretch window. Three occurrences need six clear slots
 * between them; the repair pass can reach distance 3 for one pair and not the
 * other. The real fix is authoring, not ordering: drop or rewrite one of the
 * three beats (`ir/m31.ir.yaml`). Listed in
 * `fb16-research/content-floors-violations.md`.
 */
const HARD_REUSE_EXEMPTIONS: ReadonlySet<string> = new Set([
  "ja-m31-neo-10|ja-m31-neo-10-cloze-10|ja-m31-neo-10-lc-11",
]);

/** Course-wide soft (distance-3 or echo) pairs, 2026-09-15. Report-only. */
const SOFT_REUSE_BUDGET = 260;

describe(`RULE 2 — same sentence needs ≥ ${SENTENCE_REUSE_MIN_GAP - 1} steps between re-uses`, () => {
  const hard: string[] = [];
  let soft = 0;
  let sentenceSteps = 0;
  const softByModule = new Map<string, number>();

  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    for (const s of lesson.steps as LessonStep[]) {
      if (primarySentenceOf(s).tokens >= 2) sentenceSteps++;
    }
    const found = findSentenceReuse(lesson.steps as LessonStep[]);
    soft += found.soft.length;
    if (found.soft.length) {
      softByModule.set(
        lesson.moduleId,
        (softByModule.get(lesson.moduleId) ?? 0) + found.soft.length,
      );
    }
    for (const v of found.hard) {
      const key = `${lessonId}|${v.firstId}|${v.secondId}`;
      if (HARD_REUSE_EXEMPTIONS.has(key)) continue;
      hard.push(
        `${lesson.moduleId} ${lessonId} d=${v.distance} ` +
          `[${v.firstIndex}]${v.firstType} ${v.firstId} → ` +
          `[${v.secondIndex}]${v.secondType} ${v.secondId} :: ${v.sentence}`,
      );
    }
  }

  it("is not vacuous — the sweep sees the sentence corpus", () => {
    expect(sentenceSteps, "sentence-level JA steps walked").toBeGreaterThan(4000);
  });

  it("no lesson re-asks a sentence within the gap", () => {
    expect(
      hard,
      "same-sentence pairs closer than " +
        `${SENTENCE_REUSE_MIN_GAP} indices (#138 "asked this question in a different font"):\n  ` +
        hard.join("\n  "),
    ).toEqual([]);
  });

  it("every exemption still describes a real pair (no stale entries)", () => {
    // A grandfather list that outlives its violation is how a gate quietly
    // narrows. Recompute the raw (unfiltered) hard set and require every
    // exemption to be present in it.
    const raw = new Set<string>();
    for (const lessonId of getAvailableMockLessonIds()) {
      const lesson = getMockLessonContent(lessonId);
      if (!lesson || lesson.languageId !== "ja") continue;
      for (const v of findSentenceReuse(lesson.steps as LessonStep[]).hard) {
        raw.add(`${lessonId}|${v.firstId}|${v.secondId}`);
      }
    }
    const stale = [...HARD_REUSE_EXEMPTIONS].filter((k) => !raw.has(k));
    expect(stale, "exemptions whose violation is gone — delete them").toEqual([]);
  });

  it("soft (distance-3 / echo) pairs never rise course-wide", () => {
    const report = [...softByModule]
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([m, n]) => `${m}:${n}`)
      .join(" ");
    expect(
      soft,
      `soft same-sentence pairs (baseline ${SOFT_REUSE_BUDGET}, 2026-09-15). ` +
        `Per module: ${report}`,
    ).toBeLessThanOrEqual(SOFT_REUSE_BUDGET);
  });

  it("the detector fires on a planted re-use, and folds kanji surface", () => {
    // Proof the gate can fail. Two builds of one sentence, adjacent — plus the
    // #138 shape: the same sentence written in kanji, which must still collide.
    const build = (id: string, surface: string, reading: string) =>
      ({
        id,
        type: "build_sentence",
        prompt: "Build",
        targetSentence: surface,
        tiles: ["x"],
        correctOrder: ["でんしゃ", "が", "でる"],
        granularity: "word",
        targetAnnotation: [{ surface, reading }],
      }) as unknown as LessonStep;
    const filler = (id: string) =>
      ({ id, type: "match_pairs", prompt: "m", pairs: [] }) as unknown as LessonStep;

    const adjacent = findSentenceReuse([
      build("a", "でんしゃが でる", "でんしゃが でる"),
      build("b", "電車が 出る", "でんしゃが でる"),
    ]);
    expect(adjacent.hard).toHaveLength(1);
    expect(adjacent.hard[0].distance).toBe(1);

    // One filler between → still hard (distance 2).
    expect(
      findSentenceReuse([
        build("a", "でんしゃが でる", "でんしゃが でる"),
        filler("f1"),
        build("b", "でんしゃが でる", "でんしゃが でる"),
      ]).hard,
    ).toHaveLength(1);

    // Two fillers between → legal, reported soft.
    const spaced = findSentenceReuse([
      build("a", "でんしゃが でる", "でんしゃが でる"),
      filler("f1"),
      filler("f2"),
      build("b", "でんしゃが でる", "でんしゃが でる"),
    ]);
    expect(spaced.hard).toHaveLength(0);
    expect(spaced.soft).toHaveLength(1);

    // An echo (speaking) pair is never hard, however close.
    const echo = findSentenceReuse([
      build("a", "でんしゃが でる", "でんしゃが でる"),
      {
        id: "s",
        type: "speaking",
        targetPhrase: "でんしゃが でる",
        translation: "the train leaves",
      } as unknown as LessonStep,
    ]);
    expect(echo.hard).toHaveLength(0);
    expect(echo.soft).toHaveLength(1);
  });

  it("normalization folds spaces and sentence punctuation, not word order", () => {
    expect(normalizeSentenceKey("さいふを おとす。")).toBe(
      normalizeSentenceKey("さいふをおとす"),
    );
    expect(normalizeSentenceKey("あした いく")).not.toBe(
      normalizeSentenceKey("いく あした"),
    );
  });
});
