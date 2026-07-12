import { describe, expect, it } from "vitest";
import { getMockLessonContent } from "./mockLessons";
import { getMockCourse } from "@/shared/domain/mockCourse";

/**
 * Kana-module word-intro ordering (Spencer 2026-06-13): a learner must
 * never be asked to SPELL a word (listening_build) before that word has
 * been introduced. Accepted introduction surfaces:
 *
 *   - word_image_mcq with the word as the CORRECT option (image-MCQ-as-
 *     intro, authoring guide §13). Distractor appearances do NOT count —
 *     passive exposure isn't teaching.
 *   - listening_comprehension on the word (audio→meaning MCQ) — the
 *     primer pattern used when a word has no usable image (こえ, いけ).
 *   - teach / phrase_card steps.
 *   - build_sentence containing the word (context-build intro).
 *   - speaking / match_pairs (kana + meaning + audio shown together).
 *
 * The taught-set accumulates ACROSS lessons in course order, so a word
 * introduced in an earlier lesson stays fair game. m3+ modules are
 * covered by the atom-conformance tests; this guards m1/m2, which have
 * no atoms.
 */

function kanaModuleLessonIds(): string[] {
  const course = getMockCourse("ja");
  const ids: string[] = [];
  for (const mod of course.modules) {
    if (mod.id !== "m1" && mod.id !== "m2") continue;
    type LessonRef = { id: string };
    type ModuleShape = {
      lessons?: LessonRef[];
      lessonGroups?: { lessons?: LessonRef[] }[];
    };
    const m = mod as unknown as ModuleShape;
    for (const l of m.lessons ?? []) ids.push(l.id);
    for (const g of m.lessonGroups ?? []) {
      for (const l of g.lessons ?? []) ids.push(l.id);
    }
  }
  return ids;
}

describe("kana word intro ordering", () => {
  it("never asks the learner to spell a word before introducing it", () => {
    const taught = new Set<string>();
    const violations: string[] = [];
    const teach = (w?: string) => {
      const t = (w ?? "").trim();
      if (t) taught.add(t);
    };

    for (const id of kanaModuleLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        if (s.type === "listening_build") {
          const w = (s.targetSentence ?? "").trim();
          if (w && w.length > 1 && !taught.has(w)) {
            violations.push(`${id} / ${s.id}: spells "${w}" before intro`);
          }
        }
        // Introduction surfaces (after the check so a build can't
        // teach itself).
        if (s.type === "word_image_mcq") {
          const correct = (s.options ?? []).find(
            (o: { id: string }) => o.id === s.correctOptionId,
          );
          teach(correct?.word);
        }
        if (s.type === "listening_comprehension") teach(s.transcript);
        if (s.type === "phrase_card") teach(s.kana ?? s.phrase);
        if (s.type === "build_sentence") {
          teach((s.correctOrder ?? []).join(""));
          for (const t of s.correctOrder ?? []) teach(t);
        }
        if (s.type === "listening_build") teach(s.targetSentence);
        if (s.type === "match_pairs") {
          for (const p of s.pairs ?? []) teach(p.source ?? p.kana);
        }
        if (s.type === "speaking") teach(s.targetPhrase);
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("character builds carry at least 2 decoy tiles", () => {
    // Thin banks degrade a build into pure ordering (いいえ shipped with
    // ZERO decoys — its own tiles only). Floor: answer + ≥2 decoys.
    const thin: string[] = [];
    for (const id of kanaModuleLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        const isBuild =
          s.type === "build_sentence" || s.type === "listening_build";
        if (!isBuild || s.granularity !== "character") continue;
        const decoys =
          (s.tiles?.length ?? 0) - (s.correctOrder?.length ?? 0);
        if (decoys < 2) {
          thin.push(`${id} / ${s.id}: ${decoys} decoys`);
        }
      }
    }
    expect(thin, thin.join("\n")).toEqual([]);
  });
});
