/**
 * Per-lesson-run "juice" state — the in-lesson correct-answer combo.
 *
 * Module-level rather than React state on purpose: the producer
 * (LessonPage.handleStepComplete) and the consumers (CelebrationToast copy
 * + tier styling, the combo-pitched "correct" sfx) live on opposite sides
 * of the step-view prop boundary, and threading a counter through 15 step
 * views for a display-only value isn't worth the churn. LessonPage resets
 * it whenever a lesson run starts.
 *
 * Combo semantics: +1 per graded correct answer, reset to 0 on a graded
 * wrong answer. Replay-tail retries count — clearing your misses can still
 * build a streak, which is the point of the tail.
 */
import { playSfx } from "@/shared/audio/sfx";

let combo = 0;
let verdicts = new Map<string, boolean>();

/** Call when a lesson run starts (mount / lesson change). */
export function resetLessonJuice(): void {
  combo = 0;
  verdicts = new Map();
}

/** Current consecutive-correct count within this lesson run. */
export function getCombo(): number {
  return combo;
}

/**
 * Report a graded answer. Updates the combo and plays the matching sound —
 * the single audio call site for correct/incorrect, so step views never
 * need to know about sfx for grading.
 *
 * Deduped per step: some step views call `onComplete(id, true)` more than
 * once for one step (trace persists EVERY passing attempt for resume
 * safety, then reports again on Continue), but the combo must track steps
 * — the unit the progress bar counts — not attempts. A repeat success is
 * dropped; a wrong→correct upgrade (replay tail) still counts, and a
 * repeated wrong still resets so the retry chime fires.
 */
export function reportGradedAnswer(stepId: string, correct: boolean): void {
  if (correct && verdicts.get(stepId) === true) return;
  verdicts.set(stepId, correct);
  if (correct) {
    combo += 1;
    playSfx("correct", { combo });
  } else {
    combo = 0;
    playSfx("incorrect");
  }
}
