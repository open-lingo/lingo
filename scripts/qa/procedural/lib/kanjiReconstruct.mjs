/**
 * Kana -> kanji reconstruction for feeding the JA lexical sidecar, per the
 * mitigation in `docs/tile-shrapnel-2026-09-17.md` §1 / `sidecar.py`'s doc
 * comment: run the tagger on the KANJI surface when one is available, and
 * treat the course lexicon as an OVERRIDE dictionary (an exact-match known
 * word substitutes as one unit, kanji or not — it never gets re-split by
 * the tagger's own opinion).
 *
 * Builds a reconstructed string from an ordered tile list by substituting
 * each tile's course-atom kanji spelling (exact `display` match; falls back
 * to the tile's own kana when the tile isn't a registered atom or the atom
 * has no kanji `secondary`), and returns the offset span of each tile
 * within that reconstructed string so a caller can map tagger token offsets
 * back onto tiles.
 */

/** `atoms` is `getNormalizedCourseAtoms('ja')`'s array (`lib/lexicon.mjs`). */
export function buildKanjiIndex(atoms) {
  const byKana = new Map();
  for (const a of atoms) {
    if (a.secondary && !byKana.has(a.display)) byKana.set(a.display, a.secondary);
  }
  return byKana;
}

/**
 * @param {string[]} tiles
 * @param {Map<string,string>} kanjiIndex  from `buildKanjiIndex`
 * @returns {{text: string, spans: {start:number, end:number, tile:string, tileIndex:number}[]}}
 */
export function reconstruct(tiles, kanjiIndex) {
  let text = "";
  const spans = [];
  tiles.forEach((tile, tileIndex) => {
    const display = kanjiIndex.get(tile) ?? tile;
    const start = text.length;
    text += display;
    spans.push({ start, end: text.length, tile, tileIndex });
  });
  return { text, spans };
}

/** Attribute each tagger token to the tile span it overlaps MOST (by
 *  character count); a token that straddles two tile spans equally goes to
 *  the earlier one. Returns `Map<tileIndex, token[]>`. */
export function attributeTokensToTiles(tokens, spans) {
  const byTile = new Map(spans.map((s) => [s.tileIndex, []]));
  for (const tok of tokens) {
    let best = null;
    let bestOverlap = 0;
    for (const span of spans) {
      const overlap = Math.min(tok.end, span.end) - Math.max(tok.start, span.start);
      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        best = span;
      }
    }
    if (best) byTile.get(best.tileIndex).push(tok);
  }
  return byTile;
}

/** UniDic pos1 tags that are function/attachable, never counted as content
 *  morphemes: particles (all subtypes, including 接続助詞 for ので/けど —
 *  see doc), auxiliary verbs (ます/です/ない/た endings), and punctuation. */
const FUNCTION_POS1 = new Set(["助詞", "助動詞", "補助記号", "記号", "接尾辞"]);

export function isContentToken(tok) {
  return !FUNCTION_POS1.has(tok.pos1);
}
