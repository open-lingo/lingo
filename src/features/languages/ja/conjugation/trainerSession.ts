/**
 * Conjugation Trainer — session logic (data layer, Task 1). Pure and
 * UI-independent: builds MCQ questions for a trainer type and grades a
 * finished session into Track B (grammar FSRS, production modality).
 *
 * The distractor generators + `shuffle` live here as the SINGLE source;
 * `ConjugationPracticePage` imports them (do not duplicate).
 */
import {
  ADJ_FORM_LABELS,
  getVerbsUpToModule,
  getAdjsUpToModule,
  type AdjEntry,
  type AdjForm,
  type VerbGroup,
} from "../conjugationTables";
import {
  conjugateVerb,
  conjugateIAdj,
  CHAIN_FORM_LABELS,
  type ChainForm,
  type IAdjForm,
} from "../conjugationEngine";
import {
  reviewGrammarPoint,
  getGrammarCardState,
} from "@/features/flashcards/engine/grammarSrs";
import type { SRSRating } from "@/features/flashcards/data/types";
import {
  getTrainerType,
  isSelectionAhead,
  formUnlockModule,
  type ConjugationTrainerType,
  type TrainerTypeId,
} from "./trainerRegistry";
import { combosForSelection } from "./comboForms";
import {
  generateFormationDistractors,
  generateIAdjFormationDistractors,
} from "./formationDistractors";

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ─── Anti-elimination formation distractors (Task 5) ────────────────────
//
// Implementation lives in ./formationDistractors.ts — a PURE leaf module
// (tables + engine only) so the lesson-side `conjugationCloze` factory can
// import it without this file's SRS/localStorage dependency chain (which
// closed an import cycle through the curriculum). Re-exported here so every
// existing consumer keeps its import path; still the SINGLE source.
// `generateIAdjFormationDistractors` moved to the same leaf 2026-07-27 (m12):
// the い-adjective transform ramp needs it from `grammarHelpers`, and importing
// THIS file there would close the very cycle the leaf exists to avoid.
export { generateFormationDistractors, generateIAdjFormationDistractors };

/** LEGACY: same-item-wrong-form + same-form-other-item, kept for na-adjectives
 *  in the Free drill (verbs + i-adjectives now use the formation generators). */
export function generateAdjDistractors(
  correct: string,
  adj: AdjEntry,
  targetForm: AdjForm,
  pool: AdjEntry[],
): string[] {
  const distractors = new Set<string>();

  for (const [form, value] of Object.entries(adj.forms)) {
    if (form !== targetForm && value !== correct) {
      distractors.add(value);
    }
  }

  for (const other of pool) {
    if (other.id !== adj.id) {
      distractors.add(other.forms[targetForm]);
    }
  }

  distractors.delete(correct);
  return shuffle([...distractors]).slice(0, 3);
}

/** The word's conjugation class, shown as a chip on the drill card so the
 *  learner knows WHICH rule to apply — and absorbs which words are irregular
 *  (Spencer 2026-07-02). */
export type WordClass = "godan" | "ichidan" | "irregular" | "i-adj" | "i-adj-irregular";

export type TrainerQuestion = {
  itemId: string;
  prompt: string;
  /** Written (kanji) dictionary form of the prompt word, when one exists —
   *  drill views derive kanji+furigana for prompt AND options from it
   *  (`writtenSegments`). */
  kanji?: string;
  meaning: string;
  wordClass: WordClass;
  formLabel: string;
  form: string;
  correct: string;
  options: string[];
};

export type BuildTrainerSessionOpts = {
  /** Override the computed question count (still clamped to [6, 12]). */
  count?: number;
};

const MIN_QUESTIONS = 6;
const MAX_QUESTIONS = 12;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

type VerbItem = { id: string; dictionary: string; kanji?: string; meaning: string; group: VerbGroup };
type AdjItem = { id: string; dictionary: string; kanji?: string; meaning: string };

/** One MCQ for a verb chain form — SINGLE source, shared by individual +
 *  combined sessions so both use the same distractor machinery. */
