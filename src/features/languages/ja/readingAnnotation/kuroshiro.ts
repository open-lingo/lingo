/**
 * Kanji → hiragana conversion for ASR transcripts.
 *
 * Whisper (and occasionally Safari's on-device JA speech) returns
 * transcripts in natural Japanese orthography — kanji included. The
 * scoring layer (`loose-match.ts`) normalizes kana but doesn't read
 * kanji; without conversion, a Whisper transcript of "愛" never
 * matches a target of "あい" and the learner sees a false fail.
 *
 * This helper wraps `kuroshiro` + `kuroshiro-analyzer-kuromoji` (the
 * standard browser-side Japanese morphological analyzer) behind a
 * memoized, lazy-loaded singleton.
 *
 * Constraints:
 *   - Lazy import: kuromoji ships ~12 MB of dictionary data; it must
 *     NOT land in the main bundle. The dynamic `import()` here puts
 *     the libs in a separate chunk that only loads on first call.
 *   - Skip-fast on no-kanji input: most attempts on a beginner
 *     curriculum are pure kana, so we short-circuit before touching
 *     kuroshiro.
 *   - Graceful degradation: if init or convert throws (dict 404,
 *     network failure, browser quirk), we resolve with the original
 *     input and log one console warning. Speech flow must never die
 *     because the kanji-reader failed.
 *
 * The scorer (`scoreAlternatives`) stays pure and synchronous;
 * conversion happens in consumers before they call it.
 *
 * ── Dictionary origin (perf review 2026-09-17, docs/perf-2026-09-17.md §1,
 * lane A4b) ──────────────────────────────────────────────────────────────
 * This is a REAL, learner-facing, offline dependency for the JA course —
 * `SpeakingStepView.tsx` calls `convertToHiragana` on every JA speaking-step
 * attempt whose transcript isn't already a literal accepted form, for BOTH
 * the native (`SFSpeechRecognizer`) and web engines, not just Whisper. It is
 * NOT what feeds furigana rendering (`AnnotatedText`/`jaReadingAnnotation`
 * uses the separate, kuromoji-free `romajiLexicon.ts` tokenizer; readings
 * there come from authored/precomputed content, not this dictionary). It was
 * also NOT the same as `LanguageModule.romanizer` — that JA capability field
 * (`jaRomanizer` in `ja/module.ts`) had zero callers anywhere in the app and
 * was removed (2026-09-17, lane A9); `convertToHiragana`'s only live callers
 * are this step-scoring path and the `/speech-tune` dev tool.
 *
 * The dict (`public/dict/*.dat.gz`, ~15.4 MB compressed) is 52.7% of the
 * build-25 IPA. Because it's genuinely needed offline mid-lesson (every JA
 * learner hits it at their first speaking step), it stays BUNDLED BY
 * DEFAULT on every platform — 15 MB shipped once in the IPA beats 15 MB
 * fetched over the network with no persistent cache on every cold dict
 * init, and a network fetch breaks the offline speaking step entirely
 * (lead decision, docs/perf-2026-09-17.md §1a, 2026-09-17). The CDN path
 * stays in the code but is opt-in behind TWO gates, both required:
 * `VITE_DICT_FROM_CDN === "1"` AND `VITE_ASSET_BASE_URL` set at build time
 * (`scripts/build/prune-native-assets.mjs` mirrors the same two-gate check
 * before deleting `dist/dict`). The env-base-alone check this lane
 * inherited from A4b was a real landmine: build 25's shipped `.env.native`
 * sets `VITE_ASSET_BASE_URL` to the TTS CDN host
 * (`https://app.openlingoapp.com`) for an unrelated reason, so a bare
 * `ASSET_BASE ? cdn : bundled` check would have silently switched every
 * native install to network-fetching the dict with no persistent
 * on-device cache — the explicit opt-in flag is the fix. Revisiting the
 * CDN path is gated on that precondition: a persistent on-device cache
 * (so the 15 MB is paid once per device, not once per cold init) plus a
 * versioned `/dict/v1/` CDN prefix (the site bucket's root sync runs
 * `aws s3 sync --delete`, per `deploy.yml`; a bare `/dict/` prefix would
 * get deleted out from under installed apps the next time a web build
 * ships without `dist/dict`, since only native builds populate it today
 * under this same two-gate check). Not done by this lane — see the prune
 * script's header + the printed `aws s3 cp` command for the actual upload
 * step, which remains a precondition regardless of the flag.
 *
 * When BOTH gates are satisfied, native fetches route through
 * `fetchBinaryNative` (CapacitorHttp), not a plain XHR/fetch: the asset CDN
 * sends no `Access-Control-Allow-Origin` (confirmed via curl with
 * `Origin: capacitor://localhost` against a known-published CDN object —
 * same gap that historically broke TTS on native, see `nativeHttp.ts`), so
 * a same-origin-assuming browser fetch from `capacitor://localhost` would
 * be blocked by CORS. `patchNativeDictLoaderOnce` below monkey-patches
 * `kuromoji`'s own `BrowserDictionaryLoader.prototype.loadArrayBuffer` (the
 * one seam kuromoji exposes for swapping its transport) to fetch via
 * CapacitorHttp and gunzip with `DecompressionStream`, rather than XHR. This
 * is unverified end-to-end — the CDN copy does not exist yet — but every
 * individual piece (CapacitorHttp bypassing CORS; `DecompressionStream`
 * live on the relevant WebKit build, task 5 of `docs/perf-2026-09-17.md`)
 * is proven elsewhere in this codebase; see the unit tests in
 * `kuroshiro.test.ts`. Any failure here still flows through the SAME
 * existing graceful degradation as today (one console.warn, unconverted
 * transcript, never a crash) — no new failure mode, only a new trigger for
 * an old one.
 */

