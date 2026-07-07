/**
 * JA inflected-surface-form generator for the external-study importer
 * (Anki → atom matching). Given a dictionary-form verb/adjective ATOM, it
 * enumerates the conjugated surface forms a learner's Anki cards are likely
 * to carry (食べました, 会いましょう, 住んでいる …) so those cards credit the
 * dictionary-form atom.
 *
 * Design (per anki-import-spec-2026-07-07 §match.ts):
 *   - **Reuse, don't reinvent.** The te/ta euphonic changes (すんで not すみて,
 *     いって not いきて) and the ます-/ない-stem rules already live in the tested
 *     `conjugationEngine` — this file drives that engine rather than hand-
 *     rolling suffix concatenation (a naive "masuStem + て" would mis-generate
 *     すみて and fail 住んでいる). We add only the forms the engine has no
 *     column for: volitional ましょう, progressive ている, and て+ください.
 *   - **Generate FROM atoms, never deconjugate input.** Keys are bounded by the
 *     course's atoms.
 *   - **Group resolution:** authoritative from `VERB_ENTRIES`/`ADJ_ENTRIES`
 *     when the atom is a curriculum verb/adj; otherwise inferred from the kana
 *     ending for verbs whose gloss reads "to …". る-final verbs are ambiguous
 *     (ichidan vs godan) so we over-generate BOTH groups — extra keys are
 *     harmless for equality matching (they simply never appear in real input).
 *   - **Written (kanji) forms** are derived by leading-kana-block substitution
 *     against the atom's kanji form (same prefix-substitution contract as
 *     `conjugationTables.VerbEntry.kanji`); skipped when the stem changes shape
 *     (irregular くる→きた).
 *
 * Pure. No React, no storage.
 */
import {
  conjugateVerb,
  conjugateIAdj,
  type ChainForm,
} from "./conjugationEngine";
import {
  VERB_ENTRIES,
  ADJ_ENTRIES,
  type VerbGroup,
} from "./conjugationTables";
import type { CourseAtom } from "./courseAtoms";

/** う-row (godan) dictionary endings that are NOT ambiguous with ichidan. */
const GODAN_ENDINGS = new Set(["う", "く", "ぐ", "す", "つ", "ぬ", "ぶ", "む"]);

/** Every ChainForm the engine can produce for a verb. */
const VERB_CHAIN_FORMS: ChainForm[] = [
  "masu",
  "masu-neg",
  "masu-past",
  "masu-past-neg",
  "te",
  "ta",
  "nai",
  "tai",
  "nai-past",
  "tai-neg",
  "tai-past",
  "tai-neg-past",
];

function findVerbEntry(atom: CourseAtom): (typeof VERB_ENTRIES)[number] | undefined {
  const primaryKanji = firstKanji(atom.kanji);
  return VERB_ENTRIES.find(
    (v) =>
      v.dictionary === atom.kana ||
      (v.kanji != null && (v.kanji === primaryKanji || v.kanji === atom.kanji)),
  );
}

function findIAdjEntry(atom: CourseAtom): (typeof ADJ_ENTRIES)[number] | undefined {
  const primaryKanji = firstKanji(atom.kanji);
  return ADJ_ENTRIES.find(
    (a) =>
      a.type === "i-adj" &&
      (a.dictionary === atom.kana ||
        (a.kanji != null && (a.kanji === primaryKanji || a.kanji === atom.kanji))),
  );
}

/** The first written variant of a kanji field ("川 / 河" → "川", "見る  観る" → "見る"). */
export function firstKanji(kanji: string | undefined): string | undefined {
  if (!kanji) return undefined;
  const first = kanji
    .split("/")[0]
    .trim()
    .split(/\s+/)[0]
    .trim();
  return first || undefined;
}

function glossLooksLikeVerb(atom: CourseAtom): boolean {
  return atom.meaningEn.trim().toLowerCase().startsWith("to ");
}

