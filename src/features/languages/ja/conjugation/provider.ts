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
  getVerbsUpToModule,
  getAdjsUpToModule,
  type AdjForm,
} from "../conjugationTables";
import { writtenSegments } from "../writtenForms";
import {
  CONJUGATION_TRAINER_TYPES,
  getTrainerType,
  unlockModuleForType,
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
  };
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

const MASU_SUFFIX_FORMS: ReadonlySet<string> = new Set([
  "masu-neg",
  "masu-past",
  "masu-past-neg",
]);

const jaFreeDrill: ConjFreeDrillProvider = {
  categories: [
    { id: "verbs", label: "Verbs" },
    { id: "i-adj", label: "i-Adjectives" },
    { id: "na-adj", label: "na-Adjectives" },
  ],
  defaultForms: ["masu", "nai", "te", "ta"],
  minModule: 7,
  formsFor(categoryId) {
    if (categoryId === "verbs") {
      return (Object.keys(CHAIN_FORM_LABELS) as ChainForm[])
        .filter((f) => !MASU_SUFFIX_FORMS.has(f))
        .map((key) => ({ key, label: CHAIN_FORM_LABELS[key] }));
    }
    return (Object.keys(ADJ_FORM_LABELS) as AdjForm[]).map((key) => ({
      key,
      label: ADJ_FORM_LABELS[key],
    }));
  },
  buildQuestion(categoryId, maxModule, selectedForms) {
    if (categoryId === "verbs") {
      const verbs = getVerbsUpToModule(maxModule);
      if (verbs.length === 0) return null;
      const forms = (Object.keys(CHAIN_FORM_LABELS) as ChainForm[]).filter((f) =>
        selectedForms.has(f),
      );
      if (forms.length === 0) return null;
      const verb = pickWeighted(verbs, (v) => v.id, "conjugation");
      const form = forms[Math.floor(Math.random() * forms.length)];
      const correct = conjugateVerb(verb.dictionary, verb.group, form);
      const distractors = generateFormationDistractors(verb.dictionary, verb.group, form, correct);
      return {
        itemId: `${verb.id}:${form}`,
        prompt: verb.dictionary,
        meaning: verb.meaning,
        formLabel: CHAIN_FORM_LABELS[form],
        correct,
        options: shuffle([correct, ...distractors]),
      };
    }
    const pool = getAdjsUpToModule(maxModule).filter((a) =>
      categoryId === "i-adj" ? a.type === "i-adj" : a.type === "na-adj",
    );
    if (pool.length === 0) return null;
    const forms = (["present", "negative", "past", "past-negative"] as AdjForm[]).filter((f) =>
      selectedForms.has(f),
    );
    if (forms.length === 0) return null;
    const adj = pickWeighted(pool, (a) => a.id, "conjugation");
    const form = forms[Math.floor(Math.random() * forms.length)];
    const correct = adj.forms[form];
    const distractors =
      categoryId === "i-adj" && form !== "present"
        ? generateIAdjFormationDistractors(adj.dictionary, form as IAdjForm, correct)
        : generateAdjDistractors(correct, adj, form, pool);
    return {
      itemId: `${adj.id}:${form}`,
      prompt: adj.dictionary,
      meaning: adj.meaning,
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
  colorVar: (tileId) => TYPE_COLOR_VAR[tileId as TrainerTypeId] ?? "--color-accent",
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
  dueCount: (typeId) => {
    const t = getTrainerType(typeId);
    return t ? dueGrammarPointCount(t) : 0;
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
    return getAdjsUpToModule(reachedModule)
      .filter((a) => a.type === "i-adj")
      .slice(0, 8)
      .map((a) => ({ dict: a.dictionary, form: a.forms[form] }));
  },

  getIntroStep: (typeId): LessonStep | null => {
    const type = getTrainerType(typeId);
    if (!type) return null;
    return getGrammarRuleStepForPoint(type.grammarPointIds[0]) ?? null;
  },

  freeDrill: jaFreeDrill,
};

registerConjugationTrainer("ja", jaConjugationTrainer);
