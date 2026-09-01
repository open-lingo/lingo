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
 * Frequency rank: the atom's explicit `freqRank` field (seeded 2026-08-26 from
 * the then-registry order — we have no corpus counts for our own backlog
 * words). Rank used to be derived from array position, which meant re-homing
 * ANY atom off "future" shifted every later atom's rank and (at 20 words per
 * module) silently moved ~1 in 20 of the remaining deck to a different unlock
 * module. Explicit ranks are stable under re-homing: a re-homed atom retires
 * its rank (gaps are fine — rank VALUE drives the bucket), a new backlog atom
 * takes max+1. `frequencyAtoms.test.ts` enforces presence + uniqueness.
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

/**
 * JA's true upper unlock bound — the last LIVE content module (m38, N4 tier).
 * Overflow ranks pile here. Was 30 until 2026-08-26 (eight modules stale: a
 * learner at m38 saw nothing new past m30). `frequencyAtoms.test.ts` ties
 * this to the live curriculum so it cannot silently go stale again.
 */
export const JA_FREQ_LAST_MODULE = 38;

function isFrequencyCandidate(atom: CourseAtom): boolean {
  return (
    atom.fromModule === "future" &&
    atom.kind === "vocab" &&
    isSrsEligibleAtom(atom)
  );
}

export const JA_FREQUENCY_ATOMS: ReadonlyArray<FrequencyAtom<JaConjugationLink>> =
  JA_COURSE_ATOMS.filter(isFrequencyCandidate)
    .map((atom) => {
      // Candidates without an explicit rank are a seeding bug — the test
      // enforces presence; sort below keeps output deterministic regardless.
      const frequencyRank = atom.freqRank ?? Number.MAX_SAFE_INTEGER;
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
        source: "freq" as const,
      };
    })
    .sort((a, b) => a.frequencyRank - b.frequencyRank);
