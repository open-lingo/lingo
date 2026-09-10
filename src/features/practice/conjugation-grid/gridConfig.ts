/**
 * Conjugation Grid — per-language axis config (ES, FR).
 *
 * The grid trainer is axis-driven: a tense axis (tabs) × a person axis (the
 * N-cell grid). This file is deliberately colocated with the feature rather
 * than a global "any language" abstraction — a second grid language earned
 * the generalization (recon note, 2026-07-15; FR landed it 2026-09-10).
 *
 * `ConjugationGridConfig.formKey`/`cellLabel` are declared with METHOD
 * SHORTHAND (`formKey(tense: string, person: string): string`), not arrow-
 * typed properties (`formKey: (t: string, p: string) => string`). This is
 * load-bearing, not stylistic: TypeScript checks method-shorthand members
 * BIVARIANTLY, so ES's and FR's own narrowly-typed `esFormKey`/`frFormKey`
 * (typed over `EsTenseId`/`EsPersonId` and `FrTenseId`/`FrPersonId`
 * respectively, not plain `string`) can each satisfy the shared, wider
 * `ConjugationGridConfig` interface. An arrow-typed property would be
 * checked CONTRAVARIANTLY under `strictFunctionTypes` and reject both
 * languages' narrower functions — verified empirically against this
 * repo's `tsc --strict` before adopting the pattern.
 *
 * Person labels are DERIVED from each language's `*_CONJUGATION_FORM_LABELS`
 * map (the data layer's single source), never hardcoded here: the map's
 * present-tense values look like "él / ella / usted (present)" (ES) or
 * "il / elle / on (présent)" (FR), so the person display label is the text
 * before the trailing parenthetical, and ES's regional note ("Spain") is the
 * text after the em-dash inside it — FR has no regional note.
 */
import {
  ES_CONJUGATION_FORM_LABELS,
  type EsVerbForm,
} from "@/features/languages/es/conjugationTables";
import {
  FR_CONJUGATION_FORM_LABELS,
  type FrVerbForm,
} from "@/features/languages/fr/conjugationTables";

export type EsTenseId = "present" | "preterite" | "imperfect";
export type EsPersonId = "yo" | "tu" | "el" | "nosotros" | "vosotros" | "ustedes";

export type FrTenseId = "present" | "passeCompose";
export type FrPersonId = "je" | "tu" | "il";

export type GridTense = {
  id: string;
  /** Learner-facing tab label — the target language's tense name. */
  label: string;
};

export type GridPerson = {
  id: string;
  /** Display label derived from the language's form-labels map. */
  label: string;
  /** Regional note parsed from the labels map ("Spain" for vosotros). ES
   *  only — FR's labels carry no regional note. */
  note?: string;
};

/** Conjugation class, union of every language's `group` literals. FR only
 *  populates "er"/"irregular" — a subset, so `FrVerbEntry` structurally
 *  satisfies this without widening its own type to plain `string`. */
export type GridVerbGroup = "ar" | "er" | "ir" | "irregular";

/** Shape-only verb-entry contract the grid engine and UI consume — every
 *  language's `*VerbEntry` (ES, FR) structurally satisfies this; extra
 *  per-language fields (e.g. FR's `taughtForms`) pass through untouched. */
export type GridVerbEntry = {
  id: string;
  lemma: string;
  meaning: string;
  group: GridVerbGroup;
  forms: Record<string, string>;
  introducedAtModule: number;
};

export type ConjugationGridConfig = {
  tenses: GridTense[];
  persons: GridPerson[];
  /** The data key for one grid cell, e.g. ("preterite","tu") → "preterite.tu".
   *  Method shorthand — see file header for why. */
  formKey(tense: string, person: string): string;
  /** Full cell label straight from the language's labels map. Method
   *  shorthand — see file header for why. */
  cellLabel(tense: string, person: string): string;
};

// ─── Spanish ───────────────────────────────────────────────────────────────

const ES_TENSES: Array<{ id: EsTenseId; label: string }> = [
  { id: "present", label: "presente" },
  { id: "preterite", label: "pretérito" },
  { id: "imperfect", label: "imperfecto" },
];

const ES_PERSON_IDS: EsPersonId[] = ["yo", "tu", "el", "nosotros", "vosotros", "ustedes"];

const esFormKey = (tense: EsTenseId, person: EsPersonId): EsVerbForm =>
  `${tense}.${person}` as EsVerbForm;

const esCellLabel = (tense: EsTenseId, person: EsPersonId): string =>
  ES_CONJUGATION_FORM_LABELS[esFormKey(tense, person)];

/** "él / ella / usted (present)" → label "él / ella / usted"; note from "— X". */
function parsePersonLabel(person: EsPersonId): GridPerson {
  const raw = ES_CONJUGATION_FORM_LABELS[esFormKey("present", person)];
  const paren = raw.match(/\(([^)]*)\)\s*$/)?.[1];
  const label = raw.replace(/\s*\([^)]*\)\s*$/, "");
  const note = paren?.includes("—") ? paren.split("—")[1]?.trim() : undefined;
  return note ? { id: person, label, note } : { id: person, label };
}

const ES_GRID_CONFIG: ConjugationGridConfig = {
  tenses: ES_TENSES,
  persons: ES_PERSON_IDS.map(parsePersonLabel),
  formKey: esFormKey,
  cellLabel: esCellLabel,
};

// ─── French ─────────────────────────────────────────────────────────────────

const FR_TENSES: Array<{ id: FrTenseId; label: string }> = [
  { id: "present", label: "présent" },
  { id: "passeCompose", label: "passé composé" },
];

const FR_PERSON_IDS: FrPersonId[] = ["je", "tu", "il"];

const frFormKey = (tense: FrTenseId, person: FrPersonId): FrVerbForm =>
  `${tense}.${person}` as FrVerbForm;

const frCellLabel = (tense: FrTenseId, person: FrPersonId): string =>
  FR_CONJUGATION_FORM_LABELS[frFormKey(tense, person)];

/** "il / elle / on (présent)" → label "il / elle / on". FR labels carry no
 *  em-dash regional note (unlike ES's vosotros), so `note` is always absent. */
function parseFrPersonLabel(person: FrPersonId): GridPerson {
  const raw = FR_CONJUGATION_FORM_LABELS[frFormKey("present", person)];
  const label = raw.replace(/\s*\([^)]*\)\s*$/, "");
  return { id: person, label };
}

const FR_GRID_CONFIG: ConjugationGridConfig = {
  tenses: FR_TENSES,
  persons: FR_PERSON_IDS.map(parseFrPersonLabel),
  formKey: frFormKey,
  cellLabel: frCellLabel,
};

/** Axis config for the grid trainer, or null when the language has none.
 *  JA is deliberately excluded — its trainer is engine-backed, not tabular. */
export function getConjugationGridConfig(langId: string): ConjugationGridConfig | null {
  if (langId === "es") return ES_GRID_CONFIG;
  if (langId === "fr") return FR_GRID_CONFIG;
  return null;
}
