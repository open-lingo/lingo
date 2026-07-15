/**
 * Conjugation Grid — session logic (pure, UI-independent). Builds the MCQ
 * rounds for the ES person×tense grid trainer.
 *
 * Determinism: every builder takes a `seed` and is stable given it (options,
 * question order, mix cell choice all flow through `seededShuffle`). The UI
 * mints a fresh seed per round (`makeRoundSeed`) so "Retry" reshuffles, while
 * tests pin seeds. (The ja trainerSession predates the shared seeded shuffle
 * and still uses Math.random; the house seeding convention for NEW code is
 * `@/shared/utils/seededShuffle` — see buildReviewTailSteps / tile banks.)
 *
 * Distractors come from ADJACENT CELLS of the paradigm — the confusions that
 * actually happen at a conjugation table:
 *   A. same verb, same tense, other persons   (hablo → hablas / hablamos …)
 *   B. same verb, same person, other tenses   (hablo → hablé / hablaba)
 *   C. other verbs, same tense + person       (hablo → como / vivo …)
 * One pick from each tier when possible (so every question mixes confusion
 * kinds), then tiers refill in that order. Options are always 4, unique, and
 * include the correct form — Spanish's real syncretism (hablaba yo = hablaba
 * él; fui ser = fui ir) is handled by dedup, never by trusting cell identity.
 */
import type { EsVerbEntry } from "@/features/languages/es/conjugationTables";
import { seededShuffle } from "@/shared/utils/seededShuffle";
import type {
  ConjugationGridConfig,
  EsPersonId,
  EsTenseId,
} from "./gridConfig";

export const OPTION_COUNT = 4;
export const MIX_ROUND_SIZE = 6;

export type GridQuestion = {
  verbId: string;
  lemma: string;
  meaning: string;
  group: EsVerbEntry["group"];
  tense: EsTenseId;
  person: EsPersonId;
  /** Full cell label from the language's labels map ("tú (preterite)"). */
  formLabel: string;
  /** Display labels resolved from the grid config (UI renders these as-is). */
  personLabel: string;
  personNote?: string;
  tenseLabel: string;
  correct: string;
  /** OPTION_COUNT unique options, correct included, seeded order. */
  options: string[];
};

/** Fresh random seed for a new round — the ONE non-deterministic entry point. */
export function makeRoundSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Up to 3 adjacent-cell distractors, unique and never equal to the correct
 * form. Tier order A→B→C (one from each first); a same-verb-any-cell fallback
 * exists for degenerate future data but is unreachable with the shipped
 * tables (the tests pin distractors to the strict adjacency set).
 */
export function generateAdjacentDistractors(
  verb: EsVerbEntry,
  tense: EsTenseId,
  person: EsPersonId,
  others: EsVerbEntry[],
  config: ConjugationGridConfig,
  seed: string,
): string[] {
  const form = config.formKey(tense, person);
  const correct = verb.forms[form];

  const sameTenseOtherPersons = config.persons
    .filter((p) => p.id !== person)
    .map((p) => verb.forms[config.formKey(tense, p.id)]);
  const samePersonOtherTenses = config.tenses
    .filter((t) => t.id !== tense)
    .map((t) => verb.forms[config.formKey(t.id, person)]);
  const sameCellOtherVerbs = others
    .filter((o) => o.id !== verb.id)
    .map((o) => o.forms[form]);

  const tiers = [
    seededShuffle(sameTenseOtherPersons, `${seed}:tierA`),
    seededShuffle(samePersonOtherTenses, `${seed}:tierB`),
    seededShuffle(sameCellOtherVerbs, `${seed}:tierC`),
  ];

  const out: string[] = [];
  const seen = new Set<string>([correct]);
  const push = (s: string | undefined) => {
    if (s !== undefined && !seen.has(s) && out.length < OPTION_COUNT - 1) {
      seen.add(s);
      out.push(s);
    }
  };

  // One from each confusion kind first, then refill in tier order.
  for (const tier of tiers) push(tier.find((v) => !seen.has(v)));
  for (const tier of tiers) for (const v of tier) push(v);

  if (out.length < OPTION_COUNT - 1) {
    const anyOtherCell = config.tenses.flatMap((t) =>
      config.persons.map((p) => verb.forms[config.formKey(t.id, p.id)]),
    );
    for (const v of seededShuffle(anyOtherCell, `${seed}:fallback`)) push(v);
  }

  return out;
}

/** One MCQ for a single grid cell — shared by verb and mix rounds. */
export function makeGridQuestion(
  verb: EsVerbEntry,
  tense: EsTenseId,
  person: EsPersonId,
  others: EsVerbEntry[],
  config: ConjugationGridConfig,
  seed: string,
): GridQuestion {
  const form = config.formKey(tense, person);
  const correct = verb.forms[form];
  const cellSeed = `${seed}:${verb.id}:${form}`;
  const distractors = generateAdjacentDistractors(
    verb,
    tense,
    person,
    others,
    config,
    cellSeed,
  );
  const personDef = config.persons.find((p) => p.id === person);
  const tenseDef = config.tenses.find((t) => t.id === tense);
  return {
    verbId: verb.id,
    lemma: verb.lemma,
    meaning: verb.meaning,
    group: verb.group,
    tense,
    person,
    formLabel: config.cellLabel(tense, person),
    personLabel: personDef?.label ?? person,
    personNote: personDef?.note,
    tenseLabel: tenseDef?.label ?? tense,
    correct,
    options: seededShuffle([correct, ...distractors], `${cellSeed}:opts`),
  };
}

/**
 * The core round: all 6 persons of one verb × tense, asked one at a time in
 * a seeded order (the visible grid stays in canonical table order — the UI
 * maps questions back to cells by person).
 */
export function buildVerbRound(
  verb: EsVerbEntry,
  tense: EsTenseId,
  pool: EsVerbEntry[],
  config: ConjugationGridConfig,
  seed: string,
): GridQuestion[] {
  const others = pool.filter((o) => o.id !== verb.id);
  const personOrder = seededShuffle(config.persons, `${seed}:order`);
  return personOrder.map((p) =>
    makeGridQuestion(verb, tense, p.id, others, config, seed),
  );
}

/**
 * Mix round: `count` random cells across the given verbs (the caller decides
 * the pool — the page passes the learner's unlocked verbs) within one tense.
 * Cells are unique (verb, person) pairs; count clamps to what exists.
 */
export function buildMixRound(
  pool: EsVerbEntry[],
  tense: EsTenseId,
  config: ConjugationGridConfig,
  seed: string,
  count: number = MIX_ROUND_SIZE,
): GridQuestion[] {
  const cells = pool.flatMap((verb) =>
    config.persons.map((p) => ({ verb, person: p.id })),
  );
  const chosen = seededShuffle(cells, `${seed}:cells`).slice(
    0,
    Math.min(count, cells.length),
  );
  return chosen.map((c) =>
    makeGridQuestion(c.verb, tense, c.person, pool, config, seed),
  );
}
