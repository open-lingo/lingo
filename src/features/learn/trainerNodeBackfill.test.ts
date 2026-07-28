import { describe, it, expect, beforeEach } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  clearMockProgress,
  isLessonCompleted,
  markLessonCompleted,
} from "@/shared/domain/mockProgress";
import { backfillTrainerNodes } from "./trainerNodeBackfill";

/**
 * Trainer nodes landed in modules people had already finished, and
 * `getCurrentModuleIndex` returns the FIRST module that isn't fully complete —
 * so without a retro-credit, shipping this feature would have pulled every
 * existing learner back to module 8 and dragged `useCourseLevel` (drill pools,
 * kanji exposure, the learn map) back with them.
 */
const FLAG_KEY = "lingo_trainer_node_backfill_v1";

function moduleWithTrainerNode() {
  for (const mod of getMockCourse("ja").modules) {
    const node = (mod.lessons ?? []).find((l) => l.kind === "trainer");
    if (node) return { mod, node };
  }
  throw new Error("no trainer node in the ja course — this guard has nothing to protect");
}

function complete(id: string) {
  markLessonCompleted(id, { accuracy: 1, xpEarned: 0, isReview: false });
}

describe("trainer node backfill", () => {
  beforeEach(() => {
    clearMockProgress();
    localStorage.removeItem(FLAG_KEY);
  });

  it("credits the node when the rest of the module was already finished", () => {
    const { mod, node } = moduleWithTrainerNode();
    for (const l of mod.lessons ?? []) if (l.kind !== "trainer") complete(l.id);

    expect(isLessonCompleted(node.id)).toBe(false);
    expect(backfillTrainerNodes("ja")).toBeGreaterThan(0);
    expect(isLessonCompleted(node.id)).toBe(true);
  });

  it("leaves the node alone when the module was NOT finished", () => {
    const { mod, node } = moduleWithTrainerNode();
    const rows = (mod.lessons ?? []).filter((l) => l.kind !== "trainer");
    // Everything but one — a learner who was still working through it.
    for (const l of rows.slice(0, -1)) complete(l.id);

    backfillTrainerNodes("ja");
    expect(isLessonCompleted(node.id)).toBe(false);
  });

  it("runs once, so a learner who finishes the module later still meets the gate", () => {
    const { mod, node } = moduleWithTrainerNode();
    const rows = (mod.lessons ?? []).filter((l) => l.kind !== "trainer");
    for (const l of rows.slice(0, -1)) complete(l.id);

    // First load: nothing to credit, but the migration is spent.
    expect(backfillTrainerNodes("ja")).toBe(0);
    // Learner now finishes the last real lesson...
    complete(rows[rows.length - 1].id);
    // ...and the drill is still required. A backfill that re-ran here would
    // hand out the credit and the gate would never fire for anyone.
    expect(backfillTrainerNodes("ja")).toBe(0);
    expect(isLessonCompleted(node.id)).toBe(false);
  });
});
