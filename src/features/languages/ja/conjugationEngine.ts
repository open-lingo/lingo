/**
 * Rule-based Japanese conjugation engine (v1.1). Pure functions, no React.
 *
 * Ground-truthed against the hand-authored `VERB_ENTRIES` / `ADJ_ENTRIES`
 * tables (`conjugationEngine.test.ts` loops over every table cell). The tables
 * are the fixture: if the engine and a table value ever disagree, the table is
 * authoritative (curriculum data is owner-reviewed).
 *
 * Beyond the table's stored columns the engine also produces the STACKED chain
 * forms the trainer drills (なかった / たくない / たかった / たくなかった …),
 * which have no table column — the engine is their single source of truth.
 */
import type { VerbGroup } from "./conjugationTables";

export type ChainForm =
  | "masu"
  | "masu-neg"
  | "masu-past"
  | "masu-past-neg"
  | "te"
  | "ta"
  | "nai"
  | "tai"
  | "nai-past" // なかった   (nai chain: ない → なかった)
  | "tai-neg" // たくない   (tai conjugates as an い-adjective)
  | "tai-past" // たかった
  | "tai-neg-past" // たくなかった
  | "volitional" // のもう／たべよう／しよう／こよう — "let's …"
  | "ba" // のめば／たべれば／すれば／くれば — "if …"
  | "potential" // のめる／たべられる／できる／こられる — "can …" (m24)
  | "tara" // のんだら／たべたら／したら／きたら — "if/when …" (m32)
  | "imperative" // のめ／たべろ／しろ／こい — blunt command form (UNTAUGHT — see provider.ts FREE_DRILL_VERB_FORM_MODULE)
  | "prohibitive" // のむな／たべるな／するな／くるな — "don't …" (UNTAUGHT)
  | "causative" // のませる／たべさせる／させる／こさせる — "make/let …" (UNTAUGHT)
  | "passive"; // のまれる／たべられる／される／こられる — "is …-ed" (UNTAUGHT)

/** い-adjective conjugated forms (present is the dictionary form itself). */
export type IAdjForm = "negative" | "past" | "past-negative" | "ba";

/** Unambiguous display labels — chains disambiguate tense/polarity. */
export const CHAIN_FORM_LABELS: Record<ChainForm, string> = {
  masu: "ます form",
  "masu-neg": "ません",
  "masu-past": "ました",
  "masu-past-neg": "ませんでした",
  te: "て form",
  ta: "た form",
  nai: "ない form",
  tai: "たい form",
  "nai-past": "ない form (past)",
  "tai-neg": "たい form (negative)",
  "tai-past": "たい form (past)",
  "tai-neg-past": "たい form (negative past)",
  volitional: "volitional form (let's)",
  ba: "ば form (if)",
  potential: "potential form (can)",
  tara: "たら form (if/when)",
  imperative: "imperative form (command)",
  prohibitive: "prohibitive form (don't)",
  causative: "causative form (make/let)",
  passive: "passive form (is done to)",
};

/**
 * Display labels for the い-adjective cells (m12 / spine s09). Deliberately
 * NOT merged into `CHAIN_FORM_LABELS`: the two form vocabularies are
 * disjoint namespaces keyed off the transform card's CLASS ("i-adj" vs a
 * VerbGroup), and merging them would let a verb card resolve an adjective
 * label. The trailing " form" also keeps the label out of the kana-only
 * provenance projection (`kanaSurfaces`) — a bare "くない" would read as a
 * taught surface on every ramp card.
 */
export const IADJ_FORM_LABELS: Record<IAdjForm, string> = {
  negative: "くない form",
  past: "かった form",
  "past-negative": "くなかった form",
  ba: "ければ form (if)",
};

