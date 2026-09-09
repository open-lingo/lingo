/**
 * Japanese conjugation-trainer provider. Assembles the JA trainer registry,
 * session/distractor engine, combo (stacked-form) map, tile colors, written-
 * form (kanji + furigana) rendering, and Track-B grading into the generic
 * `ConjugationTrainerProvider` contract the drill surface consumes.
 *
 * This is the ONLY place the JA linguistics touch the trainer surface — the UI
 * reads everything through `getLanguageModule("ja").conjugation.trainer`.
 * Behaviour is identical to the pre-generalization JA-hardwired surface.
 */
import type {
  ConjugationTrainerProvider,
  ConjTrainerTypeMeta,
  ConjTrainerQuestion,
  ConjComboInfo,
  ConjCheatItem,
  ConjWordClassInfo,
  ConjRubySegment,
  ConjFreeDrillProvider,
  ConjExampleSentence,
} from "@/shared/conjugation/types";
import { registerConjugationTrainer } from "@/shared/conjugation/registry";
import type { LessonStep } from "@/features/lesson/types";
import { getGrammarRuleStepForPoint } from "@/features/lesson/data/grammarReviewPools";
import { recordPracticeResult, pickWeighted } from "@/features/practice/practiceStats";

import {
  conjugateVerb,
  conjugateIAdj,
  CHAIN_FORM_LABELS,
  type ChainForm,
  type IAdjForm,
} from "../conjugationEngine";
import {
  ADJ_FORM_LABELS,
  ADJ_ENTRIES,
  getVerbsUpToModule,
  getAdjsUpToModule,
  type AdjForm,
  type VerbGroup,
} from "../conjugationTables";
import { writtenSegments } from "../writtenForms";
import {
  CONJUGATION_TRAINER_TYPES,
  getTrainerType,
  unlockModuleForType,
  formUnlockModule,
  grammarPointModule,
  isTypeUnlocked,
  isSelectionAhead,
  effectivePoolModule,
  dueGrammarPointCount,
  type ConjugationTrainerType,
  type TrainerTypeId,
} from "./trainerRegistry";
import {
  buildTrainerSession,
  buildCombinedSession,
  typeMasteryPercent,
  gradeTrainerSessionIfOnPath,
  gradeCombinedSessionIfOnPath,
  shuffle,
  generateFormationDistractors,
  generateIAdjFormationDistractors,
  generateAdjDistractors,
  type TrainerQuestion,
} from "./trainerSession";
import {
  COMBO_MAP,
  combosForSelection,
  canExtendSelection,
  type ComboEntry,
} from "./comboForms";
import {
  TYPE_GLYPH,
  TYPE_COLOR_VAR,
  TILE_ORDER,
  FORM_TO_TILES,
  CONJ_TYPE_COLOR_CSS,
} from "./typeColors";

/** Learners see kanji (with furigana) in the trainer from this module on. */
const KANJI_EXPOSURE_MODULE = 10;

/** Demo verb/adjective for rendering "what a combo produces" in the hub sub-line. */
const COMBO_DEMO = { dictionary: "みる", group: "ichidan" as const };
const COMBO_DEMO_ADJ = "たかい";

const jaEx = (text: string, translation: string): ConjExampleSentence => ({ text, translation });

/** One example sentence per trainer type — the form shown in real use (kept
 *  low-kanji for beginners). */
const TYPE_EXAMPLE: Record<string, ConjExampleSentence> = {
  "te-form": jaEx("うたを きいて、べんきょうします。", "I listen to music and (then) study."),
  "ta-form": jaEx("きのう えいがを みた。", "I watched a movie yesterday."),
  "nai-form": jaEx("にくを たべない。", "I don't eat meat."),
  masu: jaEx("まいにち にほんごを べんきょうします。", "I study Japanese every day."),
  "v-tai": jaEx("みずが のみたいです。", "I want to drink water."),
  "i-adj-forms": jaEx("この みせは たかくないです。", "This shop isn't expensive."),
};

