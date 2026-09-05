/**
 * Where does a kana WORD sit inside a course sentence — or is it only a
 * substring of some other word?
 *
 * `String#includes` was the miner's and the kanji-cloze builder's only test,
 * and Japanese has no word spaces to save it: に sat inside なに, せん inside
 * すみません, いえ inside いいえ, しろい inside おもしろい. TestFlight #11
 * (2026-09-05) was the learner being asked to complete な＿を やる with 二.
 * A probe over the switchover corpus found 51 of 136 mined sentences wrong
 * the same way.
 *
 * Course sentences are bunsetsu-segmented by spaces, so a word occurrence is
 * real when it starts at a segment boundary and is followed by a segment
 * boundary or by something that glues to a word: a particle or a copula
 * ending. Anything else is a different word. Every occurrence is tried so a
 * bad first hit never hides a clean later one.
 */

const BOUNDARY = "\\s。、！？!?「」『』（）()・…";
const LEFT_BOUNDARY = new RegExp(`[${BOUNDARY}]`);
const GLUE =
  "を|は|が|に|で|と|も|の|へ|や|か|ね|よ|な|から|まで|より|だ|です|でした|だった|じゃ|だけ|かな|って";
const RIGHT_OK = new RegExp(`^(?:${GLUE})*(?:$|[${BOUNDARY}])`);

/** Index of `kana` as a whole word in `text`, or -1. */
export function findWordSpan(text: string, kana: string): number {
  if (!kana) return -1;
  let from = 0;
  for (;;) {
    const at = text.indexOf(kana, from);
    if (at === -1) return -1;
    const leftOk = at === 0 || LEFT_BOUNDARY.test(text[at - 1]!);
    const rightOk = RIGHT_OK.test(text.slice(at + kana.length));
    if (leftOk && rightOk) return at;
    from = at + 1;
  }
}

/** Does `text` use `kana` as a word (not merely contain the characters)? */
export function usesWord(text: string, kana: string): boolean {
  return findWordSpan(text, kana) !== -1;
}
