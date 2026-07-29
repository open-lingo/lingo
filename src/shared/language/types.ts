/**
 * Core types for the language-module contract. See:
 *
 *   - ADR-001 (Language module contract)
 *   - ADR-005 (Per-language course atom registry — atom-id naming)
 *   - ADR-011 (Optional capabilities pattern)
 *   - docs/dev/architecture/language-module-interface.md (the reference shape)
 *
 * Per open-items.md #3, `alphabetConfig` is OPTIONAL on `LanguageModule` —
 * Latin-script languages (ES/FR) won't populate it.
 *
 * Per open-items.md #5, build-time assertions are relocated to vitest;
 * curriculum files do not call assertion factories at import time.
 *
 * `GrammarHelpers` is intentionally a flat `Record<string, factory>`
 * (per open-items.md #1, deferred until Phase 6+ surfaces a stable
 * named-interface shape across 3+ languages).
 *
 * `LanguageId` includes a `(string & {})` escape so a downstream
 * `getLanguageModule(arbitraryString)` typechecks; runtime gates on
 * `getAllLanguageIds().includes(id)`.
 */

import type { LessonStep } from "@/features/lesson/types";
import type { CourseModule } from "@/shared/domain/course";
import type { ConjugationTrainerProvider } from "@/shared/conjugation/types";

// ─── Identity ────────────────────────────────────────────────────────────

export type LanguageId =
  | "en"
  | "ja"
  | "ko"
  | "es"
  | "fr"
  | "zh"
  | "ru"
  | (string & {});

export type AtomId = `${string}:${string}`;
export type ModuleId = string;
export type SymbolId = `${string}:${string}`;

/**
 * Language-shared part-of-speech taxonomy.
 *
 * Adjective nuance is language-specific: JA splits i-adjective vs na-adjective
 * (see `JaConjugationClass`), and KO treats descriptive verbs as adjectives
 * (see `KoStemClass` — the same jamo engine conjugates both). Both surface as
 * `"adjective"` here; the conjugation class carries the sub-distinction.
 *
 * `phrase` / `grammar` / `other` are legacy buckets still used by the KO atom
 * table (jamo → `other`, function bits → `grammar`, set phrases → `phrase`).
 * New JA tagging uses `expression` for set phrases/greetings.
 */
export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "particle"
  | "counter"
  | "number"
  | "pronoun"
  | "determiner"
  | "conjunction"
  | "interjection"
  | "expression"
  | "proper-noun"
  // ── legacy buckets (KO atom table) ──
  | "phrase"
  | "grammar"
  | "other";

// ─── Atom (base shape every language extends) ────────────────────────────

export interface Atom {
  /** `<lang>:<canonical-surface>` per ADR-005. */
  id: AtomId;
  languageId: LanguageId;
  surface: string;
  /** English meaning — short, one phrase. */
  gloss: string;
  partOfSpeech: PartOfSpeech;
  fromModule?: ModuleId;
  srsEligible: boolean;
}

// ─── secondScript (kanji / hanja / hanzi) ────────────────────────────────

export interface SecondScriptForm {
  glyphs: string;
  readings: string[];
}

export interface StrokePath {
  d: string;
}

export interface StrokeOrder {
  strokes: StrokePath[];
  bounds: { width: number; height: number };
}

export interface SecondScriptCapability {
  /** ZH true; JA/KO false (helper script, not load-bearing). */
  required: boolean;
  glyphMap: Map<AtomId, SecondScriptForm>;
  strokeOrderData?: Record<string, StrokeOrder>;
  /** "always" = render glyphs always; "auto" = mastery-driven; "manual" = setting. */
  unlockPolicy: "always" | "auto" | "manual";
}

// ─── readingAnnotation (furigana / pinyin / ruby) ────────────────────────

export interface AnnotationFragment {
  /** Displayed token. */
  text: string;
  /** Reading hint, rendered above (e.g. romaji over kana, pinyin over hanzi). */
  reading?: string;
  /** Symbol id for mastery-driven helper visibility lookup. */
  symbolId?: SymbolId;
  /**
   * Present on word-grouped fragments: the individual symbols contained in
   * `text` (e.g. ["が","く","せ","い"], yōon digraphs kept merged), so
   * exposure tracking stays per-symbol while `reading` carries ONE authored
   * word-level romanization rendered once above the whole word.
   */
  symbols?: string[];
}

export interface ReadingAnnotationCapability {
  /** Tokenize + annotate a string into fragments. Empty array = no annotation. */
  annotate: (token: string) => AnnotationFragment[];
  /** When true and `symbolMastery` is also configured, mastered symbols hide their helper. */
  fadeOnMastery: boolean;
}

// ─── romanizer ───────────────────────────────────────────────────────────

export interface Romanizer {
  /** Asynchronous transliteration (JA needs kuromoji morphology). */
  romanize: (token: string) => Promise<string>;
  /** Style: "romaji" (JA), "RR" (KO), "pinyin" (ZH), etc. */
  style: string;
}

// ─── conjugation ─────────────────────────────────────────────────────────

export interface ConjugationTable {
  lemmaAtomId: AtomId;
  partOfSpeech: PartOfSpeech;
  forms: Record<string, string>;
}

export interface InflectionAnalysis {
  lemma: string;
  formKey: string;
  tense?: string;
  politeness?: string;
  negation?: boolean;
}

