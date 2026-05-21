import { describe, it, expect } from "vitest";
import {
  createInitialState,
  reviewCard,
  gradeFromLesson,
  shouldRepeatInSession,
  isNew,
  isLearning,
  isMastered,
  isDue,
  buryCard,
  unburyCard,
  addDays,
  getTargetRetention,
  MASTERED_INTERVAL_DAYS,
} from "./srs";
import type { SRSCardState } from "../data/types";

const T0 = new Date("2026-05-20T12:00:00Z");

function dayAfter(state: SRSCardState, days: number): Date {
  const d = new Date(state.dueDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

describe("FSRS-6 engine", () => {
  describe("createInitialState", () => {
    it("returns a fresh new-card state", () => {
      const s = createInitialState();
      expect(s.state).toBe("new");
      expect(s.reps).toBe(0);
      expect(s.lapses).toBe(0);
      expect(s.stability).toBe(0);
      expect(s.difficulty).toBe(0);
      expect(s.interval).toBe(0);
    });

    it("ignores legacy initialEase argument", () => {
      const a = createInitialState();
      const b = createInitialState(2.5);
      const c = createInitialState(99);
      expect(a).toEqual(b);
      expect(b).toEqual(c);
    });
  });

  describe("ratings drive state transitions", () => {
    it("Good on a new card promotes it past learning by the second review", () => {
      const s0 = createInitialState();
      const s1 = reviewCard(s0, "good", T0);
      expect(s1.reps).toBe(1);
      expect(s1.state === "learning" || s1.state === "review").toBe(true);
      const s2 = reviewCard(s1, "good", dayAfter(s1, 1));
      expect(s2.state).toBe("review");
      expect(s2.reps).toBe(2);
    });

    it("Again resets the card to relearning and increments lapses", () => {
      let s = createInitialState();
      s = reviewCard(s, "good", T0);
      s = reviewCard(s, "good", dayAfter(s, 1));
      const stable = s;
      const next = reviewCard(stable, "again", dayAfter(stable, stable.interval));
      expect(next.state).toBe("relearning");
      expect(next.lapses).toBe(stable.lapses + 1);
    });

    it("Hard is a SUCCESS — reps still increments, lapses do not", () => {
      let s = createInitialState();
      s = reviewCard(s, "good", T0);
      s = reviewCard(s, "good", dayAfter(s, 1));
      const before = s;
      const next = reviewCard(before, "hard", dayAfter(before, before.interval));
      expect(next.reps).toBe(before.reps + 1);
      expect(next.lapses).toBe(before.lapses);
      expect(next.state).toBe("review");
    });

    it("Easy on a learning card promotes to review faster than Good", () => {
      const s0 = createInitialState();
      const good = reviewCard(s0, "good", T0);
      const easy = reviewCard(s0, "easy", T0);
      expect(easy.interval).toBeGreaterThanOrEqual(good.interval);
      expect(easy.stability).toBeGreaterThan(good.stability);
    });
  });

  describe("shouldRepeatInSession", () => {
    it("flags Again and Hard for in-session re-show", () => {
      expect(shouldRepeatInSession("again")).toBe(true);
      expect(shouldRepeatInSession("hard")).toBe(true);
      expect(shouldRepeatInSession("good")).toBe(false);
      expect(shouldRepeatInSession("easy")).toBe(false);
    });
  });

  describe("gradeFromLesson (3-of-4 mapping)", () => {
    it("wrong → Again (lapse)", () => {
      let s = createInitialState();
      s = reviewCard(s, "good", T0);
      s = reviewCard(s, "good", dayAfter(s, 1));
      const before = s;
      const next = gradeFromLesson(
        before,
        { correct: false },
        dayAfter(before, before.interval),
      );
      expect(next.lapses).toBe(before.lapses + 1);
      expect(next.state).toBe("relearning");
    });

    it("first-try correct → Good", () => {
      const s = createInitialState();
      const next = gradeFromLesson(s, { correct: true, retried: false }, T0);
      const ref = reviewCard(s, "good", T0);
      expect(next.stability).toBe(ref.stability);
      expect(next.difficulty).toBe(ref.difficulty);
    });

    it("correct after retry → Hard", () => {
      let s = createInitialState();
      s = reviewCard(s, "good", T0);
      s = reviewCard(s, "good", dayAfter(s, 1));
      const hardOutcome = gradeFromLesson(
        s,
        { correct: true, retried: true },
        dayAfter(s, s.interval),
      );
      const goodOutcome = gradeFromLesson(
        s,
        { correct: true, retried: false },
        dayAfter(s, s.interval),
      );
      expect(hardOutcome.stability).toBeLessThan(goodOutcome.stability);
      expect(hardOutcome.lapses).toBe(s.lapses);
      expect(goodOutcome.lapses).toBe(s.lapses);
    });
  });

  describe("predicate helpers", () => {
    it("isNew classifies fresh and never-graded states", () => {
      expect(isNew(undefined)).toBe(true);
      expect(isNew(createInitialState())).toBe(true);
      const s = reviewCard(createInitialState(), "good", T0);
      expect(isNew(s)).toBe(false);
    });

    it("isLearning vs isMastered split on MASTERED_INTERVAL_DAYS", () => {
      const learning: SRSCardState = {
        ...createInitialState(),
        reps: 1,
        interval: 3,
        state: "review",
      };
      expect(isLearning(learning)).toBe(true);
      expect(isMastered(learning)).toBe(false);

      const mature: SRSCardState = {
        ...learning,
        interval: MASTERED_INTERVAL_DAYS + 5,
      };
      expect(isLearning(mature)).toBe(false);
      expect(isMastered(mature)).toBe(true);
    });
  });

  describe("bury / unbury", () => {
    it("isDue is false while buried", () => {
      const today = new Date().toISOString().slice(0, 10);
      const s: SRSCardState = {
        ...createInitialState(),
        dueDate: today,
        reps: 1,
        state: "review",
      };
      expect(isDue(s)).toBe(true);
      const buried = buryCard(s);
      expect(buried.buriedUntil).toBe(addDays(today, 1));
      expect(isDue(buried)).toBe(false);
      const unburied = unburyCard(buried);
      expect(unburied.buriedUntil).toBeUndefined();
      expect(isDue(unburied)).toBe(true);
    });
  });

  describe("configuration", () => {
    it("target retention is 95%", () => {
      expect(getTargetRetention()).toBe(0.95);
    });
  });
});
