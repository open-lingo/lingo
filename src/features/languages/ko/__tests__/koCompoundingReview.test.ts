/**
 * KO compounding-review gate — machine form of the audit's §2 #5 fix
 * ("no review-interleave machinery anywhere in KO").
 *
 * Three guarantees:
 *   1. Every content module m3–m15 carries its two spliced prior-module
 *      review grids (mid + tail, from `withReviewInterleave`), each a full
 *      6-pair draw of STRICTLY earlier-module atoms, every source with a
 *      manifest TTS clip and no ambiguous duplicate targets.
 *   2. The two draws differ — a copied grid reviews half as much.
 *   3. RATCHET: per module, the fraction of lessons that exercise at least
 *      one prior-module atom (via `exercisedAtoms`) never drops below
 *      `REVIEW_FRACTION_FLOOR`. Raise-only: if you add lessons, keep them
 *      compounding; never lower the floor to ship.
 */
import { describe, it, expect } from "vitest";
import type { LessonContent, MatchPairsStep } from "@/features/lesson/types";
import { getTtsUrl } from "@/shared/tts";
import { KO_COURSE_ATOMS } from "../courseAtoms";
import { reviewSpliceIndexes } from "../curriculum/_reviewInterleave";
import { KO_M3_LESSONS } from "../curriculum/m3";
import { KO_M4_LESSONS } from "../curriculum/m4";
import { KO_M5_LESSONS } from "../curriculum/m5";
import { KO_M6_LESSONS } from "../curriculum/m6";
import { KO_M7_LESSONS } from "../curriculum/m7";
import { KO_M8_LESSONS } from "../curriculum/m8";
import { KO_M9_LESSONS } from "../curriculum/m9";
import { KO_M10_LESSONS } from "../curriculum/m10";
import { KO_M11_LESSONS } from "../curriculum/m11";
import { KO_M12_LESSONS } from "../curriculum/m12";
import { KO_M13_LESSONS } from "../curriculum/m13";
import { KO_M14_LESSONS } from "../curriculum/m14";
import { KO_M15_LESSONS } from "../curriculum/m15";

const MODULES: ReadonlyArray<[string, LessonContent[]]> = [
  ["m3", KO_M3_LESSONS],
  ["m4", KO_M4_LESSONS],
  ["m5", KO_M5_LESSONS],
  ["m6", KO_M6_LESSONS],
  ["m7", KO_M7_LESSONS],
  ["m8", KO_M8_LESSONS],
  ["m9", KO_M9_LESSONS],
  ["m10", KO_M10_LESSONS],
  ["m11", KO_M11_LESSONS],
  ["m12", KO_M12_LESSONS],
  ["m13", KO_M13_LESSONS],
  ["m14", KO_M14_LESSONS],
  ["m15", KO_M15_LESSONS],
];

/**
 * ES-parity floor (es-quality.test.ts uses 0.6). Measured 2026-09-01 after
 * the interleave wave: m3=6/9, m12=5/8 were the minima (0.625+); everything
 * else ≥0.75. Raise-only — never lower to ship.
 */
const REVIEW_FRACTION_FLOOR = 0.6;

function moduleIndex(fromModule: string | undefined): number {
  const m = fromModule ? /^m(\d+)$/.exec(fromModule) : null;
  return m ? Number(m[1]) : -1;
}

// atomId → introducing module, first registration wins (id duplicates exist
// by convention — re-registers are srsEligible:false companions).
const atomModuleById = new Map<string, string>();
const atomModuleBySurface = new Map<string, string>();
for (const a of KO_COURSE_ATOMS) {
  if (!a.fromModule) continue;
  if (!atomModuleById.has(a.id)) atomModuleById.set(a.id, a.fromModule);
  if (!atomModuleBySurface.has(a.surface)) atomModuleBySurface.set(a.surface, a.fromModule);
}

function reviewGrids(lessons: LessonContent[]): { name: string; step: MatchPairsStep }[] {
  const { mid, tail } = reviewSpliceIndexes(lessons.length);
  return [
    { name: "mid", step: lessons[mid].steps[lessons[mid].steps.length - 1] as MatchPairsStep },
    { name: "tail", step: lessons[tail].steps[lessons[tail].steps.length - 1] as MatchPairsStep },
  ];
}

