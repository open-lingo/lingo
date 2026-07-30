/**
 * Warm the TTS decode cache ahead of playback.
 *
 * ## Why
 *
 * Clips used to sit in the app bundle's public dir, so "loading" one was a
 * same-machine disk read and the lazy `loadBuffer`-on-play path was effectively
 * free. Since the 2026-07 migration they come from CloudFront, so the first
 * play of any clip pays a network round trip *plus* an mp3 decode — and it is
 * paid at the exact moment the learner expects sound, most visibly on the
 * 350ms-after-mount autoplay, where the clip arrives late or the step has
 * already advanced.
 *
 * Prefetching moves that cost to lesson mount, where there is nothing to be
 * late for. Everything funnels through the same `bufferCache` in `./index`, so
 * a prefetched clip makes the later `playJaAudio` a pure cache hit.
 *
 * ## Scope
 *
 * A whole lesson at once, not a sliding window. Lessons are bounded (tens of
 * steps, ~15 KB per clip) and CloudFront serves them `immutable`, so the naive
 * version is both small and cache-friendly. A window would add ordering
 * bookkeeping to save bandwidth nobody is short of.
 *
 * Silent mode is deliberately NOT respected here: it gates autoplay only, and
 * tap-to-play stays live so the learner can always ask for sound (see the
 * silent-mode note in `./index`). Prefetching keeps that responsive.
 */
import { useEffect } from "react";
import { prefetchTtsAudio } from "./index";

/**
 * Step fields whose value is spoken aloud. Kept in sync with the same list in
 * `features/lesson/data/audioCoverage.test.ts` — that test walks compiled
 * lessons for exactly these keys to prove every spoken surface has a clip, so
 * the two lists describing "what gets spoken" must not drift.
 */
const AUDIO_FIELDS = ["audioKey", "audioText", "transcript", "promptAudioText"];

/** How many clips to fetch at once. Enough to hide latency, few enough not to
 *  contend with the lesson's own images and chunks on a slow connection. */
const CONCURRENCY = 6;

/**
 * Every spoken string reachable from `node`, deduped and in encounter order.
 *
 * Walks the whole structure rather than reading known step shapes: step types
 * nest spoken text at varying depths (dialogue lines, review tails, anchors),
 * and a shape-aware reader silently misses new ones. `audioKey` may already be
 * a resolved URL rather than text — those are skipped, since they are resolved
 * at build time and need no lookup.
 */
export function collectAudioTexts(node: unknown): string[] {
  const found = new Set<string>();

  const walk = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (
        AUDIO_FIELDS.includes(key) &&
        typeof child === "string" &&
        child &&
        // Already-resolved paths/URLs are not manifest keys.
        !child.startsWith("/") &&
        !/^https?:\/\//.test(child)
      ) {
        found.add(child);
      }
      walk(child);
    }
  };

  walk(node);
  return [...found];
}

/**
 * Decode `texts` into the shared buffer cache, `CONCURRENCY` at a time.
 *
 * Resolves when every text has been attempted. Individual failures are
 * swallowed on purpose: a prefetch miss must never surface as an error, it
 * just means that clip falls back to loading on play. Pass an `AbortSignal`
 * to stop early — checked between items, so an unmount stops the queue rather
 * than draining it.
 */
export async function prefetchTtsTexts(
  texts: string[],
  lang?: string,
  signal?: AbortSignal,
): Promise<{ attempted: number; ready: number }> {
  let index = 0;
  let ready = 0;
  let attempted = 0;

  const worker = async (): Promise<void> => {
    while (index < texts.length) {
      if (signal?.aborted) return;
      const text = texts[index++];
      attempted++;
      try {
        if (await prefetchTtsAudio(text, lang)) ready++;
      } catch {
        // Prefetch is best-effort; playback retries on demand.
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, texts.length) }, worker),
  );
  return { attempted, ready };
}

/**
 * Prefetch every clip a lesson (or any step-bearing structure) will speak.
 *
 * Pass the steps themselves; the walk finds the spoken fields. Re-runs when
 * `steps` or `lang` change, and aborts in-flight work on unmount so leaving a
 * lesson early stops the queue.
 */
export function usePrefetchLessonAudio(steps: unknown, lang?: string): void {
  useEffect(() => {
    if (!steps) return;
    const texts = collectAudioTexts(steps);
    if (texts.length === 0) return;
    const controller = new AbortController();
    void prefetchTtsTexts(texts, lang, controller.signal);
    return () => controller.abort();
  }, [steps, lang]);
}
