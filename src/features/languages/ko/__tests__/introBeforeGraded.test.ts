/**
 * Intro-before-graded gate for KO content modules (m3–m15 since the
 * 2026-09-01 release audit; extend the MODULE_LESSONS table as later
 * modules get their audit pass).
 *
 * House invariant ("Intro before review — always"): no atom is exercised by
 * a graded step before it has been actively introduced. JA enforces this via
 * its own conformance machinery; KO had no equivalent, which let M3 grade
 * 칠 ("seven") in a sentenceMcq when only 일/삼/육/십 had intro cards
 * (caught by the 2026-08-26 audit — this test would have failed on it).
 *
 * Scope, deliberately conservative to avoid false positives:
 *   - Only atoms the module itself owns (`fromModule === moduleId`) with
 *     `kind: "vocab"` and srsEligible (defaulted true). Particles and
 *     grammar markers (이에요/예요, 은/는) are taught via info cards +
 *     particle clozes — an intro pattern this step-walk can't see — and
 *     phrases get phrase cards that resolve their own atomId anyway.
 *   - Intro step types: `phrase_card` (its `atomId`) and `word_image_mcq`
 *     (image-MCQ-as-intro doctrine — its exercisedAtoms count as intro).
 *   - Everything else that carries exercisedAtoms is a graded step.
 */
import { describe, it, expect } from "vitest";
import type { LessonContent } from "@/features/lesson/types";
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
import { KO_COURSE_ATOMS } from "../courseAtoms";

const MODULE_LESSONS: ReadonlyArray<[moduleId: string, lessons: LessonContent[]]> = [
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

const INTRO_TYPES = new Set(["phrase_card", "word_image_mcq"]);

describe("KO intro-before-graded", () => {
  it.each(MODULE_LESSONS)("%s: every owned vocab atom is introduced before it is graded", (moduleId, lessons) => {
    const gated = new Map<string, string>(); // atomId -> surface
    for (const a of KO_COURSE_ATOMS) {
      if (a.fromModule === moduleId && a.kind === "vocab" && a.srsEligible !== false) {
        gated.set(a.id, a.surface);
      }
    }
    expect(gated.size).toBeGreaterThan(0);

    const introduced = new Set<string>();
    const violations: string[] = [];

    for (const lesson of lessons) {
      for (const step of lesson.steps) {
        const s = step as unknown as {
          type: string;
          atomId?: string;
          exercisedAtoms?: string[];
        };
        if (INTRO_TYPES.has(s.type)) {
          if (s.atomId) introduced.add(s.atomId);
          for (const id of s.exercisedAtoms ?? []) introduced.add(id);
          continue;
        }
        for (const id of s.exercisedAtoms ?? []) {
          if (gated.has(id) && !introduced.has(id)) {
            violations.push(
              `${lesson.id} / ${step.id}: grades ${id} (${gated.get(id)}) before any intro step`,
            );
            introduced.add(id); // report each atom once
          }
        }
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});
