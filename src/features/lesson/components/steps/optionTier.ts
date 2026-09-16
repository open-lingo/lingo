/**
 * WHICH OPTION TIER a grid of answers renders at — one rule, every step view.
 *
 * Phase 2B of the 2026-09-16 device sweep. `Tile` (`../tiles/Tile.tsx`) owns
 * the geometry of each tier; this file owns the ONE decision a view is still
 * allowed to make — which tier a given set of options is. It exists because
 * that decision was duplicated: `MultipleChoiceStepView` had an 8-character
 * cap, `WordImageMcqStepView` had its own `clamp(1rem, 17cqw, 1.5rem)` fit
 * system, `ListeningComprehensionStepView` had nothing at all, and each one
 * drifted separately. A view now calls `pickOptionSize(texts)` and passes the
 * result straight to `<Tile size={…}>`; it never picks a padding or a font.
 *
 * THE RULE, and why each half of it is there:
 *
 *   A grid is a WORD grid when no option contains whitespace. Not when every
 *   option is short. The character cap that used to gate this demoted a 2×2
 *   grid of single Japanese words to the left-aligned `sentence` prose tier
 *   the moment one option was 9+ characters (`ありがとうございます` is 10), and
 *   prose wraps mid-word — TestFlight #156, measured at 1 of 4 options wrapped
 *   at 100% and 2 of 4 at 125%/140% on `ja-m3-neo-5?step=12`. A long single
 *   word is still a word: the `word` tier centres it and shrinks it toward its
 *   own FIT floor before it is allowed to wrap, which is the order Spencer
 *   asked for ("shrinking the font size floor is preferred").
 *
 *   The cap that REMAINS is a sanity cap, deliberately well above anything
 *   authored (longest single-token option in the four shipped courses: 12
 *   glyphs JA/KO, 17 Latin). Past it, the "word" is a mis-authored sentence
 *   with its spaces eaten and prose is the safer render. Wide scripts (kana,
 *   kanji, hangul) take the lower cap because their glyphs are ~1em where
 *   Latin is ~0.5em, so 16 wide and 24 Latin are about the same ink.
 *
 *   One tier for the WHOLE grid, decided by the longest option — never per
 *   option. A per-option decision is what put a 5xl kana beside a text-xl
 *   3-mora word and "looked broken" (Spencer 2026-05-17), and it is #137
 *   ("the height of every tile should be the same") one grid at a time.
 */
import type { TileSize } from "../tiles/Tile";

/** Kana, kanji, CJK punctuation, hangul — the ~1em-per-glyph scripts. */
const WIDE_SCRIPT =
  /[\u1100-\u11ff\u3000-\u303f\u3040-\u30ff\u3130-\u318f\u3400-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/;

/** Sanity caps — see the header. Not a layout number: a mis-authoring guard. */
export const SINGLE_WORD_MAX_WIDE = 16;
export const SINGLE_WORD_MAX_LATIN = 24;

/** Is this one token — no whitespace, and not absurdly long for its script? */
export function isSingleWordOption(raw: string): boolean {
  const text = raw.trim();
  if (!text) return false;
  if (/\s/.test(text)) return false;
  return text.length <= (WIDE_SCRIPT.test(text) ? SINGLE_WORD_MAX_WIDE : SINGLE_WORD_MAX_LATIN);
}

/** Every option is a single token → this grid renders as centred word cards. */
export function allSingleWordOptions(texts: readonly string[]): boolean {
  return texts.length > 0 && texts.every(isSingleWordOption);
}

/**
 * The tier for a grid of answer options.
 *
 * `word-glyph` — every option is ≤2 glyphs (the alphabet drill).
 * `word`       — a word-only grid with a 3+-glyph option.
 * `glyph`      — reserved for a ≤2-glyph option inside a MIXED grid; that one
 *                is per-option by design and stays with the caller that needs
 *                it (`MultipleChoiceStepView`), because it is the one case
 *                where a single tile legitimately differs from its siblings.
 * `sentence`   — prose. Left-aligned, wraps, never told `nowrap`.
 */
export function pickOptionSize(texts: readonly string[]): Extract<
  TileSize,
  "sentence" | "word" | "word-glyph"
> {
  if (!allSingleWordOptions(texts)) return "sentence";
  return texts.some((t) => t.trim().length > 2) ? "word" : "word-glyph";
}
