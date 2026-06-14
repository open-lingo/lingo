import { describe, expect, it, beforeEach } from "vitest";
import { seedUnlockedAtomsDueNextDay } from "./seedSchedule";
import { getAtomsForLesson } from "./lessonAtomIndex";
import { isSrsEligibleAtom } from "@/features/languages/ja/courseAtoms";
import {
  createSeededState,
  isNew,
  isDue,
  addDays,
  getToday,
} from "@/features/flashcards/engine/srs";
import { clearSRSStore, getCardState } from "@/features/flashcards/engine";

/**
 * D4 (scheduling-model-2026-06-15): a word unlocked today is scheduled due
 * the NEXT day — never same-day. These guard the two halves: the seeded
 * state's shape, and the unlock-event seeding (eligible-only, idempotent).
 */
describe("createSeededState", () => {
  it("is never-reviewed (isNew) yet not due today", () => {
    const tomorrow = addDays(getToday(), 1);
    const s = createSeededState(tomorrow);
    expect(isNew(s)).toBe(true); // reps 0 → in-course review still picks it up
    expect(isDue(s)).toBe(false); // due tomorrow → standalone reviewer skips it today
    expect(s.recognition.dueDate).toBe(tomorrow);
    expect(s.production.dueDate).toBe(tomorrow);
  });
});

describe("seedUnlockedAtomsDueNextDay", () => {
  beforeEach(() => clearSRSStore());

  it("schedules a content lesson's SRS-eligible atoms due next day", () => {
    const lessonId = "ja-m1-l1";
    const eligible = getAtomsForLesson(lessonId).filter(isSrsEligibleAtom);
    expect(eligible.length).toBeGreaterThan(0);

    const seeded = seedUnlockedAtomsDueNextDay(lessonId);
    expect(seeded).toBe(eligible.length);

    const tomorrow = addDays(getToday(), 1);
    for (const atom of eligible) {
      const state = getCardState(atom.id);
      expect(state).toBeDefined();
      expect(isNew(state!)).toBe(true); // not yet reviewed
      expect(isDue(state!)).toBe(false); // due tomorrow, not same-day
      expect(state!.recognition.dueDate).toBe(tomorrow);
    }
  });

  it("never clobbers an existing schedule (idempotent)", () => {
    const lessonId = "ja-m1-l1";
    expect(seedUnlockedAtomsDueNextDay(lessonId)).toBeGreaterThan(0);
    expect(seedUnlockedAtomsDueNextDay(lessonId)).toBe(0);
  });
});
