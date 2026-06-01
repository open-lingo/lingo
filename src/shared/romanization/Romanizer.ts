/**
 * Romanizer — generic protocol for a "logographic / non-Latin script
 * → Latin (or phonetic kana) transducer". Phase 2 wires this into the
 * LanguageModule via the `romanizer` slot (ADR-011).
 *
 * Current implementations (Phase 1):
 *   - JA: kuroshiro (kanji + katakana → hiragana). See
 *     `features/languages/ja/readingAnnotation/kuroshiro.ts`.
 *
 * Planned (Phase 6+):
 *   - ZH: pinyin transducer.
 *   - KO: revised romanization (when KO learners ask for it).
 *
 * The protocol is intentionally async to allow lazy-loaded analyzers
 * (kuroshiro pulls in a ~12 MB kuromoji dictionary on first call).
 * Fallback semantics: `toPhonetic` MUST resolve, even on failure;
 * implementations log once and return the input unchanged. The speech
 * scoring pipeline never gates on the analyzer's success.
 */

export interface Romanizer {
  /**
   * Convert input text to the language's phonetic / non-logographic
   * surface form (e.g. hiragana for JA, pinyin for ZH). Returns the
   * input unchanged on any failure.
   */
  toPhonetic(text: string): Promise<string>;
}
