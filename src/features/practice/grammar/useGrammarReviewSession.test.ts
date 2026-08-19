import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { LessonStep } from "@/features/lesson/types";
import type { SRSCardState } from "@/features/flashcards/data/types";
import type {
  GrammarPoint,
  GrammarReviewItem,
  GrammarReviewQueue,
} from "@/features/flashcards/engine/grammarSrs";

// ── Mocks ──────────────────────────────────────────────────────────────────
const buildGrammarReviewQueue = vi.fn<(...args: unknown[]) => GrammarReviewQueue>();
const reviewGrammarPoint = vi.fn();
const getReachedModules = vi.fn<() => Set<string>>(() => new Set(["m27"]));

vi.mock("@/features/flashcards/engine/grammarSrs", () => ({
  buildGrammarReviewQueue: (...a: unknown[]) => buildGrammarReviewQueue(...a),
  reviewGrammarPoint: (...a: unknown[]) => reviewGrammarPoint(...a),
  getReachedModules: () => getReachedModules(),
}));

const getGrammarPool = vi.fn<(id: string) => LessonStep[]>(() => []);
const getGrammarRuleStepForPoint = vi.fn<(id: string) => LessonStep | null>(
  () => null,
);

vi.mock("@/features/lesson/data/grammarReviewPools", () => ({
  getGrammarPool: (id: string) => getGrammarPool(id),
  getGrammarRuleStepForPoint: (id: string) => getGrammarRuleStepForPoint(id),
}));

import { useGrammarReviewSession, SESSION_CAP } from "./useGrammarReviewSession";

// ── Fixtures ─────────────────────────────────────────────────────────────────
function point(id: string, module = "m3"): GrammarPoint {
  return {
    id,
    point: "は",
    pointEn: "topic",
    category: "particle",
    module,
    status: "shipped",
  };
}

function reviewItem(
  id: string,
  opts: { isNew?: boolean; state?: SRSCardState | null; module?: string } = {},
): GrammarReviewItem {
  return {
    point: point(id, opts.module ?? "m3"),
    state: opts.state ?? null,
    dueModalities: [],
    isNew: opts.isNew ?? false,
  };
}

function makeQueue(items: GrammarReviewItem[]): GrammarReviewQueue {
  return {
    review: items.filter((i) => !i.isNew),
    newItems: items.filter((i) => i.isNew),
    queue: items,
    dueCount: items.filter((i) => !i.isNew).length,
    newCount: items.filter((i) => i.isNew).length,
    unseenTotal: 0,
    newCardsAllowed: 0,
    notDueCount: 0,
  };
}

function clozeStep(
  id: string,
  modality: "recognition" | "production" = "production",
): LessonStep {
  return {
    id,
    type: "particle_cloze",
    modality,
    prompt: { before: "わたし", after: "がくせいです" },
    options: ["は", "が"],
    correctParticle: "は",
  } as unknown as LessonStep;
}

function ruleStep(id: string): LessonStep {
  return {
    id,
    type: "grammar_rule",
    title: "は topic",
    rule: "は marks the topic.",
  } as unknown as LessonStep;
}

function cardState(recognitionReps: number, productionReps: number): SRSCardState {
  return {
    recognition: { reps: recognitionReps },
    production: { reps: productionReps },
  } as unknown as SRSCardState;
}

beforeEach(() => {
  vi.clearAllMocks();
  getReachedModules.mockReturnValue(new Set(["m27"]));
  getGrammarRuleStepForPoint.mockReturnValue(null);
});

