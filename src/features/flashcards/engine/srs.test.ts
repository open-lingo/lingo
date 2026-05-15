import { describe, it, expect } from "vitest";
import {
  DEFAULT_EASE,
  addDays,
  createInitialState,
  reviewCard,
  shouldRepeatInSession,
  isNew,
} from "./srs";

describe("srs (SM-2)", () => {
  describe("addDays", () => {
    it("advances calendar days across month boundary", () => {
      expect(addDays("2026-01-30", 3)).toBe("2026-02-02");
    });

    it("handles zero-day advance", () => {
      expect(addDays("2026-05-13", 0)).toBe("2026-05-13");
    });
  });

  describe("createInitialState", () => {
    it("uses DEFAULT_EASE when no override given", () => {
      const s = createInitialState();
      expect(s.easeFactor).toBe(DEFAULT_EASE);
      expect(s.interval).toBe(0);
      expect(s.repetitions).toBe(0);
    });

    it("clamps ease into [1.3, 3]", () => {
      expect(createInitialState(0.1).easeFactor).toBe(1.3);
      expect(createInitialState(99).easeFactor).toBe(3);
    });
  });

  describe("reviewCard", () => {
    it("good on a new card: interval=1, repetitions=1", () => {
      const next = reviewCard(createInitialState(), "good");
      expect(next.interval).toBe(1);
      expect(next.repetitions).toBe(1);
    });

    it("good twice: second review uses 6-day interval (SM-2 step 3)", () => {
      const a = reviewCard(createInitialState(), "good");
      const b = reviewCard(a, "good");
      expect(b.repetitions).toBe(2);
      expect(b.interval).toBe(6);
    });

    it("again resets repetitions and interval without changing EF", () => {
      const a = reviewCard(createInitialState(), "good");
      const b = reviewCard(a, "again");
      expect(b.repetitions).toBe(0);
      expect(b.interval).toBe(0);
      expect(b.easeFactor).toBe(a.easeFactor); // EF unchanged on failure
    });

    it("never drops EF below MIN_EASE (1.3)", () => {
      let s = createInitialState();
      for (let i = 0; i < 20; i++) s = reviewCard(s, "hard");
      expect(s.easeFactor).toBeGreaterThanOrEqual(1.3);
    });
  });

  describe("shouldRepeatInSession", () => {
    it("re-shows again/hard/good (quality < 4 — note: good=4 is the boundary)", () => {
      expect(shouldRepeatInSession("again")).toBe(true);
      expect(shouldRepeatInSession("hard")).toBe(true);
      expect(shouldRepeatInSession("good")).toBe(false);
      expect(shouldRepeatInSession("easy")).toBe(false);
    });
  });

  describe("isNew", () => {
    it("treats undefined state as new", () => {
      expect(isNew(undefined)).toBe(true);
    });

    it("treats reps=0 as new", () => {
      expect(isNew(createInitialState())).toBe(true);
    });

    it("after one good review the card is no longer new", () => {
      expect(isNew(reviewCard(createInitialState(), "good"))).toBe(false);
    });
  });
});
