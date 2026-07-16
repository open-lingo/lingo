import { describe, expect, it } from "vitest";
import { getAvailableMockLessonIds, getMockLessonContent } from "./mockLessons";

/**
 * build_sentence / listening_build DISTRACTOR AUDIT (Spencer QA
 * 2026-07-16): "for any build sentence thing, we need a few more
 * distractors, we give them the answer a little too easy."
 *
 * Both step types ship a flat `tiles` pool (answer tiles + distractor
 * tiles) plus a separate `correctOrder` (the answer, as an ordered
 * sub-sequence of `tiles` — see BuildSentenceStepView / ListeningBuild-
 * StepView: `bankTiles = seededShuffle(step.tiles, step.id)`, graded by
 * comparing the placed sequence to `correctOrder`; nothing pads the pool
 * at render time). So `distractorCount = tiles.length - correctOrder.length`
 * exactly — every tile not needed for the answer is a distractor, however
 * many times a token repeats.
 *
 * This is a REPORT, not a regression gate (the gate — "every paddable
 * step meets its floor" — lives in buildTileFloor.test.ts, mirroring how
 * matchPairsPairCount.test.ts is the gate for matchPairsFloor.ts's
 * report-less pad pass). Run it directly to print the distribution:
 *
 *   AUDIT_BUILD_TILE_DISTRACTORS=1 npx vitest run \
 *     src/features/lesson/data/buildTileDistractorAudit.test.ts
 *
 * Scope note: only TOP-LEVEL build_sentence / listening_build steps are
 * walked. `row_test` items of kind "build" carry a nested BuildSentenceStep
 * payload with the same tiles/correctOrder shape but are a distinct
 * mastery-check surface (M1/M2 kana rows) — out of scope for this audit,
 * flagged as a follow-up in the session notes.
 */

type TileStep = {
  id: string;
  type: "build_sentence" | "listening_build";
  granularity: "word" | "character";
  tiles: string[];
  correctOrder: string[];
};

type Row = {
  lessonId: string;
  languageId: string;
  stepId: string;
  type: TileStep["type"];
  granularity: TileStep["granularity"];
  answerCount: number;
  distractorCount: number;
};

function collectRows(): Row[] {
  const rows: Row[] = [];
  for (const id of getAvailableMockLessonIds()) {
    const lesson = getMockLessonContent(id);
    if (!lesson) continue;
    for (const step of lesson.steps as unknown as Array<Record<string, unknown>>) {
      if (step.type !== "build_sentence" && step.type !== "listening_build") {
        continue;
      }
      const s = step as unknown as TileStep;
      rows.push({
        lessonId: lesson.id,
        languageId: lesson.languageId,
        stepId: s.id,
        type: s.type,
        granularity: s.granularity,
        answerCount: s.correctOrder.length,
        distractorCount: s.tiles.length - s.correctOrder.length,
      });
    }
  }
  return rows;
}

/** Bucket a distractor count into the report's 0 / 1 / 2 / 3+ columns. */
function bucket(n: number): "0" | "1" | "2" | "3+" {
  if (n <= 0) return "0";
  if (n === 1) return "1";
  if (n === 2) return "2";
  return "3+";
}

export function formatDistractorReport(rows: Row[]): string {
  const languages = [...new Set(rows.map((r) => r.languageId))].sort();
  const lines: string[] = [];
  lines.push(`build_sentence / listening_build distractor audit`);
  lines.push(`total steps: ${rows.length}`);
  for (const lang of languages) {
    const langRows = rows.filter((r) => r.languageId === lang);
    const counts = { "0": 0, "1": 0, "2": 0, "3+": 0 };
    for (const r of langRows) counts[bucket(r.distractorCount)]++;
    const wordRows = langRows.filter((r) => r.granularity === "word");
    const wordCounts = { "0": 0, "1": 0, "2": 0, "3+": 0 };
    for (const r of wordRows) wordCounts[bucket(r.distractorCount)]++;
    lines.push(
      `\n${lang}: ${langRows.length} steps (${wordRows.length} word-granularity, ${langRows.length - wordRows.length} character-granularity)`,
    );
    lines.push(
      `  ALL granularities  — 0: ${counts["0"]}  1: ${counts["1"]}  2: ${counts["2"]}  3+: ${counts["3+"]}`,
    );
    lines.push(
      `  word granularity   — 0: ${wordCounts["0"]}  1: ${wordCounts["1"]}  2: ${wordCounts["2"]}  3+: ${wordCounts["3+"]}`,
    );
  }
  return lines.join("\n");
}

describe("build tile distractor audit", () => {
  it.skipIf(!process.env.AUDIT_BUILD_TILE_DISTRACTORS)("prints the distribution", () => {
    const rows = collectRows();
    // eslint-disable-next-line no-console
    console.log("\n" + formatDistractorReport(rows) + "\n");
    expect(rows.length).toBeGreaterThan(0);
  });

  // Always-on smoke check (cheap, keeps the audit machinery itself honest
  // even when the print is skipped): the walker finds real steps and the
  // distractor arithmetic never goes negative (tiles is always >= the
  // answer — a negative would mean a broken authored/padded step).
  it("distractorCount is never negative", () => {
    const rows = collectRows();
    const violations = rows.filter((r) => r.distractorCount < 0);
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
});
