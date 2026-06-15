/**
 * Per-module vocabulary, derived from the real curriculum atom catalogs.
 *
 * Module ids in the mock course (`m1`, `m2`, …) line up 1:1 with the
 * `fromModule` attribution on the language atom catalogs
 * (`JA_COURSE_ATOMS` / `KO_COURSE_ATOMS`), so we can surface the genuine
 * vocabulary a module introduces without inventing anything. Atoms that
 * are alphabet-only (jamo / single kana, not SRS-eligible) are excluded so
 * the count reflects real words, not letters.
 *
 * Only `ja` and `ko` carry atom catalogs today; other languages return an
 * empty list (callers omit the vocab line rather than fake it).
 */
import {
  JA_COURSE_ATOMS,
  isSrsEligibleAtom,
} from "@/features/languages/ja/courseAtoms";
import { KO_COURSE_ATOMS } from "@/features/languages/ko/courseAtoms";

/** A single surfaced vocab entry — the surface form plus its English gloss. */
export type ModuleVocabEntry = {
  /** Surface form (kana for JA, Hangul for KO). */
  label: string;
  /** Short English meaning. */
  meaning: string;
};

function jaVocabByModule(): Map<string, ModuleVocabEntry[]> {
  const out = new Map<string, ModuleVocabEntry[]>();
  for (const atom of JA_COURSE_ATOMS) {
    if (atom.kind === "particle") continue;
    if (!isSrsEligibleAtom(atom)) continue;
    const mod = atom.fromModule;
    if (!mod || mod === "future" || mod.startsWith("sidequest")) continue;
    const list = out.get(mod) ?? [];
    list.push({ label: atom.kana, meaning: atom.meaningEn });
    out.set(mod, list);
  }
  return out;
}

function koVocabByModule(): Map<string, ModuleVocabEntry[]> {
  const out = new Map<string, ModuleVocabEntry[]>();
  for (const atom of KO_COURSE_ATOMS) {
    if (atom.kind === "jamo" || atom.kind === "syllable") continue;
    if (atom.srsEligible === false) continue;
    const mod = atom.fromModule;
    if (!mod || mod.startsWith("sidequest")) continue;
    const list = out.get(mod) ?? [];
    list.push({ label: atom.surface, meaning: atom.gloss });
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
  const built =
    languageId === "ja"
      ? jaVocabByModule()
      : languageId === "ko"
        ? koVocabByModule()
        : new Map<string, ModuleVocabEntry[]>();
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
