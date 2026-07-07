/**
 * Japanese language module — populates the `LanguageModule` contract for JA.
 *
 * Every cross-language consumer must reach JA data through this module via
 * `getLanguageModule("ja")`. Direct imports of `JA_COURSE_ATOMS`,
 * `jaGrammarHelpers`, etc. from outside `features/languages/ja/` are
 * anti-patterns — caught by the post-Phase-2 grep in PR review.
 *
 * Adapter notes (preserve behavior):
 *   - `courseAtoms` is an adapter view over the file-internal `JA_COURSE_ATOMS`
 *     (CourseAtom shape) that exposes ADR-005-conformant `Atom` shape with
 *     `id: "ja:<courseAtom.id>"`. The bare CourseAtom.id is kept inside the
 *     JA file because hundreds of internal lookups + lesson factories key off
 *     it; the registry boundary supplies the namespaced view.
 *   - SRS storage normalizes bare keys (`"ai"`) to `"ja:ai"` on read/write
 *     (see `srsStorage.ts`). So any consumer can pass either shape and the
 *     storage layer canonicalizes.
 */

import type { LanguageModule } from "@/shared/language/LanguageModule";
import type {
  Atom,
  AtomId,
  ClassifierSet,
  ConjugationCapability,
  CourseModule,
  ParticleSet,
  PartOfSpeech,
  PlacementBank,
  PlacementItem,
  ReadingAnnotationCapability,
  Romanizer,
  SecondScriptCapability,
  SymbolMasteryConfig,
  TtsManifest,
  VocabArtResolver,
  VocabGraduationCapability,
  AlphabetConfig,
} from "@/shared/language/types";
import type { GraduationAnchor } from "@/shared/language/types";

import {
  JA_COURSE_ATOMS,
  type CourseAtom,
  type CourseAtomKind,
} from "./courseAtoms";
import * as grammarHelpers from "./grammarHelpers";
import { WORD_IMAGE_MCQ_BLOCKLIST } from "./grammarHelpers";
import { jaImportMatch } from "./importMatchKeys";
import { VERB_ENTRIES, ADJ_ENTRIES } from "./conjugationTables";
import { COUNTER_DEFS } from "./classifiers";
import { N5_KANJI } from "./secondScript/n5Kanji";
import { convertToHiragana } from "./readingAnnotation/kuroshiro";
import { annotateJapaneseText, isPastKanaPhase } from "./romajiLexicon";

import { getMockCourse } from "@/shared/domain/mockCourse";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import { isKana, KANA_ROMAJI } from "@/shared/japanese/kanaTable";
import { lingoArtUrl, notoEmojiUrl } from "@/shared/assets/notoEmoji";
import jaManifest from "../../../pub/tts/manifest.json";

import { ALL_ROWS } from "@/features/lesson/data/hiraganaCurriculum";
import {
  PLACEMENT_QUESTION_BANK,
  instantiateItem,
} from "@/features/placement/questionBank";

// ── Course id ────────────────────────────────────────────────────────────

const JA_COURSE_ID = "mock-1";

// ── Atom adapter (CourseAtom → Atom) ─────────────────────────────────────

function kindToPartOfSpeech(kind: CourseAtomKind): PartOfSpeech {
  switch (kind) {
    case "particle":
      return "particle";
    case "phrase":
      return "phrase";
    default:
      return "noun";
  }
}

function toAtom(c: CourseAtom): Atom {
  return {
    id: `ja:${c.id}` as AtomId,
    languageId: "ja",
    surface: c.kanji ?? c.kana,
    gloss: c.meaningEn,
    partOfSpeech: kindToPartOfSpeech(c.kind),
    fromModule: c.fromModule === "future" ? undefined : c.fromModule,
    srsEligible: c.excludeFromSrs !== true,
  };
}

const JA_ATOMS: Atom[] = JA_COURSE_ATOMS.map(toAtom);

// ── Curriculum (lazy — breaks the registry ↔ mockCourse import cycle) ──

