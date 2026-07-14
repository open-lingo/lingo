import { describe, expect, it } from "vitest";
import { getAvailableMockLessonIds, getMockLessonContent } from "./mockLessons";
import type { MatchPairsStep } from "../types";

/**
 * Match grids are WORD ↔ meaning — full sentences wrap to two-line cards
 * and don't fit the grid (Spencer QA 2026-07-13: padMatchPairsFloor
 * backfilled これは あおいです / タクシー です into ja-m3-2-1's review
 * match from the phrase-kind course atoms). The padder now filters
 * phrase atoms; this guard keeps every producer honest — authored pairs,
 * review-tail draws, and floor padding alike.
 *
 * Whitespace in the source is the discriminator: every multi-word example
 * phrase in the corpus is space-segmented, and no single vocab word
 * carries a space.
 */
describe("match_pairs grids are word-only", () => {
  it("no ja match grid carries a sentence-shaped source", () => {
    const offenders: string[] = [];
    for (const id of getAvailableMockLessonIds()) {
      if (!id.startsWith("ja")) continue;
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const s of lesson.steps) {
        if (s.type !== "match_pairs") continue;
        for (const p of (s as MatchPairsStep).pairs) {
          if (/\s/.test(p.source.trim())) {
            offenders.push(`${id} :: ${s.id} :: "${p.source}"`);
          }
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
