/**
 * STEP INDEX — dumps every step of the requested lessons (index, type, id, and
 * the visible text) so a capture harness can deep-link `?step=N` to the exact
 * step a tester screenshotted. Gated behind an env flag like the coverage map.
 *
 *   STEP_INDEX_EMIT=1 STEP_INDEX_PREFIX=ja-m30,ja-m25 npx vitest run \
 *     src/features/lesson/dev/stepIndex.emit.test.ts
 *
 * Output: artifacts/ux-loop/step-index.json
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { getAvailableMockLessonIds, getMockLessonContent } from "../data/mockLessons";

const ENABLED = process.env.STEP_INDEX_EMIT === "1";
const PREFIXES = (process.env.STEP_INDEX_PREFIX ?? "").split(",").filter(Boolean);

function textOf(step: Record<string, unknown>): string {
  const bits: string[] = [];
  const walk = (v: unknown, depth: number) => {
    if (bits.join(" ").length > 400 || depth > 3) return;
    if (typeof v === "string") { if (v.length > 1) bits.push(v); return; }
    if (Array.isArray(v)) { for (const x of v) walk(x, depth + 1); return; }
    if (v && typeof v === "object") { for (const [k, x] of Object.entries(v)) { if (k === "id" || k === "type" || k === "exercisedAtoms" || k === "modality") continue; walk(x, depth + 1); } }
  };
  walk(step, 0);
  return bits.join(" | ").slice(0, 400);
}

describe.runIf(ENABLED)("step index — emit", () => {
  it("dumps step indexes for the requested lessons", () => {
    const ids = getAvailableMockLessonIds().filter((id) => PREFIXES.some((p) => id.startsWith(p))).sort();
    const out: Record<string, { index: number; type: string; id: string; text: string }[]> = {};
    for (const lessonId of ids) {
      const lesson = getMockLessonContent(lessonId);
      if (!lesson) continue;
      out[lessonId] = lesson.steps.map((s, i) => ({
        index: i,
        type: s.type,
        id: s.id,
        text: textOf(s as unknown as Record<string, unknown>),
      }));
    }
    const file = path.resolve("artifacts/ux-loop/step-index.json");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(out, null, 1));
    expect(Object.keys(out).length).toBeGreaterThan(0);
  });
});
