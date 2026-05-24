import { describe, expect, it } from "vitest";
import { isLegacyFlatFsrsState, migrateFlatToModal } from "./srsMigration";

describe("srsMigration", () => {
  describe("isLegacyFlatFsrsState", () => {
    it("returns true for a flat FSRS-6 state with all required fields", () => {
      const flat = {
        stability: 5.2,
        difficulty: 4.1,
        state: "review",
        interval: 7,
        dueDate: "2026-06-01",
        lastReviewDate: "2026-05-25",
        reps: 4,
        lapses: 1,
      };
      expect(isLegacyFlatFsrsState(flat)).toBe(true);
    });

    it("returns false for SM-2 shape (easeFactor + repetitions, no stability)", () => {
      const sm2 = {
        easeFactor: 2.5,
        interval: 5,
        dueDate: "2026-05-25",
        repetitions: 2,
        lastReviewDate: "2026-05-20",
      };
      expect(isLegacyFlatFsrsState(sm2)).toBe(false);
    });

    it("returns false for already-modal state (has recognition sub-state)", () => {
      const modal = {
        recognition: {
          stability: 3, difficulty: 5, state: "review",
          interval: 4, dueDate: "2026-06-01", lastReviewDate: "2026-05-28",
          reps: 2, lapses: 0,
        },
        production: {
          stability: 1.5, difficulty: 6, state: "learning",
          interval: 1, dueDate: "2026-05-25", lastReviewDate: "2026-05-24",
          reps: 1, lapses: 0,
        },
      };
      expect(isLegacyFlatFsrsState(modal)).toBe(false);
    });

    it("returns false for garbage", () => {
      expect(isLegacyFlatFsrsState({ foo: "bar" })).toBe(false);
      expect(isLegacyFlatFsrsState(null)).toBe(false);
      expect(isLegacyFlatFsrsState(undefined)).toBe(false);
      expect(isLegacyFlatFsrsState(42)).toBe(false);
    });
  });

  describe("migrateFlatToModal", () => {
    it("copies flat FSRS-6 state into both modality sub-states", () => {
      const flat = {
        stability: 5.2,
        difficulty: 4.1,
        state: "review" as const,
        interval: 7,
        dueDate: "2026-06-01",
        lastReviewDate: "2026-05-25",
        reps: 4,
        lapses: 1,
      };
      const upgraded = migrateFlatToModal(flat);
      expect(upgraded.recognition.stability).toBe(5.2);
      expect(upgraded.production.stability).toBe(5.2);
      expect(upgraded.recognition.reps).toBe(4);
      expect(upgraded.production.reps).toBe(4);
      expect(upgraded.recognition.lapses).toBe(1);
      expect(upgraded.production.lapses).toBe(1);
    });

    it("hoists card-shared fields (lastSyncedAt, buriedUntil) to the top level", () => {
      const flat = {
        stability: 1,
        difficulty: 5,
        state: "learning" as const,
        interval: 1,
        dueDate: "2026-05-25",
        lastReviewDate: "2026-05-24",
        reps: 1,
        lapses: 0,
        lastSyncedAt: "2026-05-24T12:00:00Z",
        buriedUntil: "2026-05-26",
      };
      const upgraded = migrateFlatToModal(flat);
      expect(upgraded.lastSyncedAt).toBe("2026-05-24T12:00:00Z");
      expect(upgraded.buriedUntil).toBe("2026-05-26");
      // Should NOT appear in sub-states
      expect((upgraded.recognition as Record<string, unknown>).lastSyncedAt).toBeUndefined();
      expect((upgraded.production as Record<string, unknown>).buriedUntil).toBeUndefined();
    });

    it("preserves learningSteps when present in flat state", () => {
      const flat = {
        stability: 0.5,
        difficulty: 5,
        state: "learning" as const,
        interval: 0,
        dueDate: "2026-05-23",
        lastReviewDate: "2026-05-23",
        reps: 1,
        lapses: 0,
        learningSteps: 2,
      };
      const upgraded = migrateFlatToModal(flat);
      expect(upgraded.recognition.learningSteps).toBe(2);
      expect(upgraded.production.learningSteps).toBe(2);
    });
  });
});
