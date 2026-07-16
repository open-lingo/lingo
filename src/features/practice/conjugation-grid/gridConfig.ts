/**
 * Conjugation Grid — per-language axis config (ES only for now).
 *
 * The grid trainer is axis-driven: a tense axis (tabs) × a person axis (the
 * 6-cell grid). This file is deliberately colocated with the feature rather
 * than a global "any language" abstraction — a second grid language earns
 * the generalization, one doesn't (recon note, 2026-07-15).
 *
 * Person labels are DERIVED from `ES_CONJUGATION_FORM_LABELS` (the data
 * layer's single source), never hardcoded here: the map's values look like
 * "él / ella / usted (present)" / "vosotros (present — Spain)", so the person
 * display label is the text before the trailing parenthetical and the
 * regional note ("Spain") is the text after the em-dash inside it.
 */
import {
  ES_CONJUGATION_FORM_LABELS,
  type EsVerbForm,
} from "@/features/languages/es/conjugationTables";

export type EsTenseId = "present" | "preterite" | "imperfect";
export type EsPersonId = "yo" | "tu" | "el" | "nosotros" | "vosotros" | "ustedes";

export type GridTense = {
  id: EsTenseId;
  /** Learner-facing tab label — the Spanish tense name. */
  label: string;
};

export type GridPerson = {
  id: EsPersonId;
  /** Display label derived from ES_CONJUGATION_FORM_LABELS ("él / ella / usted"). */
  label: string;
  /** Regional note parsed from the labels map ("Spain" for vosotros). */
  note?: string;
};

export type ConjugationGridConfig = {
  tenses: GridTense[];
  persons: GridPerson[];
  /** The data key for one grid cell, e.g. ("preterite","tu") → "preterite.tu". */
  formKey: (tense: EsTenseId, person: EsPersonId) => EsVerbForm;
  /** Full cell label straight from the language's labels map. */
  cellLabel: (tense: EsTenseId, person: EsPersonId) => string;
};

const ES_TENSES: Array<{ id: EsTenseId; label: string }> = [
  { id: "present", label: "presente" },
  { id: "preterite", label: "pretérito" },
  { id: "imperfect", label: "imperfecto" },
];

const ES_PERSON_IDS: EsPersonId[] = ["yo", "tu", "el", "nosotros", "vosotros", "ustedes"];

const esFormKey = (tense: EsTenseId, person: EsPersonId): EsVerbForm =>
  `${tense}.${person}` as EsVerbForm;

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
  cellLabel: (tense, person) => ES_CONJUGATION_FORM_LABELS[esFormKey(tense, person)],
};

/** Axis config for the grid trainer, or null when the language has none.
 *  JA is deliberately excluded — its trainer is engine-backed, not tabular. */
export function getConjugationGridConfig(langId: string): ConjugationGridConfig | null {
  if (langId === "es") return ES_GRID_CONFIG;
  return null;
}