describe("KO compounding review", () => {
  it.each(MODULES)("%s: carries two full prior-module review grids", (mod, lessons) => {
    for (const { name, step } of reviewGrids(lessons)) {
      expect(step.type, `${mod} ${name} grid`).toBe("match_pairs");
      expect(step.id).toBe(`ko-${mod}-review-${name}-match`);
      expect(step.pairs.length).toBe(6);
      expect(step.playAudioOnSelect).toBe(true);

      const targets = new Set(step.pairs.map((p) => p.target.toLowerCase()));
      expect(targets.size, `${step.id}: duplicate meanings make the grid ambiguous`).toBe(6);

      const cur = moduleIndex(mod);
      for (const p of step.pairs) {
        const from = atomModuleBySurface.get(p.source);
        expect(from, `${step.id}: '${p.source}' is not a registered atom surface`).toBeDefined();
        expect(
          moduleIndex(from),
          `${step.id}: '${p.source}' (from ${from}) is not strictly prior to ${mod}`,
        ).toBeLessThan(cur);
        expect(
          getTtsUrl(p.source, "ko"),
          `${step.id}: '${p.source}' has no manifest clip`,
        ).not.toBeNull();
      }

      const exercised = (step.exercisedAtoms ?? []).filter((id) =>
        moduleIndex(atomModuleById.get(id)) >= 0,
      );
      expect(exercised.length, `${step.id}: grid must write SRS review credit`).toBe(6);
    }
  });

  it.each(MODULES)("%s: mid and tail draws differ", (_mod, lessons) => {
    const [a, b] = reviewGrids(lessons).map((g) =>
      g.step.pairs.map((p) => p.source).sort().join("|"),
    );
    expect(a).not.toBe(b);
  });

  it("ratchet: every module's prior-module-reference lesson fraction stays at/above the floor", () => {
    // ES-parity detector (es-quality.test.ts referencesPriorModule): a lesson
    // "references a prior module" when any step (a) exercises a prior-module
    // atom id, or (b) surfaces a prior-module word token-for-token in its
    // target-language text. KO tokens carry suffixed particles (커피를), so a
    // token matches when it STARTS WITH a ≥2-char taught surface — single-jamo
    // and single-syllable surfaces are excluded to avoid prefix false
    // positives (사 would match 사과).
    const priorSurfaces = new Map<string, number>();
    for (const [surface, fm] of atomModuleBySurface) {
      const idx = moduleIndex(fm);
      if (idx >= 0 && surface.length >= 2 && !surface.includes(" ")) {
        priorSurfaces.set(surface, idx);
      }
    }
    const textOf = (s: Record<string, unknown>): string[] => {
      const out: string[] = [];
      for (const k of ["audioText", "audioKey", "targetPhrase", "targetSentence", "kana"]) {
        if (typeof s[k] === "string") out.push(s[k] as string);
      }
      return out;
    };
    const report: string[] = [];
    const bad: string[] = [];
    for (const [mod, lessons] of MODULES) {
      const cur = moduleIndex(mod);
      const referencesPrior = (l: LessonContent): boolean =>
        l.steps.some((step) => {
          const s = step as Record<string, unknown> & { exercisedAtoms?: string[] };
          if ((s.exercisedAtoms ?? []).some((id) => {
            const idx = moduleIndex(atomModuleById.get(id));
            return idx >= 0 && idx < cur;
          })) return true;
          for (const text of textOf(s)) {
            for (const token of text.split(/\s+/)) {
              for (const [surface, idx] of priorSurfaces) {
                if (idx < cur && token.startsWith(surface)) return true;
              }
            }
          }
          return false;
        });
      const withReview = lessons.filter(referencesPrior).length;
      const frac = withReview / lessons.length;
      report.push(`${mod}=${withReview}/${lessons.length}`);
      if (frac < REVIEW_FRACTION_FLOOR) bad.push(`${mod}=${withReview}/${lessons.length}`);
    }
    expect(
      bad,
      `below floor ${REVIEW_FRACTION_FLOOR} (all: ${report.join(" ")}) — add review carriers, never lower the floor`,
    ).toEqual([]);
  });
});
