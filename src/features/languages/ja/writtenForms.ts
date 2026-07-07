/**
 * Written-form (kanji + furigana) derivation for conjugation drills.
 *
 * Conjugation only ever changes a word's ENDING, so the written form of any
 * conjugated word is derivable from its kanji dictionary form by prefix
 * substitution: the kanji block replaces the same NUMBER of leading kana in
 * every form. This length-preservation even survives 来る's reading changes —
 * くる/こない/きた all spend exactly one kana on 来 (来る・来[こ]ない・来[き]た).
 *
 * Contract on `kanji` fields (enforced by writtenForms.test.ts): a leading
 * kanji block + a kana tail identical to the kana dictionary form's tail.
 * Mid-word kanji is not representable — such words omit the field and render
 * in kana.
 */

export type RubySegment = {
  text: string;
  /** Furigana reading — present only on the kanji segment. */
  ruby?: string;
};

const HAN_RE = /\p{Script=Han}/u;

/**
 * Split a conjugated kana word into written segments using the entry's kana +
 * kanji dictionary forms. Returns a single plain segment (no ruby) when there
 * is no kanji form or the shapes don't match the contract — rendering safely
 * degrades to kana.
 */
export function writtenSegments(
  kanaDictionary: string,
  kanjiDictionary: string | undefined,
  conjugated: string,
): RubySegment[] {
  if (!kanjiDictionary || kanjiDictionary === kanaDictionary || !HAN_RE.test(kanjiDictionary)) {
    return [{ text: conjugated }];
  }
  // Longest common suffix of the two dictionary forms = the okurigana tail.
  let suffix = 0;
  while (
    suffix < kanaDictionary.length &&
    suffix < kanjiDictionary.length &&
    kanaDictionary[kanaDictionary.length - 1 - suffix] ===
      kanjiDictionary[kanjiDictionary.length - 1 - suffix]
  ) {
    suffix++;
  }
  const kanaPrefixLen = kanaDictionary.length - suffix;
  const kanjiPrefix = kanjiDictionary.slice(0, kanjiDictionary.length - suffix);
  // Degenerate shapes (no kana replaced, or the conjugated form is shorter
  // than the reading) → plain kana.
  if (kanaPrefixLen <= 0 || kanjiPrefix.length === 0 || conjugated.length <= kanaPrefixLen) {
    return [{ text: conjugated }];
  }
  return [
    { text: kanjiPrefix, ruby: conjugated.slice(0, kanaPrefixLen) },
    { text: conjugated.slice(kanaPrefixLen) },
  ];
}
