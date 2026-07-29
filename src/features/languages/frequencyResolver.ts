/**
 * Frequency ("optional") vocab resolver — the seam the deck builder consumes.
 *
 * Pure + testable: given a language, the learner's reached module, and the
 * opt-in flag, it returns the ids of frequency atoms that should be unlocked.
 * The deck layer unions these into the unlocked-id set (`buildEnrichedCourseDeck`)
 * so frequency cards surface as unlocked ONLY when opted-in AND module-reached —
 * with no change to lesson-driven unlocks.
 */
import type { Flashcard } from "@/features/flashcards/data/types";
import type { FrequencyAtom } from "./frequencyTypes";
import { JA_FREQUENCY_ATOMS } from "./ja/frequencyAtoms";
import { KO_FREQUENCY_ATOMS } from "./ko/frequencyAtoms";

/** Conjugation-link-agnostic view (the resolver never reads `conjugation`). */
export type AnyFrequencyAtom = FrequencyAtom<unknown>;

const REGISTRY: Record<string, ReadonlyArray<AnyFrequencyAtom>> = {
  ja: JA_FREQUENCY_ATOMS,
  ko: KO_FREQUENCY_ATOMS,
};

/** All frequency atoms for a language ([] for languages with no registry). */
export function getFrequencyAtoms(
  languageId: string,
): ReadonlyArray<AnyFrequencyAtom> {
  return REGISTRY[languageId] ?? [];
}

/**
 * Ids of frequency atoms unlocked at the learner's reached module.
 *
 * - `enabled === false` → empty set (feature off: frequency atoms never enter
 *   the deck or intake).
 * - Otherwise: every atom whose `unlockModule <= reachedModule`. Higher modules
 *   yield a superset (unlock is monotonic in `reachedModule`).
 */
export function getFrequencyUnlockedAtomIds(
  languageId: string,
  reachedModule: number,
  enabled: boolean,
): Set<string> {
  const out = new Set<string>();
  if (!enabled) return out;
  for (const atom of getFrequencyAtoms(languageId)) {
    if (atom.unlockModule <= reachedModule) out.add(atom.id);
  }
  return out;
}

/**
 * Build a deck card for a frequency atom not already present as a course card
 * (e.g. the KO seed, which has no backing course atom). JA frequency atoms
 * reuse their existing course card, so this is only hit for genuinely-new words.
 */
export function frequencyAtomToFlashcard(
  atom: AnyFrequencyAtom,
  opts?: { unlocked?: boolean },
): Flashcard {
  return {
    id: atom.id,
    front: atom.surface,
    back: atom.meaningEn,
    type: "word",
    unlocked: opts?.unlocked,
    source: "freq",
  };
}
