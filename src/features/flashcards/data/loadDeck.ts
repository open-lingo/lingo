import type { FlashcardDeck, Flashcard } from "./types";
import type { ParticlesData } from "@/features/practice/data/types";
import { getUnlockedCardIds } from "./lessonCardMap";

import koDeck from "./ko-beginner.json";
import jaDeck from "./ja-beginner.json";
import koParticles from "@/features/practice/data/ko.json";
import jaParticles from "@/features/practice/data/ja.json";

const COURSE_ID = "mock-1";

const decksByLang: Record<string, FlashcardDeck> = {
  ko: {
    ...(koDeck as FlashcardDeck),
    courseId: COURSE_ID,
  },
  ja: {
    ...(jaDeck as FlashcardDeck),
    courseId: COURSE_ID,
  },
};

const particlesByLang: Record<string, ParticlesData> = {
  ko: koParticles as ParticlesData,
  ja: jaParticles as ParticlesData,
};

export function getDeckForLanguage(languageId: string): FlashcardDeck | null {
  return decksByLang[languageId] ?? null;
}

/**
 * Returns the deck with only unlocked cards for practice.
 * For course decks: filters to cards introduced by completed lessons.
 * For non-course decks: returns all cards (all unlocked).
 * Call on each load/refresh; later a nightly job could sync unlock state to the backend.
 */
export function getDeckForPractice(
  languageId: string,
  completedLessonIds: string[]
): FlashcardDeck | null {
  const deck = getDeckForLanguage(languageId);
  if (!deck) return null;

  if (!deck.courseId) {
    return { ...deck, cards: deck.cards.map((c) => ({ ...c, unlocked: true })) };
  }

  const unlockedIds = getUnlockedCardIds(languageId, completedLessonIds);
  const practiceCards = deck.cards
    .filter((c) => unlockedIds.has(c.id))
    .map((c) => ({ ...c, unlocked: true } as Flashcard));

  return { ...deck, cards: practiceCards };
}

export function getParticlesForLanguage(languageId: string): ParticlesData | null {
  return particlesByLang[languageId] ?? null;
}