// う-row kana → い-row (ます-stem) and → あ-row (ない-stem).
const U_TO_I: Record<string, string> = {
  う: "い",
  く: "き",
  ぐ: "ぎ",
  す: "し",
  つ: "ち",
  ぬ: "に",
  ぶ: "び",
  む: "み",
  る: "り",
};
const U_TO_A: Record<string, string> = {
  う: "わ", // exception: う → わ, not あ
  く: "か",
  ぐ: "が",
  す: "さ",
  つ: "た",
  ぬ: "な",
  ぶ: "ば",
  む: "ま",
  る: "ら",
};
// う-row kana → お-row (volitional stem). No う → わ exception here: かう →
// かおう, not かわおう — the exception is nai-only.
const U_TO_O: Record<string, string> = {
  う: "お",
  く: "こ",
  ぐ: "ご",
  す: "そ",
  つ: "と",
  ぬ: "の",
  ぶ: "ぼ",
  む: "も",
  る: "ろ",
};
// う-row kana → え-row (ば-stem). No う → わ exception here either — かう →
// かえば, not かわえば; the exception is nai-only.
const U_TO_E: Record<string, string> = {
  う: "え",
  く: "け",
  ぐ: "げ",
  す: "せ",
  つ: "て",
  ぬ: "ね",
  ぶ: "べ",
  む: "め",
  る: "れ",
};

/** Godan て/た euphonic change. `past` selects た/だ over て/で. */
function godanEuphonic(dictionary: string, past: boolean): string {
  // いく is the classic irregular: いって / いった (not the general く rule).
  if (dictionary === "いく") return dictionary.slice(0, -1) + (past ? "った" : "って");
  const last = dictionary.slice(-1);
  const base = dictionary.slice(0, -1);
  if (last === "う" || last === "つ" || last === "る") return base + (past ? "った" : "って");
  if (last === "む" || last === "ぶ" || last === "ぬ") return base + (past ? "んだ" : "んで");
  if (last === "く") return base + (past ? "いた" : "いて");
  if (last === "ぐ") return base + (past ? "いだ" : "いで");
  if (last === "す") return base + (past ? "した" : "して");
  return base + (past ? "った" : "って");
}

type Stems = {
  masuStem: string;
  naiStem: string;
  te: string;
  ta: string;
  volitional: string;
  ba: string;
  /** m24: う-verbs slide to the え-row + る; る-verbs attach られる; くる →
   *  こられる; する has no potential of its own and uses できる. */
  potential: string;
  /** UNTAUGHT (no module teaches it yet — see provider.ts). う-verbs slide to
   *  the え-row (no extra kana); る-verbs drop る + ろ; くる → こい; する →
   *  しろ. くれる is the one hand-authored exception: くれ, not くれろ. */
  imperative: string;
  /** UNTAUGHT. あ-row (naiStem) + せる for う-verbs and る-verbs alike (the
   *  ichidan case collapses to naiStem === dictionary-minus-る); くる → こさせる
   *  (also naiStem + させる); する is the one suppletive exception — させる,
   *  not "しさせる" — because causative/passive both use a さ-stem that
   *  nothing else in this table exposes. */
  causative: string;
  /** UNTAUGHT. あ-row (naiStem) + れる, same shape as causative; くる →
   *  こられる (naiStem + られる); する → される (suppletive さ-stem, same
   *  exception as causative). Ichidan's naiStem + られる is BYTE-IDENTICAL to
   *  potential for every ichidan verb and for くる — that's not a bug, it's
   *  genuine Japanese (られる is ambiguous between the two
   *  readings for those verbs). formationDistractors.ts relies on this: it
   *  never hand-crafts "the other reading" as a wrong option, so the natural
   *  dedupe (a distractor equal to `correct` is dropped) keeps a passive
   *  question from ever offering its own correct answer as a decoy, and
   *  vice versa for potential. */
  passive: string;
};