let _jaCurriculum: CourseModule[] | null = null;
function jaCurriculum(): CourseModule[] {
  if (_jaCurriculum == null) _jaCurriculum = getMockCourse("ja").modules;
  return _jaCurriculum;
}

// ── Particles (derived from courseAtoms.kind="particle") ─────────────────

const jaParticles: ParticleSet = {
  particles: JA_COURSE_ATOMS.filter((a) => a.kind === "particle").map((a) => ({
    id: `ja:${a.id}`,
    form: a.kana,
    meaning: a.meaningEn,
  })),
};

// ── Classifiers (from COUNTER_DEFS) ──────────────────────────────────────

const jaClassifiers: ClassifierSet = {
  classifiers: COUNTER_DEFS.map((c) => ({
    id: `ja:counter-${c.id}`,
    surface: c.kanji,
    meaning: c.meaning,
    usedWith: [],
  })),
};

// ── Conjugation (from VERB_ENTRIES + ADJ_ENTRIES) ────────────────────────

const jaConjugation: ConjugationCapability = {
  tables: [
    ...VERB_ENTRIES.map((v) => ({
      lemmaAtomId: `ja:${v.id}` as AtomId,
      partOfSpeech: "verb" as PartOfSpeech,
      forms: v.forms as Record<string, string>,
    })),
    ...ADJ_ENTRIES.map((a) => ({
      lemmaAtomId: `ja:${a.id}` as AtomId,
      partOfSpeech: "adjective" as PartOfSpeech,
      forms: a.forms as Record<string, string>,
    })),
  ],
};

// ── secondScript (kanji glyph map from N5_KANJI) ─────────────────────────

const jaSecondScript: SecondScriptCapability = (() => {
  const glyphMap = new Map<AtomId, { glyphs: string; readings: string[] }>();
  // Index N5 kanji by their anchor vocab atom ids; map JA atoms with a
  // matching kanji form to a glyph entry.
  const kanjiByCharacter = new Map(N5_KANJI.map((k) => [k.character, k]));
  for (const c of JA_COURSE_ATOMS) {
    if (!c.kanji) continue;
    // The kanji field may carry multiple variants like "川 / 河" — only
    // map the first variant for the glyph (display) but include the kana
    // as the reading.
    const primary = c.kanji.split("/")[0].trim();
    if (!primary) continue;
    // We only register entries that have at least one N5 kanji match —
    // ensures the helper UX has real backing data.
    const hasN5Match = Array.from(primary).some((ch) => kanjiByCharacter.has(ch));
    if (!hasN5Match) continue;
    glyphMap.set(`ja:${c.id}` as AtomId, {
      glyphs: primary,
      readings: [c.kana],
    });
  }
  return {
    required: false,
    glyphMap,
    unlockPolicy: "auto",
  };
})();

// ── readingAnnotation (kana-aware tokenizer with romaji helpers) ─────────

const jaReadingAnnotation: ReadingAnnotationCapability = {
  // Past the M1–M2 kana phase, kana spans matching authored words group
  // into ONE word-level romaji fragment ("gakusei" over がくせい instead of
  // "ga ku se i" per glyph); during the kana phase — and for any span the
  // lexicon can't segment — emission stays per-kana. See romajiLexicon.ts.
  annotate: (token) => annotateJapaneseText(token, isPastKanaPhase()),
  fadeOnMastery: true,
};

// ── romanizer (kuroshiro-backed; async) ──────────────────────────────────

const jaRomanizer: Romanizer = {
  romanize: async (token) => {
    // Convert kanji → hiragana via kuroshiro, then map each kana to romaji.
    const hira = await convertToHiragana(token);
    return Array.from(hira)
      .map((ch) => KANA_ROMAJI[ch] ?? ch)
      .join("");
  },
  style: "romaji",
};

// ── symbolMastery (kana symbols + isSymbol predicate) ────────────────────

const jaSymbolMastery: SymbolMasteryConfig = {
  symbols: [], // populated lazily; today's storage is bag-of-strings keyed by kana
  isSymbol: isKana,
};

