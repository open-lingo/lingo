/**
 * Search / lookup normalization ("fold").
 *
 * A single, script-universal fold — Unicode case-fold + combining-diacritic
 * strip — with NO per-language branches. It's applied identically to a query
 * and to every indexed field (surface, reading, meaning), so:
 *
 *  - ES accent + case fold: `CAFÉ` / `Café` / `cafe` all fold to `cafe`.
 *  - JA kana ↔ romaji: a romaji query matches because the entry's romanized
 *    reading (from `module.romanizer`, pre-baked onto the atom) is indexed and
 *    folded the same way — `ai` matches あい via its reading.
 *  - KO Hangul ↔ Revised-Romanization: same mechanism — `hada` matches 하다 via
 *    its RR reading, and a Hangul query matches the Hangul surface.
 *
 * NFD is only used to expose combining marks for stripping; because BOTH sides
 * of every comparison are folded, any incidental decomposition (Hangul syllable
 * → conjoining jamo, kana + dakuten) stays consistent and never breaks a match.
 *
 * This is the seam that makes the service language-agnostic: the module supplies
 * the reading, the fold is universal, so adding a language needs no change here.
 */
export function foldText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
