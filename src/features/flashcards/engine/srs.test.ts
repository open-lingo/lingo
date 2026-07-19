import { describe, it, expect } from "vitest";
import {
  createInitialState,
  createSeededState,
  isLeech,
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
    it("target retention is 90%", () => {
      // 0.90 is the workload-optimal FSRS target; 0.95 roughly doubles review
      // load (srs-memory-retention-research-2026-07-19).
      expect(getTargetRetention()).toBe(0.9);
    });

    it("scheduling is deterministic — identical inputs always produce identical output", () => {
      // Fuzz is ON (spreads due dates to smooth daily load), but ts-fsrs fuzz
      // is SEEDED from the card's own state, so the same card+review always
      // fuzzes the same way. Reproducibility must hold regardless.
      const T = new Date("2026-05-20T12:00:00Z");
      const run = () => reviewCard(createInitialState(), "recognition", "good", T);
      const a = run();
      const b = run();
      expect(a).toEqual(b);
    });

    /**
     * Purpose: pin FSRS-6 scheduler behavior end-to-end. ts-fsrs computes
     * stability/difficulty/interval from its internal default weights;
     * a future ts-fsrs version bump that changes those weights (or the
     * FSRS-6 formula) must fail THIS test instead of silently rescheduling
     * every user's review queue in production.
     */
    it("SNAPSHOT: a fixed review sequence produces exact expected stability/interval/due-date values", () => {
      const T0 = new Date("2026-05-20T12:00:00Z");
      const ratings: Array<"good" | "hard" | "easy"> = [
        "good",
        "good",
        "hard",
        "good",
        "easy",
      ];
      let s = createInitialState();
      let clock = T0;
      const snapshots: Array<Pick<
        SRSModalityState,
        "stability" | "difficulty" | "state" | "interval" | "dueDate" | "reps" | "lapses"
      >> = [];
      for (const rating of ratings) {
        s = reviewCard(s, "recognition", rating, clock);
        const { stability, difficulty, state, interval, dueDate, reps, lapses } =
          s.recognition;
        snapshots.push({ stability, difficulty, state, interval, dueDate, reps, lapses });
        clock = new Date(s.recognition.dueDate + "T12:00:00Z");
      }

      // Values under request_retention 0.90 + seeded fuzz (deterministic).
      expect(snapshots).toEqual([
        {
          stability: 2.3065,
          difficulty: 2.11810397,
          state: "learning",
          interval: 0,
          dueDate: "2026-05-20",
          reps: 1,
          lapses: 0,
        },
        {
          stability: 2.3065,
          difficulty: 2.11121424,
          state: "review",
          interval: 2,
          dueDate: "2026-05-22",
          reps: 2,
          lapses: 0,
        },
        {
          stability: 7.51735908,
          difficulty: 4.74828477,
          state: "review",
          interval: 9,
          dueDate: "2026-05-31",
          reps: 3,
          lapses: 0,
        },
        {
          stability: 28.0388538,
          difficulty: 4.73876485,
          state: "review",
          interval: 28,
          dueDate: "2026-06-28",
          reps: 4,
          lapses: 0,
        },
        {
          stability: 129.59501351,
          difficulty: 2.96593361,
          state: "review",
          interval: 138,
          dueDate: "2026-11-13",
          reps: 5,
          lapses: 0,
        },
      ]);
    });
  });
});

describe("receptive-before-productive staggering", () => {
  it("seeds production 3 days behind recognition (createSeededState)", () => {
    const s = createSeededState("2026-05-20");
    expect(s.recognition.dueDate).toBe("2026-05-20");
    expect(s.production.dueDate).toBe("2026-05-23");
  });

  it("staggers production in createInitialState too", () => {
    const s = createInitialState();
    // production is exactly 3 days after recognition's due date
    const rec = new Date(s.recognition.dueDate + "T00:00:00Z");
    const prod = new Date(s.production.dueDate + "T00:00:00Z");
    expect((prod.getTime() - rec.getTime()) / 86_400_000).toBe(3);
  });
});

describe("leech handling", () => {
  // A mature (review-state) sub-state — lapses only accrue from failing a card
  // that's already graduated, so we build one directly rather than looping.
  const reviewSub = (lapses: number): SRSModalityState => ({
    stability: 12,
    difficulty: 6,
    state: "review",
    interval: 12,
    dueDate: "2026-05-20",
    lastReviewDate: "2026-05-08",
    reps: lapses + 3,
    lapses,
  });

  it("isLeech: true at ≥8 lapses on either modality, false below", () => {
    expect(isLeech({ recognition: reviewSub(7), production: reviewSub(2) })).toBe(false);
    expect(isLeech({ recognition: reviewSub(8), production: reviewSub(2) })).toBe(true);
    expect(isLeech({ recognition: reviewSub(2), production: reviewSub(9) })).toBe(true);
  });

  it("crossing the threshold on a review auto-buries the card", () => {
    const near: SRSCardState = { recognition: reviewSub(7), production: reviewSub(0) };
    expect(isLeech(near)).toBe(false);
    const after = reviewCard(near, "recognition", "again", new Date("2026-05-20T12:00:00Z"));
    expect(after.recognition.lapses).toBe(8);
    expect(isLeech(after)).toBe(true);
    expect(after.buriedUntil).toBeTruthy();
  });

  it("a healthy card is never a leech", () => {
    let s = createInitialState();
    let clock = new Date("2026-05-20T12:00:00Z");
    for (let i = 0; i < 5; i++) {
      s = reviewCard(s, "recognition", "good", clock);
      clock = new Date(s.recognition.dueDate + "T12:00:00Z");
    }
    expect(isLeech(s)).toBe(false);
  });
});
