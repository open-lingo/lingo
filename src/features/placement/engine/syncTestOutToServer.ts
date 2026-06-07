/**
 * Synthesise BatchAttempt rows for every lesson in the modules a user
 * tested out of, and POST them to /api/core/v1/progress/lessons/batch.
 *
 * Why: ``applyPlacementResult`` already marks the lessons complete in
 * local mockProgress (localStorage). That's good enough for "the
 * current device shows the right state", but it doesn't survive a
 * device switch or fresh login. Mirroring the same completions through
 * the existing progress-batch endpoint keeps the server row in sync so
 * the user's progress travels with them.
 *
 * Fire-and-forget: the local apply already persisted, so a transient
 * network failure shouldn't break the flow. We log + swallow.
 */

import type { BatchAttempt, ProgressApi } from "@/shared/api/progress";
import { getMockCourse } from "@/shared/domain/mockCourse";

export function buildTestOutAttempts(passedModules: string[]): BatchAttempt[] {
  if (passedModules.length === 0) return [];
  const course = getMockCourse("ja");
  const passedSet = new Set(passedModules);
  const now = new Date().toISOString();
  const stamp = Date.now();
  const attempts: BatchAttempt[] = [];
  let idx = 0;
  for (const mod of course.modules) {
    if (!passedSet.has(mod.id)) continue;
    for (const lesson of mod.lessons) {
      attempts.push({
        clientAttemptId: `testout-${mod.id}-${lesson.id}-${stamp}-${idx++}`,
        lessonId: lesson.id,
        attemptedAt: now,
        // Server clamps to [1, 3600]; 1 is the truthful floor here (no
        // time was spent on the lesson itself).
        durationSec: 1,
        passed: true,
        score: 1.0,
        stepResults: [],
        // Server-side flag: gates XP + lingots even though passed=true.
        // Without it the user would farm currency on every test-out.
        isTestOut: true,
      });
    }
  }
  return attempts;
}

export async function syncTestOutToServer(
  progress: ProgressApi,
  passedModules: string[],
): Promise<{ submitted: number }> {
  const attempts = buildTestOutAttempts(passedModules);
  if (attempts.length === 0) return { submitted: 0 };
  try {
    await progress.batchAttempts({ attempts });
    return { submitted: attempts.length };
  } catch (err) {
    // Local apply already persisted — a server miss is recoverable
    // (the user can re-trigger a sync later). Don't escalate.
    // eslint-disable-next-line no-console
    console.warn("[test-out] server sync failed", err);
    return { submitted: 0 };
  }
}
