/**
 * RULE 1 GATE — the answer-length floor (TestFlight #139, Spencer 2026-09-15).
 *
 *   "At this point they should NEVER be shorter than 5 tiles" (#139)
 *   "5 tiles in the answer, and yeah m11 is good for a cutoff — at LEAST 5
 *    tiles in the answer in anything after m11." (talk-through, Topic 3)
 *
 * The floor is on the ANSWER (`correctOrder`), never the bank: a short sentence
 * padded with distractors is still a short sentence. Predicates and constants
 * live in `features/lesson/data/contentFloors.ts` so the compiler, the
 * render-time passes and this gate cannot drift apart
 * (`docs/user-feedback/2026-09-15-recurring-complaints-rca.md` §2.1: every
 * recurring class in the matrix is a rule that was re-derived per surface).
 *
 * WHY THIS IS A RATCHET AND NOT A ZERO. The rule is new and the debt is
 * authored: 656 of 3,366 in-scope build answers across m12–m46 are under five
 * tiles, and closing them means REWRITING SENTENCES — 656 of them. Per the
 * lane's hard rule that is authoring work for dedicated lanes, not a
 * mechanical fix, so the violations are enumerated in
 * `fb16-research/content-floors-violations.md` and each module's count is
 * frozen here as a budget. The gate therefore does the one thing that matters
 * today: no NEW short answer can be authored anywhere, and every authoring
 * lane that lands lowers a number. A module not listed must be at zero, which
 * is what makes m47+ born compliant.
 *
 * Numbers measured 2026-09-15 against the compiled course (`getMockLessonContent`,
 * i.e. after every load-time pass). Lower them as lanes land; never raise one.
 */
import { describe, it, expect } from "vitest";
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import type { LessonStep } from "@/features/lesson/types";
import {
  ANSWER_TILE_FLOOR,
  ANSWER_FLOOR_FIRST_MODULE,
  answerFloorApplies,
  answerTileCount,
  isSentenceBuildStep,
} from "@/features/lesson/data/contentFloors";

/** module → number of under-floor build answers allowed (2026-09-15 baseline; lowered 2026-09-15 evening after the local-model extension lanes applied 454 patches — never raise). */
const SHORT_ANSWER_BUDGET: Readonly<Record<string, number>> = {
  m12: 42,
  m13: 6,
  m14: 7,
  m15: 0,
  m16: 3,
  m17: 3,
  m18: 0,
  m19: 0,
  m20: 2,
  m21: 5,
  m22: 0,
  m23: 0,
  m24: 3,
  m25: 2,
  m26: 1,
  m27: 7,
  m28: 3,
  m29: 6,
  m30: 1,
  m31: 1,
  m32: 0,
  m33: 6,
  m34: 11,
  m35: 9,
  m36: 8,
  m37: 5,
  m38: 7,
  m39: 7,
  m40: 0,
  m41: 2,
  m42: 5,
  m43: 2,
  m44: 3,
  m45: 2,
  m46: 2,
};

/** The one number to watch fall. Sum of the budget above. */
/** Lowered 2026-09-18 by lane SHORTANS-B: rewrote 42 of the ≤3-tile build
 * answers in m33/m34/m35/m36/m37/m38/m39/m43/m44/m46 to ≥5 answer tiles
 * (203 → 161). m38's "ぜんぶ たべてしまった" (L2) stayed short on purpose —
 * extending it broke the module's own "same-verb contrast ratchet" test
 * (the bare surface is pinned verbatim as one half of a proud/regret
 * minimal pair). m45's 2 findings were both left as debut-exempt (がくせい
 * は そうじする debuts そうじする; かえらせて ください debuts かえらせて) so its
 * budget is unchanged. See docs/ (SHORTANS-B report) for the module table. */
const SHORT_ANSWER_TOTAL_BUDGET = 161;

type Finding = { module: string; lesson: string; id: string; tiles: number; text: string };

function sweep(): { findings: Finding[]; inScope: Map<string, number> } {
  const findings: Finding[] = [];
  const inScope = new Map<string, number>();
  for (const lessonId of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(lessonId);
    if (!lesson || lesson.languageId !== "ja") continue;
    if (!answerFloorApplies(lesson.moduleId)) continue;
    for (const step of lesson.steps as LessonStep[]) {
      if (!isSentenceBuildStep(step)) continue;
      inScope.set(lesson.moduleId, (inScope.get(lesson.moduleId) ?? 0) + 1);
      const tiles = answerTileCount(step);
      if (tiles < ANSWER_TILE_FLOOR) {
        findings.push({
          module: lesson.moduleId,
          lesson: lessonId,
          id: step.id,
          tiles,
          text: step.targetSentence,
        });
      }
    }
  }
  return { findings, inScope };
}

