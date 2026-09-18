/**
 * Near-miss detector: ようとした (the attempt itself, may not have
 * happened) vs てみた (did it, to find out) — TestFlight #200/#201, b30.
 *
 * Spencer, #200 (translate step, "I was going to go to the library, but I
 * didn't have time" keyed on としょかんに いこうとした…): "doesn't this
 * imply the result happened? ... They are directly answering what
 * happened, no 'mystery' in their attempt." #201: "the distinction between
 * this and mita needs better explaining."
 *
 * English "tried to X" flattens both aspects into one phrase, so a learner
 * who knows the verb but not yet this distinction often answers a
 * ようとした-keyed translate step with the てみた form of the SAME verb —
 * 図書館に行ってみた for a sentence that needs 図書館に行こうとした. That's
 * wrong, but it's a different KIND of wrong than a random miss, and worth
 * naming instead of only listing accepted answers (decision #3).
 *
 * Table-scoped to the verbs m34 actually teaches this way — extend it as
 * more ようとする content ships (grep `you-to-suru` in the JA IR for the
 * source sentences). Deliberately NOT a general conjugator: the volitional
 * stem's te-form is irregular per verb class (いく → いって, is not the
 * u-verb's usual pattern), so a derived-on-the-fly version would need the
 * same table anyway.
 */

/** volitional stem (the `〜(よ/お)う` piece that precedes とした in an
 *  accepted answer) → that same verb's てみた form. */
const VOLITIONAL_TO_TEMITA: ReadonlyMap<string, string> = new Map([
  ["あけよう", "あけてみた"], // あける — open
  ["のもう", "のんでみた"], // のむ — drink
  ["いこう", "いってみた"], // いく — go
  ["たべよう", "たべてみた"], // たべる — eat
  ["はじめよう", "はじめてみた"], // はじめる — start
  ["だそう", "だしてみた"], // だす — take out
  ["やめよう", "やめてみた"], // やめる — quit
  ["かけよう", "かけてみた"], // かける — make a call
]);

/**
 * True when `acceptedAnswers` is keyed on ようとした for one of the table's
 * verbs AND `inputKana` (the learner's kana-normalized submission — kanji
 * already converted, whitespace not required to be stripped) contains that
 * same verb's てみた form. Used to swap the generic "Not quite" feedback
 * for a one-line explanation of WHY, not just a wrong-answer list.
 *
 * Deliberately a table lookup, not a regex extraction: the volitional
 * ending is NOT always the literal substring "よう" — godan verbs land on
 * whichever お-row mora corresponds to their final kana (のむ → のもう,
 * いく → いこう, だす → だそう; only ichidan verbs like たべる/あける
 * literally end in よう). Matching against the table's own known stems
 * sidesteps reconstructing that rule.
 */
export function isYouToSuruTemitaNearMiss(
  acceptedAnswers: readonly string[],
  inputKana: string,
): boolean {
  const input = inputKana.replace(/\s/g, "");
  for (const a of acceptedAnswers) {
    const accepted = a.replace(/\s/g, "");
    for (const [stem, temita] of VOLITIONAL_TO_TEMITA) {
      if (accepted.includes(`${stem}とした`) && input.includes(temita)) return true;
    }
  }
  return false;
}

/** The one-line why, shown in place of (not just alongside) the generic
 *  accepted-answers list when `isYouToSuruTemitaNearMiss` fires. */
export const YOU_TO_SURU_TEMITA_NEAR_MISS_MESSAGE =
  "てみた means you did it; this sentence needs ようとした — you were going to, and didn't.";
