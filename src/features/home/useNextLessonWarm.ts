import { useEffect } from "react";
import { ensureLessonLoaded } from "@/features/lesson/data/contentLoader";
import { getRegisteredLesson as getRawMockLesson } from "@/features/lesson/data/lessonRegistry";
import { collectAudioTexts, prefetchTtsTexts } from "@/shared/tts/prefetch";

/**
 * "Current lesson + 1, ready before they tap" (Spencer, 2026-09-13).
 *
 * After Home has painted and the main thread is idle, load the JSON for the
 * next lesson's module (and its predecessors — `ensureLessonLoaded`) and warm
 * that lesson's audio into the clip cache, so the lesson opens with content
 * already registered and its first clips already decoded. Bounded on
 * purpose: one lesson's texts (a few dozen clips, ~0.5 MB) — the per-module
 * audio pack stays the opt-in feature scoped on 2026-08-06, never a
 * whole-course download. Every part is best-effort and cancellable; a miss
 * costs nothing but the fetch the lesson would have made anyway.
 */
export function useNextLessonWarm(lessonId: string | null | undefined, lang: string | undefined): void {
  useEffect(() => {
    if (!lessonId || !lang) return;
    const controller = new AbortController();
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    const run = () => {
      if (controller.signal.aborted) return;
      ensureLessonLoaded(lessonId)
        .then(() => {
          if (controller.signal.aborted) return;
          const raw = getRawMockLesson(lessonId);
          if (!raw) return;
          const texts = collectAudioTexts(raw.steps, lang).slice(0, MAX_CLIPS);
          if (texts.length === 0) return;
          return prefetchTtsTexts(texts, lang, controller.signal).then(() => undefined);
        })
        .catch(() => {
          /* best effort */
        });
    };
    let idleHandle: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (typeof win.requestIdleCallback === "function") {
      idleHandle = win.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    } else {
      timer = setTimeout(run, FALLBACK_DELAY_MS);
    }
    return () => {
      controller.abort();
      if (idleHandle !== null && win.cancelIdleCallback) win.cancelIdleCallback(idleHandle);
      if (timer !== null) clearTimeout(timer);
    };
  }, [lessonId, lang]);
}

const MAX_CLIPS = 60;
const IDLE_TIMEOUT_MS = 6000;
const FALLBACK_DELAY_MS = 2500;
