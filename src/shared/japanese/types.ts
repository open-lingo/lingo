/**
 * Annotation primitive for any Japanese text we render.
 *
 * - `surface` is what appears on the baseline (kana for now, kanji in Phase 3).
 * - `reading` is the kana form. For pure-kana segments, equal to surface.
 * - `romaji` is an optional explicit override. When absent, the renderer
 *   derives it from `reading` via the kana lookup table.
 * - `role` reserved for future styling (particle highlighting, etc.).
 */
export type JapaneseAnnotation = {
  surface: string;
  reading: string;
  romaji?: string;
  role?: "word" | "particle" | "punctuation";
};