export interface ConjugationCapability {
  tables: ConjugationTable[];
  analyze?: (surface: string) => InflectionAnalysis | null;
  /**
   * Rich trainer provider consumed by the conjugation-drill surface
   * (`features/practice/conjugation/*`). A language populates this to light up
   * the trainer; the generic UI reads it via
   * `getLanguageModule(id).conjugation?.trainer`. See
   * `shared/conjugation/types.ts` for the contract.
   */
  trainer?: ConjugationTrainerProvider;
}

// ─── classifiers (counters) ──────────────────────────────────────────────

export interface Classifier {
  id: string;
  surface: string;
  meaning: string;
  usedWith: AtomId[];
}

export interface ClassifierSet {
  classifiers: Classifier[];
}

// ─── particles ───────────────────────────────────────────────────────────

export interface ParticleExample {
  sentence: string;
  gloss: string;
}

export interface Particle {
  id: string;
  form: string;
  meaning: string;
  examples?: ParticleExample[];
}

export interface ParticleSet {
  particles: Particle[];
}

// ─── symbolMastery (per ADR-012) ─────────────────────────────────────────

export interface SymbolDef {
  id: SymbolId;
  surface: string;
  associatedAtomIds?: AtomId[];
}

export interface SymbolMasteryConfig {
  symbols: SymbolDef[];
  /** Predicate: is this character a symbol of this language's tracked script? */
  isSymbol: (ch: string) => boolean;
  masteryThreshold?: number;
  decayHalfLifeDays?: number;
}

// ─── vocabArt ────────────────────────────────────────────────────────────

export interface VocabArtResolver {
  /** Atom → image URL, or null to fall back to the generic emoji resolver. */
  resolve: (atom: Atom) => string | null;
}

// ─── ttsManifest ─────────────────────────────────────────────────────────

export type TtsManifest = Record<string, string | string[]>;

// ─── placementBank ───────────────────────────────────────────────────────

export interface PlacementItem {
  id: string;
  moduleId: ModuleId;
  build: () => LessonStep;
}

export interface PlacementBank {
  /** Stage 1 — one item per difficulty tier. */
  screener: PlacementItem[];
  /** Stage 2 — per-module pool. */
  byModule: Record<ModuleId, PlacementItem[]>;
}

// ─── alphabetConfig ──────────────────────────────────────────────────────

export interface AlphabetSection {
  id: string;
  name: string;
  characters: string[];
}

export interface AlphabetConfig {
  sections: AlphabetSection[];
  hasStrokeOrder?: boolean;
  hasComponentBreakdown?: boolean;
  characterRomanization?: Record<string, string>;
}

// ─── reading / speaking content ──────────────────────────────────────────

export interface ReadingPassage {
  id: string;
  title: string;
  text: string;
  glossEn?: string;
}

export interface SpeakingPrompt {
  id: string;
  prompt: string;
  expectedKana?: string;
}

// ─── vocabGraduation ─────────────────────────────────────────────────────

export interface GraduationAnchor {
  /** Atom surface (kana / hangul / hanzi). */
  surface: string;
  /** Optional romanization fallback. */
  romanization?: string;
  /** Optional English gloss. */
  meaning?: string;
}

export interface VocabGraduationCapability {
  /**
   * Walk the curriculum + content tables to collect every anchor atom
   * reachable from `module`. Caller dedupes by surface — return order
   * matters only for stable display.
   */
  collectAnchorsForModule: (module: CourseModule) => GraduationAnchor[];
}

// ─── import match keys (external-study import → atom) ────────────────────

/**
 * Precedence-bucketed match keys for one atom, produced by the language
 * module for the Anki-import matcher. Every string is an exact surface form
 * the matcher compares by equality (no fuzzy matching). The buckets encode
 * the matcher's precedence order: `kana` (reading==kana / expression==kana),
 * `kanji` (expression==kanji), then `expanded` (inflected forms) last.
 */
export interface ImportMatchKeys {
  /** The atom's phonetic (kana / hangul / …) surface form(s). */
  kana: string[];
  /** The atom's written (kanji / hanja) form(s), if any. */
  kanji: string[];
  /** Inflected surface forms derived FROM the atom (kana + written). */
  expanded: string[];
}

/**
 * One SRS-eligible atom exposed to the language-agnostic import matcher.
 * `atom` is passed through opaquely by the core (typed `unknown`) so
 * `match.ts` never depends on a language's concrete atom shape at runtime.
 */
export interface ImportMatchEntry {
  /** Canonical card id (`<lang>:<atom>`) — the SRS/unlock store key. */
  cardId: string;
  /** The underlying language atom; the core forwards it without inspecting it. */
  atom: unknown;
  keys: ImportMatchKeys;
}

/**
 * Optional capability (ADR-011): expose every SRS-eligible atom's import
 * match keys. Mirrors the annotate/TTS registration pattern — the matcher
 * core consumes this through `getLanguageModule(id).importMatch` and stays
 * free of per-language files.
 */
export interface ImportMatchCapability {
  getMatchEntries(): ImportMatchEntry[];
}

// ─── GrammarHelpers ──────────────────────────────────────────────────────

/** Each helper composes generic step factories into a language-idiomatic step. */
export type GrammarHelperFactory = (opts: unknown) => LessonStep;
export type GrammarHelpers = Record<string, GrammarHelperFactory>;

// ─── re-export CourseModule for module curricula ─────────────────────────

export type { CourseModule };
