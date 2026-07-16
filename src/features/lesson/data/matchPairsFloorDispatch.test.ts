import { beforeEach, describe, expect, it } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { ES_ATOMS_BY_SURFACE } from "@/features/languages/es/courseAtoms";
import type { LessonContent, MatchPair, MatchPairsStep } from "../types";
import {
  MATCH_PAIRS_FLOOR,
  __resetMatchPadIndexes,
  padMatchPairsFloor,
  type MatchPadContext,
} from "./matchPairsFloor";

/**
 * Language dispatch of the match-pairs floor pass (2026-07-15). The
 * whole-course sweeps in matchPairsPairCount.test.ts are vacuous for es
 * until match content lands, so these synthetic lessons pin the contract
 * directly:
 *   - es meaning grids pad from the ES atom registry (Spanish surface →
 *     English gloss), prior-only via the es module cutoff;
 *   - languages without a pool (ko) come back UNTOUCHED — before the
 *     dispatch, their short meaning grids were backfilled with JAPANESE
 *     pairs.
 */

function matchLesson(
  languageId: string,
  moduleId: string,
  pairs: MatchPair[],
): LessonContent {
  const step: MatchPairsStep = {
    id: `${languageId}-pad-test-match`,
    type: "match_pairs",
    prompt: "Match the pairs",
    pairs,
  };
  return {
    id: `${languageId}-${moduleId}-pad-test`,
    moduleId,
    courseId: "mock-1",
    languageId,
    title: "pad test",
    steps: [step],
  };
}

/** Minimal context for the lesson's language — moduleOrder from the live
 *  course; the lesson/rarity indexes may be empty for a direct unit call
 *  (they only shape fill ORDER, never eligibility). */
function ctxFor(languageId: string): MatchPadContext {
  return {
    rawLessons: [],
    orderedLessonIds: [],
    rawById: new Map(),
    moduleOrder: getMockCourse(languageId).modules.map((m) => m.id),
    todayMs: Date.now(),
  };
}

const ES_AUTHORED: MatchPair[] = [
  { id: "p1", source: "hola", target: "hello" },
  { id: "p2", source: "adiós", target: "goodbye" },
  { id: "p3", source: "gracias", target: "thank you" },
  { id: "p4", source: "perdón", target: "sorry" },
];

beforeEach(() => {
  __resetMatchPadIndexes();
});

describe("padMatchPairsFloor language dispatch", () => {
  it("pads a 4-pair es meaning grid to 6 with SPANISH pairs only", () => {
    const lesson = matchLesson("es", "m1", ES_AUTHORED);
    const padded = padMatchPairsFloor(lesson, ctxFor("es"));
    const step = padded.steps[0] as MatchPairsStep;
    expect(step.pairs.length).toBe(MATCH_PAIRS_FLOOR);
    const fills = step.pairs.slice(ES_AUTHORED.length);
    expect(fills.length).toBe(2);
    for (const p of fills) {
      // Every fill is a live ES registry atom rendered surface → gloss…
      const atom = ES_ATOMS_BY_SURFACE.get(p.source);
      expect(atom, `${p.source} should be an ES atom surface`).toBeTruthy();
      expect(p.target).toBe(atom?.gloss);
      // …that is grid-worthy and prior-only (at-or-before this module).
      expect(atom?.srsEligible).toBe(true);
      expect(atom?.kind).not.toBe("phrase");
      expect(atom?.fromModule).toBe("m1");
      // No cross-language leak (the pre-dispatch failure mode).
      expect(
        /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(p.source + p.target),
        `${p.source} => ${p.target} should be Spanish/English`,
      ).toBe(false);
    }
    // Fills never collide with authored tiles.
    const sources = step.pairs.map((p) => p.source);
    const targets = step.pairs.map((p) => p.target.toLowerCase());
    expect(new Set(sources).size).toBe(sources.length);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it("leaves a 4-pair ko grid unpadded (no pool → lesson returned untouched)", () => {
    const lesson = matchLesson("ko", "m1", [
      { id: "p1", source: "물", target: "water" },
      { id: "p2", source: "밥", target: "rice" },
      { id: "p3", source: "집", target: "house" },
      { id: "p4", source: "불", target: "fire" },
    ]);
    const result = padMatchPairsFloor(lesson, ctxFor("ko"));
    expect(result).toBe(lesson); // identity — not even a dedupe rewrite
    expect((result.steps[0] as MatchPairsStep).pairs.length).toBe(4);
  });
});
