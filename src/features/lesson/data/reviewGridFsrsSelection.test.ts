import { describe, expect, it } from "vitest";
import type { SRSCardState } from "@/features/flashcards/data/types";
import type { SRSStore } from "@/features/flashcards/engine/srsStorage";
import { selectReviewCandidatesByFsrs } from "./reviewGridFsrsSelection";

const TODAY_MS = new Date("2026-09-17T00:00:00.000Z").getTime();

function modality(overrides: Partial<SRSCardState["recognition"]> = {}): SRSCardState["recognition"] {
  return {
    stability: 10,
    difficulty: 5,
    state: "review",
    interval: 10,
    dueDate: "2026-09-10", // overdue vs TODAY_MS by default
    lastReviewDate: "2026-09-01",
    reps: 3,
    lapses: 0,
    ...overrides,
  };
}

function due(overdueByDays: number, stability = 10): SRSCardState {
  const dueDate = new Date(TODAY_MS - overdueByDays * 86_400_000)
    .toISOString()
    .slice(0, 10);
  return { recognition: modality({ dueDate, stability }), production: modality({ dueDate, stability }) };
}

describe("selectReviewCandidatesByFsrs", () => {
  it("returns the input untouched when disabled (the flag-off / default path)", () => {
    const store: SRSStore = { "ja:a": due(20), "ja:b": due(1) };
    const input = ["ja:b", "ja:a"]; // heuristic already put b first
    const out = selectReviewCandidatesByFsrs(input, { enabled: false, store, todayMs: TODAY_MS });
    expect(out).toEqual(input);
  });

  it("ranks overdue candidates first when enabled and coverage is high enough", () => {
    const store: SRSStore = { "ja:a": due(1), "ja:b": due(20), "ja:c": due(5) };
    const out = selectReviewCandidatesByFsrs(["ja:a", "ja:b", "ja:c"], {
      enabled: true,
      store,
      todayMs: TODAY_MS,
      minCoverage: 0.5,
    });
    expect(out).toEqual(["ja:b", "ja:c", "ja:a"]);
  });

  it("breaks overdue ties by lowest stability first", () => {
    const store: SRSStore = { "ja:stiff": due(5, 40), "ja:frail": due(5, 2) };
    const out = selectReviewCandidatesByFsrs(["ja:stiff", "ja:frail"], {
      enabled: true,
      store,
      todayMs: TODAY_MS,
    });
    expect(out).toEqual(["ja:frail", "ja:stiff"]);
  });

  it("with an EMPTY store, returns exactly what the heuristic (input) order was", () => {
    const store: SRSStore = {};
    const input = ["ja:x", "ja:y", "ja:z"];
    const out = selectReviewCandidatesByFsrs(input, { enabled: true, store, todayMs: TODAY_MS });
    expect(out).toEqual(input);
  });

  it("falls back to heuristic order when coverage is below minCoverage (new user, SSR)", () => {
    // 1 of 4 candidates has state = 25% coverage, below the default 50%.
    const store: SRSStore = { "ja:a": due(30) };
    const input = ["ja:a", "ja:b", "ja:c", "ja:d"];
    const out = selectReviewCandidatesByFsrs(input, { enabled: true, store, todayMs: TODAY_MS });
    expect(out).toEqual(input);
  });

  it("ranks once coverage clears the configured minCoverage threshold", () => {
    const store: SRSStore = { "ja:a": due(30) };
    const input = ["ja:a", "ja:b"]; // 50% coverage
    const out = selectReviewCandidatesByFsrs(input, {
      enabled: true,
      store,
      todayMs: TODAY_MS,
      minCoverage: 0.5,
    });
    expect(out[0]).toBe("ja:a"); // the only stateful (and therefore most-overdue) id ranks first
  });

  it("GATE: a never-introduced atom can never be selected — the function is a pure permutation of `candidates`", () => {
    // Simulates the real call shape: `candidates` is already the
    // comprehensibility-gated pool (only introduced atoms), so an atom the
    // learner hasn't met is never even offered to this function — and even
    // if the store falsely claims it is severely overdue, it cannot appear
    // in the output because it was never in the input.
    const neverIntroduced = "ja:future-word";
    const store: SRSStore = {
      "ja:a": due(1),
      "ja:b": due(2),
      [neverIntroduced]: due(9999), // maximally "overdue" — must still never surface
    };
    const gatedCandidates = ["ja:a", "ja:b"]; // caller excluded neverIntroduced upstream
    const out = selectReviewCandidatesByFsrs(gatedCandidates, {
      enabled: true,
      store,
      todayMs: TODAY_MS,
      minCoverage: 0.5,
    });
    expect(out).not.toContain(neverIntroduced);
    expect([...out].sort()).toEqual([...gatedCandidates].sort());
  });

  it("is a no-op on an empty candidate list", () => {
    expect(selectReviewCandidatesByFsrs([], { enabled: true })).toEqual([]);
  });
});
