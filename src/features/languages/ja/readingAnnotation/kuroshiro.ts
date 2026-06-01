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
 */

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

/** Where the kuromoji dictionary files are served. See vite.config.ts. */
const DICT_PATH = "/dict/";

/** Loosely typed kuroshiro instance (the package ships no .d.ts). */
type KuroshiroLike = {
  convert(str: string, opts: { to: string }): Promise<string>;
};

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