function toMeta(type: ConjugationTrainerType): ConjTrainerTypeMeta {
  return {
    id: type.id,
    title: type.title,
    subtitle: type.subtitle,
    category: type.category === "verb" ? "verb" : "adjective",
    adjective: type.category !== "verb",
    example: TYPE_EXAMPLE[type.id],
    glyph: TYPE_GLYPH[type.id],
    colorVar: TYPE_COLOR_VAR[type.id],
    unlockModule: unlockModuleForType(type),
    formation: type.formation.map((r) => ({
      groupLabel: r.groupLabel,
      pattern: r.pattern,
      exampleDict: r.exampleDict,
      exampleForm: r.exampleForm,
    })),
  };
}

function toQuestion(q: TrainerQuestion): ConjTrainerQuestion {
  return {
    itemId: q.itemId,
    prompt: q.prompt,
    meaning: q.meaning,
    wordClassId: q.wordClass,
    formLabel: q.formLabel,
    form: q.form,
    correct: q.correct,
    options: q.options,
    written: q.kanji,
    isAdjective: q.wordClass.includes("adj"),
    // Per-question example: show the reviewed word's own conjugation in a
    // short frame (not a fixed demo word). `formLabel` names the form.
    example: jaQuestionExample(q),
  };
}

/** Example built from THIS question's word so the learner sees their own verb
 *  conjugated, e.g. たべて → "to eat · て-form". */
function jaQuestionExample(q: TrainerQuestion): ConjExampleSentence {
  const base = q.meaning.replace(/^to be /i, "").replace(/^to /i, "").trim();
  return { text: q.correct, translation: `${base} · ${q.formLabel}` };
}

function comboExample(entry: ComboEntry): string {
  return entry.category === "i-adj"
    ? conjugateIAdj(COMBO_DEMO_ADJ, entry.form)
    : conjugateVerb(COMBO_DEMO.dictionary, COMBO_DEMO.group, entry.form);
}

// ─── Word-class chip metadata (moved from DrillQuestionCard) ─────────────

const WORD_CLASS: Record<string, ConjWordClassInfo> = {
  godan: {
    labelKey: "practice.conjugation.classGodan",
    labelDefault: "Godan verb",
    explainKey: "practice.conjugation.classGodanExplain",
    explainDefault:
      "Godan verbs conjugate by shifting the last kana along its row before the ending attaches — のむ → のみます・のまない.",
    irregular: false,
  },
  ichidan: {
    labelKey: "practice.conjugation.classIchidan",
    labelDefault: "Ichidan verb",
    explainKey: "practice.conjugation.classIchidanExplain",
    explainDefault:
      "Ichidan verbs drop る and attach the ending directly — たべる → たべます・たべない.",
    irregular: false,
  },
  irregular: {
    labelKey: "practice.conjugation.classIrregular",
    labelDefault: "Irregular verb",
    explainKey: "practice.conjugation.classIrregularExplain",
    explainDefault:
      "する and くる follow neither pattern — the stem itself changes per form (くる → きます・こない). Worth memorizing.",
    irregular: true,
  },
  "i-adj": {
    labelKey: "practice.conjugation.classIAdj",
    labelDefault: "い-adjective",
    explainKey: "practice.conjugation.classIAdjExplain",
    explainDefault:
      "い-adjectives conjugate by replacing the final い — たかい → たかくない・たかかった.",
    irregular: false,
  },
  "i-adj-irregular": {
    labelKey: "practice.conjugation.classIAdjIrregular",
    labelDefault: "Irregular い-adjective",
    explainKey: "practice.conjugation.classIAdjIrregularExplain",
    explainDefault: "いい conjugates from its older form よい — よくない・よかった・よくなかった.",
    irregular: true,
  },
};

// ─── Free drill ──────────────────────────────────────────────────────────

