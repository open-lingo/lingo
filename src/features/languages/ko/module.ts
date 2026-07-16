/**
 * Korean language module — populates the `LanguageModule` contract for KO.
 *
 * Phase 3 + 5 deliverables: registered with required slots + the optional
 * capabilities KO opts in to today. Per ADR-011, slots KO doesn't have
 * (`secondScript`, `readingAnnotation`, `symbolMastery`) are intentionally
 * omitted — the generic engines detect `module.<capability> == null` and
 * route around themselves.
 *
 * Cross-language consumer entry point: reach KO data exclusively via
 * `getLanguageModule("ko")`. Direct imports of `KO_COURSE_ATOMS` /
 * `koGrammarHelpers` / etc. from outside `features/languages/ko/` are
 * anti-patterns. (Mirrors the JA module's invariant.)
 *
 * Lazy curriculum: `module.curriculum` is a lazy getter — same pattern
 * as the JA module to avoid the registry ↔ mockCourse import cycle.
 */

import type { LanguageModule } from "@/shared/language/LanguageModule";
import type {
  Atom,
  AtomId,
  ClassifierSet,
  ConjugationCapability,
  CourseModule,
  ParticleSet,
  PlacementBank,
  TtsManifest,
  VocabArtResolver,
  AlphabetConfig,
} from "@/shared/language/types";

import { KO_COURSE_ATOMS, type KoAtom } from "./courseAtoms";
import * as grammarHelpers from "./grammarHelpers";
import { KO_COUNTER_DEFS } from "./classifiers";
import { buildKoConjugationTables } from "./conjugationTables";
import { getRegisteredTrainer } from "@/shared/conjugation/registry";
import { KO_PLACEMENT_BANK } from "./placementBank";
import { annotateKorean, romanizeKorean } from "./romanization/hangulRomanize";

import { getMockCourse } from "@/shared/domain/mockCourse";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { notoEmojiUrl } from "@/shared/assets/notoEmoji";

// ── Course id ────────────────────────────────────────────────────────────

const KO_COURSE_ID = "mock-1";

// ── Atom adapter (KoAtom already satisfies Atom — narrow the type) ──────

const KO_ATOMS: Atom[] = KO_COURSE_ATOMS.map((a): Atom => ({
  id: a.id,
  languageId: a.languageId,
  surface: a.surface,
  gloss: a.gloss,
  partOfSpeech: a.partOfSpeech,
  fromModule: a.fromModule,
  srsEligible: a.srsEligible,
}));

// ── Curriculum (lazy — breaks the registry ↔ mockCourse import cycle) ──

let _koCurriculum: CourseModule[] | null = null;
function koCurriculum(): CourseModule[] {
  if (_koCurriculum == null) _koCurriculum = getMockCourse("ko").modules;
  return _koCurriculum;
}

// ── Particles (derived from courseAtoms.kind="particle") ────────────────
//
// Same pattern as JA: the canonical source of truth is the atom registry;
// the ParticleSet is a thin view that adds an empty `examples` array. The
// JSON-backed `particles.json` is still loaded by the flashcards deck
// page, but the contract slot comes from atoms — atomic id consistency.

const koParticles: ParticleSet = {
  particles: KO_COURSE_ATOMS.filter((a) => a.kind === "particle").map((a) => ({
    id: a.id,
    form: a.surface,
    meaning: a.gloss,
  })),
};

// ── Classifiers (derived from KO_COUNTER_DEFS — slim shape per ADR-001) ─
//
// Phase 5 spec asks for the high-frequency counters: 개 / 명 / 마리 /
// 장 / 잔 / 권 / 대 / 살 / 시 / 분 / 시간 / 일. The existing
// `KO_COUNTER_DEFS` (CounterPracticePage) covers myeong/gae/mari/jan
// already; we augment with the rest as ClassifierSet entries that don't
// need the full reading table yet. usedWith is left empty (sparse at
// this content stage; populated when M3+ KO content introduces counter
// usage).

