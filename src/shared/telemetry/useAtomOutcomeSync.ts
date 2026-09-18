import { useEffect } from "react";
import { useApi } from "@/shared/api";
import {
  flushAtomOutcomes,
  registerAtomOutcomeSender,
  unregisterAtomOutcomeSender,
} from "./atomOutcome";

/**
 * Wires `atomOutcome.ts`'s buffering engine to the authenticated transport
 * (`telemetryOutcomes` API client) and to the background-flush triggers.
 * Mirrors `features/lesson/useLessonSyncSession.ts`'s split: the engine
 * stays transport-agnostic, this hook is the one place that knows about
 * `useApi()`.
 *
 * Mount once per page that grades steps — `LessonPage.tsx` and
 * `AlphabetLessonPage.tsx` (the two grading seams `atomOutcome` events are
 * recorded from). A no-op when `telemetry.atomOutcomes` is off (the
 * buffering engine never queues anything, so every flush call here is
 * immediately a no-op too) — safe to mount unconditionally.
 */
export function useAtomOutcomeSync(): void {
  const { telemetryOutcomes } = useApi();

  useEffect(() => {
    registerAtomOutcomeSender((items, opts) =>
      telemetryOutcomes
        .sendBatch(
          items.map((e) => ({ ...e })),
          opts,
        )
        .then(() => ({ ok: true, status: 202 }))
        .catch((err: unknown) => {
          const status =
            err && typeof err === "object" && "status" in err
              ? (err as { status: number }).status
              : 0;
          return { ok: false, status };
        }),
    );

    const flushOnHide = () => {
      void flushAtomOutcomes({ keepalive: true });
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flushOnHide();
    };
    window.addEventListener("pagehide", flushOnHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushOnHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      // Navigate-away mid-lesson (no lesson-end call reached) — best-effort
      // flush of whatever's still buffered before this page's sender goes
      // away, same "catch abandoned events on unmount" reasoning as
      // `useLessonSyncSession.ts`.
      void flushAtomOutcomes({ keepalive: true });
      unregisterAtomOutcomeSender();
    };
  }, [telemetryOutcomes]);
}
