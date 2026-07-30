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
import { getTtsUrl, prefetchTtsAudio } from "./index";

/**
 * Longest string worth testing as a manifest key. Clips are words and single
 * sentences; anything longer is prose (explanations, rule bodies) that is never
 * spoken, and hashing it would be wasted work.
 */
const MAX_KEY_LENGTH = 200;

/** How many clips to fetch at once. Enough to hide latency, few enough not to
 *  contend with the surface's own images and chunks on a slow connection. */
const CONCURRENCY = 6;

/**
 * How many items ahead of the learner to warm.
 *
 * Surfaces hand us their whole collection — a flashcard queue can be hundreds
 * of cards, and warming all of it would pull tens of MB the learner will
 * probably never reach in this session. A window keeps the cost proportional
 * to what is actually about to be played.
 *
 * It self-extends: the effect re-runs as the index advances, and items already
 * decoded are cache hits, so each step pulls only what newly entered the
 * window.
 */
const DEFAULT_WINDOW = 20;

/**
 * Every string reachable from `node` that the manifest has a clip for.
 *
 * ## Why this doesn't use a field allow-list
 *
 * It did, and it was wrong. The first version copied the four field names from
 * `audioCoverage.test.ts` (`audioKey`, `audioText`, `transcript`,
 * `promptAudioText`) on the assumption they enumerated "what gets spoken". They
 * don't — the step views resolve audio from at least a dozen more:
 * `targetPhrase`, `targetSentence`, `example.ja`, `pair.source`,
 * `payload.symbol`, `opt.symbol`, `fullAudio`, `answer`, `meaningEn`, `kana`,
 * `word`. So for most step types the prefetch collected nothing and every clip
 * still loaded on play.
 *
 * Any allow-list has that failure mode, and it fails silently — a new step type
 * just quietly stops being prefetched. So instead we test every string against
 * the manifest and let resolution be the filter: if there's a clip for it, it's
 * spoken. That cannot drift, because it consults the same resolver playback
 * uses.
 *
 * Cost is a SHA-256 over each candidate string — microseconds each, a few
 * hundred per lesson. A string that coincidentally matches a clip but is never
 * spoken costs one wasted (cached, immutable) fetch.
 */
export function collectAudioTexts(node: unknown, lang?: string): string[] {
  const found = new Set<string>();
  const seen = new Set<string>();

  const consider = (s: string): void => {
    if (!s || s.length > MAX_KEY_LENGTH) return;
    // Already-resolved paths/URLs are not manifest keys.
    if (s.startsWith("/") || /^https?:\/\//.test(s)) return;
    if (seen.has(s)) return;
    seen.add(s);
    if (getTtsUrl(s, lang)) found.add(s);
  };

  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      consider(value);
      return;
    }
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    for (const child of Object.values(value as Record<string, unknown>)) walk(child);
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
 * Prefetch every clip reachable from `source` will speak.
 *
 * `source` is deliberately untyped: lesson steps, a flashcard queue, a list of
 * practice prompts, a single dictionary entry — the walk finds spoken strings
 * by asking the manifest, so every surface passes whatever collection it
 * already has. Anything that plays audio should call this.
 *
 * Re-runs when `source` or `lang` change, and aborts in-flight work on unmount
 * so leaving a surface early stops the queue rather than draining it.
 *
 * NOTE: `source` is a dependency by identity. Pass a memoized value (most
 * callers already hold one from `useMemo`/`useState`); an array rebuilt every
 * render would restart the queue every render. The abort makes that merely
 * wasteful rather than harmful, but it is worth getting right.
 */
export function usePrefetchAudio(
  source: unknown,
  lang?: string,
  opts?: { index?: number; window?: number },
): void {
  const index = opts?.index ?? 0;
  const size = opts?.window ?? DEFAULT_WINDOW;

  useEffect(() => {
    if (!source) return;
    // Arrays are windowed; anything else (a single entry, an object) is walked
    // whole because there is no order to window along.
    const slice = Array.isArray(source)
      ? source.slice(Math.max(0, index), Math.max(0, index) + size)
      : source;
    const texts = collectAudioTexts(slice, lang);
    if (texts.length === 0) return;
    const controller = new AbortController();
    void prefetchTtsTexts(texts, lang, controller.signal);
    return () => controller.abort();
  }, [source, lang, index, size]);
}