const koClassifiers: ClassifierSet = {
  classifiers: [
    // ── from existing KO_COUNTER_DEFS ──
    ...KO_COUNTER_DEFS.map((c) => ({
      id: `ko:counter-${c.id}`,
      surface: c.kanji,
      meaning: c.meaning,
      usedWith: [] as AtomId[],
    })),
    // ── augmented per Phase 5 spec ──
    { id: "ko:counter-jang", surface: "장", meaning: "flat objects (sheets, tickets)", usedWith: [] },
    { id: "ko:counter-gwon", surface: "권", meaning: "books, volumes", usedWith: [] },
    { id: "ko:counter-dae", surface: "대", meaning: "machines, vehicles", usedWith: [] },
    { id: "ko:counter-sal", surface: "살", meaning: "age (native-Korean number)", usedWith: [] },
    { id: "ko:counter-si", surface: "시", meaning: "o'clock (hours)", usedWith: [] },
    { id: "ko:counter-bun", surface: "분", meaning: "minutes (also: person, honorific)", usedWith: [] },
    { id: "ko:counter-sigan", surface: "시간", meaning: "duration in hours", usedWith: [] },
    { id: "ko:counter-il", surface: "일", meaning: "days", usedWith: [] },
    { id: "ko:counter-bun-person", surface: "분", meaning: "person (honorific count)", usedWith: [] },
  ],
};

// ── Conjugation (jamo engine + authored lemma list; full trainer provider) ─

const koConjugation: ConjugationCapability = {
  // Generated from the authored lemma list by the jamo engine — every drilled
  // cell across all stem classes, verbs + adjectives (conjugationTables.ts).
  tables: buildKoConjugationTables(),
  // Lazy provider (self-registers via the trainer surface) — see JA module.
  get trainer() {
    return getRegisteredTrainer("ko");
  },
  // analyze: omitted — populating it is content-design work. Stays null;
  // generic engine renders the table cells without an analyzer.
};

// ── vocabArt (atom.emoji → Noto fallback; KO has no custom SVGs yet) ────

const koVocabArt: VocabArtResolver = {
  resolve: (atom) => {
    const bare = atom.id.startsWith("ko:") ? atom.id.slice(3) : atom.id;
    const koAtom = KO_COURSE_ATOMS.find((a) => a.surface === bare);
    if (koAtom?.emoji) return notoEmojiUrl(koAtom.emoji);
    return null;
  },
};

// ── ttsManifest (Phase 4 fills; empty until then — runtime falls back to
//      browser TTS via the speech-synthesis API path) ────────────────────

const koTtsManifest: TtsManifest = {};

// ── alphabetConfig (from existing languageConfig hangul section) ────────

const koAlphabetConfig: AlphabetConfig | undefined = (() => {
  const cfg = getLanguageConfig("ko");
  const sections = cfg?.alphabet?.sections;
  if (!sections) return undefined;
  return {
    sections: sections.map((s) => ({
      id: s.id,
      name: s.name,
      characters: s.characters,
    })),
    hasStrokeOrder: cfg?.alphabet?.hasStrokeOrder ?? false,
    hasComponentBreakdown: cfg?.hasComponentBreakdown ?? false,
    characterRomanization: cfg?.alphabet?.characterRomanization,
  };
})();

// ── placementBank (re-exported from placementBank.ts) ───────────────────

const koPlacementBank: PlacementBank = KO_PLACEMENT_BANK;

// ── Module ───────────────────────────────────────────────────────────────

export const koModule: LanguageModule = {
  id: "ko",
  displayName: { en: "Korean", native: "한국어" },
  scriptFont:
    '"Noto Sans KR", "Inter", ui-sans-serif, system-ui, sans-serif',
  textDirection: "ltr",

  courseId: KO_COURSE_ID,
  get curriculum() {
    return koCurriculum();
  },
  courseAtoms: KO_ATOMS,
  grammarHelpers: grammarHelpers as unknown as LanguageModule["grammarHelpers"],

  ttsManifest: koTtsManifest,
  vocabArt: koVocabArt,
  placementBank: koPlacementBank,

  alphabetConfig: koAlphabetConfig,
  // secondScript: omitted — Hanja deferred (open-items.md #7)
  // Hangul is phonetic, so the reading aid is computed (Revised Romanization),
  // not authored per-word. `annotateKorean` produces one ruby fragment per
  // Hangul word with pronunciation-based RR above it; the shared AnnotatedText
  // renderer + the `showRomanization` setting gate visibility.
  readingAnnotation: { annotate: annotateKorean, fadeOnMastery: false },
  romanizer: {
    romanize: (token: string) => Promise.resolve(romanizeKorean(token)),
    style: "RR",
  },
  conjugation: koConjugation,
  classifiers: koClassifiers,
  particles: koParticles,
  // symbolMastery: omitted — alphabet drill handles jamo mastery
};

export type { KoAtom };
