import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { getContentRevision, hasRegisteredLesson, subscribeContent } from "./lessonRegistry";
import { ensureAllContentLoaded, ensureCourseLoaded, ensureLessonLoaded } from "./contentLoader";

/**
 * React seams for content-as-data (2026-09-13; see contentLoader.ts).
 *
 * `useContentRevision()` re-renders the caller whenever lessons register, so
 * anything memoised over the registry (`useMemo(() => build(...), [rev])`)
 * recomputes once JSON lands. `useLessonReady(id)` / `useCourseReady(lang)`
 * kick the load and report `loading | ready | error`; under the eager test
 * runtime they are `ready` on the first render.
 */
export function useContentRevision(): number {
  return useSyncExternalStore(subscribeContent, getContentRevision, getContentRevision);
}

export type ContentLoadState = "loading" | "ready" | "error";

export function useLessonReady(lessonId: string | undefined): {
  state: ContentLoadState;
  error: unknown;
  retry: () => void;
} {
  const [state, setState] = useState<ContentLoadState>(() =>
    lessonId && hasRegisteredLesson(lessonId) ? "ready" : "loading",
  );
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!lessonId) return;
    let alive = true;
    if (hasRegisteredLesson(lessonId)) {
      setState("ready");
    } else {
      setState("loading");
    }
    ensureLessonLoaded(lessonId).then(
      () => {
        if (alive) setState("ready");
      },
      (e: unknown) => {
        if (!alive) return;
        setError(e);
        setState("error");
      },
    );
    return () => {
      alive = false;
    };
  }, [lessonId, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { state, error, retry };
}

/** Load a whole course (or up to a module) for pages that read many lessons. */
export function useCourseReady(lang: string | undefined, upToModuleId?: string): ContentLoadState {
  const [state, setState] = useState<ContentLoadState>("loading");
  useEffect(() => {
    if (!lang) return;
    let alive = true;
    setState("loading");
    ensureCourseLoaded(lang, upToModuleId).then(
      () => {
        if (alive) setState("ready");
      },
      () => {
        if (alive) setState("error");
      },
    );
    return () => {
      alive = false;
    };
  }, [lang, upToModuleId]);
  return state;
}

/** Every course — admin/dev surfaces that enumerate the whole registry. */
export function useAllContentReady(): ContentLoadState {
  const [state, setState] = useState<ContentLoadState>("loading");
  useEffect(() => {
    let alive = true;
    ensureAllContentLoaded().then(
      () => {
        if (alive) setState("ready");
      },
      () => {
        if (alive) setState("error");
      },
    );
    return () => {
      alive = false;
    };
  }, []);
  return state;
}
