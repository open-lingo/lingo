import { describe, expect, it } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

/**
 * A KANA'S EXAMPLE WORD MUST CONTAIN THAT KANA.
 *
 * The kana ladder introduces its characters in pairs, and the second of each
 * pair had inherited the first's anchor word: 【き】 was introduced with かい
 * (shell), 【く】 with いけ (pond), 【ち】 with うた (song), 【り】 with さくら.
 * Spencer's learner walk (2026-07-27) described the cost exactly — "I look for
 * the new shape in the word and it isn't there, so I assume I've misread the
 * shape." An anchor word that does not contain its own kana teaches the
 * learner to distrust their reading.
 *
 * `payload.example` is dual-purpose: on the dakuten and yōon rows it carries a
 * SHAPE HINT ("Same shape as く with two strokes"), not a word. Only entries
 * that look like an anchor word — Japanese text followed by a gloss in
 * parentheses — are checked.
 */
const ANCHOR = /^([ぁ-ゖァ-ヺー]+)\s*[(（]/;

describe("kana intro anchors", () => {
  it("every example WORD contains the kana it introduces", () => {
    const offenders: string[] = [];
    let checked = 0;
    for (const mod of getMockCourse("ja").modules) {
      for (const entry of mod.lessons ?? []) {
        const lesson = getMockLessonContent(entry.id);
        if (!lesson) continue;
        for (const raw of lesson.steps) {
          const step = raw as unknown as { type?: string; payload?: Record<string, unknown> };
          if (step.type !== "symbol_intro") continue;
          const symbol = String(step.payload?.symbol ?? "");
          const example = String(step.payload?.example ?? "");
          const m = ANCHOR.exec(example);
          if (!symbol || !m) continue; // shape hint, not an anchor word
          checked++;
          if (!m[1].includes(symbol))
            offenders.push(`${entry.id}: 【${symbol}】 is anchored to 「${m[1]}」, which does not contain it`);
        }
      }
    }
    // Non-vacuity: if the payload shape moves, every anchor stops being an
    // anchor and this reads exactly like a clean ladder.
    expect(checked, "no anchor words found — symbol_intro payload moved").toBeGreaterThan(50);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