/**
 * Resolve which verb group(s) to conjugate the atom as. Returns [] when the
 * atom is not a (dictionary-form) verb. An ambiguous る-ending verb with no
 * table entry yields both groups so the matcher over-generates safely.
 */
function verbGroupsFor(atom: CourseAtom): VerbGroup[] {
  const entry = findVerbEntry(atom);
  if (entry) return [entry.group];
  if (!glossLooksLikeVerb(atom)) return [];
  const last = atom.kana.slice(-1);
  if (GODAN_ENDINGS.has(last)) return ["godan"];
  if (last === "る") return ["ichidan", "godan"];
  return [];
}

/** Longest common suffix (by code unit) of two strings. */
function longestCommonSuffix(a: string, b: string): string {
  let i = 0;
  while (i < a.length && i < b.length && a[a.length - 1 - i] === b[b.length - 1 - i]) {
    i++;
  }
  return a.slice(a.length - i);
}

/**
 * Derive the written (kanji) surface form for a conjugated kana form by
 * substituting the atom's leading kanji block for its leading kana. Returns
 * null when the atom has no kanji or the stem's leading kana changed shape
 * (e.g. irregular くる→きた), in which case only the kana form is usable.
 */
function toWritten(cf: string, kanaDict: string, kanjiPrimary: string | undefined): string | null {
  if (!kanjiPrimary) return null;
  const tail = longestCommonSuffix(kanaDict, kanjiPrimary);
  const kanaPrefix = kanaDict.slice(0, kanaDict.length - tail.length);
  const kanjiBlock = kanjiPrimary.slice(0, kanjiPrimary.length - tail.length);
  if (kanaPrefix && !cf.startsWith(kanaPrefix)) return null;
  return kanjiBlock + cf.slice(kanaPrefix.length);
}

function verbKanaForms(dict: string, group: VerbGroup): string[] {
  const out: string[] = [];
  for (const form of VERB_CHAIN_FORMS) out.push(conjugateVerb(dict, group, form));
  const masu = conjugateVerb(dict, group, "masu");
  const masuStem = masu.slice(0, -2); // drop ます
  const te = conjugateVerb(dict, group, "te");
  // Forms the engine has no column for:
  out.push(masuStem + "ましょう"); // volitional (会いましょう)
  out.push(te + "いる", te + "います", te + "いた", te + "いました"); // progressive (住んでいる)
  out.push(te + "ください"); // te-request
  return out;
}

function iAdjKanaForms(dict: string): string[] {
  const neg = conjugateIAdj(dict, "negative");
  const past = conjugateIAdj(dict, "past");
  const pastNeg = conjugateIAdj(dict, "past-negative");
  const stem = dict === "いい" ? "よ" : dict.slice(0, -1);
  return [
    neg,
    past,
    pastNeg,
    dict + "です",
    neg + "です",
    past + "です",
    stem + "く", // adverbial
    stem + "くて", // te-form
  ];
}

/**
 * All inflected surface forms for an atom (kana + written), excluding the
 * plain dictionary form (that is already a base match key). Empty for atoms
 * that aren't verbs/adjectives.
 */
export function jaInflectedForms(atom: CourseAtom): string[] {
  const kanaForms: string[] = [];

  for (const group of verbGroupsFor(atom)) {
    kanaForms.push(...verbKanaForms(atom.kana, group));
  }
  if (findIAdjEntry(atom)) {
    kanaForms.push(...iAdjKanaForms(atom.kana));
  }

  if (kanaForms.length === 0) return [];

  const kanjiPrimary = firstKanji(atom.kanji);
  const out = new Set<string>();
  for (const cf of kanaForms) {
    out.add(cf);
    const written = toWritten(cf, atom.kana, kanjiPrimary);
    if (written) out.add(written);
  }
  // Never let the plain dictionary forms leak into the inflected bucket —
  // they belong to the higher-precedence kana/kanji buckets.
  out.delete(atom.kana);
  if (kanjiPrimary) out.delete(kanjiPrimary);
  return [...out];
}
