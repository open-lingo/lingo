import { useEffect } from "react";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import { reconcileLocalProgressToServer } from "@/shared/domain/progressReconcile";
import { pushAllSrsCardsOnceAfterReconcile } from "@/features/flashcards/engine/srsSync";
import { emitProgressChanged } from "@/shared/domain/progressEvents";

/**
 * Trigger for the local→server catch-up.
 *
 * b20 shipped this inside `useProgressMe`'s query function and it never
 * fired on the founder's phone: 33 GET /progress/me, six tick-sized batch
 * POSTs, not one 100-row chunk. The query function is the wrong host for it.
 * It runs once per fetch, inside a promise continuation — while the learning
 * language it is gated on only becomes readable after `/users/me/settings`
 * resolves AND SettingsContext's Phase-2 effect has committed a render and
 * written localStorage. Both payloads arrive in the same `/boot` batch, so
 * the progress half always wins, and nothing re-runs the query function when
 * the language finally lands.
 *
 * So the trigger is an effect keyed on (progress data, resolved language,
 * user). Whichever arrives last starts it, every time. Re-running is cheap
 * and safe: the diff is a set difference, the marker suppresses a re-post of
 * an unchanged set, and `clientAttemptId` is deterministic so the server
 * dedupes anything that slips through.
 *
 * Mounted by `LessonProgressHydrate`, which sits inside `LanguageProvider`
 * and is the app's single global sync owner.
 */
export function useProgressReconcile(): void {
  const { user } = useAuth();
  const { progress, srs } = useApi();
  const { summary, isProgressReady } = useProgressMe();
  const { language, isLoading: languageLoading } = useLanguage();

  const userId = user?.sub;
  const languageId = language?.id;
  const lessons = summary?.lessons;

  useEffect(() => {
    if (!isProgressReady || !userId) return;
    // The race this hook exists for: wait for the language, don't skip on it.
    if (languageLoading || !languageId) return;
    if (!lessons) return;

    void reconcileLocalProgressToServer({
      userId,
      serverLessons: lessons,
      batch: (payload) => progress.bulkComplete(payload),
    })
      .then((outcome) => {
        // THE gap this lane closes: a reconcile that actually posts
        // completions (build 33: 139 → 525 server-side in seconds) never
        // told the TanStack cache or the Home page anything — nothing local
        // changed (these rows were already complete on THIS device, that's
        // why they were local-only), so `mockProgress`'s own
        // `notifyProgressChanged` never fired either. `posted > 0` is the
        // "a sync completed" condition, not `status === "queued"` (a queued
        // op that never landed is not a completed sync).
        if (outcome.posted > 0) emitProgressChanged("reconcile_push");

        // Belt-and-braces (docs/handoff-2026-09-18-resume.md §6): once a
        // lesson reconcile has actually landed something new, push every SRS
        // card once — not just the dirty ones — so due counts converge even
        // if a card's dirty bookkeeping ever drifted from what the server
        // holds. One-time per user (see `hasPushedFullSrsAfterReconcile`);
        // `enqueueSyncOp` inside `pushAllSrsCardsOnceAfterReconcile` queues
        // this behind any sync already in flight rather than racing it on
        // the shared "srs:sync" tag.
        if (outcome.status === "queued" && outcome.posted > 0) {
          void pushAllSrsCardsOnceAfterReconcile(userId, (payload) =>
            srs.sync(payload),
          )
            .then((synced) => {
              // SRS has its own reactive signal (SRSStoreRevisionContext) for
              // due-count recompute; this only covers progress/me consumers
              // that also mirror XP/lingots off the SRS push.
              if (synced > 0) emitProgressChanged("srs_sync");
            })
            .catch(() => {
              /* unmarked — retried on the next reconcile that posts something */
            });
        }
      })
      .catch(() => {
        /* queued rows retry on the next sync tick */
      });
  }, [isProgressReady, userId, languageId, languageLoading, lessons, progress, srs]);
}
