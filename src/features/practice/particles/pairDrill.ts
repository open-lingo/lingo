/**
 * Two-blank particle drill: session construction + grading. Pure — the page
 * owns state and rendering.
 */
import { seededShuffle } from "@/shared/utils/seededShuffle";
import type { ParticlePair } from "./particlePairs";
import type { PairSentence } from "./mineParticlePairs";

/** Questions per session — a short set, same length as the reading cloze. */
export const PAIR_SESSION_SIZE = 8;

export type PairQuestion = {
  id: string;
  pairId: string;
  text: string;
  translation: string;
  /** Text split around the two blanks: [before, between, after]. */
  segments: [string, string, string];
  /** Correct particle for blank 1 and blank 2, in sentence order. */
  answers: [string, string];
  /** Option bank shared by both blanks, shuffled once per question. */
  options: string[];
};

export function toQuestion(pair: ParticlePair, s: PairSentence, seed: string): PairQuestion {
  const [b1, b2] = s.blanks;
  const bank = [...new Set([pair.particles[0], pair.particles[1], pair.foil])];
  return {
    id: s.id,
    pairId: pair.id,
    text: s.text,
    translation: s.translation,
    segments: [s.text.slice(0, b1.start), s.text.slice(b1.end, b2.start), s.text.slice(b2.end)],
    answers: [b1.particle, b2.particle],
    options: seededShuffle(bank, `${seed}:${s.id}`),
  };
}

/**
 * Pick a session from the mined pool: shuffled by seed, capped at
 * `PAIR_SESSION_SIZE`. Sentences already served in the previous set (`avoid`)
 * are pushed to the back so a "New set" tap actually shows new sentences
 * while the pool is large enough.
 */
export function buildPairSession(
  pair: ParticlePair,
  pool: readonly PairSentence[],
  seed: string,
  avoid: ReadonlySet<string> = new Set(),
): PairQuestion[] {
  const shuffled = seededShuffle(pool, seed);
  const fresh = shuffled.filter((s) => !avoid.has(s.id));
  const stale = shuffled.filter((s) => avoid.has(s.id));
  return [...fresh, ...stale].slice(0, PAIR_SESSION_SIZE).map((s) => toQuestion(pair, s, seed));
}

export type PairGrade = {
  /** Per-blank correctness, in sentence order. */
  blanks: [boolean, boolean];
  /** The one combined result: both blanks right. */
  correct: boolean;
};

/** Grade both blanks; the combined result is true only when both are right. */
export function gradePair(q: PairQuestion, picked: [string | null, string | null]): PairGrade {
  const blanks: [boolean, boolean] = [picked[0] === q.answers[0], picked[1] === q.answers[1]];
  return { blanks, correct: blanks[0] && blanks[1] };
}
