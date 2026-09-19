/**
 * Portuguese (Brazilian) language module — populates the `LanguageModule`
 * contract for PT. Scaffolding lane (docs/pt-course-design-2026-09-18.md
 * §5): NO LESSON CONTENT. Registered in `shared/language/registry.ts` so
 * `moduleConformance.test.ts` (`describe.each(getAllLanguageIds())`) gates
 * PT from day one — same "registered but not selectable" precedent FR set
 * (`fr/module.ts`'s header) before its audio coverage gate passed. PT stays
 * out of `AVAILABLE_LEARNING_LANGUAGE_IDS`
 * (`shared/domain/languageConfig.ts`) — that is the separate switch, and it
 * is additionally gated behind `feature-flags.json`'s `courses.ptBeta`
 * allow-list (`shared/domain/betaAccess.ts`) once a future lane wires a
 * real user identity into Switch-language / course-map / placement / boot
 * — this lane ships the tested seam, not the wiring (see betaAccess.ts's
 * header for why).
 *
 * Per ADR-011, slots PT doesn't have (`alphabetConfig`, `secondScript`,
 * `readingAnnotation`, `romanizer`, `classifiers`, `symbolMastery`,
 * `reading`, `speaking`) are intentionally omitted — Latin script needs no
 * alphabet trainer (open-items.md #3).
 *
 * Cross-language consumers must reach PT data exclusively through
 * `getLanguageModule("pt")`. Direct imports of `getPtCourseAtoms` /
 * `ptGrammarHelpers` / etc. from outside `features/languages/pt/` are
 * anti-patterns, same as JA/KO/ES/FR.
 *
 * Curriculum is NOT lazy (unlike ES/FR, which route through the shared
 * `shared/domain/mockCourse.ts` and use a lazy getter to avoid a registry↔
 * mockCourse import cycle): `pt/curriculum/index.ts` is self-contained and
 * importing it eagerly here is what guarantees every `mN.ts`'s atoms are
 * registered (via the `atom()` side effect) before `courseAtoms` below
 * reads the live registry — see `courseAtoms.ts`'s header on why PT has no
 * `atoms.generated.json` content-as-data layer yet.
 */
import type { LanguageModule } from "@/shared/language/LanguageModule";
import type {
  Atom,
  AtomId,
  ConjugationCapability,
  ParticleSet,
  PartOfSpeech,
  PlacementBank,
  TtsManifest,
  VocabArtResolver,
} from "@/shared/language/types";

import { buildPortugueseCourse } from "./curriculum";
import { findPtAtomBySurface, getPtCourseAtoms, type PtAtom } from "./courseAtoms";
import * as grammarHelpers from "./grammarHelpers";
import { PT_VERB_ENTRIES } from "./conjugationTables";
import { PT_PLACEMENT_BANK } from "./placementBank";

import { notoEmojiUrl, lingoArtUrl } from "@/shared/assets/notoEmoji";
import { getTtsManifest } from "@/shared/tts/manifest";

// ── Course id ────────────────────────────────────────────────────────────

// "mock-1" for every language (ja/ko/es/fr all use this exact literal —
// courseId is not a cross-language discriminator; progress is keyed by
// languageId separately). Matching the convention, not inventing a new one.
const PT_COURSE_ID = "mock-1";

// ── Curriculum (eager — see header; forces mN.ts atom registration) ──────

const PT_CURRICULUM = buildPortugueseCourse();

// ── Atom adapter (PtAtom already satisfies Atom — narrow the type) ───────
// Read AFTER `buildPortugueseCourse()` above so every mN.ts has evaluated
// and registered its atoms into the live registry `getPtCourseAtoms()` reads.

const PT_ATOMS: Atom[] = getPtCourseAtoms().map((a): Atom => ({
  id: a.id,
  languageId: a.languageId,
  surface: a.surface,
  gloss: a.gloss,
  partOfSpeech: a.partOfSpeech,
  fromModule: a.fromModule,
  srsEligible: a.srsEligible,
}));

// ── Particles (derived from courseAtoms.kind="particle") ─────────────────

const ptParticles: ParticleSet = {
  particles: getPtCourseAtoms()
    .filter((a) => a.kind === "particle")
    .map((a) => ({ id: a.id, form: a.surface, meaning: a.gloss })),
};

// ── Conjugation (from PT_VERB_ENTRIES — empty until m1 authors ser/estar/ter) ─

const ptConjugation: ConjugationCapability = {
  tables: PT_VERB_ENTRIES.map((v) => ({
    lemmaAtomId: `pt:${v.lemma}` as AtomId,
    partOfSpeech: "verb" as PartOfSpeech,
    forms: v.forms as Record<string, string>,
  })),
};

// ── vocabArt (custom art first, then atom.emoji → Noto fallback) ────────

const ptVocabArt: VocabArtResolver = {
  resolve: (atom) => {
    const bare = atom.id.startsWith("pt:") ? atom.id.slice(3) : atom.id;
    const ptAtom: PtAtom | undefined = findPtAtomBySurface(bare);
    if (!ptAtom) return null;
    const custom = lingoArtUrl("pt", ptAtom.surface);
    if (custom) return custom;
    if (ptAtom.emoji) return notoEmojiUrl(ptAtom.emoji);
    return null;
  },
};

// ── ttsManifest ──────────────────────────────────────────────────────────
// Empty manifest (schema 2, count 0) until the first authoring wave's
// clips ship — `src/shared/tts/manifests/pt.json` exists so
// `getTtsManifest("pt")` resolves instead of falling back to the
// zero-coverage default; see that file's own header.

const ptTtsManifest: TtsManifest = getTtsManifest("pt");

// ── placementBank ─────────────────────────────────────────────────────────

const ptPlacementBank: PlacementBank = PT_PLACEMENT_BANK;

// ── Module ───────────────────────────────────────────────────────────────

export const ptModule: LanguageModule = {
  id: "pt",
  displayName: { en: "Portuguese", native: "Português" },
  scriptFont: '"Inter", ui-sans-serif, system-ui, sans-serif',
  textDirection: "ltr",

  courseId: PT_COURSE_ID,
  curriculum: PT_CURRICULUM,
  courseAtoms: PT_ATOMS,
  grammarHelpers: grammarHelpers as unknown as LanguageModule["grammarHelpers"],

  ttsManifest: ptTtsManifest,
  vocabArt: ptVocabArt,
  placementBank: ptPlacementBank,

  // alphabetConfig: omitted — Latin script, no trainer (open-items.md #3)
  // secondScript / readingAnnotation / romanizer: omitted (ADR-011)
  conjugation: ptConjugation,
  // classifiers: omitted — Portuguese has no counter system
  particles: ptParticles,
  // symbolMastery / reading / speaking: omitted — later waves author
  // the passages/prompts
};

export type { PtAtom };
