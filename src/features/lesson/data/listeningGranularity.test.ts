import { describe, expect, it } from "vitest";
import { getAvailableMockLessonIds, getMockLessonContent } from "./mockLessons";

/**
 * Listening sentence-first ratchet (workshop B, Spencer 2026-07-12):
 * "make what you hear" from single words is the WEAKER form of both
 * listening types — sentence-level items carry the exposure. M1-M4 keep
 * word-level items by design (kana acquisition); from M5 the counts below
 * are a RATCHET: the backfill wave burns them down, and new authoring may
 * never push a module's word-level count back up. Lower a module's number
 * here whenever a wave lands (same pattern as the GATE_EXEMPTIONS ratchet).
 *
 * lb = listening_build with < 3 tiles; lc = listening_comprehension whose
 * transcript is a bare word (no particle/space, < 6 chars).
 *
 * 2026-07-12 wave: all 381 items THIS HEURISTIC SEES converted; every
 * baseline is now 0. Katakana-row lessons (id ends in "-kata") are
 * exempt: they are SCRIPT acquisition, the same carve-out as M1-M4
 * (decoding the loanword is the drill).
 *
 * KNOWN GAP (post-wave review, 2026-07-12): the lc char-class heuristic
 * false-negatives on words CONTAINING particle kana (がつ months, はち,
 * に, はな, もの…) — ~31 literal word-level LCs survive uncounted, plus
 * ~67 review-tail LCs that draw single pool words dynamically. A
 * follow-up wave should convert those and tighten this heuristic to a
 * token-boundary check; until then "0" means "0 the regex can see".
 */
const WORD_LEVEL_BASELINE: Record<string, { lb: number; lc: number }> = {
  m5: { lb: 0, lc: 0 },
  m6: { lb: 0, lc: 0 },
  m7: { lb: 0, lc: 0 },
  m8: { lb: 0, lc: 0 },
  m9: { lb: 0, lc: 0 },
  m10: { lb: 0, lc: 0 },
  m11: { lb: 0, lc: 0 },
  m12: { lb: 0, lc: 0 },
  m13: { lb: 0, lc: 0 },
  m14: { lb: 0, lc: 0 },
  m15: { lb: 0, lc: 0 },
  m16: { lb: 0, lc: 0 },
  m17: { lb: 0, lc: 0 },
  m18: { lb: 0, lc: 0 },
  m19: { lb: 0, lc: 0 },
  m20: { lb: 0, lc: 0 },
  m21: { lb: 0, lc: 0 },
  m22: { lb: 0, lc: 0 },
  m23: { lb: 0, lc: 0 },
  m24: { lb: 0, lc: 0 },
  m25: { lb: 0, lc: 0 },
  m26: { lb: 0, lc: 0 },
  m27: { lb: 0, lc: 0 },
};

function countWordLevel(): Record<string, { lb: number; lc: number }> {
  const counts: Record<string, { lb: number; lc: number }> = {};
  for (const id of getAvailableMockLessonIds()) {
    if (!id.startsWith("ja")) continue;
    const lesson = getMockLessonContent(id);
    if (!lesson) continue;
    const mod = lesson.moduleId;
    if (!WORD_LEVEL_BASELINE[mod]) continue;
    if (id.endsWith("-kata")) continue; // script acquisition — exempt
    counts[mod] ??= { lb: 0, lc: 0 };
    for (const s of lesson.steps) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const a = s as any;
      if (s.type === "listening_build" && (a.correctOrder ?? []).length < 3) {
        counts[mod].lb++;
      }
      if (s.type === "listening_comprehension") {
        const text: string = a.transcript ?? a.audioKey ?? "";
        if (!/[はがをにでとへもや、。 ]/.test(text) && text.length < 6) {
          counts[mod].lc++;
        }
      }
    }
  }
  return counts;
}

describe("listening sentence-first ratchet (M5+)", () => {
  it("word-level listening counts never regress above the baseline", () => {
    const counts = countWordLevel();
    const regressions: string[] = [];
    let backlog = 0;
    for (const [mod, base] of Object.entries(WORD_LEVEL_BASELINE)) {
      const cur = counts[mod] ?? { lb: 0, lc: 0 };
      if (cur.lb > base.lb) {
        regressions.push(`${mod}: listening_build word-level ${cur.lb} > baseline ${base.lb}`);
      }
      if (cur.lc > base.lc) {
        regressions.push(`${mod}: listening_comprehension word-level ${cur.lc} > baseline ${base.lc}`);
      }
      backlog += cur.lb + cur.lc;
    }
    // eslint-disable-next-line no-console
    console.log(`[listening ratchet] M5+ word-level backlog: ${backlog} items`);
    expect(regressions, regressions.join("\n")).toEqual([]);
  });
});
