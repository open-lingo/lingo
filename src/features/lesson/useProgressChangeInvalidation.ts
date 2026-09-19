import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  subscribeProgressChanged,
  type ProgressChangeReason,
} from "@/shared/domain/progressEvents";

/** Lesson-shaped reasons can move quest progress (test-out bulk completes,
 *  placement credits, a real lesson finishing). SRS pushes and UI-mutation
 *  claims (ads/shop/social) never did before this lane and still don't. */
const QUEST_REASONS = new Set<ProgressChangeReason>([
  "lesson_end",
  "reconcile_push",
  "reconcile_pull",
  "bulk_complete",
  "placement",
  "pull_ignoring_reset",
]);

/** `pullFromServerIgnoringReset` already did a direct `refetchQueries` on
 *  progress/me before emitting — invalidating it again here would be a
 *  second, redundant GET for the same data. Every other reason still gets
 *  the invalidation. */
const SKIP_PROGRESS_ME_REASONS = new Set<ProgressChangeReason>(["pull_ignoring_reset"]);

/**
 * The single subscriber that turns a `progressChanged` signal into the
 * TanStack invalidations every scattered call site used to fire by hand.
 * Mount exactly once — `LessonProgressHydrate` is the app's single global
 * sync owner, same as `useAppLifecycleSync`/`useProgressReconcile`.
 *
 * Invalidation only marks the query stale and refetches ACTIVE observers —
 * it does not itself add a new fetch beyond that one refetch per signal, so
 * emitting the signal costs exactly one `progress/me` request when a
 * component is mounted to observe it (zero if nothing is).
 */
export function useProgressChangeInvalidation(): void {
  const queryClient = useQueryClient();

  useEffect(
    () =>
      subscribeProgressChanged((event) => {
        if (!SKIP_PROGRESS_ME_REASONS.has(event.reason)) {
          void queryClient.invalidateQueries({ queryKey: ["progress", "me"] });
        }
        if (QUEST_REASONS.has(event.reason)) {
          void queryClient.invalidateQueries({ queryKey: ["core", "quests", "list"] });
        }
      }),
    [queryClient],
  );
}
