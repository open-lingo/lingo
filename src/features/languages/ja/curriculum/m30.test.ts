/**
 * JA M30 curriculum guard — Gate 2 of docs/retrospective-2026-07-17.md §4
 * (per-module content tests, ES/KO convention — mirrors m29.test.ts).
 *
 * The shared lints (pathway integrity, unique ids, passive-card spacing,
 * explanation lints, Gate 5 distractors, Gate 6 antiPattern minimal pairs,
 * Gate 7 complexity ratchet) come from `../__tests__/moduleContentLints.ts`;
 * this file adds M30-specific spot assertions pinned to the STAGE 2
 * authoring task (pairs 5-7 + story + test file):
 *   - transformBuild ships in pair 6 with BOTH directions (casual→polite
 *     and polite→casual) present across 6-1/6-2.
 *   - the story ships both register versions of the same invitation.
 *   - zero particle_cloze anywhere in the module (guide §4c — m30 is far
 *     past every N5 particle's 2-module grandfather window).
 *   - every production step whose answer depends on register carries an
 *     explicit register cue in its prompt (pinned invariant 8).
 */
import { describe, it, expect } from "vitest";
import {
  getJaModuleLessons,
  moduleGrammarPointIds,
  registerJaModuleContentLints,
} from "../__tests__/moduleContentLints";
import type { LessonStep } from "@/features/lesson/types";

registerJaModuleContentLints("m30");

/** Every step across every authored m30 lesson. */
function allM30Steps(): LessonStep[] {
  return getJaModuleLessons("m30").flatMap((l) => l.steps);
}

/** Production step types whose `prompt`/`sourceText` is an English cue. */
function englishPromptOf(step: LessonStep): string | null {
  switch (step.type) {
    case "build_sentence":
      return step.prompt;
    case "translate":
      return step.sourceText;
    default:
      return null;
  }
}

// An explicit addressee cue: "to a friend", "to your boss", "as けん",
// "as her boss" — anything that names WHO the register choice is for, not
// just the bare register word itself (pinned invariant 8).
const REGISTER_CUE = /\bto (a|your|an|けん|たなかさん)\b|\bas\b/i;

