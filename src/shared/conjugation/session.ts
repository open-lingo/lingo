/**
 * Language-agnostic session helpers shared by every conjugation provider.
 * Pure — no React, no per-language linguistics.
 */
import type { SRSRating } from "@/features/flashcards/data/types";

export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Per-question credit: 1 correct, 0 wrong, 0.5 correct-after-peek. */
export type QuestionCredit = number | boolean;

export const credit = (r: QuestionCredit): number =>
  typeof r === "boolean" ? (r ? 1 : 0) : r;

/**
 * Session → FSRS rating (matches lesson grading semantics): full marks →
 * "good"; ≥50% of possible credit → "hard"; otherwise → "again". Hard is a
 * success under FSRS-6 (see CLAUDE.md SRS invariants).
 */
export function sessionRating(results: QuestionCredit[]): SRSRating {
  if (results.length === 0) return "again";
  const score = results.reduce<number>((acc, r) => acc + credit(r), 0);
  if (score === results.length) return "good";
  if (score / results.length >= 0.5) return "hard";
  return "again";
}

/**
 * Round-robin over heterogeneous question factories, avoiding a repeated
 * (item, form) pair while a pool still has unused items.
 */
export interface QuestionFactory<Q> {
  form: string;
  pool: Array<{ id: string }>;
  make: (item: { id: string }) => Q;
}

export function roundRobinBuild<Q>(
  factories: QuestionFactory<Q>[],
  target: number,
): Q[] {
  const usable = factories.filter((f) => f.pool.length > 0);
  if (usable.length === 0 || target <= 0) return [];
  const usedPairs = new Set<string>();
  const questions: Q[] = [];
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
