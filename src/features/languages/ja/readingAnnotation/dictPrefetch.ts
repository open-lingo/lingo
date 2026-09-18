/**
 * Prefetch trigger for the kuromoji dictionary — the part of Spencer's
 * 2026-09-18 decision this lane implements: "load first module worth of
 * dictionary max so we don't bloat all users, and then once they start
 * working on things then we load the dictionary" (the dictionary is the
 * monolithic, non-sliceable phase-1 target; per-course lesson-content packs
 * are phase 2, a separate lane).
 *
 * ## The module-8 premise this lane was briefed with does NOT hold
 *
 * The brief's default trigger was "module 6 (kanji-eligible module 8 minus
 * 2)" — `KANJI_RECOGNITION_MODULE` (`kanjiRollout.ts`) is genuinely 8, but
 * that constant gates when KANJI SURFACES may render in lesson content, not
 * when the dictionary is actually invoked. `SpeakingStepView.tsx` calls
 * `warmKanjiReading()`/`convertToHiragana()` on EVERY JA speaking step,
 * unconditionally (`if (!isJa) return; warmKanjiReading();` — no module
 * check), because Whisper and even Safari's on-device recognizer return
 * natural Japanese orthography (kanji) regardless of what the CURRICULUM
 * is teaching in kana — see `kuroshiro.ts`'s file header. Module 1
 * (`ja/curriculum/m1-ha.ts`, e.g. `speaking("ja-ha3-speak-hito", "ひと",
 * "person")`) already has speaking steps. So the dictionary is a candidate
 * to be needed starting at the learner's FIRST JA speaking step — inside
 * module 1, not module 6 or 8.
 *
 * `DICT_PREFETCH_MODULE` is therefore 1, not 6 — this lane corrects the
 * brief's number rather than implementing a trigger that would arrive
 * after most learners already needed the dictionary. The mechanism (fire
 * a background prefetch once the learner reaches a given module) is kept
 * exactly as briefed and is trivially re-tunable if a later measurement
 * says otherwise. Because module 1 is also the START of the course, this
 * collapses in practice to "prefetch as soon as a JA learner opens the
 * course" — there is very little lead time before the dictionary is
 * needed, which is why the inline "Downloading Japanese dictionary…" UI
 * state (`useDictDownloadState.ts`) is NOT a rare edge case in this
 * design, it is the common case for a new JA install until the prefetch
 * has had a chance to land.
 */
import {
  getDictCdnBaseUrl,
  getDictFetchRaw,
  isDictFromCdn,
} from "./kuroshiro";
import { getDictStore } from "./dictCache";
import { prefetchAllDictFiles } from "./dictLoader";

/** See the file header: the true earliest need, not the brief's module-6 assumption. */
export const DICT_PREFETCH_MODULE = 1;

let prefetchStarted = false;

/**
 * Fire-and-forget: warms the persistent cache with every dict file once
 * the learner is on `moduleIndex >= DICT_PREFETCH_MODULE` of the JA
 * course. No-ops (never even constructs a network request) when:
 *   - `courseId` isn't `"ja"` — non-JA learners never pay this cost.
 *   - the CDN-lazy path isn't active (`isDictFromCdn()` false — either the
 *     `dictionary.lazy` flag is off, or `VITE_ASSET_BASE_URL` is unset).
 *   - `moduleIndex` is below the threshold.
 *   - a prefetch has already started this session (memoized — repeated
 *     lesson-mount calls as the learner moves through modules must not
 *     restart 12 parallel fetches on every navigation).
 */
export function triggerDictPrefetch(courseId: string, moduleIndex: number): void {
  if (prefetchStarted) return;
  if (courseId !== "ja") return;
  if (!isDictFromCdn()) return;
  if (moduleIndex < DICT_PREFETCH_MODULE) return;
  prefetchStarted = true;
  void (async () => {
    const [dictBaseUrl, fetchRaw] = await Promise.all([
      Promise.resolve(getDictCdnBaseUrl()),
      getDictFetchRaw(),
    ]);
    await prefetchAllDictFiles({ dictBaseUrl, fetchRaw, store: getDictStore() });
  })();
}

/** Test-only: reset the once-per-session memoization. */
export function __resetDictPrefetchForTests(): void {
  prefetchStarted = false;
}
