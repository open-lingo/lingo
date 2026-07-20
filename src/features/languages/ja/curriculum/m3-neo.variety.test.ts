/**
 * Guide density-bar guard (2026-07-20, module-3 reauthor pass): no two
 * adjacent same-type steps, max 2 selection-taps in a row, 18-24 steps,
 * >=5 distinct types, every lesson closes on a match grid.
 */
import { describe, it, expect } from "vitest";
import { M3_NEO_LESSONS } from "@/features/languages/ja/curriculum/m3-neo";
const SELECTION = new Set(["listening_comp","word_image_mcq","sentence_mcq","particle_cloze","self_explanation_mcq"]);
describe("m3-neo variety bar", () => {
  for (const lesson of M3_NEO_LESSONS) {
    it(`${lesson.id}: no adjacent same-type, max 2 selection taps in a row, 18-24 steps, ends match_pairs`, () => {
      const types = lesson.steps.map((s: any) => s.type);
      for (let i = 1; i < types.length; i++)
        expect(types[i], `${lesson.id} adjacent ${types[i]} @${i}`).not.toBe(types[i-1]);
      let run = 0;
      for (const t of types) {
        run = SELECTION.has(t) ? run + 1 : 0;
        expect(run, `${lesson.id} selection run`).toBeLessThanOrEqual(2);
      }
      expect(types.length).toBeGreaterThanOrEqual(18);
      expect(types.length).toBeLessThanOrEqual(24);
      expect(types[types.length-1]).toBe("match_pairs");
      expect(new Set(types).size).toBeGreaterThanOrEqual(5);
    });

    it(`${lesson.id}: no primary sentence surface repeats more than 3x (Spencer 2026-07-20)`, () => {
      const counts = new Map<string, number>();
      for (const s of lesson.steps as any[]) {
        const surf =
          s.audioText ?? s.target ?? s.targetSentence ?? s.correctKana ??
          s.targetPhrase ?? s.acceptedAnswers?.[0];
        if (typeof surf !== "string") continue;
        const norm = surf.replace(/[。\s　]/g, "");
        counts.set(norm, (counts.get(norm) ?? 0) + 1);
      }
      for (const [sentence, n] of counts) {
        expect(n, `${lesson.id}: "${sentence}" used ${n}x`).toBeLessThanOrEqual(3);
      }
    });

    it(`${lesson.id}: reply/say prompts with sentence answers are generation steps, not MCQs`, () => {
      // Spencer 2026-07-20: a "pick your reply" MCQ prints the sentence the
      // learner should be PRODUCING. Single-chunk choices (だいじょうぶ) and
      // form-discrimination (Telling or asking?) stay MCQ-legal.
      for (const s of lesson.steps as any[]) {
        if (s.type !== "sentence_mcq" && s.type !== "multiple_choice") continue;
        const prompt = `${s.prompt ?? ""} ${s.question ?? ""}`;
        const correct = s.correctKana ?? s.options?.find((o: any) => o.id === s.correctOptionId)?.text ?? "";
        if (/\breply\b|\bsay:/i.test(prompt) && /[ 　]/.test(correct)) {
          throw new Error(`${lesson.id}/${s.id}: production-framed prompt with a full-sentence answer must be a build/translate/speaking step`);
        }
      }
    });
  }
});
