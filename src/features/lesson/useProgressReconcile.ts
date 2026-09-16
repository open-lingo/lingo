import { useEffect } from "react";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useProgressMe } from "@/shared/hooks/useProgressMe";
import { reconcileLocalProgressToServer } from "@/shared/domain/progressReconcile";

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
  const { progress } = useApi();
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
      batch: (payload) => progress.batchAttempts(payload),
    }).catch(() => {
      /* queued rows retry on the next sync tick */
    });
  }, [isProgressReady, userId, languageId, languageLoading, lessons, progress]);
}