describe("JA M30 module-specific content", () => {
  it("teaches its headline grammar points via grammar_rule cards", () => {
    const gps = moduleGrammarPointIds("m30");
    expect(gps).toContain("casual-question-no-ka");
    expect(gps).toContain("yo-ne-function");
    expect(gps).toContain("casual-no-question");
    expect(gps).toContain("register-awareness");
    expect(gps).toContain("casual-nai-invitation");
  });

  it("ships its full lesson set including pairs 5-7 and the story lesson", () => {
    const ids = getJaModuleLessons("m30").map((l) => l.id);
    expect(ids.length).toBeGreaterThanOrEqual(15);
    expect(ids).toContain("ja-m30-5-1");
    expect(ids).toContain("ja-m30-5-2");
    expect(ids).toContain("ja-m30-6-1");
    expect(ids).toContain("ja-m30-6-2");
    expect(ids).toContain("ja-m30-story");
    expect(ids).toContain("ja-m30-7-1");
    expect(ids).toContain("ja-m30-7-2");
  });

  it("ships ZERO particle_cloze steps anywhere in the module (guide §4c)", () => {
    const offenders = allM30Steps().filter((s) => s.type === "particle_cloze");
    expect(offenders.map((s) => s.id)).toEqual([]);
  });

  it("ships ZERO phrase_card / info steps (m30 is ja — §4b2 / §4d)", () => {
    const offenders = allM30Steps().filter(
      (s) => s.type === "phrase_card" || s.type === "info",
    );
    expect(offenders.map((s) => s.id)).toEqual([]);
  });

  it("pair 6 ships transformBuild steps in BOTH directions (casual→polite and polite→casual)", () => {
    const pair6 = [
      ...getJaModuleLessons("m30").filter(
        (l) => l.id === "ja-m30-6-1" || l.id === "ja-m30-6-2",
      ),
    ].flatMap((l) => l.steps);
    const transformSteps = pair6.filter(
      (s): s is LessonStep & { transformLabel: string } =>
        s.type === "build_sentence" &&
        "transformLabel" in s &&
        typeof (s as { transformLabel?: unknown }).transformLabel === "string",
    );
    expect(transformSteps.length).toBeGreaterThanOrEqual(6);
    const labels = new Set(transformSteps.map((s) => s.transformLabel));
    expect(labels.has("→ casual")).toBe(true);
    expect(labels.has("→ polite")).toBe(true);
    // Each sub-lesson individually carries 3-5 per the authoring spec.
    for (const lessonId of ["ja-m30-6-1", "ja-m30-6-2"]) {
      const lesson = getJaModuleLessons("m30").find((l) => l.id === lessonId)!;
      const count = lesson.steps.filter(
        (s) => s.type === "build_sentence" && "transformLabel" in s,
      ).length;
      expect(count, `${lessonId} transformBuild count`).toBeGreaterThanOrEqual(3);
      expect(count, `${lessonId} transformBuild count`).toBeLessThanOrEqual(5);
    }
  });

  it("the story ships both register versions of the same invitation", () => {
    const story = getJaModuleLessons("m30").find((l) => l.id === "ja-m30-story");
    expect(story, "ja-m30-story not registered").toBeDefined();
    const corpus = JSON.stringify(story!.steps);
    // Casual invitation surface (dropped か).
    expect(corpus.includes("たべない")).toBe(true);
    // Polite invitation surface (m23's ませんか, reused here).
    expect(corpus.includes("たべませんか")).toBe(true);
    // Two dialogue_listen scenes — one per register.
    const dialogueSteps = story!.steps.filter((s) => s.type === "dialogue_listen");
    expect(dialogueSteps.length).toBeGreaterThanOrEqual(2);
  });

  it("every production step whose answer depends on register carries an explicit cue in its prompt", () => {
    const failures: string[] = [];
    for (const lesson of getJaModuleLessons("m30")) {
      for (const step of lesson.steps) {
        if (step.type !== "build_sentence" && step.type !== "translate") continue;
        const prompt = englishPromptOf(step);
        if (!prompt) continue;
        // Register-dependent surfaces: prompts that ask the learner to
        // produce a casual OR polite form (ない？/ませんか/くる？/きますか-
        // class content). Heuristic: any prompt mentioning "casually" or
        // "politely" is register-dependent by construction; those must
        // additionally name WHO (friend/boss/senior/etc — pinned invariant 8).
        const registerDependent = /\b(casually|politely)\b/i.test(prompt);
        if (!registerDependent) continue;
        if (!REGISTER_CUE.test(prompt)) {
          failures.push(`${lesson.id}/${step.id}: "${prompt}"`);
        }
      }
    }
    expect(failures, `missing register-cue (who): \n  ${failures.join("\n  ")}`).toEqual([]);
  });

  it("no MCQ option carries a trailing register tag (pinned invariant 9)", () => {
    for (const lesson of getJaModuleLessons("m30")) {
      for (const step of lesson.steps) {
        if (step.type !== "multiple_choice") continue;
        for (const o of step.options) {
          expect(
            /\((plain|casual|polite)\)\s*$/i.test(o.text),
            `${lesson.id}/${step.id}: option "${o.text}" carries a register tag`,
          ).toBe(false);
        }
      }
    }
  });

  it("every grammar_rule antiPattern is a full sentence", () => {
    for (const lesson of getJaModuleLessons("m30")) {
      for (const step of lesson.steps) {
        if (step.type !== "grammar_rule" || !step.antiPattern) continue;
        expect(
          /[。！？]$/.test(step.antiPattern.ja.trim()),
          `${lesson.id}/${step.id}: antiPattern "${step.antiPattern.ja}" is not a full sentence`,
        ).toBe(true);
      }
    }
  });

  it("introduces no new atoms in stage 2 — all 20 m30 atoms were introduced in stage 1", () => {
    // Stage 2 (pairs 5-7 + story) reuses stage 1's 20 atoms plus earlier-
    // module review vocabulary only. courseAtoms.ts should show every
    // fromModule:"m30" atom's introducedByLessonId in pairs 1-4.
    const stage1Ids = new Set([
      "ja-m30-1-1", "ja-m30-1-2", "ja-m30-2-1", "ja-m30-2-2",
      "ja-m30-3-1", "ja-m30-3-2", "ja-m30-4-1", "ja-m30-4-2",
    ]);
    // Import lazily to avoid a hard dependency cycle at module-eval time.
    return import("../courseAtoms").then(({ JA_COURSE_ATOMS }) => {
      // 19 atoms are fromModule:"m30" — the 20th (たぶん) is an m18 atom
      // reused as review vocabulary only (never re-registered here; see
      // the m30.ts file header).
      const m30Atoms = JA_COURSE_ATOMS.filter((a) => a.fromModule === "m30");
      expect(m30Atoms.length).toBe(19);
      for (const atom of m30Atoms) {
        expect(
          atom.introducedByLessonId && stage1Ids.has(atom.introducedByLessonId),
          `${atom.id} introducedByLessonId "${atom.introducedByLessonId}" is not a stage-1 lesson`,
        ).toBe(true);
      }
    });
  });
});
