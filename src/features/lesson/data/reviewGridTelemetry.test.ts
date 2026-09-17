import { describe, expect, it, beforeEach, vi } from "vitest";
import type { LessonContent, LessonStep } from "../types";
import type { SRSCardState } from "@/features/flashcards/data/types";
import type { SRSStore } from "@/features/flashcards/engine/srsStorage";
import { summarizeReviewSteps, recordReviewStepsServed } from "./reviewGridTelemetry";
import { logReviewGridServed } from "@/shared/telemetry/sessionLog";

vi.mock("@/shared/telemetry/sessionLog", () => ({
  logReviewGridServed: vi.fn(),
}));

function modality(overrides: Partial<SRSCardState["recognition"]> = {}): SRSCardState["recognition"] {
  return {
    stability: 10,
    difficulty: 5,
    state: "review",
    interval: 10,
    dueDate: "2000-01-01", // always due relative to any test "today"
    lastReviewDate: "1999-12-01",
    reps: 3,
    lapses: 0,
    ...overrides,
  };
}

function dueCard(): SRSCardState {
  return { recognition: modality(), production: modality() };
}

function notDueCard(): SRSCardState {
  const farFuture = modality({ dueDate: "2999-01-01" });
  return { recognition: farFuture, production: farFuture };
}

function step(overrides: Partial<LessonStep> & { id: string; type: LessonStep["type"] }): LessonStep {
  return overrides as LessonStep;
}

function lesson(steps: LessonStep[]): Pick<LessonContent, "id" | "steps"> {
  return { id: "ja-m9-neo-3", steps };
}

describe("summarizeReviewSteps", () => {
  it("skips TEACH-kind steps even if they carry exercisedAtoms", () => {
    const l = lesson([
      step({ id: "s1", type: "info", exercisedAtoms: ["ja:a"] } as never),
    ]);
    expect(summarizeReviewSteps(l, {})).toEqual([]);
  });

  it("skips graded steps with no exercisedAtoms", () => {
    const l = lesson([step({ id: "s1", type: "multiple_choice" } as never)]);
    expect(summarizeReviewSteps(l, {})).toEqual([]);
  });

  it("computes overlap/notDueServed/dueNotServed against the live due set", () => {
    const store: SRSStore = {
      "ja:due1": dueCard(),
      "ja:due2": dueCard(),
      "ja:notdue1": notDueCard(),
    };
    const l = lesson([
      step({
        id: "s1",
        type: "multiple_choice",
        exercisedAtoms: ["ja:due1", "ja:notdue1"],
      } as never),
    ]);
    const rows = summarizeReviewSteps(l, store);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      lessonId: "ja-m9-neo-3",
      stepIndex: 0,
      servedAtomIds: 2,
      dueAtomIds: 2, // due1 + due2, whole-store denominator
      overlap: 1, // due1 only
      notDueServed: 1, // notdue1
      dueNotServed: 1, // due2 never touched by this step
    });
  });

  it("preserves step index across skipped (teach) steps", () => {
    const store: SRSStore = { "ja:a": dueCard() };
    const l = lesson([
      step({ id: "s0", type: "info" } as never),
      step({ id: "s1", type: "multiple_choice", exercisedAtoms: ["ja:a"] } as never),
    ]);
    const rows = summarizeReviewSteps(l, store);
    expect(rows).toHaveLength(1);
    expect(rows[0].stepIndex).toBe(1);
  });
});

describe("recordReviewStepsServed", () => {
  beforeEach(() => {
    vi.mocked(logReviewGridServed).mockClear();
  });

  it("logs one event per graded step", () => {
    const store: SRSStore = { "ja:a": dueCard() };
    const l = lesson([
      step({ id: "s1", type: "multiple_choice", exercisedAtoms: ["ja:a"] } as never),
      step({ id: "s2", type: "multiple_choice", exercisedAtoms: ["ja:a"] } as never),
    ]);
    recordReviewStepsServed(l, store);
    expect(logReviewGridServed).toHaveBeenCalledTimes(2);
  });

  it("is a no-op outside the browser (no window)", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error -- simulate SSR/Node for this one assertion
    delete globalThis.window;
    try {
      const l = lesson([
        step({ id: "s1", type: "multiple_choice", exercisedAtoms: ["ja:a"] } as never),
      ]);
      recordReviewStepsServed(l, { "ja:a": dueCard() });
      expect(logReviewGridServed).not.toHaveBeenCalled();
    } finally {
      globalThis.window = originalWindow;
    }
  });
});
