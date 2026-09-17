import { useEffect } from "react";
import { setLessonContext } from "@/shared/telemetry/errorReporter";

/**
 * Keeps the client error reporter's lesson/step context (`errorReporter.ts`'s
 * `setLessonContext`) in sync with whatever step is currently on screen, so
 * a report filed mid-lesson (a JS error, an unhandled rejection, an error
 * boundary catch) carries enough to find the exact step — never lesson
 * TEXT, only `lessonId`/`stepIndex`/`stepType` (see `LessonErrorContext`).
 *
 * Call from the single place each surface knows its current step:
 * `LessonPage` (`lesson.id`/`currentStepIdx`/`currentStep.type`) and
 * `PlacementTestPage` (same shell, `StepRenderer`, no stable numeric lesson
 * id — see that call site for what it passes instead).
 *
 * Clears context on every dependency change (old context must not survive
 * into the next step's window) and on unmount (leaving the lesson/test must
 * not leave stale context on a later, unrelated error).
 */
export function useLessonErrorContext(
  lessonId: string | undefined,
  stepIndex: number | undefined,
  stepType: string | undefined,
): void {
  useEffect(() => {
    if (!lessonId) return;
    setLessonContext({ lessonId, stepIndex, stepType });
    return () => setLessonContext(null);
  }, [lessonId, stepIndex, stepType]);
}
