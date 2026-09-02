/**
 * Normalized course-atom view — the ONE cross-language read surface over
 * the per-language atom catalogs (ADR-005). Vocab browsing, the lesson
 * atom index, the course map, the command palette, and the flashcards
 * course deck all consume this shape instead of ja-gating per feature.
 *
 * Why not the registry's contract-level `Atom`? That view deliberately
 * strips the language extras these surfaces need (emoji art, atom kind,
 * ES gender, romanization). So this adapter reads the full-fidelity
 * catalogs directly and is the single sanctioned aggregation point for
 * those imports — the per-feature `JA_COURSE_ATOMS` imports it replaces
 * were the anti-pattern (see registry.ts header).
 *
 * Laziness: ES atoms come from `getEsCourseAtoms()`, a lazy accessor that
 * breaks the es courseAtoms ↔ curriculum/m{n} import cycle. It must NEVER
 * be called at module scope here — every per-language list materializes on
 * the first `getNormalizedCourseAtoms(lang)` call and is memoized.
 */
import {
  JA_COURSE_ATOMS,
  canonicalAtomId,
  isSrsEligibleAtom,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";
import {
  KO_COURSE_ATOMS,
  type KoAtom,
} from "@/features/languages/ko/courseAtoms";
import {
  getEsCourseAtoms,
  type EsAtom,
} from "@/features/languages/es/courseAtoms";
import {
  getFrCourseAtoms,
  type FrAtom,
} from "@/features/languages/fr/courseAtoms";
import { isLanguageRegistered } from "@/shared/language/registry";

/** Atom kind; `"other"` covers alphabet material (KO jamo / syllables). */
export type NormalizedAtomKind = "vocab" | "particle" | "phrase" | "other";

export type NormalizedAtom = {
  /** Canonical SRS/unlock id (`ja:biiru`, `es:cerveza`) — the store key. */
  id: string;
  languageId: string;
  /** Target-language display form (kana for JA, surface for ES/KO). */
  display: string;
  /** Short English meaning. */
  gloss: string;
  /** Secondary written form (kanji for JA), when the atom has one. */
  secondary?: string;
  /** Romanization (romaji for JA, RR for KO); Latin-script atoms omit. */
  romanization?: string;
  /** Optional emoji art carrier. */
  emoji?: string;
  /** ES grammatical gender, surfaced alongside the gloss on noun atoms. */
  gender?: "m" | "f";
  kind: NormalizedAtomKind;
  /** Source module key (`m3`, `sidequest-survival`, `future`). */
  module: string;
  /** SRS-pool eligibility (JA applies its strict single-kana rule). */
  srsEligible: boolean;
};

function fromJaAtom(atom: CourseAtom): NormalizedAtom {
  return {
    id: canonicalAtomId(atom),
    languageId: "ja",
    display: atom.kana,
    gloss: atom.meaningEn,
    secondary: atom.kanji,
    romanization: atom.romaji,
    emoji: atom.emoji,
    kind: atom.kind,
    module: atom.fromModule,
    srsEligible: isSrsEligibleAtom(atom),
  };
}

function fromKoAtom(atom: KoAtom): NormalizedAtom {
  return {
    id: atom.id,
    languageId: "ko",
    display: atom.surface,
    gloss: atom.gloss,
    romanization: atom.romanization,
    emoji: atom.emoji,
    kind:
      atom.kind === "jamo" || atom.kind === "syllable" ? "other" : atom.kind,
    // KO's atom factory maps "future" to undefined; fold it back so module
    // keys are uniform across languages (vocab sort/labels expect it).
    module: atom.fromModule ?? "future",
    srsEligible: atom.srsEligible,
  };
}

function fromEsAtom(atom: EsAtom): NormalizedAtom {
  return {
    id: atom.id,
    languageId: "es",
    display: atom.surface,
    gloss: atom.gloss,
    emoji: atom.emoji,
    gender: atom.gender,
    kind: atom.kind,
    module: atom.fromModule ?? "future",
    srsEligible: atom.srsEligible,
  };
}

function fromFrAtom(atom: FrAtom): NormalizedAtom {
  return {
    id: atom.id,
    languageId: "fr",
    display: atom.surface,
    gloss: atom.gloss,
    emoji: atom.emoji,
    gender: atom.gender,
    kind: atom.kind,
    module: atom.fromModule ?? "future",
    srsEligible: atom.srsEligible,
  };
}

function buildAtomsFor(languageId: string): NormalizedAtom[] {
  // Registry gate per ADR-005: unregistered languages read as empty, never
  // as a silent fallback onto another catalog. A registered language
  // without an adapter below is also empty until one is added here.
  if (!isLanguageRegistered(languageId)) return [];
  switch (languageId) {
    case "ja":
      return JA_COURSE_ATOMS.map(fromJaAtom);
    case "ko":
      return KO_COURSE_ATOMS.map(fromKoAtom);
    case "es":
      return getEsCourseAtoms().map(fromEsAtom);
    case "fr":
      return getFrCourseAtoms().map(fromFrAtom);
    default:
      return [];
  }
}

const atomsCache = new Map<string, ReadonlyArray<NormalizedAtom>>();
const indexCache = new Map<string, ReadonlyMap<string, NormalizedAtom>>();

/**
 * Full normalized atom catalog for a language, in curriculum authoring
 * order (m1 → mN). Memoized; empty for languages without a catalog.
 */
export function getNormalizedCourseAtoms(
  languageId: string,
): ReadonlyArray<NormalizedAtom> {
  const cached = atomsCache.get(languageId);
  if (cached) return cached;
  const built = buildAtomsFor(languageId);
  atomsCache.set(languageId, built);
  return built;
}

/** Canonical-id → atom lookup for one language. Memoized. */
export function getNormalizedAtomIndex(
  languageId: string,
): ReadonlyMap<string, NormalizedAtom> {
  const cached = indexCache.get(languageId);
  if (cached) return cached;
  const built = new Map(
    getNormalizedCourseAtoms(languageId).map((a) => [a.id, a]),
  );
  indexCache.set(languageId, built);
  return built;
}

/** Test hook — drop the memoized catalogs. */
export function __resetNormalizedAtoms(): void {
  atomsCache.clear();
  indexCache.clear();
}
