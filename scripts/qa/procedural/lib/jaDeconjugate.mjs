/**
 * Minimal JA de-conjugator: given a bare kana SURFACE (no kanji), try to
 * recover a JMdict dictionary-form candidate for the verb/adjective it is
 * an inflected form of. Used by Q3 v3 to close the false-positive class 3
 * from `docs/procedural-qa-2026-09-17.md` §3 — "kana-only tagger parse
 * failures with no kanji anchor" (いっぽん, のまない) — WITHOUT depending
 * on the fugashi tagger's own (sometimes-wrong) segmentation for exactly
 * the cases where it is known to fail.
 *
 * This is deliberately NOT a general conjugator (the repo already has
 * one, `src/features/languages/ja/conjugationEngine.ts`, forward-only:
 * dictionary form -> inflected form, used by the Conjugation Trainer). We
 * need the INVERSE direction (surface -> dictionary form) over arbitrary
 * kana text, which that engine doesn't provide, so this is a small,
 * bounded reverse table covering exactly the endings named in the tile-
 * shrapnel/procedural-QA false-positive classes: ない/なかった negation,
 * ます-stem forms, て/た forms (with the standard onbin sound changes),
 * すぎる, volitional, and the れる/られる・せる/させる passive/causative
 * pair. Godan onbin is genuinely ambiguous for って/った and んで/んだ (three
 * candidate dictionary endings collapse to one surface) — every candidate
 * is tried and the caller (jmdictHasVerbOrAdj) picks whichever one JMdict
 * actually has.
 *
 * Standard Japanese school-grammar tables; not sourced from any single
 * copyrighted work.
 */

const U_ROW = ["う", "く", "ぐ", "す", "つ", "ぬ", "ぶ", "む", "る"];

// あ-row (nai-stem) -> dictionary う-row ending.
const A_TO_U = { わ: "う", か: "く", が: "ぐ", さ: "す", た: "つ", な: "ぬ", ば: "ぶ", ま: "む", ら: "る" };
// い-row (masu-stem) -> dictionary う-row ending.
const I_TO_U = { い: "う", き: "く", ぎ: "ぐ", し: "す", ち: "つ", に: "ぬ", び: "ぶ", み: "む", り: "る" };
// お-row (volitional stem, ichidan/godan both realize as お+う="よう"/"おう") -> dictionary う-row ending, godan only.
const O_TO_U = { お: "う", こ: "く", ご: "ぐ", そ: "す", と: "つ", の: "ぬ", ぼ: "ぶ", も: "む", ろ: "る" };

/** て/た-form onbin: stem-final syllable observed before て/で/た/だ ->
 *  candidate dictionary-form endings (godan only; ambiguous cases list
 *  more than one candidate, resolved by JMdict lookup). Ichidan/irregular
 *  are handled separately (they don't onbin). */
const ONBIN_TE = {
  いて: ["く"], // かいて -> かく (irregular: いって for いく, handled by irregular-verb special-case below)
  いで: ["ぐ"], // およいで -> およぐ
  して: ["す"], // はなして -> はなす
  って: ["う", "つ", "る"], // かって -> かう/かつ/かる (ambiguous)
  んで: ["ぬ", "ぶ", "む"], // しんで -> しぬ/しぶ/しむ (ambiguous)
};
const ONBIN_TA = {
  いた: ["く"],
  いだ: ["ぐ"],
  した: ["す"],
  った: ["う", "つ", "る"],
  んだ: ["ぬ", "ぶ", "む"],
};

/** Suffix-stripping table: `{ endings: string[], kind }`. Longer endings
 *  first within a kind so a stacked form (なかった before ない) strips the
 *  longest match. */
const NAI_ENDINGS = ["なかった", "ない"];
const MASU_ENDINGS = ["ませんでした", "ました", "ません", "ます"];
const TAI_ENDINGS = ["たくなかった", "たかった", "たくない", "たい"];
const SUGIRU_ENDINGS = ["すぎなかった", "すぎました", "すぎない", "すぎる", "すぎた", "すぎて"];
const PASSIVE_CAUSATIVE_ENDINGS = ["させられる", "られる", "せる", "させる", "れる"];
const VOLITIONAL_ICHIDAN = "よう"; // stem + よう, e.g. たべよう

