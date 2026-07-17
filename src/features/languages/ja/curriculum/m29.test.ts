/**
 * JA M29 curriculum guard — Gate 2 of docs/retrospective-2026-07-17.md §4
 * (per-module content tests, ES/KO convention — JA previously had zero).
 *
 * The shared lints (pathway integrity, unique ids, passive-card spacing,
 * explanation lints, Gate 5 distractors, Gate 6 antiPattern minimal pairs,
 * Gate 7 complexity ratchet) come from `../__tests__/moduleContentLints.ts`;
 * this file adds M29-specific spot assertions.
 */
import { describe, it, expect } from "vitest";
import {
  getJaModuleLessons,
  moduleGrammarPointIds,
  registerJaModuleContentLints,
} from "../__tests__/moduleContentLints";

registerJaModuleContentLints("m29");

describe("JA M29 module-specific content", () => {
  it("teaches its headline grammar points via grammar_rule cards", () => {
    const gps = moduleGrammarPointIds("m29");
    expect(gps).toContain("dict-form-u-verbs");
    expect(gps).toContain("dict-form-ru-irregular");
    expect(gps).toContain("nai-form");
    expect(gps).toContain("ta-form");
    expect(gps).toContain("nakatta-form");
  });

  it("ships its full lesson set including the story lesson", () => {
    const ids = getJaModuleLessons("m29").map((l) => l.id);
    expect(ids.length).toBeGreaterThanOrEqual(15);
    expect(ids).toContain("ja-m29-story");
  });

  // ── Pins for the m29 QA-fix regressions (2026-07-17 session) ──

  it("no MCQ option carries a trailing '(plain)' register tag (fix 81ce834)", () => {
    // The one legitimate "(plain)" left by that fix lives in an explanation
    // string that CONTRASTS registers — options must never carry the tag.
    for (const lesson of getJaModuleLessons("m29")) {
      for (const step of lesson.steps) {
        if (step.type !== "multiple_choice") continue;
        for (const o of step.options) {
          expect(
            /\(plain\)\s*$/.test(o.text),
            `${lesson.id}/${step.id}: option "${o.text}" carries a (plain) tag`,
          ).toBe(false);
        }
      }
    }
  });

  it("polite→plain recognition MCQs ship no のむます-style non-word junk (fix 25b1f46)", () => {
    // Wrong-DERIVATION distractors (のみる / のみ / のむる) are the sanctioned
    // shape; ます stacked onto a plain form (のむます) never is.
    const corpus = getJaModuleLessons("m29")
      .map((l) => JSON.stringify(l.steps))
      .join("\n");
    expect(corpus.includes("のむます")).toBe(false);
    expect(corpus.includes("たべるます")).toBe(false);
  });

  it("every grammar_rule antiPattern is a full sentence (fix ded0850)", () => {
    // Stricter than the shared Gate 6 (which exempts word-format rules):
    // m29 is the N4 exemplar and ships sentence-cued rules only.
    for (const lesson of getJaModuleLessons("m29")) {
      for (const step of lesson.steps) {
        if (step.type !== "grammar_rule" || !step.antiPattern) continue;
        expect(
          /。$/.test(step.antiPattern.ja.trim()),
          `${lesson.id}/${step.id}: antiPattern "${step.antiPattern.ja}" is not a full sentence`,
        ).toBe(true);
      }
    }
  });
});