describe(`RULE 1 — build answers are ≥ ${ANSWER_TILE_FLOOR} tiles from m${ANSWER_FLOOR_FIRST_MODULE}`, () => {
  const { findings, inScope } = sweep();

  it("is not vacuous — the sweep actually sees the m12+ build corpus", () => {
    // If a registry/glob change ever stops this walk from finding steps, the
    // budget assertions below would all pass while checking nothing. (The
    // "green and vacuous look identical" lesson, memory `prove-the-verifier-can-fail`.)
    const total = [...inScope.values()].reduce((a, b) => a + b, 0);
    expect(total, "in-scope sentence builds found in m12+").toBeGreaterThan(3000);
    expect(inScope.size, "m12+ modules with build steps").toBeGreaterThan(30);
  });

  it("no module exceeds its recorded short-answer budget", () => {
    const byModule = new Map<string, Finding[]>();
    for (const f of findings) {
      const list = byModule.get(f.module) ?? [];
      list.push(f);
      byModule.set(f.module, list);
    }
    const over: string[] = [];
    for (const [moduleId, list] of byModule) {
      const budget = SHORT_ANSWER_BUDGET[moduleId] ?? 0;
      if (list.length > budget) {
        over.push(
          `${moduleId}: ${list.length} short answers, budget ${budget}\n` +
            list
              .slice(0, 12)
              .map((f) => `      ${f.id} (${f.tiles} tiles) ${f.text}`)
              .join("\n"),
        );
      }
    }
    expect(
      over,
      "modules over the answer-floor budget — a NEW short build answer was authored, " +
        "or a lane regressed one. The floor is 5 ANSWER tiles (correctOrder), not bank tiles:\n  " +
        over.join("\n  "),
    ).toEqual([]);
  });

  it("a module with no recorded budget is at zero (m47+ is born compliant)", () => {
    const unbudgeted = findings.filter(
      (f) => SHORT_ANSWER_BUDGET[f.module] === undefined,
    );
    expect(
      unbudgeted.map((f) => `${f.module} ${f.id} (${f.tiles})`),
      "short build answers in a module with no recorded debt — add the sentences " +
        "at ≥5 answer tiles rather than adding a budget entry",
    ).toEqual([]);
  });

  it("the course-wide total never rises", () => {
    expect(
      findings.length,
      `course-wide short build answers (baseline ${SHORT_ANSWER_TOTAL_BUDGET}, ` +
        "2026-09-15). This number only goes down.",
    ).toBeLessThanOrEqual(SHORT_ANSWER_TOTAL_BUDGET);
  });

  it("below the cutoff there is no floor", () => {
    // Spencer picked m11 as the cutoff; a three-tile これはかばんだ IS the m4
    // lesson. Assert the scope boundary directly so nobody "tidies" it wider.
    expect(answerFloorApplies("m11")).toBe(false);
    expect(answerFloorApplies("m12")).toBe(true);
    // …and that the corpus below the cutoff really does carry short builds,
    // i.e. the boundary is load-bearing rather than decorative.
    let shortBelowCutoff = 0;
    for (const lessonId of getAvailableMockLessonIds()) {
      const lesson = getMockLessonContent(lessonId);
      if (!lesson || lesson.languageId !== "ja") continue;
      if (answerFloorApplies(lesson.moduleId)) continue;
      for (const step of lesson.steps as LessonStep[]) {
        if (isSentenceBuildStep(step) && answerTileCount(step) < ANSWER_TILE_FLOOR) {
          shortBelowCutoff++;
        }
      }
    }
    expect(shortBelowCutoff).toBeGreaterThan(0);
  });

  it("the detector fires on a planted short answer", () => {
    // Proof the gate can fail: a synthetic m12 build with a 3-tile answer.
    const planted = {
      id: "planted-short",
      type: "build_sentence",
      prompt: "Build: The train leaves",
      targetSentence: "でんしゃが でる",
      tiles: ["でんしゃ", "が", "でる"],
      correctOrder: ["でんしゃ", "が", "でる"],
      granularity: "word",
    } as unknown as LessonStep;
    expect(isSentenceBuildStep(planted)).toBe(true);
    expect(answerTileCount(planted as never)).toBeLessThan(ANSWER_TILE_FLOOR);
    // …and does NOT fire on the shapes the rule deliberately excludes.
    const picker = { ...planted, correctOrder: ["はい"], picker: true } as unknown as LessonStep;
    const charBuild = { ...planted, granularity: "character" } as unknown as LessonStep;
    const wordBuild = { ...planted, correctOrder: ["でんしゃ"] } as unknown as LessonStep;
    expect(isSentenceBuildStep(picker)).toBe(false);
    expect(isSentenceBuildStep(charBuild)).toBe(false);
    expect(isSentenceBuildStep(wordBuild)).toBe(false);
  });
});
