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
  getDueModalities,
  MASTERED_INTERVAL_DAYS,
} from "./srs";
import type { SRSCardState, SRSModalityState } from "../data/types";

const T0 = new Date("2026-05-20T12:00:00Z");

function dayAfterSubState(sub: SRSModalityState, days: number): Date {
  const d = new Date(sub.dueDate + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

describe("FSRS-6 engine — modal", () => {
  describe("createInitialState", () => {
    it("returns a fresh card with both modalities zeroed", () => {
      const s = createInitialState();
      for (const sub of [s.recognition, s.production]) {
        expect(sub.state).toBe("new");
        expect(sub.reps).toBe(0);
        expect(sub.lapses).toBe(0);
        expect(sub.stability).toBe(0);
        expect(sub.difficulty).toBe(0);
        expect(sub.interval).toBe(0);
      }
    });

    it("ignores legacy initialEase argument", () => {
      const a = createInitialState();
      const b = createInitialState(2.5);
      const c = createInitialState(99);
      expect(a).toEqual(b);
      expect(b).toEqual(c);
    });
  });

  describe("modality isolation", () => {
    it("reviewCard only updates the named modality", () => {
      const s0 = createInitialState();
      const s1 = reviewCard(s0, "recognition", "good", T0);
      expect(s1.recognition.reps).toBe(1);
      expect(s1.production.reps).toBe(0);
      expect(s1.production.state).toBe("new");
    });

    it("gradeFromLesson only updates the named modality", () => {
      const s0 = createInitialState();
      const s1 = gradeFromLesson(s0, "production", { correct: true }, T0);
      expect(s1.production.reps).toBe(1);
      expect(s1.recognition.reps).toBe(0);
    });
  });

  describe("ratings drive state transitions (recognition modality)", () => {
    it("Good on a new card promotes it past learning by the second review", () => {
      const s0 = createInitialState();
      const s1 = reviewCard(s0, "recognition", "good", T0);
      expect(s1.recognition.reps).toBe(1);
      expect(["learning", "review"]).toContain(s1.recognition.state);
      const s2 = reviewCard(
        s1,
        "recognition",
        "good",
        dayAfterSubState(s1.recognition, 1),
      );
      expect(s2.recognition.state).toBe("review");
      expect(s2.recognition.reps).toBe(2);
    });

    it("Again resets to relearning and increments lapses", () => {
      let s = createInitialState();
      s = reviewCard(s, "recognition", "good", T0);
      s = reviewCard(
        s,
        "recognition",
        "good",
        dayAfterSubState(s.recognition, 1),
      );
      const stable = s;
      const next = reviewCard(
        stable,
        "recognition",
        "again",
        dayAfterSubState(stable.recognition, stable.recognition.interval),
      );
      expect(next.recognition.state).toBe("relearning");
      expect(next.recognition.lapses).toBe(stable.recognition.lapses + 1);
    });

    it("Hard is a SUCCESS — reps still increments, lapses do not", () => {
      let s = createInitialState();
      s = reviewCard(s, "recognition", "good", T0);
      s = reviewCard(
        s,
        "recognition",
        "good",
        dayAfterSubState(s.recognition, 1),
      );
      const before = s;
      const next = reviewCard(
        before,
        "recognition",
        "hard",
        dayAfterSubState(before.recognition, before.recognition.interval),
      );
      expect(next.recognition.reps).toBe(before.recognition.reps + 1);
      expect(next.recognition.lapses).toBe(before.recognition.lapses);
      expect(next.recognition.state).toBe("review");
    });

    it("Easy promotes faster than Good", () => {
      const s0 = createInitialState();
      const good = reviewCard(s0, "recognition", "good", T0);
      const easy = reviewCard(s0, "recognition", "easy", T0);
      expect(easy.recognition.interval).toBeGreaterThanOrEqual(
        good.recognition.interval,
      );
      expect(easy.recognition.stability).toBeGreaterThan(good.recognition.stability);
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
      s = reviewCard(s, "recognition", "good", T0);
      s = reviewCard(
        s,
        "recognition",
        "good",
        dayAfterSubState(s.recognition, 1),
      );
      const before = s;
      const next = gradeFromLesson(
        before,
        "recognition",
        { correct: false },
        dayAfterSubState(before.recognition, before.recognition.interval),
      );
      expect(next.recognition.lapses).toBe(before.recognition.lapses + 1);
      expect(next.recognition.state).toBe("relearning");
    });

    it("first-try correct → Good", () => {
      const s = createInitialState();
      const next = gradeFromLesson(s, "recognition", { correct: true, retried: false }, T0);
      const ref = reviewCard(s, "recognition", "good", T0);
      expect(next.recognition.stability).toBe(ref.recognition.stability);
      expect(next.recognition.difficulty).toBe(ref.recognition.difficulty);
    });

    it("correct after retry → Hard (lower stability than Good)", () => {
      let s = createInitialState();
      s = reviewCard(s, "recognition", "good", T0);
      s = reviewCard(
        s,
        "recognition",
        "good",
        dayAfterSubState(s.recognition, 1),
      );
      const hardOutcome = gradeFromLesson(
        s,
        "recognition",
        { correct: true, retried: true },
        dayAfterSubState(s.recognition, s.recognition.interval),
      );
      const goodOutcome = gradeFromLesson(
        s,
        "recognition",
        { correct: true, retried: false },
        dayAfterSubState(s.recognition, s.recognition.interval),
      );
      expect(hardOutcome.recognition.stability).toBeLessThan(
        goodOutcome.recognition.stability,
      );
      expect(hardOutcome.recognition.lapses).toBe(s.recognition.lapses);
      expect(goodOutcome.recognition.lapses).toBe(s.recognition.lapses);
    });
  });

  describe("predicate helpers (rollups)", () => {
    it("isNew is true when both modalities are at zero reps", () => {
      expect(isNew(undefined)).toBe(true);
      expect(isNew(createInitialState())).toBe(true);
      const s = reviewCard(createInitialState(), "recognition", "good", T0);
      expect(isNew(s)).toBe(false);
    });

    it("isLearning: any modality below mastery threshold", () => {
      const learningSub: SRSModalityState = {
        stability: 0, difficulty: 0, state: "review",
        reps: 1, interval: 3, lapses: 0,
        dueDate: "2026-06-01", lastReviewDate: "2026-05-20",
      };
      const learning: SRSCardState = {
        recognition: learningSub,
        production: learningSub,
      };
      expect(isLearning(learning)).toBe(true);
      expect(isMastered(learning)).toBe(false);
    });

    it("isMastered: BOTH modalities at/above mastery threshold", () => {
      const matureSub: SRSModalityState = {
        stability: 0, difficulty: 0, state: "review",
        reps: 1, interval: MASTERED_INTERVAL_DAYS + 5, lapses: 0,
        dueDate: "2026-06-01", lastReviewDate: "2026-05-20",
      };
      const mature: SRSCardState = {
        recognition: matureSub,
        production: matureSub,
      };
      expect(isMastered(mature)).toBe(true);
      expect(isLearning(mature)).toBe(false);

      const half: SRSCardState = {
        recognition: matureSub,
        production: { ...matureSub, interval: 3 },
      };
      expect(isMastered(half)).toBe(false);
      expect(isLearning(half)).toBe(true);
    });
  });

  describe("isDue (either-modality)", () => {
    const today = new Date().toISOString().slice(0, 10);
    const dueSub = (): SRSModalityState => ({
      stability: 0, difficulty: 0, state: "review",
      reps: 1, interval: 0, lapses: 0,
      dueDate: today, lastReviewDate: today,
    });
    const futureSub = (): SRSModalityState => ({
      ...dueSub(),
      dueDate: addDays(today, 30),
    });

    it("is true if recognition is due", () => {
      expect(isDue({ recognition: dueSub(), production: futureSub() })).toBe(true);
    });
    it("is true if production is due", () => {
      expect(isDue({ recognition: futureSub(), production: dueSub() })).toBe(true);
    });
    it("is false if neither is due", () => {
      expect(isDue({ recognition: futureSub(), production: futureSub() })).toBe(false);
    });
    it("is false if buried even when a sub-state is due", () => {
      expect(
        isDue({
          recognition: dueSub(),
          production: dueSub(),
          buriedUntil: addDays(today, 1),
        }),
      ).toBe(false);
    });

    it("getDueModalities lists each due direction", () => {
      expect(
        getDueModalities({ recognition: dueSub(), production: futureSub() }),
      ).toEqual(["recognition"]);
      expect(
        getDueModalities({ recognition: futureSub(), production: dueSub() }),
      ).toEqual(["production"]);
      expect(
        getDueModalities({ recognition: dueSub(), production: dueSub() }),
      ).toEqual(["recognition", "production"]);
      expect(
        getDueModalities({ recognition: futureSub(), production: futureSub() }),
      ).toEqual([]);
    });
  });

  describe("bury / unbury", () => {
    it("isDue is false while buried; preserved across reviews", () => {
      const today = new Date().toISOString().slice(0, 10);
      const sub: SRSModalityState = {
        stability: 0, difficulty: 0, state: "review",
        reps: 1, interval: 0, lapses: 0,
        dueDate: today, lastReviewDate: today,
      };
      const s: SRSCardState = { recognition: sub, production: sub };
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