function makeVerbQuestion(item: VerbItem, form: ChainForm): TrainerQuestion {
  const correct = conjugateVerb(item.dictionary, item.group, form);
  const distractors = generateFormationDistractors(item.dictionary, item.group, form, correct);
  return {
    itemId: `${item.id}:${form}`,
    prompt: item.dictionary,
    kanji: item.kanji,
    meaning: item.meaning,
    wordClass: item.group,
    formLabel: CHAIN_FORM_LABELS[form],
    form,
    correct,
    options: shuffle([correct, ...distractors]),
  };
}

/** One MCQ for an i-adjective form — SINGLE source (see makeVerbQuestion). */
function makeAdjQuestion(item: AdjItem, form: IAdjForm): TrainerQuestion {
  const correct = conjugateIAdj(item.dictionary, form);
  const distractors = generateIAdjFormationDistractors(item.dictionary, form, correct);
  return {
    itemId: `${item.id}:${form}`,
    prompt: item.dictionary,
    kanji: item.kanji,
    meaning: item.meaning,
    // いい is the one suppletive い-adjective (よ- stem; engine special-case).
    wordClass: item.dictionary === "いい" ? "i-adj-irregular" : "i-adj",
    formLabel: ADJ_FORM_LABELS[form],
    form,
    correct,
    options: shuffle([correct, ...distractors]),
  };
}

/**
 * Build a trainer drill: `2 * drilledForms` questions clamped to [6, 12],
 * forms round-robin, and no repeated (item, form) pair while the pool allows.
 * MCQ options reuse the page's distractor strategy (3 distractors + correct,
 * shuffled). Returns [] when the reached-module pool has no eligible items.
 *
 * Per-form gating (B016): only forms the pool module has reached are drilled
 * (`formUnlockModule`) — a tile unlocks at its EARLIEST form, so a later form
 * must wait for its own module instead of locking the whole tile (or leaking
 * into a drill before the course teaches it).
 */
export function buildTrainerSession(
  type: ConjugationTrainerType,
  reachedModule: number,
  opts?: BuildTrainerSessionOpts,
): TrainerQuestion[] {
  if (type.category === "verb") {
    const pool = getVerbsUpToModule(reachedModule);
    const forms = (type.verbForms ?? []).filter((f) => formUnlockModule(f) <= reachedModule);
    if (pool.length === 0 || forms.length === 0) return [];
    const target = clamp(opts?.count ?? forms.length * 2, MIN_QUESTIONS, MAX_QUESTIONS);
    return buildQuestions(pool, forms, target, makeVerbQuestion);
  }

  // i-adj category
  const pool = getAdjsUpToModule(reachedModule).filter((a) => a.type === "i-adj");
  const forms = (type.adjForms ?? []).filter((f) => formUnlockModule(f) <= reachedModule);
  if (pool.length === 0 || forms.length === 0) return [];
  const target = clamp(opts?.count ?? forms.length * 2, MIN_QUESTIONS, MAX_QUESTIONS);
  return buildQuestions(pool, forms, target, makeAdjQuestion);
}

/**
 * Shared driver: round-robin the forms, and for each slot pick an item not yet
 * paired with that form (avoids repeated (item, form) pairs); once every item
 * has been paired with the current form, allow a repeat so we still hit target.
 */
function buildQuestions<T extends { id: string }, F extends string>(
  pool: T[],
  forms: F[],
  target: number,
  make: (item: T, form: F) => TrainerQuestion,
): TrainerQuestion[] {
  const usedPairs = new Set<string>();
  const questions: TrainerQuestion[] = [];
  for (let q = 0; q < target; q++) {
    const form = forms[q % forms.length];
    let candidates = shuffle(pool).filter((it) => !usedPairs.has(`${it.id}:${form}`));
    if (candidates.length === 0) candidates = shuffle(pool); // pool exhausted for this form
    const item = candidates[0];
    usedPairs.add(`${item.id}:${form}`);
    questions.push(make(item, form));
  }
  return questions;
}

// ─── Combined (multi-tile) sessions + combo unlock (v1.2 addendum) ──────

