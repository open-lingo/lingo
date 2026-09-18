import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { applyPlacementResult } from "./applyPlacement";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { getCourseAtoms } from "@/shared/language/registry";
import {
  getCardState,
  setCardState,
} from "@/features/flashcards/engine/srsStorage";
import { createInitialState, reviewCard } from "@/features/flashcards/engine/srs";
import { clearSessionLog, getSessionLog } from "@/shared/telemetry/sessionLog";

describe("applyPlacementResult — language-aware leveling", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessionLog();
  });

  it("returns empty result for no passed modules", () => {
    const r = applyPlacementResult([]);
    expect(r.skippedLessonCount).toBe(0);
    expect(r.seededAtomCount).toBe(0);
  });

  // 2026-09-18 — Spencer's iPad ran a placement test-out and neither the
  // local completedCount nor the server moved; the diagnostics session log
  // had NO record the test-out ever happened at all, so there was no way to
  // tell "applied locally, push never fired" apart from "never applied".
  // This closes that gap: every call now leaves a trace, applied or empty.
  it("logs a test_out_applied sync_event with the credited counts, even when nothing was credited", () => {
    applyPlacementResult(["m3"], "ja");
    const events = getSessionLog().filter(
      (e) => e.type === "sync_event" && e.payload.source === "test_out_applied",
    );
    expect(events).toHaveLength(1);
    expect(events[0].payload).toMatchObject({
      source: "test_out_applied",
      languageId: "ja",
      passedCount: 1,
      assumedCount: 0,
    });
    expect((events[0].payload as { lessonCount: number }).lessonCount).toBeGreaterThan(0);

    clearSessionLog();
    applyPlacementResult([]);
    const emptyEvents = getSessionLog().filter(
      (e) => e.type === "sync_event" && e.payload.source === "test_out_applied",
    );
    expect(emptyEvents).toHaveLength(1);
    expect(emptyEvents[0].payload).toMatchObject({ passedCount: 0, assumedCount: 0, lessonCount: 0 });
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

  it("JA placement leaves the module's review lesson AVAILABLE, not completed (2026-09-16 regex-drift regression guard)", () => {
    // ja review lesson ids moved from `ja-m3-review-1` to the rewrite-spine
    // shape `ja-m3-neo-review` (and `ja-mN-neo-review-1/2/3` from m7 on).
    // The old hardcoded `/^ja-m\d+-review-[12]$/` in this file stopped
    // matching ANY current id, so placement silently stopped skipping
    // review lessons — they got marked complete like any other lesson,
    // which defeats their purpose as the learner's first SRS review
    // opportunity. This asserts the m3 review lesson stays un-completed.
    applyPlacementResult(["m3"], "ja");
    const done = getMockCompletedLessonIds();
    expect(done).toContain("ja-m3-neo-1");
    expect(done).not.toContain("ja-m3-neo-review");
  });

  it("an unregistered language is a no-op (no crash)", () => {
    const r = applyPlacementResult(["m3"], "zz");
    expect(r.skippedLessonCount).toBe(0);
    expect(r.seededAtomCount).toBe(0);
  });

  it("does not clobber a GENUINELY MORE ADVANCED SRS state (Bug 2 regression, generalized for D7 test-out seeding)", () => {
    // Pick a real m3 atom and give it real learned progress, well past what
    // a test-out of m3 alone would seed (distance 1 → 5 days) — this
    // mirrors re-running placement over an atom test-out/review lessons
    // already advanced further than the seed would.
    const atoms = getCourseAtoms("ja").filter((a) => a.fromModule === "m3");
    expect(atoms.length).toBeGreaterThan(0);
    const target = atoms[0];

    const mature = {
      recognition: {
        stability: 40,
        difficulty: 5,
        state: "review" as const,
        interval: 40,
        dueDate: "2099-01-01",
        lastReviewDate: "2026-01-01",
        reps: 3,
        lapses: 0,
      },
      production: {
        stability: 40,
        difficulty: 5,
        state: "review" as const,
        interval: 40,
        dueDate: "2099-01-01",
        lastReviewDate: "2026-01-01",
        reps: 3,
        lapses: 0,
      },
    };
    setCardState(target.id, mature);

    applyPlacementResult(["m3"], "ja");

    const after = getCardState(target.id);
    expect(after).toEqual(mature);
    // Sanity: placement still seeds atoms that had no prior state.
    const untouched = atoms.find((a) => a.id !== target.id);
    if (untouched) {
      expect(getCardState(untouched.id)).toBeDefined();
    }
  });

  it("BOOSTS an existing state that's LESS advanced than the test-out seed (D7 — never shorten a longer interval, but a short one legitimately gets raised)", () => {
    // A single in-lesson "good" review leaves a same-day/short interval —
    // less advanced than even a distance-1 (5-day) test-out seed. Testing
    // out of the whole module is stronger evidence than one lesson answer,
    // so it's allowed to raise this card, per the coordinator's D7 rule
    // ("Seeding only applies to atoms with no existing SRS state or a
    // state that is less advanced than the seed").
    const atoms = getCourseAtoms("ja").filter((a) => a.fromModule === "m3");
    const target = atoms[0];

    const barelyStarted = reviewCard(createInitialState(), "recognition", "good");
    setCardState(target.id, barelyStarted);

    applyPlacementResult(["m3"], "ja");

    const after = getCardState(target.id);
    expect(after?.recognition.interval).toBe(5);
    expect(after?.production.interval).toBe(5);
    expect(after?.known).toBe(false);
  });

  it("computes the distance-scaled seed for a multi-module test-out (m30 → m1 gets 150 days, known)", () => {
    const m1Atoms = getCourseAtoms("ja").filter((a) => a.fromModule === "m1");
    expect(m1Atoms.length).toBeGreaterThan(0);

    // Simulate a banded placement/test-out that credits every module 1..30 —
    // the m1 atoms are 30 modules back from the highest credited module.
    const passed = Array.from({ length: 30 }, (_, i) => `m${i + 1}`);
    applyPlacementResult(passed, "ja");

    const state = getCardState(m1Atoms[0].id);
    expect(state?.recognition.interval).toBe(150);
    expect(state?.known).toBe(true);
  });

  describe("seeding is batched into one SRS store write (perf, TestFlight #80 QA)", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("a multi-module banded placement pass writes the SRS store exactly once", () => {
      const spy = vi.spyOn(localStorage, "setItem");
      const passed = Array.from({ length: 30 }, (_, i) => `m${i + 1}`);
      const r = applyPlacementResult(passed, "ja");
      expect(r.seededAtomCount).toBeGreaterThan(0);

      const srsWrites = spy.mock.calls.filter(
        ([key]) => key === "open-lingo-srs:v2",
      );
      expect(srsWrites).toHaveLength(1);
    });
  });
});
