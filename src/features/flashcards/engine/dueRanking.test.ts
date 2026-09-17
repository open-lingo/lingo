import { describe, expect, it } from "vitest";
import type { SRSCardState } from "../data/types";
import type { SRSStore } from "./srsStorage";
import {
  minStability,
  overdueDays,
  rankOne,
  sortIdsByDueness,
  stateCoverage,
} from "./dueRanking";

const TODAY_MS = new Date("2026-09-17T00:00:00.000Z").getTime();

function modality(
  overrides: Partial<SRSCardState["recognition"]> = {},
): SRSCardState["recognition"] {
  return {
    stability: 10,
    difficulty: 5,
    state: "review",
    interval: 10,
    dueDate: "2026-09-17",
    lastReviewDate: "2026-09-10",
    reps: 3,
    lapses: 0,
    ...overrides,
  };
}

function card(overrides: {
  recognition?: Partial<SRSCardState["recognition"]>;
  production?: Partial<SRSCardState["recognition"]>;
} = {}): SRSCardState {
  return {
    recognition: modality(overrides.recognition),
    production: modality(overrides.production),
  };
}

describe("overdueDays", () => {
  it("is 0 for a not-yet-due card", () => {
    const state = card({
      recognition: { dueDate: "2026-09-20" },
      production: { dueDate: "2026-09-25" },
    });
    expect(overdueDays(state, TODAY_MS)).toBe(0);
  });

  it("uses the EARLIEST due date across modalities", () => {
    const state = card({
      recognition: { dueDate: "2026-09-15" }, // 2 days overdue
      production: { dueDate: "2026-09-10" }, // 7 days overdue
    });
    expect(overdueDays(state, TODAY_MS)).toBeCloseTo(7, 5);
  });
});

describe("minStability", () => {
  it("takes the lower (more fragile) of the two modalities", () => {
    const state = card({
      recognition: { stability: 20 },
      production: { stability: 3 },
    });
    expect(minStability(state)).toBe(3);
  });
});

describe("rankOne", () => {
  it("returns state: undefined + due: false for an id with no stored card", () => {
    const rank = rankOne("ja:unknown", {}, TODAY_MS);
    expect(rank.state).toBeUndefined();
    expect(rank.due).toBe(false);
  });

  it("canonicalizes bare ids the same way the store does", () => {
    const store: SRSStore = { "ja:ai": card() };
    const rank = rankOne("ai", store, TODAY_MS); // bare id, default lang prefix ja
    expect(rank.state).toBeDefined();
  });
});

describe("sortIdsByDueness", () => {
  it("ranks stateful ids before stateless ones", () => {
    const store: SRSStore = { "ja:a": card() };
    const out = sortIdsByDueness(["ja:b", "ja:a", "ja:c"], store, TODAY_MS);
    expect(out[0]).toBe("ja:a");
    // b, c keep their original relative order (stable, no state either)
    expect(out.slice(1)).toEqual(["ja:b", "ja:c"]);
  });

  it("ranks most-overdue first among due cards", () => {
    const store: SRSStore = {
      "ja:mild": card({
        recognition: { dueDate: "2026-09-15" },
        production: { dueDate: "2026-09-15" },
      }), // 2 days overdue
      "ja:severe": card({
        recognition: { dueDate: "2026-09-01" },
        production: { dueDate: "2026-09-01" },
      }), // 16 days overdue
    };
    const out = sortIdsByDueness(["ja:mild", "ja:severe"], store, TODAY_MS);
    expect(out).toEqual(["ja:severe", "ja:mild"]);
  });

  it("breaks overdue ties by lowest stability first", () => {
    const store: SRSStore = {
      "ja:stable": card({
        recognition: { dueDate: "2026-09-10", stability: 40 },
        production: { dueDate: "2026-09-10", stability: 40 },
      }),
      "ja:fragile": card({
        recognition: { dueDate: "2026-09-10", stability: 2 },
        production: { dueDate: "2026-09-10", stability: 2 },
      }),
    };
    const out = sortIdsByDueness(["ja:stable", "ja:fragile"], store, TODAY_MS);
    expect(out).toEqual(["ja:fragile", "ja:stable"]);
  });

  it("puts due cards ahead of not-yet-due cards regardless of stability", () => {
    const store: SRSStore = {
      "ja:notdue": card({
        recognition: { dueDate: "2026-12-01", stability: 1 },
        production: { dueDate: "2026-12-01", stability: 1 },
      }),
      "ja:due": card({
        recognition: { dueDate: "2026-09-16", stability: 99 },
        production: { dueDate: "2026-09-16", stability: 99 },
      }),
    };
    const out = sortIdsByDueness(["ja:notdue", "ja:due"], store, TODAY_MS);
    expect(out).toEqual(["ja:due", "ja:notdue"]);
  });

  it("is a permutation — never drops or adds an id", () => {
    const store: SRSStore = { "ja:a": card() };
    const input = ["ja:z", "ja:a", "ja:m"];
    const out = sortIdsByDueness(input, store, TODAY_MS);
    expect([...out].sort()).toEqual([...input].sort());
    expect(out).toHaveLength(input.length);
  });
});

describe("stateCoverage", () => {
  it("is 0 for an empty candidate list", () => {
    expect(stateCoverage([], {})).toBe(0);
  });

  it("is the fraction of candidates with stored state", () => {
    const store: SRSStore = { "ja:a": card(), "ja:b": card() };
    expect(stateCoverage(["ja:a", "ja:b", "ja:c", "ja:d"], store)).toBe(0.5);
  });
});
