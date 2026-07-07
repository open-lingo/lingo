import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getActiveGrammarPoints,
  buildGrammarReviewQueue,
  setGrammarCardState,
  getGrammarCardState,
  reviewGrammarPoint,
  clearGrammarStore,
  getGrammarStore,
  nextGrammarDue,
  devForceAllGrammarDue,
} from "./grammarSrs";
import { createInitialState, createSeededState, addDays, getToday } from "./srs";
import {
  JA_COURSE_ATOMS,
  canonicalAtomId,
} from "@/features/languages/ja/courseAtoms";
import {
  STORAGE_QUOTA_EVENT,
  __resetStorageQuotaThrottle,
  type StorageQuotaDetail,
} from "@/shared/utils/storageQuota";

const GRAMMAR_STORE_KEY = "open-lingo-srs-grammar:v1";

/** Unlocked set containing every atom from the given modules (canonical ids). */
function unlockModules(...modules: string[]): Set<string> {
  const set = new Set<string>();
  for (const atom of JA_COURSE_ATOMS) {
    if (atom.fromModule && modules.includes(atom.fromModule)) {
      set.add(canonicalAtomId(atom));
    }
  }
  return set;
}

describe("Track B — grammar SRS", () => {
  beforeEach(() => clearGrammarStore());

  it("activates only shipped grammar points whose module is reached", () => {
    const unlocked = unlockModules("m3");
    const active = getActiveGrammarPoints(unlocked);
    const ids = active.map((p) => p.id);
    expect(ids).toContain("wa-topic"); // m3, shipped
    // A point from a much later, un-reached module must NOT be active.
    expect(active.every((p) => p.module === "m3")).toBe(true);
    expect(ids).not.toContain("te-form"); // m14, not reached
  });

  it("number/counter-category points never activate, even with their module reached", () => {
    // m5 ships kara-origin + kudasai (grammar) AND numbers-1-10 + counter-nin
    // (recognition drills — Counters-Trainer/vocab material, not grammar).
    const unlocked = unlockModules("m5");
    const ids = getActiveGrammarPoints(unlocked).map((p) => p.id);
    expect(ids).toContain("kara-origin");
    expect(ids).toContain("kudasai");
    expect(ids).not.toContain("numbers-1-10");
    expect(ids).not.toContain("counter-nin");
  });

  it("never-reviewed points are throttled unseen; nothing due yet", () => {
    const unlocked = unlockModules("m3");
    const q = buildGrammarReviewQueue(unlocked);
    expect(q.dueCount).toBe(0); // no state yet
    expect(q.unseenTotal).toBeGreaterThan(0);
    expect(q.newCount).toBeLessThanOrEqual(q.newCardsAllowed);
    expect(q.newCount).toBeLessThanOrEqual(q.unseenTotal);
  });

  it("a seeded (due) point surfaces in the review pile", () => {
    const unlocked = unlockModules("m3");
    setGrammarCardState("wa-topic", createInitialState()); // fresh = due today
    const q = buildGrammarReviewQueue(unlocked);
    expect(q.review.some((i) => i.point.id === "wa-topic")).toBe(true);
    expect(q.dueCount).toBeGreaterThanOrEqual(1);
  });

  it("reviewing a point writes Track B state (separate on-ramp)", () => {
    expect(getGrammarCardState("wa-topic")).toBeUndefined();
    reviewGrammarPoint("wa-topic", "production", "good");
    expect(getGrammarCardState("wa-topic")).toBeDefined();
  });

  describe("hasPool filter (empty-pool points never occupy a queue slot)", () => {
    it("a point excluded by hasPool appears in neither review/newItems/queue nor the counts (incl. unseenTotal)", () => {
      const unlocked = unlockModules("m3"); // shipped m3: wa-topic, ka-question, desu-copula, janai-desu
      setGrammarCardState("wa-topic", createInitialState()); // due

      // Unfiltered: wa-topic is due (review), the other 3 are unseen.
      const unfiltered = buildGrammarReviewQueue(unlocked);
      expect(unfiltered.review.map((i) => i.point.id)).toContain("wa-topic");
      expect(unfiltered.unseenTotal).toBe(3);

      // Excluding wa-topic via hasPool: it must vanish from review/newItems/
      // queue AND from dueCount/newCount/unseenTotal — the badge and the
      // unseen backlog display must never count a point with no renderable
      // steps (there's nothing a learner could ever review for it).
      const filtered = buildGrammarReviewQueue(unlocked, undefined, {
        hasPool: (id) => id !== "wa-topic",
      });
      expect(filtered.review.some((i) => i.point.id === "wa-topic")).toBe(false);
      expect(filtered.newItems.some((i) => i.point.id === "wa-topic")).toBe(false);
      expect(filtered.queue.some((i) => i.point.id === "wa-topic")).toBe(false);
      expect(filtered.dueCount).toBe(0);
      expect(filtered.unseenTotal).toBe(3); // unchanged — the other 3 remain unseen, none due to wa-topic's exclusion
    });

    it("new-card cap slots go to pool-backed points when an empty-pool point sits earlier in JSON order", () => {
      const unlocked = unlockModules("m3");
      // desu-copula precedes janai-desu in JSON order (both m3, shipped);
      // exclude desu-copula via hasPool and cap newPerDay to 1 — the single
      // slot must go to a pool-backed point, not be consumed by the excluded
      // one being skipped.
      const q = buildGrammarReviewQueue(unlocked, 1, {
        hasPool: (id) => id !== "desu-copula",
      });
      expect(q.newItems).toHaveLength(1);
      expect(q.newItems[0].point.id).not.toBe("desu-copula");
    });

    it("omitted predicate leaves behavior unchanged", () => {
      const unlocked = unlockModules("m3");
      const withOpts = buildGrammarReviewQueue(unlocked, undefined, {});
      const withoutOpts = buildGrammarReviewQueue(unlocked);
      expect(withOpts.queue.map((i) => i.point.id)).toEqual(
        withoutOpts.queue.map((i) => i.point.id),
      );
      expect(withOpts.unseenTotal).toBe(withoutOpts.unseenTotal);
    });
  });

  describe("read validation (parity with srsStorage.isModalFsrsState)", () => {
    it("round-trips a valid modal FSRS-6 state", () => {
      const state = createInitialState();
      setGrammarCardState("wa-topic", state);
      expect(getGrammarCardState("wa-topic")).toEqual(state);
    });

    it("drops entries that don't match the modal FSRS-6 shape", () => {
      localStorage.setItem(
        GRAMMAR_STORE_KEY,
        JSON.stringify({
          "sm2-ish": { easeFactor: 2.5, repetitions: 2 },
          garbage: { foo: "bar" },
        }),
      );
      expect(getGrammarStore()).toEqual({});
    });

    it("preserves valid entries alongside dropped invalid ones in the same store", () => {
      const valid = createInitialState();
      localStorage.setItem(
        GRAMMAR_STORE_KEY,
        JSON.stringify({
          "wa-topic": valid,
          "broken-point": { foo: "bar" },
        }),
      );
      const store = getGrammarStore();
      expect(Object.keys(store)).toEqual(["wa-topic"]);
      expect(store["wa-topic"]).toEqual(valid);
    });

    it("returns {} for a non-object stored value instead of throwing", () => {
      localStorage.setItem(GRAMMAR_STORE_KEY, JSON.stringify("not-an-object"));
      expect(getGrammarStore()).toEqual({});
    });
  });

  describe("quota-safe writes (parity with srsStorage.setSRSStore)", () => {
    beforeEach(() => {
      __resetStorageQuotaThrottle();
      vi.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("warns instead of silently dropping on QuotaExceededError", () => {
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

      expect(() =>
        setGrammarCardState("wa-topic", createInitialState()),
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

  describe("caught-up affordances (includeNotDue / nextGrammarDue / devForceAllGrammarDue)", () => {
    it("includeNotDue appends reviewed-but-not-due points, soonest-due first, without touching badge counts", () => {
      const unlocked = unlockModules("m3");
      // Both modalities scheduled in the future → not due, not unseen.
      setGrammarCardState("wa-topic", createSeededState(addDays(getToday(), 5)));
      setGrammarCardState("ka-question", createSeededState(addDays(getToday(), 2)));

      // Default queue (newPerDay 0 isolates from unseen intake): empty.
      const dueQ = buildGrammarReviewQueue(unlocked, 0);
      expect(dueQ.queue).toHaveLength(0);
      expect(dueQ.notDueCount).toBe(0);

      const freeQ = buildGrammarReviewQueue(unlocked, 0, { includeNotDue: true });
      expect(freeQ.queue.map((i) => i.point.id)).toEqual([
        "ka-question", // due in 2 days — closer, practiced first
        "wa-topic", // due in 5 days
      ]);
      expect(freeQ.notDueCount).toBe(2);
      // Scheduled meanings unchanged — badges stay honest.
      expect(freeQ.dueCount).toBe(0);
      expect(freeQ.newCount).toBe(0);
    });

    it("nextGrammarDue reports the earliest upcoming date and how many points land on it", () => {
      const unlocked = unlockModules("m3");
      expect(nextGrammarDue(unlocked)).toBeNull(); // no state at all

      const inTwo = addDays(getToday(), 2);
      setGrammarCardState("wa-topic", createSeededState(addDays(getToday(), 5)));
      setGrammarCardState("ka-question", createSeededState(inTwo));
      setGrammarCardState("desu-copula", createSeededState(inTwo));

      expect(nextGrammarDue(unlocked)).toEqual({ dueDate: inTwo, count: 2 });
    });

    it("nextGrammarDue ignores points that are already due", () => {
      const unlocked = unlockModules("m3");
      setGrammarCardState("wa-topic", createInitialState()); // due today
      expect(nextGrammarDue(unlocked)).toBeNull();
    });

    it("devForceAllGrammarDue drags every stored point back into the review pile", () => {
      const unlocked = unlockModules("m3");
      setGrammarCardState("wa-topic", createSeededState(addDays(getToday(), 5)));
      setGrammarCardState("ka-question", createSeededState(addDays(getToday(), 9)));
      expect(buildGrammarReviewQueue(unlocked, 0).dueCount).toBe(0);

      expect(devForceAllGrammarDue()).toBe(2);

      const q = buildGrammarReviewQueue(unlocked, 0);
      expect(q.dueCount).toBe(2);
      expect(q.review.map((i) => i.point.id).sort()).toEqual([
        "ka-question",
        "wa-topic",
      ]);
    });
  });
});