/**
 * FORM → module that teaches it, for the free drill's "Up to M{n}" gate. One
 * table, every verb form the engine conjugates (`ChainForm`), in the order
 * the toggle list shows them.
 *
 * Sources (freeDrill.test.ts asserts each mapped row agrees with
 * `formUnlockModule`, so the two can't drift):
 *  - masu / masu-neg …… m7   n5-grammar-points.json `masu-present`,
 *                           `masu-negative`; ir/m7.ir.yaml:65 (ません rule beat).
 *  - masu-past ………………… m10  `masu-past`.
 *  - masu-past-neg …………… m11  `masu-past-negative`; ir/m11.ir.yaml:96
 *                           ("でした arrives beside ました").
 *  - te …………………………………… m8   `te-form`; ir/m8.ir.yaml:177 `introduces: [たべて…]`.
 *  - ta …………………………………… m11  `ta-form`; ir/m11.ir.yaml:369 `introduces: [たべた…]`.
 *  - nai ………………………………… m6   `nai-form`; ir/m6.ir.yaml:259 `introduces: [たべない…]`.
 *  - nai-past …………………… m11  stacked: max(nai, ta) — FORM_GATE_POINTS.
 *  - tai / tai-* ……………… m13  `v-tai`; ir/m13.ir.yaml:357 `introduces: [たべたい…]`;
 *                           the stacks max with nai (m6) / ta (m11) → still m13.
 *  - volitional ………………… m34  NO grammar point in n5-grammar-points.json (N4
 *                           tier); ir/m34.ir.yaml:2 title "Volitional: よう/おう".
 *  - ba ………………………………………… m37  no grammar point; ir/m37.ir.yaml:82 (ば rule
 *                           beat, "slide it to the E-ROW and add ば").
 */
export const FREE_DRILL_VERB_FORM_MODULE: Record<ChainForm, number> = {
  masu: 7,
  "masu-neg": 7,
  "masu-past": 10,
  "masu-past-neg": 11,
  te: 8,
  ta: 11,
  nai: 6,
  "nai-past": 11,
  tai: 13,
  "tai-neg": 13,
  "tai-past": 13,
  "tai-neg-past": 13,
  volitional: 34,
  ba: 37,
};

/** Adjective cells — all Track B points (`i-adj-*` / `na-adj-*`, m10–m12). */
const FREE_DRILL_ADJ_FORM_MODULE: Record<"i-adj" | "na-adj", Record<AdjForm, number>> = {
  "i-adj": {
    present: grammarPointModule("i-adj-present"),
    negative: formUnlockModule("negative"),
    past: formUnlockModule("past"),
    "past-negative": formUnlockModule("past-negative"),
  },
  "na-adj": {
    present: grammarPointModule("na-adj-present"),
    negative: grammarPointModule("na-adj-negative"),
    past: grammarPointModule("na-adj-past"),
    "past-negative": Math.max(
      grammarPointModule("na-adj-negative"),
      grammarPointModule("na-adj-past"),
    ),
  },
};

/** Fixed demo words for the toggle examples — real M7/M8/M9 table entries. */
const FREE_DRILL_EXAMPLE_VERB = { dictionary: "たべる", group: "ichidan" as const };
const FREE_DRILL_EXAMPLE_IADJ = "たかい";
const FREE_DRILL_EXAMPLE_NAADJ_ID = "kirei";

const VERB_CLASS_CHIP: Record<VerbGroup, string> = {
  ichidan: "る",
  godan: "う",
  irregular: "irregular",
};

/** Verb forms the engine conjugates, in toggle-list order (ます family, plain
 *  family, たい family, then the N4 forms). */
const FREE_DRILL_VERB_FORMS = Object.keys(FREE_DRILL_VERB_FORM_MODULE) as ChainForm[];
const FREE_DRILL_ADJ_FORMS: AdjForm[] = ["present", "negative", "past", "past-negative"];

