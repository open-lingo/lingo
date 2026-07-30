/**
 * Language-agnostic conjugation-trainer provider contract.
 *
 * The conjugation-trainer SURFACE (`features/practice/conjugation/*` + the
 * `ConjugationPracticePage` hub) consumes a `ConjugationTrainerProvider`
 * resolved from the active language module (`getLanguageModule(id).conjugation.trainer`)
 * — it holds NO per-language linguistics. Each language that wants a trainer
 * supplies an implementation:
 *   - JA: `features/languages/ja/conjugation/provider.ts` (rule engine + tables)
 *   - KO: `features/languages/ko/conjugationProvider.ts` (jamo engine + tables)
 *
 * The provider owns every language-specific concern the UI would otherwise
 * hardcode: the tile registry, glyphs/colors, session building + distractors,
 * written-form (kanji/furigana) rendering, unlock gating, combo (stacked)
 * forms, cheat-sheet formation rows, and grading. The UI is a pure renderer.
 */
import type { LessonStep } from "@/features/lesson/types";

/** One rendered segment of a surface string — `ruby` present only on a
 *  second-script (kanji) block that carries a reading above it. */
export interface ConjRubySegment {
  text: string;
  ruby?: string;
}

/** One row of a trainer type's formation cheat sheet. */
export interface ConjFormationRow {
  /** e.g. "Godan — う・つ・る", "ㅂ irregular". */
  groupLabel: string;
  /** e.g. "〜う/つ/る → 〜って", "받침 ㅂ → 우 + 어요". */
  pattern: string;
  exampleDict: string;
  exampleForm: string;
}

/** Word-class chip metadata (godan/ichidan…, or KO stem classes). i18n keys +
 *  defaults so the generic chip component resolves them via `t()`. */
export interface ConjWordClassInfo {
  labelKey: string;
  labelDefault: string;
  explainKey: string;
  explainDefault: string;
  /** Renders with the amber "irregular" standout. */
  irregular: boolean;
}

/** An illustrative sentence for a form — the conjugated word in real use. */
export interface ConjExampleSentence {
  /** Target-language sentence, e.g. "커피를 마시고 싶어요.". */
  text: string;
  /** Reading/romanization aid (optional). */
  reading?: string;
  /** English gloss, e.g. "I want to drink coffee.". */
  translation: string;
}

export interface ConjTrainerTypeMeta {
  id: string;
  title: string;
  /** One factual line — no hype. */
  subtitle: string;
  /** Only used to pick the cheat-sheet "your words" label ("verb"/"adjective"). */
  category: string;
  /** Optional section grouping for the hub (e.g. "Speech level", "Tense",
   *  "Connecting", "Requests"). Tiles sharing a group render under one header;
   *  when no tile declares a group the hub falls back to a flat grid. */
  group?: string;
  /** True when the form applies to DESCRIPTIVE verbs (adjectives) — drives the
   *  "adj" flag on the tile + drill so learners know which words it fits. */
  adjective?: boolean;
  /** One example sentence showing the form in use (optional). */
  example?: ConjExampleSentence;
  /** The tile pictogram (kana / hangul glyph). */
  glyph: string;
  /** CSS var name holding the tile color, e.g. "--type-te". */
  colorVar: string;
  unlockModule: number;
  formation: ConjFormationRow[];
}

export interface ConjTrainerQuestion {
  itemId: string;
  /** Dictionary (lemma) surface — plain phonetic form. */
  prompt: string;
  meaning: string;
  /** Provider-defined class id, resolved via `wordClass(id)`. */
  wordClassId: string;
  formLabel: string;
  /** Form key — maps to build-stack tiles via `formToTiles`. */
  form: string;
  correct: string;
  options: string[];
  /** Written (second-script) dictionary form for ruby rendering; absent → plain. */
  written?: string;
  /** True when the prompt lemma is a descriptive verb (adjective) — the drill
   *  shows an "adjective" chip so the learner knows the word class. */
  isAdjective?: boolean;
  /** A per-question example built from THIS lemma's conjugation (so the
   *  learner sees their own word in use, not a fixed demo word). Preferred
   *  over the tile's static `example` when present. */
  example?: ConjExampleSentence;
}

