/**
 * Property tests for `localOnlyLessonIds` (2026-09-17 project review, lane
 * A5a — `docs/preflight-2026-09-17.md` task 5b).
 *
 * `progressReconcile.test.ts` pins specific scenarios (500 local / 18
 * server, chunking, idempotent re-hydrate). This file instead asserts the
 * INVARIANT those scenarios are instances of, over randomly generated
 * local/server/queued/pending sets:
 *
 *   localOnlyLessonIds(server) === local − server − queued − pending
 *
 * exactly (not a superset/subset), that it never returns a server-known id,
 * and that calling it twice in a row (no state mutation in between, as the
 * real function never writes) is idempotent.
 *
 * Each source lives in its own storage (mockProgress / testOutSyncQueue /
 * lessonStorage), so the property drives all three independently per
 * fast-check run via `fc.subarray` over a small fixed universe of lesson
 * ids — small enough that fast-check's shrinker converges fast, large
 * enough to exercise disjoint/overlapping/nested subset combinations.
 */
import { fc, test } from "@fast-check/vitest";
import { beforeEach, describe, expect, it } from "vitest";

import { localOnlyLessonIds } from "./progressReconcile";
import {
  clearTestOutSyncQueue,
  enqueueTestOutAttempts,
} from "./testOutSyncQueue";
import { clearMockProgress, markLessonCompleted } from "./mockProgress";
import { setPendingAttempts, type PendingAttempt } from "@/features/lesson/engine/lessonStorage";
import type { BatchAttempt, LessonRollup } from "@/shared/api/progress";

const UNIVERSE = Array.from({ length: 10 }, (_, i) => `m-${i}`);

function rollupsFor(ids: readonly string[]): Pick<LessonRollup, "lessonId" | "firstPassedAt">[] {
  return ids.map((lessonId) => ({ lessonId, firstPassedAt: "2026-09-15T12:00:00.000Z" }));
}

function attemptFor(id: string): BatchAttempt {
  return {
    clientAttemptId: `prop-${id}`,
    lessonId: id,
    attemptedAt: "2026-09-15T12:00:00.000Z",
    durationSec: 5,
    passed: true,
    score: 1,
    stepResults: [],
  };
}

function pendingFor(id: string): PendingAttempt {
  return { ...attemptFor(id), bufferedAt: "2026-09-15T12:00:00.000Z" };
}

/** Seeds all four sources fresh, mirroring `progressReconcile.test.ts`'s
 *  `beforeEach` — but callable per fast-check RUN, not once per `it`. */
function seed(local: string[], queued: string[], pending: string[]): void {
  localStorage.clear();
  clearTestOutSyncQueue();
  for (const id of local) markLessonCompleted(id, { accuracy: 1, xpEarned: 0, isReview: false });
  if (queued.length > 0) enqueueTestOutAttempts(queued.map(attemptFor));
  setPendingAttempts(pending.map(pendingFor));
}

beforeEach(() => {
  localStorage.clear();
  clearTestOutSyncQueue();
  clearMockProgress();
});

describe("localOnlyLessonIds — property: local minus server minus queued minus pending", () => {
  test.prop([
    fc.subarray(UNIVERSE), // local completions
    fc.subarray(UNIVERSE), // server-completed rollups
    fc.subarray(UNIVERSE), // already-queued test-out attempts
    fc.subarray(UNIVERSE), // buffered pending attempts
  ])("matches the set-difference definition exactly", (local, server, queued, pending) => {
    seed(local, queued, pending);

    const result = localOnlyLessonIds(rollupsFor(server));

    const covered = new Set([...server, ...queued, ...pending]);
    const expected = local.filter((id) => !covered.has(id));

    expect(new Set(result)).toEqual(new Set(expected));
    // No duplicates — `local` from `fc.subarray` has none, but pin it since
    // the function re-derives its own dedupe via the `covered` Set.
    expect(result.length).toBe(new Set(result).size);
  });

  test.prop([fc.subarray(UNIVERSE), fc.subarray(UNIVERSE), fc.subarray(UNIVERSE), fc.subarray(UNIVERSE)])(
    "never returns a server-known id",
    (local, server, queued, pending) => {
      seed(local, queued, pending);
      const result = localOnlyLessonIds(rollupsFor(server));
      for (const id of result) {
        expect(server).not.toContain(id);
      }
    },
  );

  test.prop([fc.subarray(UNIVERSE), fc.subarray(UNIVERSE), fc.subarray(UNIVERSE), fc.subarray(UNIVERSE)])(
    "is idempotent — repeated calls with unchanged storage agree",
    (local, server, queued, pending) => {
      seed(local, queued, pending);
      const rollups = rollupsFor(server);
      const first = localOnlyLessonIds(rollups);
      const second = localOnlyLessonIds(rollups);
      expect(second).toEqual(first);
    },
  );
});

// ---------------------------------------------------------------------------
// Shrunk counterexample — proves the property above is not vacuous.
//
// Method: `localOnlyLessonIds` was temporarily edited (working tree only,
// never committed — `git diff` confirmed clean before and after) to drop the
// `pending` source from `covered`:
//
//   const covered = new Set<string>(serverCompletedLessonIds(serverLessons));
//   for (const a of getQueuedTestOutAttempts()) covered.add(a.lessonId);
//   // for (const p of getPendingAttempts()) covered.add(p.lessonId);   <- removed
//
// Running the first property above against that broken version, fast-check
// failed after 10 generated cases and shrank (9 shrink steps) to the
// literal counterexample `[["m-8"],[],[],["m-8"]]` — one local completion
// that is ALSO buffered-pending and nothing else (`local`, `server`,
// `queued`, `pending` in that order). The broken version returned `["m-8"]`
// (pending never subtracted, so the id looked local-only); the real
// function correctly returns `[]`. `git diff` was confirmed clean both
// before the edit and after reverting it — nothing landed on the real
// source. The case is pinned below (with a fresh id, the id itself being
// incidental to the bug shape) as a permanent regression so a future change
// that forgets the `pending` source is caught without re-breaking anything.
// ---------------------------------------------------------------------------
it("regression: a pending-only completion is not local-only (shrunk counterexample)", () => {
  seed(["m-0"], [], ["m-0"]);
  const result = localOnlyLessonIds(rollupsFor([]));
  expect(result).toEqual([]);
});