/** @param {(text:string)=>boolean} existsFn — e.g. a JMdict kana-lookup. */
export function tryDeconjugate(surface, existsFn) {
  const candidates = new Set();

  // 1. ない/なかった (godan: あ-row stem; ichidan: bare stem; irregular).
  for (const end of NAI_ENDINGS) {
    if (!surface.endsWith(end)) continue;
    const stem = surface.slice(0, -end.length);
    if (stem.length === 0) continue;
    addIrregular(candidates, stem);
    addIchidan(candidates, stem);
    const last = stem.at(-1);
    if (A_TO_U[last]) candidates.add(stem.slice(0, -1) + A_TO_U[last]);
  }

  // 2. ます-stem forms (い-row stem; ichidan bare stem; irregular).
  for (const end of MASU_ENDINGS) {
    if (!surface.endsWith(end)) continue;
    const stem = surface.slice(0, -end.length);
    if (stem.length === 0) continue;
    addIrregular(candidates, stem);
    addIchidan(candidates, stem);
    const last = stem.at(-1);
    if (I_TO_U[last]) candidates.add(stem.slice(0, -1) + I_TO_U[last]);
  }

  // 3. たい (desiderative, itself い-adjective-conjugated — strip its own
  //    tail first, then the usual い-row masu-stem rule).
  for (const end of TAI_ENDINGS) {
    if (!surface.endsWith(end)) continue;
    const stem = surface.slice(0, -end.length);
    if (stem.length === 0) continue;
    addIrregular(candidates, stem);
    addIchidan(candidates, stem);
    const last = stem.at(-1);
    if (I_TO_U[last]) candidates.add(stem.slice(0, -1) + I_TO_U[last]);
  }

  // 4. すぎる "too much" (attaches to a masu-stem; すぎる itself is a
  //    JMdict aux-v entry so is ALSO checked directly as a content anchor
  //    by the caller — this branch recovers the HOST verb underneath it).
  for (const end of SUGIRU_ENDINGS) {
    if (!surface.endsWith(end)) continue;
    const stem = surface.slice(0, -end.length);
    if (stem.length === 0) continue;
    addIrregular(candidates, stem);
    addIchidan(candidates, stem);
    const last = stem.at(-1);
    if (I_TO_U[last]) candidates.add(stem.slice(0, -1) + I_TO_U[last]);
  }

  // 5. passive/causative れる/られる・せる/させる (attach to nai-stem for
  //    godan, bare stem for ichidan).
  for (const end of PASSIVE_CAUSATIVE_ENDINGS) {
    if (!surface.endsWith(end)) continue;
    const stem = surface.slice(0, -end.length);
    if (stem.length === 0) continue;
    addIrregular(candidates, stem);
    addIchidan(candidates, stem);
    const last = stem.at(-1);
    if (A_TO_U[last]) candidates.add(stem.slice(0, -1) + A_TO_U[last]);
  }

  // 6. volitional のもう／たべよう／しよう／こよう. Godan volitional is
  //    stem + (お-row mora of the verb's final consonant) + う — NOT the
  //    literal string "おう" (のむ -> のも+う, not の+おう).
  if (surface.endsWith("う") && surface.length >= 2) {
    const oRowChar = surface.at(-2);
    if (O_TO_U[oRowChar]) candidates.add(surface.slice(0, -2) + O_TO_U[oRowChar]);
  }
  if (surface.endsWith(VOLITIONAL_ICHIDAN)) {
    const stem = surface.slice(0, -VOLITIONAL_ICHIDAN.length);
    if (stem.length > 0) {
      addIrregular(candidates, stem);
      addIchidan(candidates, stem);
    }
  }

  // 7. て/た forms, WITH onbin (godan) or bare-stem+て/た (ichidan), plus
  //    いく's irregular onbin (いって/いった, not the regular いて/いた く-row
  //    rule) and する/くる's irregular forms.
  addTeTaCandidates(surface, "て", ONBIN_TE, candidates);
  addTeTaCandidates(surface, "た", ONBIN_TA, candidates);

  // 8. If the surface itself, unmodified, already exists (no ending
  //    matched — e.g. it's already a dictionary form), that's not this
  //    function's job (the caller checks the bare surface separately) but
  //    costs nothing to include.
  candidates.add(surface);

  for (const c of candidates) {
    if (existsFn(c)) return c;
  }
  return null;
}

function addIchidan(set, stem) {
  set.add(stem + "る");
}

function addIrregular(set, stem) {
  if (stem === "し") set.add("する");
  if (stem === "き" || stem === "こ") set.add("くる");
  // sahen compound verbs (べんきょうし -> べんきょうする) end in し directly.
  if (stem.endsWith("し")) set.add(stem.slice(0, -1) + "する");
}

function addTeTaCandidates(surface, marker, onbinTable, candidates) {
  // いく/いった irregular onbin: いって/いった, not いいて/いいた.
  if (marker === "て" && surface.endsWith("いって")) {
    candidates.add(surface.slice(0, -"いって".length) + "いく");
  }
  if (marker === "た" && surface.endsWith("いった")) {
    candidates.add(surface.slice(0, -"いった".length) + "いく");
  }
  for (const [onbin, dictEndings] of Object.entries(onbinTable)) {
    if (!surface.endsWith(onbin)) continue;
    const stem = surface.slice(0, -onbin.length);
    for (const dictEnding of dictEndings) candidates.add(stem + dictEnding);
  }
  // Ichidan / irregular: bare stem + て/た directly (たべて -> たべる).
  if (surface.endsWith(marker)) {
    const stem = surface.slice(0, -marker.length);
    if (stem.length > 0) {
      addIrregular(candidates, stem);
      addIchidan(candidates, stem);
    }
  }
  // する/くる irregular て/た forms: して/した, きて/きた.
  if (marker === "て" && surface.endsWith("して")) candidates.add(surface.slice(0, -2) + "する");
  if (marker === "た" && surface.endsWith("した")) candidates.add(surface.slice(0, -2) + "する");
  if (marker === "て" && surface.endsWith("きて")) candidates.add(surface.slice(0, -2) + "くる");
  if (marker === "た" && surface.endsWith("きた")) candidates.add(surface.slice(0, -2) + "くる");
}