function adjExample(type: "i-adj" | "na-adj", form: AdjForm): { dictionary: string; form: string } {
  if (type === "i-adj") {
    return {
      dictionary: FREE_DRILL_EXAMPLE_IADJ,
      form: form === "present" ? FREE_DRILL_EXAMPLE_IADJ : conjugateIAdj(FREE_DRILL_EXAMPLE_IADJ, form),
    };
  }
  const entry = ADJ_ENTRIES.find((a) => a.id === FREE_DRILL_EXAMPLE_NAADJ_ID);
  return entry
    ? { dictionary: entry.dictionary, form: entry.forms[form] }
    : { dictionary: "", form: "" };
}

function adjPool(categoryId: string, maxModule: number) {
  return getAdjsUpToModule(maxModule).filter((a) =>
    categoryId === "i-adj" ? a.type === "i-adj" : a.type === "na-adj",
  );
}

const jaFreeDrill: ConjFreeDrillProvider = {
  categories: [
    { id: "verbs", label: "Verbs" },
    { id: "i-adj", label: "i-Adjectives" },
    { id: "na-adj", label: "na-Adjectives" },
  ],
  defaultForms: ["masu", "nai", "te", "ta"],
  minModule: 7,
  secondScriptExposureModule: KANJI_EXPOSURE_MODULE,
  formsFor(categoryId) {
    if (categoryId === "verbs") {
      return FREE_DRILL_VERB_FORMS.map((key) => ({
        key,
        label: CHAIN_FORM_LABELS[key],
        example: {
          dictionary: FREE_DRILL_EXAMPLE_VERB.dictionary,
          form: conjugateVerb(FREE_DRILL_EXAMPLE_VERB.dictionary, FREE_DRILL_EXAMPLE_VERB.group, key),
        },
        unlockModule: FREE_DRILL_VERB_FORM_MODULE[key],
      }));
    }
    const type = categoryId === "i-adj" ? "i-adj" : "na-adj";
    return FREE_DRILL_ADJ_FORMS.map((key) => ({
      key,
      label: ADJ_FORM_LABELS[key],
      example: adjExample(type, key),
      unlockModule: FREE_DRILL_ADJ_FORM_MODULE[type][key],
    }));
  },
  listItems(categoryId, maxModule) {
    if (categoryId === "verbs") {
      return getVerbsUpToModule(maxModule).map((v) => ({
        id: v.id,
        dictionary: v.dictionary,
        written: v.kanji,
        meaning: v.meaning,
        classChip: VERB_CLASS_CHIP[v.group],
        classId: v.group,
        irregular: v.group === "irregular",
      }));
    }
    return adjPool(categoryId, maxModule).map((a) => ({
      id: a.id,
      dictionary: a.dictionary,
      written: a.kanji,
      meaning: a.meaning,
      classChip: a.type === "i-adj" ? "い" : "な",
      classId: a.type,
    }));
  },
  renderWritten: (dictionary, written, surface) => writtenSegments(dictionary, written, surface),
  buildQuestion(categoryId, maxModule, selectedForms, pinnedId = null) {
    if (categoryId === "verbs") {
      const pool = getVerbsUpToModule(maxModule);
      const verbs = pinnedId ? pool.filter((v) => v.id === pinnedId) : pool;
      if (verbs.length === 0) return null;
      // Gate here too: a checked toggle the level no longer reaches must
      // never be served, whatever the surface's state holds.
      const forms = FREE_DRILL_VERB_FORMS.filter(
        (f) => selectedForms.has(f) && FREE_DRILL_VERB_FORM_MODULE[f] <= maxModule,
      );
      if (forms.length === 0) return null;
      const verb = pinnedId ? verbs[0] : pickWeighted(verbs, (v) => v.id, "conjugation");
      const form = forms[Math.floor(Math.random() * forms.length)];
      const correct = conjugateVerb(verb.dictionary, verb.group, form);
      const distractors = generateFormationDistractors(verb.dictionary, verb.group, form, correct);
      return {
        itemId: `${verb.id}:${form}`,
        prompt: verb.dictionary,
        written: verb.kanji,
        meaning: verb.meaning,
        form,
        formLabel: CHAIN_FORM_LABELS[form],
        correct,
        options: shuffle([correct, ...distractors]),
      };
    }
    const type = categoryId === "i-adj" ? "i-adj" : "na-adj";
    const pool = adjPool(categoryId, maxModule);
    const adjs = pinnedId ? pool.filter((a) => a.id === pinnedId) : pool;
    if (adjs.length === 0) return null;
    const forms = FREE_DRILL_ADJ_FORMS.filter(
      (f) => selectedForms.has(f) && FREE_DRILL_ADJ_FORM_MODULE[type][f] <= maxModule,
    );
    if (forms.length === 0) return null;
    const adj = pinnedId ? adjs[0] : pickWeighted(adjs, (a) => a.id, "conjugation");
    const form = forms[Math.floor(Math.random() * forms.length)];
    const correct = adj.forms[form];
    const distractors =
      categoryId === "i-adj" && form !== "present"
        ? generateIAdjFormationDistractors(adj.dictionary, form as IAdjForm, correct)
        : generateAdjDistractors(correct, adj, form, pool);
    return {
      itemId: `${adj.id}:${form}`,
      prompt: adj.dictionary,
      written: adj.kanji,
      meaning: adj.meaning,
      form,
      formLabel: ADJ_FORM_LABELS[form],
      correct,
      options: shuffle([correct, ...distractors]),
    };
  },
  recordResult(_categoryId, itemId, correct) {
    recordPracticeResult("conjugation", itemId, correct);
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────

export const jaConjugationTrainer: ConjugationTrainerProvider = {
  tileOrder: TILE_ORDER,
  getTypes: () => CONJUGATION_TRAINER_TYPES.map(toMeta),
  getType: (id) => {
    const t = getTrainerType(id);
    return t ? toMeta(t) : undefined;
  },

  scopeCss: CONJ_TYPE_COLOR_CSS,
  glyph: (tileId) => TYPE_GLYPH[tileId as TrainerTypeId] ?? "",
  // Fallback resolves to a standalone-hex `--type-*` var so `var(${colorVar})`
  // stays a valid color (post-W1 `--color-accent` is a bare channel triple).
  colorVar: (tileId) => TYPE_COLOR_VAR[tileId as TrainerTypeId] ?? "--type-default",
  mixGlyphs: [
    { glyph: "て", colorVar: "--type-te" },
    { glyph: "た", colorVar: "--type-ta" },
    { glyph: "な", colorVar: "--type-nai" },
    { glyph: "ま", colorVar: "--type-masu" },
    { glyph: "い", colorVar: "--type-iadj" },
  ],

  wordClass: (id) =>
    WORD_CLASS[id] ?? {
      labelKey: `practice.conjugation.class.${id}`,
      labelDefault: id,
      explainKey: `practice.conjugation.class.${id}.explain`,
      explainDefault: "",
      irregular: false,
    },

  secondScriptExposureModule: KANJI_EXPOSURE_MODULE,
  renderSurface: (question, surface, showSecondScript): ConjRubySegment[] =>
    showSecondScript ? writtenSegments(question.prompt, question.written, surface) : [{ text: surface }],

  isTypeUnlocked: (id, reachedModule) => {
    const t = getTrainerType(id);
    return !!t && isTypeUnlocked(t, reachedModule);
  },
  isSelectionAhead: (ids, reachedModule) =>
    isSelectionAhead(ids as TrainerTypeId[], reachedModule),
  effectivePoolModule: (ids, reachedModule) =>
    effectivePoolModule(ids as TrainerTypeId[], reachedModule),

  supportsCombos: true,
  combosForSelection: (selected): ConjComboInfo[] =>
    combosForSelection(new Set(selected as TrainerTypeId[])).map((e) => ({
      tiles: e.tiles,
      form: e.form,
      label: e.label,
      example: comboExample(e),
    })),
  canExtendSelection: (selected, tileId) =>
    canExtendSelection(new Set(selected as TrainerTypeId[]), tileId as TrainerTypeId),
  missingComboTiles: (selected) => {
    if (selected.length < 2) return null;
    if (combosForSelection(new Set(selected as TrainerTypeId[])).length > 0) return null;
    const supersets = COMBO_MAP.filter((e) => selected.every((id) => e.tiles.includes(id as TrainerTypeId)));
    if (supersets.length === 0) return null;
    const smallest = [...supersets].sort((a, b) => a.tiles.length - b.tiles.length)[0];
    return smallest.tiles.filter((tid) => !selected.includes(tid));
  },
  formToTiles: (form) => FORM_TO_TILES[form],
  individualFormCount: (ids) => {
    const forms = new Set<string>();
    for (const id of ids) {
      const type = getTrainerType(id);
      if (!type) continue;
      const list = type.category === "verb" ? type.verbForms ?? [] : type.adjForms ?? [];
      for (const f of list) forms.add(f);
    }
    return forms.size;
  },

  buildSession: (typeId, poolModule) => {
    const type = getTrainerType(typeId);
    if (!type) return [];
    return buildTrainerSession(type, poolModule).map(toQuestion);
  },
  buildCombinedSession: (typeIds, poolModule, withCombos) =>
    buildCombinedSession(typeIds as TrainerTypeId[], poolModule, {
      combos: withCombos ? "on" : "off",
    }).map(toQuestion),

  typeMasteryPercent: (typeId) => typeMasteryPercent(typeId as TrainerTypeId),
  dueCount: (typeId, reachedModule) => {
    const t = getTrainerType(typeId);
    return t ? dueGrammarPointCount(t, reachedModule) : 0;
  },

  gradeSessionIfOnPath: (typeId, reachedModule, results) => {
    const type = getTrainerType(typeId);
    if (!type) return false;
    return gradeTrainerSessionIfOnPath(type, reachedModule, results);
  },
  gradeCombinedSessionIfOnPath: (typeIds, reachedModule, forms, results) =>
    gradeCombinedSessionIfOnPath(
      typeIds as TrainerTypeId[],
      reachedModule,
      forms as Array<ChainForm | IAdjForm>,
      results,
    ),

  cheatItems: (typeId, reachedModule): ConjCheatItem[] => {
    const type = getTrainerType(typeId);
    if (!type) return [];
    if (type.category === "verb") {
      const form = type.verbForms?.[0];
      if (!form) return [];
      return getVerbsUpToModule(reachedModule)
        .slice(0, 8)
        .map((v) => ({ dict: v.dictionary, form: conjugateVerb(v.dictionary, v.group, form) }));
    }
    const form = type.adjForms?.[0];
    if (!form) return [];
    // `a.forms` is keyed by the TABLE's AdjForm (no "ba" column — that's a
    // stacked engine form, same as ChainForm's "volitional"). No registered
    // trainer type wires "ba" into `adjForms` (m37 isn't registered here),
    // so this narrowing is safe.
    const tableForm = form as Exclude<IAdjForm, "ba">;
    return getAdjsUpToModule(reachedModule)
      .filter((a) => a.type === "i-adj")
      .slice(0, 8)
      .map((a) => ({ dict: a.dictionary, form: a.forms[tableForm] }));
  },

  getIntroStep: (typeId): LessonStep | null => {
    const type = getTrainerType(typeId);
    if (!type) return null;
    return getGrammarRuleStepForPoint(type.grammarPointIds[0]) ?? null;
  },

  freeDrill: jaFreeDrill,
};

registerConjugationTrainer("ja", jaConjugationTrainer);
