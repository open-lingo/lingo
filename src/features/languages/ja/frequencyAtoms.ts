/**
 * Japanese frequency ("optional") vocabulary.
 *
 * Derived — not hand-authored — from the `fromModule: "future"` entries in
 * `JA_COURSE_ATOMS`: the N5/backlog words the curriculum already tags + POS-
 * marks but no authored lesson surfaces yet. They keep their canonical atom id
 * (`ja:<id>`), so a JA frequency card IS the existing (locked) course-deck card
 * for that atom — enabling the feature flips its unlock flag, it does not mint
 * a duplicate.
 *
 * Frequency rank: we have no corpus counts for our own backlog words, so we use
 * the honest proxy — the atom's position in the curriculum registry among the
 * "future" vocab atoms. The registry is roughly authored foundational-first, so
 * earlier entries are treated as higher-frequency (earlier unlock). Deterministic
 * and stable as long as the registry order is stable.
 *
 * Filtered to real single words: `kind: "vocab"` only (drops authored sentence
 * "phrase" atoms) and SRS-eligible only (drops alphabet-trainer single-kana
 * atoms) — same gate the course deck applies, so every JA frequency atom is
 * guaranteed to already be a course-deck card.
 */
import {
  JA_COURSE_ATOMS,
  canonicalAtomId,
  isSrsEligibleAtom,
  type CourseAtom,
  type JaConjugationLink,
} from "./courseAtoms";
import {
  frequencyRankToModule,
  type FrequencyAtom,
} from "../frequencyTypes";

/** JA has 30 content modules — its true upper unlock bound. */
export const JA_FREQ_LAST_MODULE = 30;

function isFrequencyCandidate(atom: CourseAtom): boolean {
  return (
    atom.fromModule === "future" &&
    atom.kind === "vocab" &&
    isSrsEligibleAtom(atom)
  );
}

export const JA_FREQUENCY_ATOMS: ReadonlyArray<FrequencyAtom<JaConjugationLink>> =
  JA_COURSE_ATOMS.filter(isFrequencyCandidate).map((atom, i) => {
    const frequencyRank = i + 1;
    return {
      id: canonicalAtomId(atom),
      surface: atom.kana,
      reading: atom.romaji,
      meaningEn: atom.shortGloss ?? atom.meaningEn,
      pos: atom.pos,
      frequencyRank,
      unlockModule: frequencyRankToModule(frequencyRank, {
        lastModule: JA_FREQ_LAST_MODULE,
      }),
      conjugation: atom.conjugation,
      source: "freq",
    };
  });