import { IS_NATIVE } from "@/shared/platform/native";
import { loadDictFile } from "./dictLoader";
import { getDictStore } from "./dictCache";

/** CJK Unified Ideographs Basic + Compatibility Forms. */
const KANJI_RE = /[一-鿿]/;

/** Full-width katakana (excluding ヷヸヹヺヿ and the special marks). */
const KATAKANA_RE = /[ァ-ヶ]/;
const KATAKANA_RE_G = /[ァ-ヶ]/g;

/**
 * Latin alphabet + ASCII digits. Whisper occasionally hallucinates
 * English transcriptions of Japanese audio ("ryu" → "you"). The worker
 * suppresses these tokens at decode time when it can introspect the
 * tokenizer; this is the cheap defense-in-depth strip for anything that
 * leaks through.
 */
const LATIN_RE_G = /[A-Za-z0-9]+/g;

/**
 * Cheap codepoint-shift fold: 0x30A1 (ァ) → 0x3041 (ぁ) is a constant
 * -0x60 offset across the whole standard katakana block. No library
 * needed; Whisper outputs that "アイ" for "あい" round-trips to "あい"
 * before scoring.
 */
function katakanaToHiragana(s: string): string {
  if (!KATAKANA_RE.test(s)) return s;
  return s.replace(KATAKANA_RE_G, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60),
  );
}

/**
 * Where the kuromoji dictionary files are served.
 *
 * Bundled `/dict/` unless BOTH `VITE_DICT_FROM_CDN === "1"` (explicit
 * opt-in) AND `VITE_ASSET_BASE_URL` (the CDN base, same convention as
 * `shared/tts/manifest.ts`'s `ASSET_BASE`) are set. The flag exists
 * because `VITE_ASSET_BASE_URL` alone is NOT a reliable "CDN dict is
 * live" signal — the shipped `.env.native` sets it to the TTS CDN host
 * for an unrelated reason, so checking it alone would silently move every
 * native install onto a network fetch with no persistent cache.
 *
 * `VITE_DICT_FROM_CDN` is no longer a hand-set env var (2026-09-18,
 * `docs/dictionary-lazy-load-2026-09-18.md`): `vite.config.ts` derives it
 * automatically, at build time, from `dictionary.lazy` in
 * `src/pub/feature-flags.json` (`scripts/build/readDictLazyFlag.mjs`) —
 * one flag for the lead to flip instead of two env vars to remember, and
 * it can no longer collide with `VITE_ASSET_BASE_URL`'s unrelated TTS use
 * the way an env-var-only design would. Reading it as
 * `import.meta.env.VITE_DICT_FROM_CDN` here is unchanged, so this module
 * and its test suite don't need to know where the value came from.
 *
 * The CDN prefix is versioned and immutable (`/dict/v1/`, not a bare
 * `/dict/`) — `deploy.yml`'s root `aws s3 sync --delete` has no `dict/`
 * exclude, so a bare prefix would be deleted out from under installed
 * apps the next time a web build ships without `dist/dict` populated. A
 * version bump (dict format change) gets a NEW prefix (`/dict/v2/`)
 * rather than overwriting `v1` objects older installs may still be
 * fetching.
 */
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL ?? "").replace(/\/+$/, "");
const DICT_FROM_CDN =
  import.meta.env.VITE_DICT_FROM_CDN === "1" && Boolean(ASSET_BASE);
const DICT_PATH = DICT_FROM_CDN ? `${ASSET_BASE}/dict/v1/` : "/dict/";

