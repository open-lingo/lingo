/**
 * deckStats — content-derived complexity + difficulty analytics for a deck,
 * used by the community deck-preview modal to surface "what am I signing up
 * for" stats without a review session.
 *
 * Important: community decks carry NO per-user FSRS state at preview time
 * (you haven't subscribed yet), so "difficulty" here is a *content* estimate
 * derived from the card itself — length, type, and how much supporting
 * context (notes / reasoning / definitions / examples) it carries. It is a
 * browse-time signal, not the FSRS-6 difficulty (D) value the scheduler
 * assigns once you actually review. The modal labels it accordingly.
 */

import type { Flashcard } from "./data/types";

export type DeckDifficultyBand = "easy" | "medium" | "hard";

export type DeckCardComplexity = "simple" | "complex";

export type DeckStats = {
  /** Total card count. */
  total: number;
  /** Cards classed as "complex" by the content heuristic. */
  complex: number;
  /** Cards classed as "simple" (total − complex). */
  simple: number;
  /** Count of cards per difficulty band. Sums to `total`. */
  difficulty: Record<DeckDifficultyBand, number>;
  /** Overall deck difficulty band (the mode-weighted average of card bands). */
  overall: DeckDifficultyBand;
  /** Card-type tally — useful color for the stats panel. */
  types: { word: number; sentence: number; other: number };
};

/** Characters at/above which a face counts toward the "long content" signal. */
const LONG_FACE_CHARS = 40;

/**
 * Count the "complexity signals" a single card carries. Each signal nudges the
 * card toward "complex" / higher difficulty:
 *  - it is a full sentence (more to parse than a single word)
 *  - either face is long (≥ 40 chars)
 *  - it ships supporting context: note / reasoning / definition / context
 *  - it ships worked examples
 */
export function cardComplexitySignals(card: Flashcard): number {
  let signals = 0;
  if (card.type === "sentence") signals += 1;
  const longestFace = Math.max(card.front?.length ?? 0, card.back?.length ?? 0);
  if (longestFace >= LONG_FACE_CHARS) signals += 1;
  const hasInfo = Boolean(card.note || card.reasoning || card.definition || card.context);
  if (hasInfo) signals += 1;
  if (card.examples && card.examples.length > 0) signals += 1;
  return signals;
}

/** A card is "complex" when it carries ≥ 2 complexity signals. */
export function cardComplexity(card: Flashcard): DeckCardComplexity {
  return cardComplexitySignals(card) >= 2 ? "complex" : "simple";
}

/** Map a card's complexity signals to a difficulty band. */
export function cardDifficulty(card: Flashcard): DeckDifficultyBand {
  const signals = cardComplexitySignals(card);
  if (signals >= 3) return "hard";
  if (signals >= 1) return "medium";
  return "easy";
}

const BAND_WEIGHT: Record<DeckDifficultyBand, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

/** Aggregate a deck's cards into a {@link DeckStats} summary. */
export function computeDeckStats(cards: Flashcard[]): DeckStats {
  const stats: DeckStats = {
    total: cards.length,
    complex: 0,
    simple: 0,
    difficulty: { easy: 0, medium: 0, hard: 0 },
    overall: "easy",
    types: { word: 0, sentence: 0, other: 0 },
  };

  if (cards.length === 0) return stats;

  let weightSum = 0;
  for (const card of cards) {
    if (cardComplexity(card) === "complex") stats.complex += 1;
    else stats.simple += 1;

    const band = cardDifficulty(card);
    stats.difficulty[band] += 1;
    weightSum += BAND_WEIGHT[band];

    if (card.type === "sentence") stats.types.sentence += 1;
    else if (card.type === "word") stats.types.word += 1;
    else stats.types.other += 1;
  }

  const avg = weightSum / cards.length;
  stats.overall = avg >= 1.34 ? "hard" : avg >= 0.5 ? "medium" : "easy";
  return stats;
}
