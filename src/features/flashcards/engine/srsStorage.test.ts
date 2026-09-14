import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getSRSStore,
  setCardState,
  setSRSStore,
  getCardState,
  clearSRSStore,
  seedTestOutAtom,
  seedTestOutAtoms,
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

describe("seedTestOutAtoms — batched test-out/placement seed", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 3-module fixture: m1 atoms (further back, longer seed), m2 atoms (mid),
  // m3 atoms (the just-tested module, shortest seed) — mirrors a small
  // banded placement/test-out pass.
  const fixtureEntries = [
    { atomId: "ja:m1-a", intervalDays: 15 },
    { atomId: "ja:m1-b", intervalDays: 15 },
    { atomId: "ja:m2-a", intervalDays: 10 },
    { atomId: "ja:m2-b", intervalDays: 10 },
    { atomId: "ja:m3-a", intervalDays: 5 },
    { atomId: "ja:m3-b", intervalDays: 5 },
  ];

  it("(a) batched result equals sequential single-atom seeding for a 3-module fixture", () => {
    // Sequential (existing single-atom writer) into one store.
    for (const { atomId, intervalDays } of fixtureEntries) {
      seedTestOutAtom(atomId, intervalDays);
    }
    const sequentialStore = getSRSStore();
    clearSRSStore();

    // Batched (new writer) into a fresh store.
    seedTestOutAtoms(fixtureEntries);
    const batchedStore = getSRSStore();

    expect(batchedStore).toEqual(sequentialStore);
  });

  it("(a) batched return value matches which atoms a sequential pass would report seeded", () => {
    // Pre-seed one atom past what the batch would seed it to — sequential
    // seedTestOutAtom would skip it (never-shorten); the batch must too.
    seedTestOutAtom("ja:m1-a", 300);

    const seeded = seedTestOutAtoms(fixtureEntries);

    expect(seeded).not.toContain("ja:m1-a");
    expect(seeded).toEqual(
      expect.arrayContaining(["ja:m1-b", "ja:m2-a", "ja:m2-b", "ja:m3-a", "ja:m3-b"]),
    );
    expect(seeded).toHaveLength(5);
  });

  it("(b) never-shorten still holds when a lower module is seeded after a higher one", () => {
    // Seed as though the learner tested out of m3 first (short interval)...
    seedTestOutAtoms([{ atomId: "ja:atom-x", intervalDays: 5 }]);
    // ...then a later, more advanced placement pass (m30) computes a much
    // longer interval for the SAME atom's earlier attribution — this must win.
    seedTestOutAtoms([{ atomId: "ja:atom-x", intervalDays: 150 }]);
    expect(getCardState("ja:atom-x")?.recognition.interval).toBe(150);

    // And the reverse order — a longer interval already on record must NOT
    // be shortened by a later, smaller-distance batch.
    seedTestOutAtoms([{ atomId: "ja:atom-y", intervalDays: 150 }]);
    seedTestOutAtoms([{ atomId: "ja:atom-y", intervalDays: 5 }]);
    expect(getCardState("ja:atom-y")?.recognition.interval).toBe(150);
  });

  it("(c) localStorage.setItem is called once per batch", () => {
    const spy = vi.spyOn(localStorage, "setItem");
    seedTestOutAtoms(fixtureEntries);
    // seedTestOutAtoms itself performs exactly one write; the environment's
    // getItem-based cache invalidation touches storage reads, not writes.
    const srsWrites = spy.mock.calls.filter(([key]) => key === "open-lingo-srs:v2");
    expect(srsWrites).toHaveLength(1);
  });

  it("(c) an all-skipped batch (never-shorten) performs zero writes", () => {
    seedTestOutAtoms([{ atomId: "ja:atom-z", intervalDays: 300 }]);
    const spy = vi.spyOn(localStorage, "setItem");
    const seeded = seedTestOutAtoms([{ atomId: "ja:atom-z", intervalDays: 5 }]);
    expect(seeded).toHaveLength(0);
    const srsWrites = spy.mock.calls.filter(([key]) => key === "open-lingo-srs:v2");
    expect(srsWrites).toHaveLength(0);
  });

  it("an empty batch is a no-op", () => {
    expect(seedTestOutAtoms([])).toEqual([]);
  });
});