export const COMBO_PROFICIENCY_MIN_REPS = 3;

const COMBO_MIN_QUESTIONS = 8;
const COMBO_MAX_QUESTIONS = 14;
const COMBO_DEFAULT_QUESTIONS = 12;
/** Share of a combo-unlocked session spent on stacked forms (the exposure goal). */
const COMBO_WEIGHT = 0.4;

/**
 * FORM → Track B grammar point. The grading authority for BOTH individual and
 * combined sessions (v1.2 addendum). A form absent here or mapped to `null`
 * writes NOTHING:
 *   - `masu` / `masu-past` are POOLED points (plain/polite present + polite past
 *     are reviewed by the step-pool grammar session) — grading them here would
 *     double-count. So an individual ます drill and a みました combo write nothing.
 *   - the two polite-negative points (`masu-negative`, `masu-past-negative`) are
 *     graded ONLY via their combo forms (ません / ませんでした), never by an
 *     individual masu drill.
 * i-adj: `negative` is the tile's base form; `past` / `past-negative` are
 * combo-exclusive (い+た / い+ない+た, comboForms.ts) — like the polite
 * negatives, those two points are graded only when their combo forms appear.
 */
const FORM_TO_POINT: Record<string, string | null> = {
  te: "te-form",
  ta: "ta-form",
  nai: "nai-form",
  "nai-past": "nai-form",
  tai: "v-tai",
  "tai-neg": "v-tai",
  "tai-past": "v-tai",
  "tai-neg-past": "v-tai",
  "masu-neg": "masu-negative",
  "masu-past-neg": "masu-past-negative",
  masu: null,
  "masu-past": null,
  // i-adj forms (a combined session may include the i-adj tile's individuals).
  negative: "i-adj-negative",
  past: "i-adj-past",
  "past-negative": "i-adj-past-negative",
};

/** The Track B points a type grades through its OWN individual forms (empty for
 *  masu — it drills only ます, which maps to no point). `maxModule` mirrors the
 *  builders' per-form gating (B016): a form the learner hasn't reached was not
 *  drilled, so its point must not be graded. */
function gradablePointsForType(
  type: ConjugationTrainerType,
  maxModule: number = Number.POSITIVE_INFINITY,
): string[] {
  const forms: string[] =
    type.category === "verb" ? type.verbForms ?? [] : type.adjForms ?? [];
  const points = new Set<string>();
  for (const f of forms) {
    if (formUnlockModule(f) > maxModule) continue;
    const p = FORM_TO_POINT[f];
    if (p) points.add(p);
  }
  return [...points];
}

// masu has no exempt point of its own to gate on (its two points are combo-only,
// so gating on their reps would be circular). We instead count COMPLETED masu
// drills. This is the least-invasive honest signal: gradeTrainerSession is
// already the once-per-session grading hook the UI calls exactly once per drill,
// so bumping a counter there needs no new write site and — unlike practiceStats,
// which only the Free drill writes — reflects real trainer masu sessions.
const MASU_DRILL_REPS_KEY = "lingo:conjugation-trainer:masu-drill-reps:v1";

