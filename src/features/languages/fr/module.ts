/**
 * French language module — populates the `LanguageModule` contract for FR.
 *
 * STATUS: registered and SELECTABLE (Spencer opened the gate 2026-08-21 to
 * walk the custom-authored m1/m2 — the walk doubles as the Denise voice
 * audition). Registration predates selectability: `moduleConformance` is
 * `describe.each(getAllLanguageIds())`, so French has been gate-checked since
 * registration. Selectability waited on the fr pin §7 item 6 precondition —
 * "Do not make French selectable before its audio coverage gate passes at
 * zero" — satisfied 2026-08-19 when m1's clips + `shared/tts/manifests/fr.json`
 * landed (frAudioCoverage green at ratchet 0). The switch lives in
 * `AVAILABLE_LEARNING_LANGUAGE_IDS` in `shared/domain/languageConfig.ts`.
 *
 * Per ADR-011, slots FR does not have (`alphabetConfig`, `secondScript`,
 * `readingAnnotation`, `romanizer`, `classifiers`, `symbolMastery`, `reading`,
 * `speaking`) are intentionally omitted — the generic engines detect
 * `module.<capability> == null` and route around themselves. Latin script needs
 * no alphabet trainer.
 *
 * Cross-language consumers must reach FR data exclusively through
 * `getLanguageModule("fr")`. Direct imports of `getFrCourseAtoms` etc. from
 * outside `features/languages/fr/` are anti-patterns, same as JA/KO/ES.
 *
 * `conjugation` is omitted until `fr/conjugationTables.ts` exists (fr pin §7
 * item 1). An empty `tables: []` would be worse than absent: the generic
 * engines treat null as "this language has no conjugation capability" and route
 * around it, but treat an empty table set as "capability present, no data" and
 * render an empty trainer.
 */

import type { LanguageModule } from "@/shared/language/LanguageModule";
import type {
  Atom,
  CourseModule,
  ParticleSet,
  PlacementBank,
  TtsManifest,
  VocabArtResolver,
} from "@/shared/language/types";

import { findFrAtomBySurface, getFrCourseAtoms, type FrAtom } from "./courseAtoms";
import * as grammarHelpers from "./grammarHelpers";
import { FR_PLACEMENT_BANK } from "./placementBank";

import { getMockCourse } from "@/shared/domain/mockCourse";
import { notoEmojiUrl, lingoArtUrl } from "@/shared/assets/notoEmoji";
import { getTtsManifest } from "@/shared/tts/manifest";

// ── Course id ────────────────────────────────────────────────────────────

const FR_COURSE_ID = "mock-1";

// ── Atom adapter (FrAtom already satisfies Atom — narrow the type) ───────

const FR_ATOMS: Atom[] = getFrCourseAtoms().map((a): Atom => ({
  id: a.id,
  languageId: a.languageId,
  surface: a.surface,
  gloss: a.gloss,
  partOfSpeech: a.partOfSpeech,
  fromModule: a.fromModule,
  srsEligible: a.srsEligible,
}));

// ── Curriculum (lazy — breaks the registry ↔ mockCourse import cycle) ────

let _frCurriculum: CourseModule[] | null = null;
function frCurriculum(): CourseModule[] {
  if (_frCurriculum == null) _frCurriculum = getMockCourse("fr").modules;
  return _frCurriculum;
}

// ── Particles (derived from courseAtoms.kind="particle") ─────────────────
//
// Articles, prepositions and conjunctions register as kind "particle", same
// as ES. French adds a wrinkle the other languages do not have: several of
// these surface CONTRACTED (`de + le → du`, `à + les → aux`) or ELIDED
// (`le + ami → l'ami`). The contracted forms are their own atoms — they are
// what the learner hears and writes — and `elidesBefore()` in courseAtoms.ts
// is the single place that decides elision.

const frParticles: ParticleSet = {
  particles: getFrCourseAtoms()
    .filter((a) => a.kind === "particle")
    .map((a) => ({ id: a.id, form: a.surface, meaning: a.gloss })),
};

// ── vocabArt (custom art first, then atom.emoji → Noto fallback) ────────

const frVocabArt: VocabArtResolver = {
  resolve: (atom) => {
    const bare = atom.id.startsWith("fr:") ? atom.id.slice(3) : atom.id;
    const frAtom: FrAtom | undefined = findFrAtomBySurface(bare);
    if (!frAtom) return null;
    const custom = lingoArtUrl("fr", frAtom.surface);
    if (custom) return custom;
    if (frAtom.emoji) return notoEmojiUrl(frAtom.emoji);
    return null;
  },
};

// ── ttsManifest ──────────────────────────────────────────────────────────
// NO fr clips exist. `getTtsManifest` returns an empty manifest for an
// unknown language, which is the correct descriptor — not a missing file to
// be papered over. This is the gate on selectability; see the header.

const frTtsManifest: TtsManifest = getTtsManifest("fr");

// ── placementBank ────────────────────────────────────────────────────────

const frPlacementBank: PlacementBank = FR_PLACEMENT_BANK;

// ── Module ───────────────────────────────────────────────────────────────

export const frModule: LanguageModule = {
  id: "fr",
  displayName: { en: "French", native: "Français" },
  scriptFont: '"Inter", ui-sans-serif, system-ui, sans-serif',
  textDirection: "ltr",

  courseId: FR_COURSE_ID,
  get curriculum() {
    return frCurriculum();
  },
  courseAtoms: FR_ATOMS,
  grammarHelpers: grammarHelpers as unknown as LanguageModule["grammarHelpers"],

  ttsManifest: frTtsManifest,
  vocabArt: frVocabArt,
  placementBank: frPlacementBank,

  // alphabetConfig: omitted — Latin script, no trainer
  // secondScript / readingAnnotation / romanizer: omitted (ADR-011)
  // conjugation: omitted until fr/conjugationTables.ts — see header
  // classifiers: omitted — French has no counter system
  particles: frParticles,
  // symbolMastery / reading / speaking: omitted — later waves

  // F5: the five pairs where the accent IS the word. gradeTypedAnswer
  // refuses to accent-fold across these (ou is not où); every other accent
  // stays lenient-with-nudge. Folded keys, per the AccentPolicy contract.
  // Landing this capability is what lifts F5's ban on authoring typed
  // steps whose answer is one of these pairs.
  accentPolicy: {
    protectedFoldedForms: new Set(["a", "ou", "sur", "du", "la"]),
  },
};

export type { FrAtom };