export interface ConjComboInfo {
  tiles: string[];
  form: string;
  label: string;
  /** A demo conjugation for the hub's "+ … included" sub-line. */
  example: string;
}

export interface ConjCheatItem {
  dict: string;
  form: string;
}

/** Mix-tile glyph fragment (one colored character in the free-drill button). */
export interface ConjMixGlyph {
  glyph: string;
  colorVar: string;
}

// ─── Free drill (optional) ───────────────────────────────────────────────

export interface ConjFreeDrillCategory {
  id: string;
  label: string;
}

export interface ConjFreeDrillQuestion {
  itemId: string;
  prompt: string;
  meaning: string;
  formLabel: string;
  correct: string;
  options: string[];
}

/** Optional free-play drill. When a provider omits this, the surface hides the
 *  "Mix — free drill" tile and route. */
export interface ConjFreeDrillProvider {
  categories: ConjFreeDrillCategory[];
  defaultForms: string[];
  /** Lowest module the free drill pool draws from (JA: 7). */
  minModule: number;
  formsFor(categoryId: string): Array<{ key: string; label: string }>;
  buildQuestion(
    categoryId: string,
    maxModule: number,
    selectedForms: ReadonlySet<string>,
  ): ConjFreeDrillQuestion | null;
  recordResult(categoryId: string, itemId: string, correct: boolean): void;
}

// ─── Provider ─────────────────────────────────────────────────────────────

export interface ConjugationTrainerProvider {
  /** Tile ids in hub-grid order. */
  tileOrder: string[];
  getTypes(): ConjTrainerTypeMeta[];
  getType(id: string): ConjTrainerTypeMeta | undefined;

  /** `--type-*` palette + drill styles, scoped to `.conj-scope`. Injected once
   *  per page via a `<style>` tag. */
  scopeCss: string;
  glyph(tileId: string): string;
  colorVar(tileId: string): string;
  /** Colored glyph fragments for the Mix-tile face. */
  mixGlyphs: ConjMixGlyph[];

  wordClass(id: string): ConjWordClassInfo;

  /** Module from which the second script (kanji) is exposed on the drill card.
   *  `undefined` → never render a written form (plain phonetic only). */
  secondScriptExposureModule?: number;
  renderSurface(
    question: ConjTrainerQuestion,
    surface: string,
    showSecondScript: boolean,
  ): ConjRubySegment[];

  // ── gating / pools ──
  isTypeUnlocked(id: string, reachedModule: number): boolean;
  isSelectionAhead(ids: string[], reachedModule: number): boolean;
  effectivePoolModule(ids: string[], reachedModule: number): number;

  // ── combos (stacked forms) ──
  supportsCombos: boolean;
  combosForSelection(selected: string[]): ConjComboInfo[];
  canExtendSelection(selected: string[], tileId: string): boolean;
  /** Smallest superset combo's still-unselected tiles, for the "Add ⟨…⟩" hint. */
  missingComboTiles(selected: string[]): string[] | null;
  formToTiles(form: string): string[] | undefined;
  individualFormCount(ids: string[]): number;

  // ── sessions ──
  buildSession(typeId: string, poolModule: number): ConjTrainerQuestion[];
  buildCombinedSession(
    typeIds: string[],
    poolModule: number,
    withCombos: boolean,
  ): ConjTrainerQuestion[];

  // ── hub tile stats ──
  typeMasteryPercent(typeId: string): number;
  /** Due badge for a tile. `reachedModule` lets per-form unlocks (B016) skip
   *  points the learner hasn't reached — an unreachable point must not count. */
  dueCount(typeId: string, reachedModule: number): number;

  // ── grading (returns true if graded on-path, false if practice-only) ──
  gradeSessionIfOnPath(
    typeId: string,
    reachedModule: number,
    results: number[],
  ): boolean;
  gradeCombinedSessionIfOnPath(
    typeIds: string[],
    reachedModule: number,
    forms: string[],
    results: number[],
  ): boolean;

  // ── cheat sheet ──
  cheatItems(typeId: string, reachedModule: number): ConjCheatItem[];

  // ── intro rule step (JA); null when none ──
  getIntroStep(typeId: string): LessonStep | null;

  // ── free drill (optional) ──
  freeDrill?: ConjFreeDrillProvider;
}
