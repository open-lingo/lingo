import { describe, expect, it } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "./mockLessons";
import { getTtsUrl } from "@/shared/tts";

/**
 * `symbol_to_sound` integrity (Spencer 2026-06-13, ja-m1-ta-1 ち walkthrough).
 *
 * The audio-MCQ renders each option's `text` (romaji) as the button label
 * and plays `getTtsUrl(option.symbol)` on tap. A distractor shipped with an
 * empty romaji (confusables were pushed with `romaji: ""` in
 * `pickThreeKanaDistractors`, fine for glyph-only `symbol_recognition` but
 * not here) rendered as a BLANK, unlabelled button — two of ち's four
 * options were blank. These were silent failures: the step still "worked",
 * it just looked broken and gave away the answer by elimination.
 *
 * Every option must therefore have (a) a non-empty romaji label, (b) a
 * resolvable audio URL, and the step must offer a full set of 4 options
 * with the correct one present.
 */

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

describe("symbol_to_sound option integrity", () => {
  it("every option is labelled, audible, and the set is complete", () => {
    const blankLabel: string[] = [];
    const noAudio: string[] = [];
    const wrongCount: string[] = [];
    const noCorrect: string[] = [];

    for (const id of allLessonIds()) {
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const s of lesson.steps as any[]) {
        if (s.type !== "symbol_to_sound") continue;
        const opts: { id: string; text?: string; symbol: string }[] =
          s.options ?? [];

        if (opts.length !== 4) wrongCount.push(`${id}/${s.id}: ${opts.length} options`);
        if (!opts.some((o) => o.id === s.correctOptionId)) {
          noCorrect.push(`${id}/${s.id}`);
        }
        for (const o of opts) {
          if (!o.text || !o.text.trim()) {
            blankLabel.push(`${id}/${s.id}: ${o.symbol || "(no symbol)"}`);
          }
          if (!getTtsUrl(o.symbol)) {
            noAudio.push(`${id}/${s.id}: ${o.symbol}`);
          }
        }
      }
    }

    expect(blankLabel, `blank romaji labels:\n${blankLabel.join("\n")}`).toEqual([]);
    expect(noAudio, `options with no resolvable audio:\n${noAudio.join("\n")}`).toEqual([]);
    expect(wrongCount, `steps not offering 4 options:\n${wrongCount.join("\n")}`).toEqual([]);
    expect(noCorrect, `steps missing their correct option:\n${noCorrect.join("\n")}`).toEqual([]);
  });
});
