/**
 * Spanish language module — populates the `LanguageModule` contract for ES.
 *
 * Per ADR-011, slots ES doesn't have (`alphabetConfig`, `secondScript`,
 * `readingAnnotation`, `romanizer`, `classifiers`, `symbolMastery`,
 * `reading`, `speaking`) are intentionally omitted — the generic engines
 * detect `module.<capability> == null` and route around themselves.
 * Latin script needs no alphabet trainer (open-items.md #3); m1 teaches
 * pronunciation in-lesson instead (spine §Deliberately out of scope).
 *
 * Cross-language consumer entry point: reach ES data exclusively via
 * `getLanguageModule("es")`. Direct imports of `getEsCourseAtoms` /
 * `esGrammarHelpers` / etc. from outside `features/languages/es/` are
 * anti-patterns. (Mirrors the JA/KO modules' invariant.)
 *
 * Lazy curriculum: `module.curriculum` is a lazy getter — same pattern
 * as the JA/KO modules to avoid the registry ↔ mockCourse import cycle.
 */

import type { LanguageModule } from "@/shared/language/LanguageModule";
import type {
  Atom,
  AtomId,
  ConjugationCapability,
  CourseModule,
  ParticleSet,
  PartOfSpeech,
  PlacementBank,
  TtsManifest,
  VocabArtResolver,
} from "@/shared/language/types";

import { findEsAtomBySurface, getEsCourseAtoms, type EsAtom } from "./courseAtoms";
import * as grammarHelpers from "./grammarHelpers";
import { ES_VERB_ENTRIES } from "./conjugationTables";
import { ES_PLACEMENT_BANK } from "./placementBank";

import { getMockCourse } from "@/shared/domain/mockCourse";
import { notoEmojiUrl } from "@/shared/assets/notoEmoji";
import { getTtsManifest } from "@/shared/tts/manifest";

// ── Course id ────────────────────────────────────────────────────────────

const ES_COURSE_ID = "mock-1";

// ── Atom adapter (EsAtom already satisfies Atom — narrow the type) ──────

const ES_ATOMS: Atom[] = getEsCourseAtoms().map((a): Atom => ({
  id: a.id,
  languageId: a.languageId,
  surface: a.surface,
  gloss: a.gloss,
  partOfSpeech: a.partOfSpeech,
  fromModule: a.fromModule,
  srsEligible: a.srsEligible,
}));

// ── Curriculum (lazy — breaks the registry ↔ mockCourse import cycle) ──

let _esCurriculum: CourseModule[] | null = null;
function esCurriculum(): CourseModule[] {
  if (_esCurriculum == null) _esCurriculum = getMockCourse("es").modules;
  return _esCurriculum;
}

// ── Particles (derived from courseAtoms.kind="particle") ────────────────
//
// Same pattern as JA/KO: the canonical source of truth is the atom
// registry; articles/preps/conjunctions register as kind "particle"
// (spine §Module spine) so this slot is non-empty from m1 on.

const esParticles: ParticleSet = {
  particles: getEsCourseAtoms()
    .filter((a) => a.kind === "particle")
    .map((a) => ({
      id: a.id,
      form: a.surface,
      meaning: a.gloss,
    })),
};

// ── Conjugation (from ES_VERB_ENTRIES — 10 spine seed verbs) ─────────────

const esConjugation: ConjugationCapability = {
  tables: ES_VERB_ENTRIES.map((v) => ({
    lemmaAtomId: `es:${v.lemma}` as AtomId,
    partOfSpeech: "verb" as PartOfSpeech,
    forms: v.forms as Record<string, string>,
  })),
  // analyze: omitted — populating it is content-design work. Stays null;
  // generic engine renders the table cells without an analyzer.
};

// ── vocabArt (atom.emoji → Noto fallback; ES has no custom SVGs yet) ────

const esVocabArt: VocabArtResolver = {
  resolve: (atom) => {
    const bare = atom.id.startsWith("es:") ? atom.id.slice(3) : atom.id;
    const esAtom: EsAtom | undefined = findEsAtomBySurface(bare);
    if (esAtom?.emoji) return notoEmojiUrl(esAtom.emoji);
    return null;
  },
};

// ── ttsManifest ──────────────────────────────────────────────────────────
// 1,255 es-MX-DaliaNeural clips are generated and published. Coverage
// descriptor only — `shared/tts` derives the actual paths.

const esTtsManifest: TtsManifest = getTtsManifest("es");

// ── placementBank (aggregated from curriculum/m{n} in placementBank.ts) ─

const esPlacementBank: PlacementBank = ES_PLACEMENT_BANK;

// ── Module ───────────────────────────────────────────────────────────────

export const esModule: LanguageModule = {
  id: "es",
  displayName: { en: "Spanish", native: "Español" },
  scriptFont: '"Inter", ui-sans-serif, system-ui, sans-serif',
  textDirection: "ltr",

  courseId: ES_COURSE_ID,
  get curriculum() {
    return esCurriculum();
  },
  courseAtoms: ES_ATOMS,
  grammarHelpers: grammarHelpers as unknown as LanguageModule["grammarHelpers"],

  ttsManifest: esTtsManifest,
  vocabArt: esVocabArt,
  placementBank: esPlacementBank,

  // alphabetConfig: omitted — Latin script, no trainer (open-items.md #3)
  // secondScript / readingAnnotation / romanizer: omitted (ADR-011)
  conjugation: esConjugation,
  // classifiers: omitted — Spanish has no counter system
  particles: esParticles,
  // symbolMastery / reading / speaking: omitted — later waves author
  // the passages/prompts (spine §Reading passages / speaking prompts)
};

export type { EsAtom };
