import { getAtomsForLesson } from "./lessonAtomIndex";
import { isSrsEligibleAtom } from "@/features/languages/ja/courseAtoms";
import { getCardState, setCardState } from "@/features/flashcards/engine/srsStorage";
import { createSeededState, addDays, getToday } from "@/features/flashcards/engine/srs";

/**
 * D4 (seed-on-unlock) — `docs/srs-scheduling-model-2026-06-15.md`.
 *
 * When a CONTENT lesson completes, schedule its newly-unlocked atoms into
 * FSRS due the NEXT day — never same-day (a same-day review is a poor memory
 * test). Only seeds SRS-eligible atoms with no existing state; it never
 * clobbers a real schedule.
 *
 * The seeded state is reps-0, so it still counts as `isNew` and the module's
 * in-course review lesson (done in the same session) still picks the atom up
 * as a within-session retrieval. The next-day due date only governs the
 * STANDALONE flashcard reviewer, so a word the learner just met doesn't
 * surface there until tomorrow.
 *
 * Replaces the old build-time `setCardState` side-effect in
 * `buildSrsReviewLesson` (which seeded due-today on every course-deck build).
 */
export function seedUnlockedAtomsDueNextDay(lessonId: string): number {
  const atoms = getAtomsForLesson(lessonId).filter(isSrsEligibleAtom);
  if (atoms.length === 0) return 0;
  const due = addDays(getToday(), 1);
  let seeded = 0;
  for (const atom of atoms) {
    if (getCardState(atom.id)) continue; // don't clobber a real schedule
    setCardState(atom.id, createSeededState(due));
    seeded++;
  }
  return seeded;
}
