import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getSRSStore,
  setCardState,
  setSRSStore,
  getCardState,
  clearSRSStore,
} from "./srsStorage";
import { createInitialState } from "./srs";
import {
  STORAGE_QUOTA_EVENT,
  __resetStorageQuotaThrottle,
  type StorageQuotaDetail,
} from "@/shared/utils/storageQuota";

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
        "ja:legacy-1": {
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
    expect(store["ja:legacy-1"].recognition.stability).toBe(2.5);
    expect(store["ja:legacy-1"].production.stability).toBe(2.5);
    expect(store["ja:legacy-1"].recognition.reps).toBe(1);
    expect(store["ja:legacy-1"].production.reps).toBe(1);
    expect(store["ja:legacy-1"].lastSyncedAt).toBe("2026-05-28T00:00:00Z");
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
    // Phase 2 (2026-06-01): bare atom ids canonicalize to `ja:<bare>`
    // on read. Already-prefixed test keys pass through unchanged.
    const modal = createInitialState();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        "ja:modal-1": modal,
        "ja:legacy-1": {
          stability: 1, difficulty: 5, state: "learning",
          interval: 1, dueDate: "2026-05-23", lastReviewDate: "2026-05-23",
          reps: 1, lapses: 0,
        },
        "ja:sm2-1": { easeFactor: 2.5, repetitions: 3 },
      }),
    );
    const store = getSRSStore();
    expect(Object.keys(store).sort()).toEqual(["ja:legacy-1", "ja:modal-1"]);
    expect(store["ja:modal-1"]).toEqual(modal);
    expect(store["ja:legacy-1"].recognition.stability).toBe(1);
  });

  it("clearSRSStore wipes the key", () => {
    setCardState("c", createInitialState());
    clearSRSStore();
    expect(getSRSStore()).toEqual({});
  });

  describe("quota guard", () => {
    beforeEach(() => {
      __resetStorageQuotaThrottle();
      vi.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("setSRSStore warns instead of silently dropping on QuotaExceededError", () => {
      const events: StorageQuotaDetail[] = [];
      const handler = (e: Event) =>
        events.push((e as CustomEvent<StorageQuotaDetail>).detail);
      window.addEventListener(STORAGE_QUOTA_EVENT, handler);

      const original = localStorage.setItem.bind(localStorage);
      Object.defineProperty(localStorage, "setItem", {
        configurable: true,
        writable: true,
        value: () => {
          throw new DOMException("quota", "QuotaExceededError");
        },
      });

      // Previously this swallowed the error with no signal.
      expect(() =>
        setSRSStore({ "ja:c": createInitialState() }),
      ).not.toThrow();

      Object.defineProperty(localStorage, "setItem", {
        configurable: true,
        writable: true,
        value: original,
      });
      window.removeEventListener(STORAGE_QUOTA_EVENT, handler);

      expect(events).toHaveLength(1);
      expect(events[0].reason).toBe("exceeded");
    });
  });
});
