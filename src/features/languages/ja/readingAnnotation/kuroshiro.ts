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
 * there come from authored/precomputed content, not this dictionary). It is
 * also NOT the same as `LanguageModule.romanizer` — that capability field is
 * registered (`jaRomanizer` in `ja/module.ts`) but has zero callers anywhere
 * in the app; `convertToHiragana`'s only live callers are this step-scoring
 * path and the `/speech-tune` dev tool.
 *
 * The dict (`public/dict/*.dat.gz`, ~15.4 MB compressed) is 52.7% of the
 * build-25 IPA. Because it's genuinely needed offline mid-lesson, it is
 * bundled by default on every platform — pruning it from a native build
 * (`scripts/build/prune-native-assets.mjs`) is opt-in and ONLY happens when
 * `VITE_ASSET_BASE_URL` is set at native build time, i.e. once the dict is
 * actually published to the CDN (not done by this lane — see that script's
 * header + the printed `aws s3 cp` command). Until then, native builds keep
 * shipping the bundled copy unchanged — zero behavior change, zero risk.
 *
 * When a CDN base IS configured, native fetches route through
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
 * Same convention as `shared/tts/manifest.ts`'s `ASSET_BASE`: an absolute
 * CDN base when `VITE_ASSET_BASE_URL` is set, else the locally-bundled
 * `/dict/` path (see `vite.config.ts`'s `copyKuromojiDict`/`serveDictAsBinary`).
 * Web leaves `VITE_ASSET_BASE_URL` unset today, so this is a no-op there —
 * the dict keeps loading from the bundle exactly as before.
 */
const ASSET_BASE = (import.meta.env.VITE_ASSET_BASE_URL ?? "").replace(/\/+$/, "");
const DICT_PATH = ASSET_BASE ? `${ASSET_BASE}/dict/` : "/dict/";

/** Loosely typed kuroshiro instance (the package ships no .d.ts). */
type KuroshiroLike = {
  convert(str: string, opts: { to: string }): Promise<string>;
};

/**
 * Gunzip via the platform `DecompressionStream` (no extra dependency, no
 * CJS/ESM interop guesswork — unlike reaching into kuromoji's bundled
 * `zlibjs`, whose module shape under Vite's commonjs interop isn't
 * guaranteed). Confirmed live on the relevant WebKit build — see
 * `docs/perf-2026-09-17.md` task 5 (`DecompressionStream`/gzip-at-rest
 * finding, lane A4). If it's ever missing, the fetch promise rejects and
 * flows into the SAME graceful degradation `getInstance()` already has.
 */
async function gunzip(bytes: ArrayBuffer): Promise<ArrayBuffer> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream unavailable");
  }
  const stream = new Blob([bytes]).stream().pipeThrough(
    new DecompressionStream("gzip"),
  );
  return await new Response(stream).arrayBuffer();
}

let nativeLoaderPatchPromise: Promise<void> | null = null;

/**
 * Monkey-patch kuromoji's browser XHR loader to fetch via `CapacitorHttp`
 * (bypasses the CORS gap — see the file-header doc) instead of a plain XHR,
 * and gunzip with `DecompressionStream` instead of XHR + the loader's own
 * bundled decompressor. Idempotent; only does anything on native with a CDN
 * base configured.
 */
function patchNativeDictLoaderOnce(): Promise<void> {
  nativeLoaderPatchPromise ??= (async () => {
    const [{ default: BrowserDictionaryLoader }, { fetchBinaryNative }] =
      await Promise.all([
        import("kuromoji/src/loader/BrowserDictionaryLoader.js"),
        import("@/shared/platform/nativeHttp"),
      ]);
    BrowserDictionaryLoader.prototype.loadArrayBuffer = function (
      url: string,
      callback: (err: unknown, buffer: ArrayBuffer | null) => void,
    ) {
      fetchBinaryNative(url)
        .then(gunzip)
        .then((buffer) => callback(null, buffer))
        .catch((err: unknown) => callback(err, null));
    };
  })();
  return nativeLoaderPatchPromise;
}

let initPromise: Promise<KuroshiroLike> | null = null;
let initFailed = false;

async function getInstance(): Promise<KuroshiroLike> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    // Dynamic imports keep both libs out of the main bundle.
    const [{ default: Kuroshiro }, { default: KuromojiAnalyzer }] =
      await Promise.all([
        import("kuroshiro"),
        import("kuroshiro-analyzer-kuromoji"),
      ]);
    if (IS_NATIVE && ASSET_BASE) {
      await patchNativeDictLoaderOnce();
    }
    const k = new Kuroshiro();
    await k.init(new KuromojiAnalyzer({ dictPath: DICT_PATH }));
    return k as unknown as KuroshiroLike;
  })();
  return initPromise;
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

  if (initFailed) return stripped;

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
    if (!initFailed) {
      initFailed = true;
      // Single warning, then silent. We never want this to spam the
      // console mid-lesson.
      // eslint-disable-next-line no-console
      console.warn(
        "[kanjiReading] kuroshiro init/convert failed; falling back to raw transcript.",
        err,
      );
    }
    return folded;
  }
}

/** Test-only: reset the memoized state. */
export function __resetKanjiReadingForTests(): void {
  initPromise = null;
  initFailed = false;
}
