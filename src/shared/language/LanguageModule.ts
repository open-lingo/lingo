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

import type { AccentPolicy } from "@/shared/speech/loose-match";
import type {
  Atom,
  AtomId,
  ClassifierSet,
  ConjugationCapability,
  CourseModule,
  GrammarHelpers,
  ImportMatchCapability,
  LanguageId,
  ParticleSet,
  PlacementBank,
  ReadingAnnotationCapability,
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
  speaking?: SpeakingPrompt[];
  imageMcqBlocklist?: Set<string>;
  vocabGraduation?: VocabGraduationCapability;
  /** External-study import (Anki → atom) match-key provider. */
  importMatch?: ImportMatchCapability;
  /** Typed-answer accent grading (fr pin F5): folded keys of word forms
   *  whose diacritic IS the word (a/à, ou/où …). `gradeTypedAnswer`
   *  refuses to accent-fold across these; omitting the capability keeps
   *  the fully-lenient fold (right for es, moot for kana). */
  accentPolicy?: AccentPolicy;
  /** Dialogue voice routing (2b generalization, 2026-08-20): speakers in
   *  `maleSpeakers` play the `maleVoiceLang` voice-scoped TTS manifest;
   *  everyone else plays the course-default voice. Omitting the capability
   *  means ALL dialogue speakers use the default voice — declare it only
   *  once the second voice's clips actually exist (ja: Keita). */
  dialogueVoices?: DialogueVoicesCapability;
}

export type DialogueVoicesCapability = {
  maleSpeakers: ReadonlySet<string>;
  maleVoiceLang: string;
};

export type { Atom, AtomId, LanguageId };
