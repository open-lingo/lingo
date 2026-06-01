/**
 * LanguageModule contract — every shipped language implements this
 * interface and registers via `shared/language/registry.ts`. ADR-001.
 *
 * **Required slots** every language populates; **optional capability
 * slots** the language opts in to per ADR-011. A `module.<capability>`
 * field that is `undefined` means the generic engine skips the relevant
 * UX entirely.
 *
 * Per open-items.md #3: `alphabetConfig` is OPTIONAL — most Latin-script
 * languages (ES/FR/EN) omit it.
 */

import type {
  Atom,
  AtomId,
  ClassifierSet,
  ConjugationCapability,
  CourseModule,
  GrammarHelpers,
  LanguageId,
  ParticleSet,
  PlacementBank,
  ReadingAnnotationCapability,
  ReadingPassage,
  Romanizer,
  SecondScriptCapability,
  SpeakingPrompt,
  SymbolMasteryConfig,
  TtsManifest,
  VocabArtResolver,
  VocabGraduationCapability,
  AlphabetConfig,
} from "./types";

export interface LanguageModule {
  // ── Required: identity + rendering ──────────────────────────────────
  id: LanguageId;
  displayName: { en: string; native: string };
  scriptFont: string;
  textDirection: "ltr" | "rtl";

  // ── Required: content spine ─────────────────────────────────────────
  curriculum: CourseModule[];
  courseAtoms: Atom[];
  grammarHelpers: GrammarHelpers;

  // ── Required: course identity ──────────────────────────────────────
  /** Canonical course id (used by progress / SRS / placement). */
  courseId: string;

  // ── Required: assets ────────────────────────────────────────────────
  ttsManifest: TtsManifest;
  vocabArt: VocabArtResolver;

  // ── Required: placement ─────────────────────────────────────────────
  placementBank: PlacementBank;

  // ── Optional capabilities (ADR-011) ────────────────────────────────
  /** Latin-script langs may omit (open-items.md #3). */
  alphabetConfig?: AlphabetConfig;
  secondScript?: SecondScriptCapability;
  readingAnnotation?: ReadingAnnotationCapability;
  romanizer?: Romanizer;
  conjugation?: ConjugationCapability;
  classifiers?: ClassifierSet;
  particles?: ParticleSet;
  symbolMastery?: SymbolMasteryConfig;
  reading?: ReadingPassage[];
  speaking?: SpeakingPrompt[];
  imageMcqBlocklist?: Set<string>;
  vocabGraduation?: VocabGraduationCapability;
}

export type { Atom, AtomId, LanguageId };