export function getMasuDrillReps(): number {
  try {
    return parseInt(localStorage.getItem(MASU_DRILL_REPS_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

function bumpMasuDrillReps(): void {
  try {
    localStorage.setItem(MASU_DRILL_REPS_KEY, String(getMasuDrillReps() + 1));
  } catch {
    // quota / no localStorage
  }
}

/** Test helper: reset the masu drill-history counter. */
export function clearMasuDrillReps(): void {
  try {
    localStorage.removeItem(MASU_DRILL_REPS_KEY);
  } catch {
    // no localStorage
  }
}

/**
 * Has the learner reached combo-unlock proficiency for a tile? Every point the
 * type grades through its individual forms must have production `reps >=
 * COMBO_PROFICIENCY_MIN_REPS`. The masu tile has no such point, so it gates on
 * completed-drill history instead (see MASU_DRILL_REPS_KEY above).
 */
export function isTypeProficient(typeId: TrainerTypeId): boolean {
  if (typeId === "masu") {
    return getMasuDrillReps() >= COMBO_PROFICIENCY_MIN_REPS;
  }
  const type = getTrainerType(typeId);
  if (!type) return false;
  const points = gradablePointsForType(type);
  if (points.length === 0) return false;
  return points.every((pid) => {
    const state = getGrammarCardState(pid);
    return !!state && state.production.reps >= COMBO_PROFICIENCY_MIN_REPS;
  });
}

/**
 * Ink-fill mastery proxy for the hub tiles (v1.2 Task 7). NO new state — derived
 * from Track B production reps the trainer already writes. A tile reads "full"
 * once its point(s) reach MASTERY_TARGET_REPS production reps (2× the combo
 * threshold, so full ⇒ comfortably combo-unlocked). Multi-point types average
 * their per-point fill; masu (no Track B point of its own) uses its completed-
 * drill counter. This is a deliberately simple proxy, not a retention estimate.
 */
const MASTERY_TARGET_REPS = COMBO_PROFICIENCY_MIN_REPS * 2; // 6

export function typeMasteryPercent(typeId: TrainerTypeId): number {
  const cap = (reps: number) => Math.min(reps / MASTERY_TARGET_REPS, 1);
  if (typeId === "masu") return Math.round(cap(getMasuDrillReps()) * 100);
  const type = getTrainerType(typeId);
  if (!type) return 0;
  const points = gradablePointsForType(type);
  if (points.length === 0) return 0;
  const sum = points.reduce((acc, pid) => {
    const state = getGrammarCardState(pid);
    return acc + cap(state?.production.reps ?? 0);
  }, 0);
  return Math.round((sum / points.length) * 100);
}

/** Round-robin builder over heterogeneous form factories (verb + adj + combo),
 *  avoiding repeated (item, form) pairs while a pool allows. */
type QuestionFactory = {
  form: string;
  pool: Array<{ id: string }>;
  make: (item: { id: string }) => TrainerQuestion;
};

function roundRobinBuild(factories: QuestionFactory[], target: number): TrainerQuestion[] {
  const usable = factories.filter((f) => f.pool.length > 0);
  if (usable.length === 0 || target <= 0) return [];
  const usedPairs = new Set<string>();
  const questions: TrainerQuestion[] = [];
  for (let q = 0; q < target; q++) {
    const f = usable[q % usable.length];
    let candidates = shuffle(f.pool).filter((it) => !usedPairs.has(`${it.id}:${f.form}`));
    if (candidates.length === 0) candidates = shuffle(f.pool);
    const item = candidates[0];
    usedPairs.add(`${item.id}:${f.form}`);
    questions.push(f.make(item));
  }
  return questions;
}

export type BuildCombinedSessionOpts = {
  /** Override the computed question count (still clamped to [8, 14]). */
  count?: number;
  /**
   * Combo (stacked-form) inclusion (v1.4.1 — Spencer 2026-07-05: the silent
   * proficiency gate read as "no paired trainings here"):
   *   - "on":   include the selection's combo forms unconditionally — the hub's
   *             "Combined forms" toggle is EXPLICIT intent, no hidden gate;
   *   - "off":  individuals only (the toggle turned off — free mixing);
   *   - "auto": legacy proficiency gate (every tile isTypeProficient).
   */
  combos?: "on" | "off" | "auto";
};

/**
 * Build a combined multi-tile drill (v1.2 addendum). Reuses the individual
 * question/distractor machinery — no parallel implementation:
 *   - individuals: every selected tile's own forms (verb + i-adj);
 *   - combos: `combosForSelection` forms, ONLY when every selected tile
 *     `isTypeProficient`; when unlocked ~40% of questions are combo forms;
 *   - count clamped to [8, 14].
 * Each combo entry stays within one category (verb stacks drill verbs, the
 * い-adjective stacks drill adjectives) — no single question mixes categories.
 */
export function buildCombinedSession(
  selected: TrainerTypeId[],
  reachedModule: number,
  opts?: BuildCombinedSessionOpts,
): TrainerQuestion[] {
  const types = selected
    .map((id) => getTrainerType(id))
    .filter((t): t is ConjugationTrainerType => !!t);
  if (types.length === 0) return [];

  const verbPool = getVerbsUpToModule(reachedModule) as VerbItem[];
  const adjPool = getAdjsUpToModule(reachedModule).filter((a) => a.type === "i-adj") as AdjItem[];

  // Per-form gating (B016): individuals AND combos only drill forms the pool
  // module has reached — the combined toggle can't surface a stacked form
  // (e.g. ませんでした) before the course teaches its point.
  const reachedForm = (f: string) => formUnlockModule(f) <= reachedModule;
  const verbForms = [
    ...new Set(types.flatMap((t) => (t.category === "verb" ? t.verbForms ?? [] : []))),
  ].filter(reachedForm);
  const adjForms = [
    ...new Set(types.flatMap((t) => (t.category === "i-adj" ? t.adjForms ?? [] : []))),
  ].filter(reachedForm);

  const comboMode = opts?.combos ?? "auto";
  const unlocked =
    comboMode === "on"
      ? true
      : comboMode === "off"
        ? false
        : selected.length > 0 && selected.every((id) => isTypeProficient(id));
  const comboEntries = (unlocked ? combosForSelection(new Set(selected)) : []).filter((e) =>
    reachedForm(e.form),
  );

  const total = clamp(
    opts?.count ?? COMBO_DEFAULT_QUESTIONS,
    COMBO_MIN_QUESTIONS,
    COMBO_MAX_QUESTIONS,
  );

  const individualFactories: QuestionFactory[] = [
    ...verbForms.map((form) => ({
      form,
      pool: verbPool,
      make: (item: { id: string }) => makeVerbQuestion(item as VerbItem, form),
    })),
    ...adjForms.map((form) => ({
      form,
      pool: adjPool,
      make: (item: { id: string }) => makeAdjQuestion(item as AdjItem, form),
    })),
  ];
  // Each combo entry drills its own category's pool — verb combos conjugate
  // verbs, the い-adjective stacks (かった/くなかった) conjugate adjectives.
  const comboFactories: QuestionFactory[] = comboEntries.map((entry) =>
    entry.category === "verb"
      ? {
          form: entry.form,
          pool: verbPool,
          make: (item: { id: string }) =>
            makeVerbQuestion(item as VerbItem, entry.form as ChainForm),
        }
      : {
          form: entry.form,
          pool: adjPool,
          make: (item: { id: string }) =>
            makeAdjQuestion(item as AdjItem, entry.form as IAdjForm),
        },
  );

  const canCombo = comboFactories.some((f) => f.pool.length > 0);
  const comboCount = canCombo ? Math.round(total * COMBO_WEIGHT) : 0;
  const individualCount = total - comboCount;

  const individuals = roundRobinBuild(individualFactories, individualCount);
  const combos = roundRobinBuild(comboFactories, comboCount);
  return shuffle([...individuals, ...combos]);
}

/**
 * Per-question credit: 1 = correct, 0 = wrong, 0.5 = correct after peeking at
 * the cheat sheet mid-question (the drill card's stuck-hint flow — Spencer
 * 2026-07-05). Booleans still accepted everywhere for back-compat.
 */
export type QuestionCredit = number | boolean;

const credit = (r: QuestionCredit): number => (typeof r === "boolean" ? (r ? 1 : 0) : r);

/**
 * Session → FSRS rating, matching lesson grading semantics:
 *   full marks → "good"; ≥50% of possible credit → "hard"; otherwise → "again".
 * A half-credit answer therefore caps the session at "hard" — peeking is a
 * success, just a slower one. (Hard is a success under FSRS-6 — see CLAUDE.md
 * SRS invariants.)
 */
export function sessionRating(results: QuestionCredit[]): SRSRating {
  if (results.length === 0) return "again";
  const score = results.reduce<number>((acc, r) => acc + credit(r), 0);
  if (score === results.length) return "good";
  if (score / results.length >= 0.5) return "hard";
  return "again";
}

/**
 * Grade a finished session into Track B: one production-modality review per
 * covered grammar point, at the session-level rating. `maxModule` (the
 * learner's reached module; default unbounded) mirrors the builder's per-form
 * gating — a partially-unlocked tile never grades a point the learner hasn't
 * reached (B016).
 *
 * NOTE: this writes on every call — it has no double-fire guard. The UI must
 * call it EXACTLY ONCE per completed session (Task 2's summary screen owns
 * that guard); the engine stays a pure "grade now" primitive.
 */
export function gradeTrainerSession(
  type: ConjugationTrainerType,
  results: QuestionCredit[],
  maxModule: number = Number.POSITIVE_INFINITY,
): void {
  const rating = sessionRating(results);
  // Grade only the points this type reaches through its own drilled forms
  // (FORM_TO_POINT). For masu this set is empty — its polite-negative points are
  // combo-only, so an individual masu drill writes NOTHING to Track B.
  for (const pointId of gradablePointsForType(type, maxModule)) {
    reviewGrammarPoint(pointId, "production", rating);
  }
  // masu has no Track B point of its own; record the completed drill so combo
  // proficiency (isTypeProficient) has an honest signal to gate on.
  if (type.id === "masu") bumpMasuDrillReps();
}

/**
 * Grade a finished COMBINED session into Track B (v1.2 addendum). Per-question
 * forms map to points via FORM_TO_POINT; each point gets ONE production review
 * at the session rating over ONLY its own questions. Forms mapped to `null`
 * (masu / masu-past — pooled points) write nothing, so the step-pool session
 * stays the sole reviewer of those and we never double-grade.
 *
 * Like gradeTrainerSession this is a pure grade-now primitive with NO
 * double-fire guard — the UI must call it exactly once per completed session.
 */
export function gradeCombinedSession(
  formsDrilled: Array<ChainForm | IAdjForm>,
  results: QuestionCredit[],
  maxModule: number = Number.POSITIVE_INFINITY,
): void {
  const byPoint = new Map<string, QuestionCredit[]>();
  formsDrilled.forEach((form, i) => {
    // Per-form gate (B016): a form beyond the learner's module should never
    // have been drilled on-path — defensively refuse to grade it (its gate
    // points include the very point it grades).
    if (formUnlockModule(form) > maxModule) return;
    const point = FORM_TO_POINT[form as string];
    if (!point) return;
    const arr = byPoint.get(point) ?? [];
    arr.push(results[i]);
    byPoint.set(point, arr);
  });
  for (const [pointId, res] of byPoint) {
    reviewGrammarPoint(pointId, "production", sessionRating(res));
  }
}

// ─── Learn-ahead grading gate (v1.5) ────────────────────────────────────
//
// Ahead-of-path sessions are PRACTICE-ONLY: the learner opted into a form
// they haven't been taught, so nothing is written to Track B — no production
// reviews, and no masu drill-history bump (an ahead masu drill shouldn't
// count toward combo proficiency either). The session views call these
// unconditionally in their once-per-completion grade effect; the returned
// boolean is what the summary surfaces as the "Practice only" note.

/** Grade a per-type session unless it was ahead of the learner's path.
 *  Returns true when it graded (on-path), false when skipped (ahead). */
export function gradeTrainerSessionIfOnPath(
  type: ConjugationTrainerType,
  reachedModule: number,
  results: QuestionCredit[],
): boolean {
  if (isSelectionAhead([type.id], reachedModule)) return false;
  gradeTrainerSession(type, results, reachedModule);
  return true;
}

/** Grade a combined session unless ANY selected type was ahead — one ahead
 *  tile makes the whole session practice-only (its questions interleave, so
 *  partial grading would credit points off mixed evidence). */
export function gradeCombinedSessionIfOnPath(
  selected: TrainerTypeId[],
  reachedModule: number,
  formsDrilled: Array<ChainForm | IAdjForm>,
  results: QuestionCredit[],
): boolean {
  if (isSelectionAhead(selected, reachedModule)) return false;
  gradeCombinedSession(formsDrilled, results, reachedModule);
  return true;
}