function stemsOf(dictionary: string, group: VerbGroup): Stems {
  if (group === "ichidan") {
    const s = dictionary.slice(0, -1); // drop final る
    return {
      masuStem: s,
      naiStem: s,
      te: s + "て",
      ta: s + "た",
      volitional: s + "よう",
      ba: s + "れば",
      potential: s + "られる",
      // くれる is the one hand-authored exception: くれ, not the regular くれろ.
      imperative: dictionary === "くれる" ? "くれ" : s + "ろ",
      causative: s + "させる",
      passive: s + "られる", // byte-identical to potential — see Stems.passive doc
    };
  }
  if (group === "irregular") {
    if (dictionary === "くる")
      return {
        masuStem: "き",
        naiStem: "こ",
        te: "きて",
        ta: "きた",
        volitional: "こよう",
        ba: "くれば",
        potential: "こられる",
        imperative: "こい",
        causative: "こさせる",
        passive: "こられる", // byte-identical to potential — see Stems.passive doc
      };
    // する family (する, べんきょうする, …): keep the prefix, swap する.
    const prefix = dictionary.slice(0, -2);
    return {
      masuStem: prefix + "し",
      naiStem: prefix + "し",
      te: prefix + "して",
      ta: prefix + "した",
      volitional: prefix + "しよう",
      ba: prefix + "すれば",
      potential: prefix + "できる",
      imperative: prefix + "しろ",
      // Suppletive さ-stem — NOT prefix + naiStem + せる/れる (that would give
      // "しせる"/"しれる", which are wrong). Causative/passive are the one
      // place する's stem isn't し.
      causative: prefix + "させる",
      passive: prefix + "される",
    };
  }
  // godan
  const last = dictionary.slice(-1);
  const base = dictionary.slice(0, -1);
  const masuStem = base + (U_TO_I[last] ?? last);
  // ある → ない is suppletive (the nai-stem is empty so naiStem + ない = ない).
  const naiStem = dictionary === "ある" ? "" : base + (U_TO_A[last] ?? last);
  return {
    masuStem,
    naiStem,
    te: godanEuphonic(dictionary, false),
    ta: godanEuphonic(dictionary, true),
    volitional: base + (U_TO_O[last] ?? last) + "う",
    ba: base + (U_TO_E[last] ?? last) + "ば",
    potential: base + (U_TO_E[last] ?? last) + "る",
    // え-row, no extra kana (行く → 行け, not 行けろ).
    imperative: base + (U_TO_E[last] ?? last),
    causative: naiStem + "せる",
    passive: naiStem + "れる",
  };
}

/**
 * Conjugate a verb to any table column OR stacked chain form.
 * `group` disambiguates ichidan/godan homographs (きる, かえる, …).
 */
export function conjugateVerb(dictionary: string, group: VerbGroup, form: ChainForm): string {
  const { masuStem, naiStem, te, ta, volitional, ba, potential, imperative, causative, passive } =
    stemsOf(dictionary, group);
  switch (form) {
    case "potential":
      return potential;
    case "tara":
      // たら = plain past + ら, every class (m32: "take たべた, add ら").
      return ta + "ら";
    case "imperative":
      return imperative;
    case "prohibitive":
      // 〜な attaches straight to the plain dictionary form for every class —
      // no stem change, the one form in this file that needs none.
      return dictionary + "な";
    case "causative":
      return causative;
    case "passive":
      return passive;
    case "masu":
      return masuStem + "ます";
    case "masu-neg":
      return masuStem + "ません";
    case "masu-past":
      return masuStem + "ました";
    case "masu-past-neg":
      return masuStem + "ませんでした";
    case "te":
      return te;
    case "ta":
      return ta;
    case "nai":
      return naiStem + "ない";
    case "nai-past":
      return naiStem + "なかった";
    case "tai":
      return masuStem + "たい";
    case "tai-neg":
      return masuStem + "たくない";
    case "tai-past":
      return masuStem + "たかった";
    case "tai-neg-past":
      return masuStem + "たくなかった";
    case "volitional":
      return volitional;
    case "ba":
      return ba;
  }
}

/**
 * Conjugate an い-adjective. Handles the いい → よ- suppletive stem; every other
 * い-adjective drops the final い and appends the regular ending.
 */
export function conjugateIAdj(dictionary: string, form: IAdjForm): string {
  if (dictionary === "いい") {
    switch (form) {
      case "negative":
        return "よくない";
      case "past":
        return "よかった";
      case "past-negative":
        return "よくなかった";
      case "ba":
        return "よければ";
    }
  }
  const stem = dictionary.slice(0, -1); // drop final い
  switch (form) {
    case "negative":
      return stem + "くない";
    case "past":
      return stem + "かった";
    case "past-negative":
      return stem + "くなかった";
    case "ba":
      return stem + "ければ";
  }
}
