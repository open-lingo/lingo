import { describe, it, expect, beforeEach } from "vitest";
import { shouldShowFirstSessionArc } from "./FirstSessionArc";
import { setStoredSettings } from "@/features/settings/storage";
import { getMockProgressSummary } from "@/shared/domain/mockProgress";

/**
 * FTUE P0 (docs/ftue-design-2026-06-14.md §5): the first-session arc shows
 * once to brand-new learners, and the self-chosen daily goal persists into the
 * home Daily-goal card.
 */
describe("FirstSessionArc gate", () => {
  it("shows for a brand-new learner (no lessons, not yet seen)", () => {
    expect(
      shouldShowFirstSessionArc({ completedCount: 0, ftueArcSeen: false }),
    ).toBe(true);
    expect(
      shouldShowFirstSessionArc({ completedCount: 0, ftueArcSeen: undefined }),
    ).toBe(true);
  });

  it("never shows for a returning learner (has progress)", () => {
    expect(
      shouldShowFirstSessionArc({ completedCount: 3, ftueArcSeen: false }),
    ).toBe(false);
  });

  it("never shows again once seen", () => {
    expect(
      shouldShowFirstSessionArc({ completedCount: 0, ftueArcSeen: true }),
    ).toBe(false);
  });

  it("is language-agnostic — same gate for a new KO learner as a JA one", () => {
    // The arc (and its optional-placement offer) is offered to a brand-new
    // learner in ANY course; nothing in the gate is keyed to a language id.
    // The placement route itself is built from the active lang via langPath,
    // and applyPlacementResult levels against that course (covered in
    // applyPlacement.test.ts).
    expect(
      shouldShowFirstSessionArc({ completedCount: 0, ftueArcSeen: undefined }),
    ).toBe(true);
  });
});

describe("self-chosen daily goal persistence", () => {
  beforeEach(() => localStorage.clear());

  it("the home progress summary reflects the committed daily goal", () => {
    // Default before the learner chooses.
    expect(getMockProgressSummary().dailyGoalMinutes).toBe(10);
    // Commit a goal (what the arc's "Commit to my goal" step does).
    setStoredSettings({ learning: { dailyGoalMinutes: 15 } as never });
    expect(getMockProgressSummary().dailyGoalMinutes).toBe(15);
  });
});
