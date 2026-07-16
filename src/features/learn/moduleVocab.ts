/**
 * Per-module vocabulary, derived from the real curriculum atom catalogs.
 *
 * Module ids in the mock course (`m1`, `m2`, …) line up 1:1 with the
 * module attribution on the normalized atom view (`normalizedAtoms.ts`),
 * so we can surface the genuine vocabulary a module introduces without
 * inventing anything. Atoms that are alphabet-only (jamo / single kana,
 * not SRS-eligible) are excluded so the count reflects real words, not
 * letters.
 *
 * Languages without an atom catalog return an empty list (callers omit
 * the vocab line rather than fake it).
 */
import { getNormalizedCourseAtoms } from "@/features/lesson/data/normalizedAtoms";

/** A single surfaced vocab entry — the surface form plus its English gloss. */
export type ModuleVocabEntry = {
  /** Surface form (kana for JA, Hangul for KO, the word itself for ES). */
  label: string;
  /** Short English meaning. */
  meaning: string;
};

function vocabByModule(languageId: string): Map<string, ModuleVocabEntry[]> {
  const out = new Map<string, ModuleVocabEntry[]>();
  for (const atom of getNormalizedCourseAtoms(languageId)) {
    if (!atom.srsEligible) continue;
    // Alphabet material (KO jamo / syllables) is trainer territory.
    if (atom.kind === "other") continue;
    // JA lists words only; KO/ES surface their function words too (the KO
    // map has always included particles — ES matches it).
    if (languageId === "ja" && atom.kind === "particle") continue;
    const mod = atom.module;
    if (!mod || mod === "future" || mod.startsWith("sidequest")) continue;
    const list = out.get(mod) ?? [];
    list.push({ label: atom.display, meaning: atom.gloss });
    out.set(mod, list);
  }
  return out;
}

const cache = new Map<string, Map<string, ModuleVocabEntry[]>>();

/** Memoized vocab-by-module index for one language. */
export function getVocabByModule(
  languageId: string,
): Map<string, ModuleVocabEntry[]> {
  const cached = cache.get(languageId);
  if (cached) return cached;
  const built = vocabByModule(languageId);
  cache.set(languageId, built);
  return built;
}

/** Vocab entries a single module introduces (empty if none attributed). */
export function getModuleVocab(
  languageId: string,
  moduleId: string,
): ModuleVocabEntry[] {
  return getVocabByModule(languageId).get(moduleId) ?? [];
}

/** Total attributed vocab across the whole course for a language. */
export function getCourseVocabCount(languageId: string): number {
  let total = 0;
  for (const list of getVocabByModule(languageId).values()) {
    total += list.length;
  }
  return total;
}

/** Test hook — drop the memoized index. */
export function __resetModuleVocab(): void {
  cache.clear();
}
