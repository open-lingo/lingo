import { describe, it, expect, beforeEach } from "vitest";
import { getDerivedDueReviews } from "./derivedReviews";
import { setCardState, clearSRSStore } from "@/features/flashcards/engine/srsStorage";
import { createInitialState } from "@/features/flashcards/engine/srs";
import { setGrammarCardState, clearGrammarStore } from "@/features/flashcards/engine/grammarSrs";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { JA_COURSE_ATOMS, isSrsEligibleAtom } from "@/features/languages/ja/courseAtoms";

/**
 * Phase 4: the Learn review chip is performance-derived — a module is "due"
 * only when it has actually-due vocab/grammar, not on a fixed calendar.
 */
describe("getDerivedDueReviews (Phase 4)", () => {
  const course = getMockCourse("ja");

  beforeEach(() => {
    clearSRSStore();
    clearGrammarStore();
  });

  it("is empty when nothing has been reviewed (no calendar firing)", () => {
    expect(getDerivedDueReviews(course)).toEqual([]);
  });

  it("surfaces a module once one of its vocab cards is due (Track A)", () => {
    const m3Atom = JA_COURSE_ATOMS.find(
      (a) => a.fromModule === "m3" && isSrsEligibleAtom(a),
    )!;
    setCardState(m3Atom.id, createInitialState()); // fresh = due today
    const due = getDerivedDueReviews(course);
    expect(due.some((d) => d.moduleId === "m3")).toBe(true);
  });

  it("surfaces a module via due grammar points too (Track B)", () => {
    setGrammarCardState("wa-topic", createInitialState()); // m3, due today
    const due = getDerivedDueReviews(course);
    const m3 = due.find((d) => d.moduleId === "m3");
    expect(m3).toBeDefined();
    expect((m3?.dueCount ?? 0)).toBeGreaterThanOrEqual(1);
  });
});