/** Loosely typed kuroshiro instance (the package ships no .d.ts). */
type KuroshiroLike = {
  convert(str: string, opts: { to: string }): Promise<string>;
};

/**
 * Platform raw-byte transport for a dict URL: native routes through
 * `fetchBinaryNative` (CapacitorHttp) because the asset CDN sends no
 * `Access-Control-Allow-Origin` and a plain `fetch`/XHR from
 * `capacitor://localhost` would be CORS-blocked (see the file-header
 * doc); web uses a plain `fetch` (same-origin CDN path, no CORS gap).
 * Exported so `dictPrefetch.ts` can warm the persistent cache with the
 * SAME transport `patchDictLoaderOnce` below installs for kuromoji's own
 * loader — one definition of "how this app fetches a dict file."
 */
export async function getDictFetchRaw(): Promise<(url: string) => Promise<ArrayBuffer>> {
  if (IS_NATIVE) {
    const { fetchBinaryNative } = await import("@/shared/platform/nativeHttp");
    return fetchBinaryNative;
  }
  return async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`dict fetch failed: ${res.status} ${url}`);
    return res.arrayBuffer();
  };
}

/** The base URL dict files are fetched from when `DICT_FROM_CDN` — for `dictPrefetch.ts`. */
export function getDictCdnBaseUrl(): string {
  return DICT_PATH;
}

let dictLoaderPatchPromise: Promise<void> | null = null;

/**
 * Monkey-patch kuromoji's browser XHR loader to route through
 * `dictLoader.ts` (cache-first, hash-verified, gunzip-on-exit) instead of
 * its own bundled XHR + decompressor. Idempotent; only does anything when
 * `DICT_FROM_CDN` is true — on native OR web, unlike the native-only patch
 * this replaced (2026-09-18): the default loader has no persistent cache
 * or hash verification on EITHER platform, and web's CDN fetch is
 * same-origin (no CORS gap, so no CapacitorHttp detour needed there).
 */
function patchDictLoaderOnce(): Promise<void> {
  dictLoaderPatchPromise ??= (async () => {
    const [{ default: BrowserDictionaryLoader }, fetchRaw] = await Promise.all([
      import("kuromoji/src/loader/BrowserDictionaryLoader.js"),
      getDictFetchRaw(),
    ]);
    const store = getDictStore();
    BrowserDictionaryLoader.prototype.loadArrayBuffer = function (
      url: string,
      callback: (err: unknown, buffer: ArrayBuffer | null) => void,
    ) {
      const filename = url.split("/").pop() ?? url;
      loadDictFile(filename, { dictBaseUrl: DICT_PATH, fetchRaw, store })
        .then((buffer) => callback(null, buffer))
        .catch((err: unknown) => callback(err, null));
    };
  })();
  return dictLoaderPatchPromise;
}

/**
 * Reactive status for the small inline "Downloading Japanese
 * dictionary…" UI state (`useDictDownloadState.ts`). Only meaningful when
 * `DICT_FROM_CDN` — the bundled path is a local file read, not worth
 * surfacing. `"loading"` covers both a cold `getInstance()` call and a
 * background `warmKanjiReading()`/prefetch call, since either can be the
 * one a learner is waiting on.
 */
export type DictLoadStatus = "idle" | "loading" | "ready" | "error";
let dictLoadStatus: DictLoadStatus = "idle";
const dictLoadStatusListeners = new Set<() => void>();

function setDictLoadStatus(next: DictLoadStatus): void {
  if (dictLoadStatus === next) return;
  dictLoadStatus = next;
  dictLoadStatusListeners.forEach((listener) => listener());
}

/** Synchronous read for `useSyncExternalStore`. */
export function getDictLoadStatus(): DictLoadStatus {
  return dictLoadStatus;
}

export function subscribeDictLoadStatus(listener: () => void): () => void {
  dictLoadStatusListeners.add(listener);
  return () => dictLoadStatusListeners.delete(listener);
}

/** Whether the CDN-lazy path is active at all — gates the download banner. */
export function isDictFromCdn(): boolean {
  return DICT_FROM_CDN;
}

let initPromise: Promise<KuroshiroLike> | null = null;

