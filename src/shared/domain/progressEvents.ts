/**
 * ONE signal for "a sync-shaped operation just finished changing progress."
 *
 * Before this module: 9 call sites across 8 files each called
 * `queryClient.invalidateQueries({queryKey:["progress","me"]})` directly (some
 * paired it with a quests invalidation, some didn't — LessonProgressHydrate's
 * two sync effects disagreed with each other), and the local-store-derived
 * hooks (`useCompletedLessonIds`, `useLocalProgressSummary`, `usePracticeData`)
 * reacted through a SEPARATE pub/sub (`subscribeLessonProgress` in
 * `mockProgress.ts`) that only fires when the local `completed` map itself
 * changes. `progressReconcile.ts`'s local→server PUSH path — the one build 33
 * shipped — changed neither: it only POSTs, so nothing told the TanStack
 * cache (or anything reading it) that a sync had completed at all.
 *
 * The fix is ONE emission point per completed operation (never per chunk —
 * `progressReconcile.ts` already batches into one bulk op, this module does
 * not add a second layer of batching) that every consumer reacts to:
 *   - `useProgressChangeInvalidation` (mounted once by `LessonProgressHydrate`,
 *     the app's single global sync owner) invalidates `["progress","me"]`
 *     (+ `["core","quests","list"]` for lesson-shaped reasons) — replacing the
 *     scattered invalidations.
 *   - `getProgressChangeVersion()` is a monotonic counter any hook can put in
 *     a `useMemo`/`useEffect` dependency array to force a recompute against
 *     fresh state even when neither the query cache nor the local store's own
 *     notify fired (e.g. a memo derived from something outside both, like
 *     `findInProgressLessonId`'s own localStorage namespace).
 *
 * `reason` is diagnostic + lets the invalidation subscriber decide which
 * query keys matter (an SRS-only push doesn't need to touch quests) — it is
 * never used to skip the progress/me invalidation itself.
 */

export type ProgressChangeReason =
  | "lesson_end"
  | "reconcile_push"
  | "reconcile_pull"
  | "bulk_complete"
  | "placement"
  | "pull_ignoring_reset"
  | "srs_sync"
  /**
   * Shop/ads/social claims — not sync-shaped (no local→server progress
   * catch-up, no server rollup merge), but they DO change server-authoritative
   * balances that live inside the progress summary. The lead's brief: "leave
   * UI-mutation invalidations as they are but route them through the same
   * helper" — this reason is that route. Never paired with a quests
   * invalidation by the subscriber (the original 4 call sites never invalidated
   * quests either).
   */
  | "ui_mutation";

export interface ProgressChangedEvent {
  reason: ProgressChangeReason;
  at: number;
}

type ProgressChangeListener = (event: ProgressChangedEvent) => void;

const listeners = new Set<ProgressChangeListener>();

/** Bumped once per `emitProgressChanged` call. A cheap dependency-array value
 *  for a memo that needs "something changed" without caring what. */
let version = 0;

export function getProgressChangeVersion(): number {
  return version;
}

export function subscribeProgressChanged(fn: ProgressChangeListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Fire ONCE per completed operation. Callers that batch internally (chunked
 * POSTs, a drained queue) must call this after the batch settles, not per
 * chunk — see the module doc.
 */
export function emitProgressChanged(reason: ProgressChangeReason): void {
  version += 1;
  const event: ProgressChangedEvent = { reason, at: Date.now() };
  listeners.forEach((fn) => {
    try {
      fn(event);
    } catch {
      /* one bad subscriber doesn't block the rest */
    }
  });
}

/** Test seam — module-level state is per-file in vitest, but tests that run
 *  multiple scenarios in one file need to reset the counter/listeners. */
export function resetProgressEventsForTests(): void {
  version = 0;
  listeners.clear();
}