describe("useGrammarReviewSession", () => {
  it("caps the session at SESSION_CAP items and reports the surplus as remaining-due", () => {
    const items = Array.from({ length: SESSION_CAP + 10 }, (_, i) =>
      reviewItem(`p${i}`),
    );
    buildGrammarReviewQueue.mockReturnValue(makeQueue(items));
    getGrammarPool.mockImplementation((id) => [clozeStep(`ja-gpool-${id}-1`)]);

    const { result } = renderHook(() => useGrammarReviewSession());

    expect(result.current.progress.total).toBe(SESSION_CAP);
    expect(result.current.phase).toBe("active");

    // Drive all 30 items cleanly → summary.
    for (let i = 0; i < SESSION_CAP; i++) {
      act(() => {
        result.current.onStepComplete(result.current.currentStep!.id, true);
      });
      act(() => {
        result.current.onContinue();
      });
    }

    expect(result.current.phase).toBe("summary");
    expect(result.current.summary).toEqual({
      reviewed: SESSION_CAP,
      correct: SESSION_CAP,
      remainingDue: 10,
      newWaiting: 0,
      practiceOnly: false,
    });
    expect(reviewGrammarPoint).toHaveBeenCalledTimes(SESSION_CAP);
  });

  it("attaches the tagged grammar_rule card as a HINT, never as a step", () => {
    buildGrammarReviewQueue.mockReturnValue(
      makeQueue([reviewItem("wa-topic", { isNew: true })]),
    );
    getGrammarPool.mockReturnValue([clozeStep("ja-gpool-wa-topic-1")]);
    getGrammarRuleStepForPoint.mockReturnValue(ruleStep("rule-wa-topic"));

    const { result } = renderHook(() => useGrammarReviewSession());

    // Spencer 2026-08-18: "grammar review should not show the card again, they
    // can just have access to the hint button." The scored step comes FIRST —
    // there is no passive preface to click past.
    expect(result.current.currentStep?.id).toBe("ja-gpool-wa-topic-1");
    expect(result.current.currentStep?.type).not.toBe("grammar_rule");

    // ...but the card is still reachable, carrying its title and rule line.
    expect(result.current.currentStep?.ruleHint).toMatchObject({
      title: "は topic",
      ruleLine: "は marks the topic.",
    });
    expect(reviewGrammarPoint).not.toHaveBeenCalled();
  });

  it("offers no hint for a point the learner has already reviewed", () => {
    buildGrammarReviewQueue.mockReturnValue(
      makeQueue([reviewItem("wa-topic", { isNew: false })]),
    );
    getGrammarPool.mockReturnValue([clozeStep("ja-gpool-wa-topic-1")]);
    getGrammarRuleStepForPoint.mockReturnValue(ruleStep("rule-wa-topic"));

    const { result } = renderHook(() => useGrammarReviewSession());

    expect(result.current.currentStep?.id).toBe("ja-gpool-wa-topic-1");
    expect(result.current.currentStep?.ruleHint).toBeUndefined();
  });

  it("renders the scored step for a new point with no tagged rule", () => {
    buildGrammarReviewQueue.mockReturnValue(
      makeQueue([reviewItem("wa-topic", { isNew: true })]),
    );
    getGrammarPool.mockReturnValue([clozeStep("ja-gpool-wa-topic-1")]);
    getGrammarRuleStepForPoint.mockReturnValue(null);

    const { result } = renderHook(() => useGrammarReviewSession());

    expect(result.current.currentStep?.id).toBe("ja-gpool-wa-topic-1");
  });

  it("grades a clean correct answer as good (one call)", () => {
    buildGrammarReviewQueue.mockReturnValue(makeQueue([reviewItem("wa-topic")]));
    getGrammarPool.mockReturnValue([clozeStep("ja-gpool-wa-topic-1")]);

    const { result } = renderHook(() => useGrammarReviewSession());

    act(() => {
      result.current.onStepComplete("ja-gpool-wa-topic-1", true);
    });
    act(() => {
      result.current.onContinue();
    });

    expect(reviewGrammarPoint).toHaveBeenCalledTimes(1);
    expect(reviewGrammarPoint).toHaveBeenCalledWith(
      "wa-topic",
      "production",
      "good",
    );
    expect(result.current.phase).toBe("summary");
    expect(result.current.summary).toMatchObject({ reviewed: 1, correct: 1 });
  });

  it("grades a wrong answer as again, then a correct replay as hard (lesson-replay parity)", () => {
    buildGrammarReviewQueue.mockReturnValue(makeQueue([reviewItem("wa-topic")]));
    getGrammarPool.mockReturnValue([clozeStep("ja-gpool-wa-topic-1")]);

    const { result } = renderHook(() => useGrammarReviewSession());

    act(() => {
      result.current.onStepComplete("ja-gpool-wa-topic-1", false);
    });
    act(() => {
      result.current.onContinue();
    });

    // Graded once as again; now in replay pass (same step, replay run).
    expect(reviewGrammarPoint).toHaveBeenCalledTimes(1);
    expect(reviewGrammarPoint).toHaveBeenCalledWith(
      "wa-topic",
      "production",
      "again",
    );
    expect(result.current.phase).toBe("active");
    expect(result.current.isReplayRun).toBe(true);
    expect(result.current.currentStep?.id).toBe("ja-gpool-wa-topic-1");

    // Replay completes correct → graded "hard" once, exactly once.
    act(() => {
      result.current.onStepComplete("ja-gpool-wa-topic-1", true);
    });
    act(() => {
      result.current.onContinue();
    });

    expect(reviewGrammarPoint).toHaveBeenCalledTimes(2);
    expect(reviewGrammarPoint).toHaveBeenNthCalledWith(
      2,
      "wa-topic",
      "production",
      "hard",
    );
    expect(reviewGrammarPoint.mock.calls.map((c) => c[2])).toEqual([
      "again",
      "hard",
    ]);
    expect(result.current.phase).toBe("summary");
    // Replay success does NOT retroactively count as correct — it was missed.
    expect(result.current.summary).toMatchObject({ reviewed: 1, correct: 0 });
  });

  it("grades a wrong answer as again, then a wrong replay writes nothing further", () => {
    buildGrammarReviewQueue.mockReturnValue(makeQueue([reviewItem("wa-topic")]));
    getGrammarPool.mockReturnValue([clozeStep("ja-gpool-wa-topic-1")]);

    const { result } = renderHook(() => useGrammarReviewSession());

    act(() => {
      result.current.onStepComplete("ja-gpool-wa-topic-1", false);
    });
    act(() => {
      result.current.onContinue();
    });

    expect(reviewGrammarPoint).toHaveBeenCalledTimes(1);
    expect(result.current.isReplayRun).toBe(true);

    // Replay completes wrong → no additional write; "again" from the main
    // pass stands.
    act(() => {
      result.current.onStepComplete("ja-gpool-wa-topic-1", false);
    });
    act(() => {
      result.current.onContinue();
    });

    expect(reviewGrammarPoint).toHaveBeenCalledTimes(1);
    expect(reviewGrammarPoint).toHaveBeenCalledWith(
      "wa-topic",
      "production",
      "again",
    );
    expect(result.current.phase).toBe("summary");
    expect(result.current.summary).toMatchObject({ reviewed: 1, correct: 0 });
  });

  it("uses recognition modality when the step is a recognition step", () => {
    buildGrammarReviewQueue.mockReturnValue(makeQueue([reviewItem("wa-topic")]));
    getGrammarPool.mockReturnValue([
      clozeStep("ja-gpool-wa-topic-1", "recognition"),
    ]);

    const { result } = renderHook(() => useGrammarReviewSession());

    act(() => {
      result.current.onStepComplete("ja-gpool-wa-topic-1", true);
    });
    act(() => {
      result.current.onContinue();
    });

    expect(reviewGrammarPoint).toHaveBeenCalledWith(
      "wa-topic",
      "recognition",
      "good",
    );
  });

  it("returns a summary state immediately for an empty queue", () => {
    buildGrammarReviewQueue.mockReturnValue(makeQueue([]));

    const { result } = renderHook(() => useGrammarReviewSession());

    expect(result.current.phase).toBe("summary");
    expect(result.current.currentStep).toBeNull();
    expect(result.current.summary).toEqual({
      reviewed: 0,
      correct: 0,
      remainingDue: 0,
      newWaiting: 0,
      practiceOnly: false,
    });
  });

  it("surfaces the throttled new-card backlog on the summary", () => {
    const q = makeQueue([reviewItem("wa-topic", { isNew: true })]);
    q.unseenTotal = 6;
    buildGrammarReviewQueue.mockReturnValue(q);
    getGrammarPool.mockReturnValue([clozeStep("ja-gpool-wa-topic-1")]);

    const { result } = renderHook(() => useGrammarReviewSession());

    act(() => result.current.onStepComplete("ja-gpool-wa-topic-1", true));
    act(() => result.current.onContinue());

    // 6 unseen total, 1 taken as this session's new card → 5 waiting.
    expect(result.current.summary?.newWaiting).toBe(5);
  });

  it("skips an item whose filtered pool is empty and counts it", () => {
    // Learner has only reached m2, but the point's only pooled step is m3.
    getReachedModules.mockReturnValue(new Set(["m1", "m2"]));
    buildGrammarReviewQueue.mockReturnValue(
      makeQueue([reviewItem("wa-topic", { module: "m3" })]),
    );
    getGrammarPool.mockReturnValue([clozeStep("ja-m3-cloze-1")]);

    const { result } = renderHook(() => useGrammarReviewSession());

    expect(result.current.skippedNullCount).toBe(1);
    expect(result.current.phase).toBe("summary");
    // The skipped item still counts as remaining-due.
    expect(result.current.summary?.remainingDue).toBe(1);
  });

  it("excludes later-module harvested steps but keeps authored/synthesized ids", () => {
    getReachedModules.mockReturnValue(new Set(["m3", "m4", "m5"]));
    buildGrammarReviewQueue.mockReturnValue(
      makeQueue([reviewItem("wa-topic", { module: "m3" })]),
    );
    getGrammarPool.mockReturnValue([
      clozeStep("ja-m3-cloze-1"), // kept (m3 ≤ 5)
      clozeStep("ja-m28-cloze-1"), // excluded (m28 > 5)
      clozeStep("ja-gpool-wa-topic-9"), // kept (authored)
      clozeStep("ja-grev-masu-2"), // kept (synthesized)
    ]);

    const { result } = renderHook(() => useGrammarReviewSession());

    expect(result.current.excludedByModuleCount).toBe(1);
    // state === null → index 0 of the FILTERED pool.
    expect(result.current.currentStep?.id).toBe("ja-m3-cloze-1");
    expect(result.current.progress.total).toBe(1);
  });

  it("passes a pool-aware hasPool predicate to buildGrammarReviewQueue", () => {
    buildGrammarReviewQueue.mockReturnValue(makeQueue([]));
    // getGrammarPool default mock returns [] — an empty-pool point must
    // report false, a pool-backed point true, proving the predicate is
    // actually backed by getGrammarPool rather than a stub.
    getGrammarPool.mockImplementation((id) =>
      id === "has-steps" ? [clozeStep("ja-gpool-has-steps-1")] : [],
    );

    renderHook(() => useGrammarReviewSession());

    expect(buildGrammarReviewQueue).toHaveBeenCalledTimes(1);
    const [, , opts] = buildGrammarReviewQueue.mock.calls[0];
    expect(typeof (opts as { hasPool?: unknown })?.hasPool).toBe("function");
    const hasPool = (opts as { hasPool: (id: string) => boolean }).hasPool;
    expect(hasPool("has-steps")).toBe(true);
    expect(hasPool("empty-pool-point")).toBe(false);
  });

  it("rotates through the filtered pool by rep count", () => {
    getReachedModules.mockReturnValue(new Set(["m27"]));
    buildGrammarReviewQueue.mockReturnValue(
      makeQueue([
        reviewItem("wa-topic", { module: "m3", state: cardState(1, 0) }),
      ]),
    );
    getGrammarPool.mockReturnValue([
      clozeStep("ja-gpool-wa-topic-1"),
      clozeStep("ja-gpool-wa-topic-2"),
      clozeStep("ja-gpool-wa-topic-3"),
    ]);

    const { result } = renderHook(() => useGrammarReviewSession());

    // reps sum = 1 → index 1.
    expect(result.current.currentStep?.id).toBe("ja-gpool-wa-topic-2");
  });

  describe("practice mode (no-SRS 'practice anyway' session)", () => {
    it("requests the widened queue (includeNotDue) from the engine", () => {
      buildGrammarReviewQueue.mockReturnValue(makeQueue([]));

      renderHook(() => useGrammarReviewSession({ practice: true }));

      const [, , opts] = buildGrammarReviewQueue.mock.calls[0];
      expect((opts as { includeNotDue?: boolean }).includeNotDue).toBe(true);

      // Default (due) session must NOT widen.
      buildGrammarReviewQueue.mockClear();
      renderHook(() => useGrammarReviewSession());
      const [, , dueOpts] = buildGrammarReviewQueue.mock.calls[0];
      expect((dueOpts as { includeNotDue?: boolean }).includeNotDue).toBe(false);
    });

    it("writes NOTHING to Track B across main and replay passes", () => {
      buildGrammarReviewQueue.mockReturnValue(
        makeQueue([reviewItem("wa-topic"), reviewItem("ka-question")]),
      );
      getGrammarPool.mockImplementation((id) => [clozeStep(`ja-gpool-${id}-1`)]);

      const { result } = renderHook(() =>
        useGrammarReviewSession({ practice: true }),
      );

      // Item 1 correct, item 2 wrong → replay pass runs.
      act(() => result.current.onStepComplete("ja-gpool-wa-topic-1", true));
      act(() => result.current.onContinue());
      act(() => result.current.onStepComplete("ja-gpool-ka-question-1", false));
      act(() => result.current.onContinue());

      // Replay the missed item correctly (would grade "hard" in a due session).
      expect(result.current.isReplayRun).toBe(true);
      act(() => result.current.onStepComplete("ja-gpool-ka-question-1", true));
      act(() => result.current.onContinue());

      expect(result.current.phase).toBe("summary");
      expect(reviewGrammarPoint).not.toHaveBeenCalled();
      expect(result.current.summary).toMatchObject({
        reviewed: 2,
        correct: 1,
        practiceOnly: true,
      });
    });
  });
});
