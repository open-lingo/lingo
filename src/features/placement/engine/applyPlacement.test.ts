import { describe, it, expect, beforeEach } from "vitest";
import { applyPlacementResult } from "./applyPlacement";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { getCourseAtoms } from "@/shared/language/registry";
import {
  getCardState,
  setCardState,
} from "@/features/flashcards/engine/srsStorage";
import { createInitialState, reviewCard } from "@/features/flashcards/engine/srs";

describe("applyPlacementResult — language-aware leveling", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty result for no passed modules", () => {
    const r = applyPlacementResult([]);
    expect(r.skippedLessonCount).toBe(0);
    expect(r.seededAtomCount).toBe(0);
  });

  it("JA leveling completes JA lessons (ja-* ids), never KO", () => {
    const r = applyPlacementResult(["m3"], "ja");
    expect(r.skippedLessonCount).toBeGreaterThan(0);
    const done = getMockCompletedLessonIds();
    expect(done.some((id) => id.startsWith("ja-"))).toBe(true);
    expect(done.some((id) => id.startsWith("ko-"))).toBe(false);
  });

  it("KO leveling completes KO lessons (ko-* ids), never JA", () => {
    // The core regression guard: a KO learner's placement must NOT be
    // silently leveled against the JA course (the old `?? \"ja\"` bug).
    const r = applyPlacementResult(["m3"], "ko");
    expect(r.skippedLessonCount).toBeGreaterThan(0);
    const done = getMockCompletedLessonIds();
    expect(done.some((id) => id.startsWith("ko-"))).toBe(true);
    expect(done.some((id) => id.startsWith("ja-"))).toBe(false);
  });

  it("KO leveling auto-completes the script modules (m1/m2) when a later module passes", () => {
    applyPlacementResult(["m5"], "ko");
    // m1/m2 are script modules — passing m5 implies the learner can read
    // Hangul, so those modules' lessons are auto-completed too.
    expect(getMockCompletedLessonIds()).toContain("ko-m1-intro");
  });

  it("an unregistered language is a no-op (no crash)", () => {
    const r = applyPlacementResult(["m3"], "zz");
    expect(r.skippedLessonCount).toBe(0);
    expect(r.seededAtomCount).toBe(0);
  });

  it("does not clobber existing SRS progress on an atom that's already learned (Bug 2 regression)", () => {
    // Pick a real m3 atom and give it real learned progress BEFORE running
    // placement over m3 — this mirrors re-running placement (or placement
    // landing on an atom test-out/review lessons already advanced).
    const atoms = getCourseAtoms("ja").filter((a) => a.fromModule === "m3");
    expect(atoms.length).toBeGreaterThan(0);
    const target = atoms[0];

    const learned = reviewCard(createInitialState(), "recognition", "good");
    setCardState(target.id, learned);

    applyPlacementResult(["m3"], "ja");

    const after = getCardState(target.id);
    expect(after).toEqual(learned);
    // Sanity: placement still seeds atoms that had no prior state.
    const untouched = atoms.find((a) => a.id !== target.id);
    if (untouched) {
      expect(getCardState(untouched.id)).toBeDefined();
    }
  });
});
