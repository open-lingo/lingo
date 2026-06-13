import { describe, it, expect, beforeEach } from "vitest";
import {
  getActiveGrammarPoints,
  buildGrammarReviewQueue,
  setGrammarCardState,
  getGrammarCardState,
  reviewGrammarPoint,
  clearGrammarStore,
} from "./grammarSrs";
import { createInitialState } from "./srs";
import {
  JA_COURSE_ATOMS,
  canonicalAtomId,
} from "@/features/languages/ja/courseAtoms";

/** Unlocked set containing every atom from the given modules (canonical ids). */
function unlockModules(...modules: string[]): Set<string> {
  const set = new Set<string>();
  for (const atom of JA_COURSE_ATOMS) {
    if (atom.fromModule && modules.includes(atom.fromModule)) {
      set.add(canonicalAtomId(atom));
    }
  }
  return set;
}

describe("Track B — grammar SRS", () => {
  beforeEach(() => clearGrammarStore());

  it("activates only shipped grammar points whose module is reached", () => {
    const unlocked = unlockModules("m3");
    const active = getActiveGrammarPoints(unlocked);
    const ids = active.map((p) => p.id);
    expect(ids).toContain("wa-topic"); // m3, shipped
    // A point from a much later, un-reached module must NOT be active.
    expect(active.every((p) => p.module === "m3")).toBe(true);
    expect(ids).not.toContain("te-form"); // m14, not reached
  });

  it("never-reviewed points are throttled unseen; nothing due yet", () => {
    const unlocked = unlockModules("m3");
    const q = buildGrammarReviewQueue(unlocked);
    expect(q.dueCount).toBe(0); // no state yet
    expect(q.unseenTotal).toBeGreaterThan(0);
    expect(q.newCount).toBeLessThanOrEqual(q.newCardsAllowed);
    expect(q.newCount).toBeLessThanOrEqual(q.unseenTotal);
  });

  it("a seeded (due) point surfaces in the review pile", () => {
    const unlocked = unlockModules("m3");
    setGrammarCardState("wa-topic", createInitialState()); // fresh = due today
    const q = buildGrammarReviewQueue(unlocked);
    expect(q.review.some((i) => i.point.id === "wa-topic")).toBe(true);
    expect(q.dueCount).toBeGreaterThanOrEqual(1);
  });

  it("reviewing a point writes Track B state (separate on-ramp)", () => {
    expect(getGrammarCardState("wa-topic")).toBeUndefined();
    reviewGrammarPoint("wa-topic", "production", "good");
    expect(getGrammarCardState("wa-topic")).toBeDefined();
  });
});
