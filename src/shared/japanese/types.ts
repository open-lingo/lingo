/**
 * Annotation primitive for any Japanese text we render.
 *
 * - `surface` is what appears on the baseline (kana for now, kanji in Phase 3).
 * - `reading` is the kana form. For pure-kana segments, equal to surface.
 * - `romaji` is an optional explicit override. When absent, the renderer
 *   derives it from `reading` via the kana lookup table.
 * - `role` reserved for future styling (particle highlighting, etc.).
 * - `atomId` resolves the token to a course atom (for SRS / lint coupling).
 *   Populated by the annotation builder when the reading matches an atom in
 *   `JA_COURSE_ATOMS_BY_KANA`; unset for free-form tokens.
 * - `gloss` is the short English translation used by the per-word
 *   hover/tap popover. Authors may override; default comes from the
 *   resolved atom's `translation` field.
 */
export type JapaneseAnnotation = {
  surface: string;
  reading: string;
  romaji?: string;
  role?: "word" | "particle" | "punctuation";
  atomId?: string;
  gloss?: string;
  /**
   * Stamped ONLY by the kanji substitution pass (`applyKanjiSurfaces`) on
   * segments it rewrote to a kanji surface: `true` while the lesson module
   * sits inside the kanji's unlock+`FURIGANA_WINDOW` grace window, `false`
   * past it. The renderer shows furigana when this is `true` OR the atom is
   * not yet FSRS-mastered (Spencer 2026-07-17 — window floor OR unmastered).
   * `undefined` (hand-authored kanji segments, kanji_reading prompts, all
   * kana segments) keeps the legacy behavior: float the reading whenever
   * `reading !== surface`.
   */
  furiganaWindowOpen?: boolean;
};
