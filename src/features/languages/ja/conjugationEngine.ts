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
  | "tai-neg-past"; // たくなかった

/** い-adjective conjugated forms (present is the dictionary form itself). */
export type IAdjForm = "negative" | "past" | "past-negative";

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

type Stems = { masuStem: string; naiStem: string; te: string; ta: string };

function stemsOf(dictionary: string, group: VerbGroup): Stems {
  if (group === "ichidan") {
    const s = dictionary.slice(0, -1); // drop final る
    return { masuStem: s, naiStem: s, te: s + "て", ta: s + "た" };
  }
  if (group === "irregular") {
    if (dictionary === "くる") return { masuStem: "き", naiStem: "こ", te: "きて", ta: "きた" };
    // する family (する, べんきょうする, …): keep the prefix, swap する.
    const prefix = dictionary.slice(0, -2);
    return {
      masuStem: prefix + "し",
      naiStem: prefix + "し",
      te: prefix + "して",
      ta: prefix + "した",
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
  };
}

/**
 * Conjugate a verb to any table column OR stacked chain form.
 * `group` disambiguates ichidan/godan homographs (きる, かえる, …).
 */
export function conjugateVerb(dictionary: string, group: VerbGroup, form: ChainForm): string {
  const { masuStem, naiStem, te, ta } = stemsOf(dictionary, group);
  switch (form) {
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
  }
}
