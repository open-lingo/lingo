import { describe, it, expect, beforeEach } from "vitest";
import {
  getSRSStore,
  setCardState,
  getCardState,
  clearSRSStore,
} from "./srsStorage";
import { createInitialState } from "./srs";

const STORAGE_KEY = "open-lingo-srs:v2";

describe("srsStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips modal FSRS-6 state", () => {
    const state = createInitialState();
    setCardState("card-1", state);
    expect(getCardState("card-1")).toEqual(state);
  });

  it("upgrades legacy flat FSRS-6 states on read", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        "legacy-1": {
          stability: 2.5,
          difficulty: 4.1,
          state: "review",
          interval: 3,
          dueDate: "2026-06-01",
          lastReviewDate: "2026-05-28",
          reps: 1,
          lapses: 0,
          lastSyncedAt: "2026-05-28T00:00:00Z",
        },
      }),
    );
    const store = getSRSStore();
    expect(store["legacy-1"].recognition.stability).toBe(2.5);
    expect(store["legacy-1"].production.stability).toBe(2.5);
    expect(store["legacy-1"].recognition.reps).toBe(1);
    expect(store["legacy-1"].production.reps).toBe(1);
    expect(store["legacy-1"].lastSyncedAt).toBe("2026-05-28T00:00:00Z");
  });

  it("drops pre-FSRS-6 SM-2 entries (no stability field)", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        "sm2-1": {
          easeFactor: 2.5,
          interval: 5,
          dueDate: "2026-05-25",
          repetitions: 2,
          lastReviewDate: "2026-05-20",
        },
        "garbage-1": { foo: "bar" },
      }),
    );
    expect(getSRSStore()).toEqual({});
  });

  it("preserves modal states alongside upgraded legacy in same store", () => {
    const modal = createInitialState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        "modal-1": modal,
        "legacy-1": {
          stability: 1, difficulty: 5, state: "learning",
          interval: 1, dueDate: "2026-05-23", lastReviewDate: "2026-05-23",
          reps: 1, lapses: 0,
        },
        "sm2-1": { easeFactor: 2.5, repetitions: 3 },
      }),
    );
    const store = getSRSStore();
    expect(Object.keys(store).sort()).toEqual(["legacy-1", "modal-1"]);
    expect(store["modal-1"]).toEqual(modal);
    expect(store["legacy-1"].recognition.stability).toBe(1);
  });

  it("clearSRSStore wipes the key", () => {
    setCardState("c", createInitialState());
    clearSRSStore();
    expect(getSRSStore()).toEqual({});
  });
});
