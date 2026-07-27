/**
 * Transform-card mastery cells (conjugation-transform spec 2026-07-23).
 *
 * The mastery unit for in-lesson conjugation drilling is a (form ×
 * verb-class) CELL, not a form: a form-level key lets mastery "jump levels
 * without covering the endings" (the failure mode that keeps Renshuu's
 * conjugation out of their SRS). Cells live INSIDE the existing grammar
 * FSRS store (`open-lingo-srs-grammar:v1`) as cards keyed `conj:<form>:
 * <class>` — no new store, per the SRS-unification direction (Spencer
 * 2026-06-14) — and use the store's per-modality states so RECOGNITION
 * (MCQ stages) and PRODUCTION (typed stage) advance independently: MCQ
 * success must never count as production mastery (skill specificity —
 * DeKeyser & Sokalski; Kang 2007; Nakata 2016; research review
 * 2026-07-23).
 *
 * Stage ladder (drives the morphing card):
 *   1 LEARN — rule table pinned, MCQ. Until the cell has any recognition reps.
 *   2 KNOW  — MCQ, rule behind a half-credit peek.
 *   3 OWN   — typed production. Requires CONSOLIDATED recognition: ≥2
 *             recognition reps AND the last recognition review on a
 *             PREVIOUS day (never same-session — affix generalization to
 *             new stems emerges only after consolidation, Tamminen et al.
 *             2012). A production lapse (FSRS "relearning") demotes to 2.
 *
 * Streak shield: misses don't reset the in-lesson flame while the cell has
 * fewer than SHIELD_REPS total reps (Spencer ruling 2026-07-23; direction
 * per Silverman & Barasch JCR — broken-streak salience demotivates).
 */
import {
  getGrammarCardState,
  reviewGrammarPoint,
} from "@/features/flashcards/engine/grammarSrs";
import { getToday } from "@/features/flashcards/engine/srs";
import type { SRSRating } from "@/features/flashcards/data/types";
import type { ChainForm } from "../conjugationEngine";
import type { VerbGroup } from "../conjugationTables";

export type TransformStage = 1 | 2 | 3;

export const SHIELD_REPS = 5;

export function transformCellId(form: ChainForm, group: VerbGroup): string {
  return `conj:${form}:${group}`;
}

/**
 * Sidecar: last PRODUCTION outcome per cell. FSRS modality state cannot
 * distinguish "failed" from "passed with a peek" (both leave the learning
 * phase at learningSteps 0, and learning-phase "again" doesn't count as a
 * lapse), so demotion needs one explicit bit. Not a second SRS — a single
 * outcome flag; migrates into the deck system with the rest (SRS
 * unification direction, 2026-06-14).
 */
const META_KEY = "open-lingo-conj-transform-meta:v1";
type CellMeta = { outcome: "pass" | "fail"; date: string };

function readMeta(): Record<string, CellMeta> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? "{}") as Record<string, CellMeta>;
  } catch {
    return {};
  }
}
function writeMeta(m: Record<string, CellMeta>): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    /* quota — stage will re-derive next session */
  }
}

export function getTransformStage(
  form: ChainForm,
  group: VerbGroup,
  today: string = getToday(),
): TransformStage {
  const id = transformCellId(form, group);
  const card = getGrammarCardState(id);
  if (!card) return 1;
  const rec = card.recognition;
  // Stage 1 spans the first TWO recognition reps — the rule table stays
  // pinned for a pair of worked examples before fading (mock ruling).
  if (rec.reps < 2) return 1;
  // Production failure pulls the card back to recognition-with-peek: the
  // crutch returns exactly where it's needed. The cell re-graduates once a
  // recognition rep lands on a LATER day than the failure — the demoted
  // MCQ pass, slept on, is the re-entry ticket (same consolidation logic
  // as first graduation).
  const meta = readMeta()[id];
  if (meta?.outcome === "fail" && !(rec.lastReviewDate > meta.date)) return 2;
  const consolidated =
    rec.reps >= 2 && rec.lastReviewDate !== "" && rec.lastReviewDate < today;
  return consolidated ? 3 : 2;
}

/** True while misses should shake — not reset — the lesson streak flame. */
export function isStreakShielded(form: ChainForm, group: VerbGroup): boolean {
  const card = getGrammarCardState(transformCellId(form, group));
  if (!card) return true;
  return card.recognition.reps + card.production.reps < SHIELD_REPS;
}

/** Total lifetime reps across modalities — surfaced on the card as `srs ×N`. */
export function getTransformCellReps(form: ChainForm, group: VerbGroup): number {
  const card = getGrammarCardState(transformCellId(form, group));
  if (!card) return 0;
  return card.recognition.reps + card.production.reps;
}

/**
 * Grade one transform answer into the cell. Stage decides the modality;
 * peeking the rule caps a correct answer at "hard" (half credit — the
 * trainer's cheat-sheet semantics). Ungraded type-tease cards must NOT
 * call this (stakes wait for consolidation; the act doesn't).
 */
export function recordTransformResult(opts: {
  form: ChainForm;
  group: VerbGroup;
  stage: TransformStage;
  correct: boolean;
  peeked: boolean;
  at?: Date;
}): void {
  const { form, group, stage, correct, peeked, at } = opts;
  const id = transformCellId(form, group);
  const modality = stage === 3 ? "production" : "recognition";
  const rating: SRSRating = !correct ? "again" : peeked ? "hard" : "good";
  reviewGrammarPoint(id, modality, rating, at);
  if (modality === "production") {
    const m = readMeta();
    m[id] = {
      outcome: correct ? "pass" : "fail",
      date: (at ?? new Date()).toISOString().slice(0, 10),
    };
    writeMeta(m);
  }
}