/**
 * TestFlight #194 class ("renshuusuru failure... every time"): a prior
 * version of this module latched a single `initFailed` boolean the first
 * time `getInstance()` rejected, and every later call short-circuited on
 * that flag WITHOUT ever attempting init again — so one transient failure
 * (a cold-start race under Capacitor, a first-run asset-extraction lag, a
 * momentary fetch hiccup) permanently disabled kanji→kana conversion for
 * the rest of the app session. Every JA speaking step whose target has any
 * kanji-eligible word — and every recognizer transcript that comes back in
 * natural (kanji) orthography — depends on this conversion; a session-wide
 * silent disable reads exactly like "we fail this every time," which is
 * what was reported.
 *
 * Fix: never memoize a REJECTED init. On failure, clear `initPromise` so the
 * next call gets a fresh attempt instead of replaying the same rejection (or
 * a cached "give up" flag). Calls are infrequent (once per finished JA
 * speaking attempt whose transcript still contains kanji after the cheap
 * fast-path checks) and the dictionary is bundled by default, so a retry is
 * cheap and a stuck failure is almost certainly transient.
 */
async function getInstance(): Promise<KuroshiroLike> {
  if (initPromise) return initPromise;
  if (DICT_FROM_CDN) setDictLoadStatus("loading");
  const attempt = (async () => {
    // Dynamic imports keep both libs out of the main bundle.
    const [{ default: Kuroshiro }, { default: KuromojiAnalyzer }] =
      await Promise.all([
        import("kuroshiro"),
        import("kuroshiro-analyzer-kuromoji"),
      ]);
    if (DICT_FROM_CDN) {
      await patchDictLoaderOnce();
    }
    const k = new Kuroshiro();
    await k.init(new KuromojiAnalyzer({ dictPath: DICT_PATH }));
    return k as unknown as KuroshiroLike;
  })();
  // Swallow here so this doesn't become an unhandled rejection when nobody
  // has awaited `attempt` yet (the `.catch` runs before the `await
  // getInstance()` below reacts to it) — the caller's own try/catch still
  // sees the original rejection via `initPromise`.
  attempt
    .then(() => setDictLoadStatus("ready"))
    .catch(() => {
      if (initPromise === attempt) initPromise = null;
      setDictLoadStatus("error");
    });
  initPromise = attempt;
  return initPromise;
}

/**
 * Kick off (but don't await) the kuromoji dictionary load. Mirrors the
 * recognizer's own `prepare()` warm-up (#155): called from the step's
 * intro/mount, this moves the ~12 MB dictionary parse off the moment
 * grading actually needs it and onto the seconds the learner spends reading
 * the card — the same "is the dictionary loaded on native AT GRADING TIME"
 * race #194's triage asked about, closed by never leaving it to chance.
 * Errors are intentionally unhandled here: `convertToHiragana` (or a later
 * warm call) will surface and retry them.
 */
export function warmKanjiReading(): void {
  void getInstance().catch(() => {});
}

/**
 * Convert a Japanese string to all-hiragana. Kanji are read via
 * kuromoji's morphological analysis; existing kana pass through
 * unchanged.
 *
 * Returns the input unchanged when:
 *   - input is empty
 *   - input contains no kanji (fast path; kuroshiro is never touched)
 *   - kuroshiro init / conversion threw (with a single console.warn)
 */
export async function convertToHiragana(text: string): Promise<string> {
  if (!text) return text;

  // Fold any katakana to hiragana first — STT engines (especially Whisper)
  // sometimes emit katakana for foreign-feeling utterances or for kana-only
  // words. Cheap codepoint shift, no kuroshiro round-trip.
  const folded = katakanaToHiragana(text);

  // Strip any Latin letters / digits — Whisper hallucinates English
  // words ("you" for "りゅう"). Even with worker-side suppress_tokens,
  // BPE pieces can leak through. We can't compare Latin to kana, so
  // drop them. If only Latin remains, the comparison correctly fails
  // and the user retries.
  const stripped = folded.replace(LATIN_RE_G, "").trim();

  // If no kanji remain after folding+strip, we're done.
  if (!KANJI_RE.test(stripped)) return stripped;

  try {
    const k = await getInstance();
    const result = await k.convert(stripped, { to: "hiragana" });
    // Kuroshiro may itself re-emit romaji for unknown kanji; strip once
    // more before returning.
    const cleaned =
      typeof result === "string" ? result.replace(LATIN_RE_G, "").trim() : "";
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.debug("[kanjiReading]", folded, "→", cleaned);
    }
    return cleaned.length > 0 ? cleaned : stripped;
  } catch (err) {
    // No sticky "give up forever" flag — see `getInstance()`. This attempt
    // falls back to the raw (kana-folded) transcript; the NEXT call gets a
    // fresh init attempt, not a cached failure.
    // eslint-disable-next-line no-console
    console.warn(
      "[kanjiReading] kuroshiro init/convert failed; falling back to raw transcript (will retry next call).",
      err,
    );
    return folded;
  }
}

/** Test-only: reset the memoized state. */
export function __resetKanjiReadingForTests(): void {
  initPromise = null;
  dictLoaderPatchPromise = null;
  dictLoadStatus = "idle";
}
