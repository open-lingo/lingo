import { describe, it, expect, beforeEach } from "vitest";
import { getMockCourse } from "@/shared/domain/mockCourse";
import {
  clearMockProgress,
  getLessonCompletion,
  getMockCompletedLessonIds,
  isLessonCompleted,
  markLessonCompleted,
} from "@/shared/domain/mockProgress";
import { backfillStoryNodes, storyNodeId } from "./storyNodeBackfill";

/**
 * Story nodes landed in modules people had already finished, and
 * `getCurrentModuleIndex` returns the FIRST module that isn't fully complete —
 * so without a retro-credit, shipping this would have pulled every existing
 * learner back to module 3 and dragged `useCourseLevel` (drill pools, kanji
 * exposure, the transit map) back with them.
 *
 * Reads the REAL course, like `trainerNodeBackfill.test.ts` — that way the
 * guard also proves the rows it protects actually exist.
 */
const FLAG_KEY = "lingo_story_node_backfill_v1";

function moduleWithStoryNode(langId: string) {
  for (const mod of getMockCourse(langId).modules) {
    const node = (mod.lessons ?? []).find((l) => l.kind === "story");
    if (node) return { mod, node };
  }
  throw new Error(`no story node in the ${langId} course — this guard has nothing to protect`);
}

function complete(id: string) {
  markLessonCompleted(id, { accuracy: 1, xpEarned: 0, isReview: false });
}

describe("storyNodeId", () => {
  it("prefixes the story id", () => {
    expect(storyNodeId("ja-m3-about-me")).toBe("story:ja-m3-about-me");
  });
});

describe("story node backfill", () => {
  beforeEach(() => {
    clearMockProgress();
    localStorage.removeItem(FLAG_KEY);
  });

  it("promotes a story node whose id matches storyNodeId", () => {
    const { node } = moduleWithStoryNode("ja");
    expect(node.storyId).toBeTruthy();
    expect(node.id).toBe(storyNodeId(node.storyId!));
  });

  it("credits the node when the rest of the module was already finished", () => {
    const { mod, node } = moduleWithStoryNode("ja");
    for (const l of mod.lessons ?? []) if (l.kind !== "story") complete(l.id);

    expect(isLessonCompleted(node.id)).toBe(false);
    expect(backfillStoryNodes("ja")).toBeGreaterThan(0);
    expect(isLessonCompleted(node.id)).toBe(true);
  });

  it("leaves the node alone when the module was NOT finished", () => {
    const { mod, node } = moduleWithStoryNode("ja");
    const rows = (mod.lessons ?? []).filter((l) => l.kind !== "story");
    // Everything but one — a learner who was still working through it.
    for (const l of rows.slice(0, -1)) complete(l.id);

    expect(backfillStoryNodes("ja")).toBe(0);
    expect(isLessonCompleted(node.id)).toBe(false);
  });

  it("does not re-credit a story node that is already complete", () => {
    const { mod, node } = moduleWithStoryNode("ja");
    for (const l of mod.lessons ?? []) complete(l.id);

    expect(isLessonCompleted(node.id)).toBe(true);
    expect(backfillStoryNodes("ja")).toBe(0);
  });

  it("runs once, so a learner who finishes the module later still meets the read", () => {
    const { mod, node } = moduleWithStoryNode("ja");
    const rows = (mod.lessons ?? []).filter((l) => l.kind !== "story");
    for (const l of rows.slice(0, -1)) complete(l.id);

    // First load: nothing to credit, but the migration is spent.
    expect(backfillStoryNodes("ja")).toBe(0);
    // Learner now finishes the last real lesson...
    complete(rows[rows.length - 1].id);
    // ...and the story is still asked for. A backfill that re-ran here would
    // hand out the credit and nobody would ever be sent to the reader.
    expect(backfillStoryNodes("ja")).toBe(0);
    expect(isLessonCompleted(node.id)).toBe(false);
  });

  it("awards zero XP — this is bookkeeping for work already done, not a reward", () => {
    const { mod, node } = moduleWithStoryNode("ja");
    for (const l of mod.lessons ?? []) if (l.kind !== "story") complete(l.id);
    backfillStoryNodes("ja");

    expect(getMockCompletedLessonIds()).toContain(node.id);
    const record = getLessonCompletion(node.id);
    expect(record?.lastXp).toBe(0);
    expect(record?.bestAccuracy).toBe(1);
    // Not a review — the learner has not actually read it yet.
    expect(record?.reviewCount).toBe(0);
  });

  it("covers Korean too — both shipped courses carry story nodes", () => {
    const { mod, node } = moduleWithStoryNode("ko");
    for (const l of mod.lessons ?? []) if (l.kind !== "story") complete(l.id);

    expect(backfillStoryNodes("ko")).toBeGreaterThan(0);
    expect(isLessonCompleted(node.id)).toBe(true);
  });
});