// ── vocabArt (kana → SVG resolver, custom-art first, then Noto fallback) ─

const jaVocabArt: VocabArtResolver = {
  resolve: (atom) => {
    // Map registry Atom back to the underlying kana to hit the existing
    // resolvers (which are kana-keyed today).
    const bare = atom.id.startsWith("ja:") ? atom.id.slice(3) : atom.id;
    const ca = JA_COURSE_ATOMS.find((c) => c.id === bare);
    if (!ca) return null;
    const custom = lingoArtUrl(ca.kana);
    if (custom) return custom;
    if (ca.emoji) return notoEmojiUrl(ca.emoji);
    return null;
  },
};

// ── ttsManifest (existing JA-only manifest pass-through) ─────────────────

const jaTtsManifest: TtsManifest = jaManifest as TtsManifest;

// ── alphabetConfig (from existing languageConfig hiragana/katakana) ──────

const jaAlphabetConfig: AlphabetConfig | undefined = (() => {
  const cfg = getLanguageConfig("ja");
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

// ── placementBank (from PLACEMENT_QUESTION_BANK, JA items only) ──────────

const jaPlacementBank: PlacementBank = (() => {
  const byModule: Record<string, PlacementItem[]> = {};
  for (const item of PLACEMENT_QUESTION_BANK) {
    const lang = item.languageId ?? "ja";
    if (lang !== "ja") continue;
    const items = byModule[item.moduleId] ?? [];
    items.push({
      id: item.id,
      moduleId: item.moduleId,
      build: () => instantiateItem(item),
    });
    byModule[item.moduleId] = items;
  }
  return { screener: [], byModule };
})();

// ── vocabGraduation (JA hiragana-row anchor walker) ──────────────────────

const jaVocabGraduation: VocabGraduationCapability = {
  collectAnchorsForModule: (module: CourseModule): GraduationAnchor[] => {
    const seen = new Set<string>();
    const out: GraduationAnchor[] = [];
    const rowsById = new Map(ALL_ROWS.map((r) => [r.id, r]));
    const seenRows = new Set<string>();
    for (const lesson of module.lessons) {
      const m = /^ja-m\d+-(.+)$/.exec(lesson.id);
      if (!m) continue;
      let rowId = m[1];
      const sub = /^(.+)-(\d+|test|recap)$/.exec(rowId);
      if (sub) rowId = sub[1];
      if (seenRows.has(rowId)) continue;
      seenRows.add(rowId);
      const row = rowsById.get(rowId);
      if (!row) continue;
      for (const w of row.anchorWords) {
        if (seen.has(w.kana)) continue;
        seen.add(w.kana);
        out.push({
          surface: w.kana,
          romanization: w.romaji,
          meaning: w.meaning,
        });
      }
    }
    return out;
  },
};

// ── Module ───────────────────────────────────────────────────────────────

export const jaModule: LanguageModule = {
  id: "ja",
  displayName: { en: "Japanese", native: "日本語" },
  scriptFont:
    '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", system-ui, sans-serif',
  textDirection: "ltr",

  courseId: JA_COURSE_ID,
  get curriculum() {
    return jaCurriculum();
  },
  courseAtoms: JA_ATOMS,
  grammarHelpers: grammarHelpers as unknown as LanguageModule["grammarHelpers"],

  ttsManifest: jaTtsManifest,
  vocabArt: jaVocabArt,
  placementBank: jaPlacementBank,

  alphabetConfig: jaAlphabetConfig,
  secondScript: jaSecondScript,
  readingAnnotation: jaReadingAnnotation,
  romanizer: jaRomanizer,
  conjugation: jaConjugation,
  classifiers: jaClassifiers,
  particles: jaParticles,
  symbolMastery: jaSymbolMastery,
  imageMcqBlocklist: new Set(WORD_IMAGE_MCQ_BLOCKLIST),
  vocabGraduation: jaVocabGraduation,
  importMatch: jaImportMatch,
};
