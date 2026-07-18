/**
 * GATE 10 — contract emitter + sanity gate.
 *
 * Normal suite runs: cheap invariants only (contracts build, key fields
 * present) so visualQaContracts.ts can never silently rot.
 *
 * Emission mode: `VISUAL_QA_LESSONS="ja-m8-6-1,ja-m29-4-1" npx vitest run
 * src/features/lesson/dev/visualQaContracts.emit.test.ts` writes
 * `test-results/visual-qa/<lessonId>/contracts.json` for the capture +
 * judge stages. (Runs under vitest so the vite alias/content pipeline is
 * identical to the app — vite-node is not reliable in this environment.)
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildLessonContracts } from "./visualQaContracts";
import { HIRAGANA_ROMAJI_OFF_MODULE } from "@/shared/settings/romajiAutoFlip";

// NOT under test-results/ — Playwright clears that dir at every run start.
const OUT_ROOT = path.resolve(__dirname, "../../../../artifacts/visual-qa");
const EMIT_LESSONS = (process.env.VISUAL_QA_LESSONS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

describe("visual-qa contracts — sanity", () => {
  it("builds contracts for a known m8 lesson with per-step expectations", () => {
    const set = buildLessonContracts("ja-m8-6-1");
    expect(set.moduleIndex).toBe(8);
    expect(set.steps.length).toBeGreaterThan(5);
    expect(set.universalExpectations.length).toBeGreaterThan(3);
    // Module ≥ M7 ⇒ the no-hiragana-romaji invariant must be stated.
    expect(
      set.universalExpectations.join(" "),
    ).toContain(`M${HIRAGANA_ROMAJI_OFF_MODULE}`);
    const speak = set.steps.find((s) => s.stepId === "ja-m8-6-1-speak-tooi");
    expect(speak).toBeDefined();
    expect(speak!.mustShow.join(" ")).toContain("とおいです");
    expect(speak!.mustShow).toContain("That mountain (over there) is far.");
  });

  it("kanji_reading contracts forbid the reading as furigana", () => {
    const set = buildLessonContracts("ja-m29-1-1");
    const kr = set.steps.find((s) => s.stepType === "kanji_reading");
    if (kr) {
      expect(kr.mustNotShow.join(" ")).toContain("reading");
    }
    expect(set.moduleIndex).toBe(29);
  });
});

describe.runIf(EMIT_LESSONS.length > 0)("visual-qa contracts — emit", () => {
  it(`emits contracts.json for: ${EMIT_LESSONS.join(", ")}`, () => {
    for (const lessonId of EMIT_LESSONS) {
      const set = buildLessonContracts(lessonId);
      const dir = path.join(OUT_ROOT, lessonId);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, "contracts.json"),
        JSON.stringify(set, null, 2),
      );
      expect(set.steps.length).toBeGreaterThan(0);
    }
  });
});
