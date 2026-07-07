/**
 * JA implementation of the language-agnostic import match-key capability
 * (anki-import-spec-2026-07-07 §match.ts "Language-agnostic seam"). Exposes
 * every SRS-eligible JA atom with precedence-bucketed match keys so the core
 * matcher (`features/flashcards/import/match.ts`) can credit Anki items to
 * atoms without importing any JA file directly — it reaches this through
 * `getLanguageModule("ja").importMatch`, mirroring annotate/TTS.
 *
 * Pure + memoized (keys are static for the course).
 */
import type {
  ImportMatchCapability,
  ImportMatchEntry,
  ImportMatchKeys,
} from "@/shared/language/types";
import {
  JA_COURSE_ATOMS,
  canonicalAtomId,
  isSrsEligibleAtom,
  type CourseAtom,
} from "./courseAtoms";
import { jaInflectedForms } from "./jaSurfaceForms";

/** Split a kanji field into its written variants ("川 / 河" → ["川","河"]). */
function kanjiVariants(kanji: string | undefined): string[] {
  if (!kanji) return [];
  return kanji
    .split("/")
    .flatMap((part) => part.trim().split(/\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Precedence-bucketed match keys for a single atom. */
export function getImportMatchKeys(atom: CourseAtom): ImportMatchKeys {
  return {
    kana: [atom.kana.trim()].filter(Boolean),
    kanji: kanjiVariants(atom.kanji),
    expanded: jaInflectedForms(atom),
  };
}

let _entries: ImportMatchEntry[] | null = null;

export function buildJaImportMatchEntries(): ImportMatchEntry[] {
  if (_entries == null) {
    _entries = JA_COURSE_ATOMS.filter(isSrsEligibleAtom).map((atom) => ({
      cardId: canonicalAtomId(atom),
      atom,
      keys: getImportMatchKeys(atom),
    }));
  }
  return _entries;
}

/** Test-only — drop the memoized entry list. */
export function __resetJaImportMatchEntriesForTests(): void {
  _entries = null;
}

export const jaImportMatch: ImportMatchCapability = {
  getMatchEntries: buildJaImportMatchEntries,
};
