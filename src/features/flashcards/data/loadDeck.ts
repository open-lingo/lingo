import type { FlashcardDeck, Flashcard } from "./types";
import type { ParticlesData } from "@/features/practice/data/types";
import { getUnlockedCardIds } from "./lessonCardMap";

import koDeck from "./ko-beginner.json";
import jaDeck from "./ja-beginner.json";
import addonKdrama from "./addon-kdrama.json";
import addonParticles from "./addon-particles.json";
import addonJlptN5 from "./addon-jlpt-n5.json";
import koParticles from "@/features/languages/ko/particles.json";
import jaParticles from "@/features/practice/data/ja.json";

const COURSE_ID = "mock-1";

const ALL_DECKS: FlashcardDeck[] = [
  { ...(koDeck as FlashcardDeck), courseId: COURSE_ID },
  { ...(jaDeck as FlashcardDeck), courseId: COURSE_ID },
  addonKdrama as FlashcardDeck,
  addonParticles as FlashcardDeck,
  addonJlptN5 as FlashcardDeck,
];

const decksById = new Map<string, FlashcardDeck>(
  ALL_DECKS.map((d) => [d.id, d])
);

const decksByLang = new Map<string, FlashcardDeck[]>();
for (const d of ALL_DECKS) {
  const list = decksByLang.get(d.languageId) ?? [];
  list.push(d);
  decksByLang.set(d.languageId, list);
}

const particlesByLang: Record<string, ParticlesData> = {
  ko: koParticles as ParticlesData,
  ja: jaParticles as ParticlesData,
};

export function getDeckForLanguage(languageId: string): FlashcardDeck | null {
  const list = decksByLang.get(languageId);
  return list?.find((d) => d.courseId) ?? list?.[0] ?? null;
}

export function getDeckById(deckId: string): FlashcardDeck | null {
  return decksById.get(deckId) ?? null;
}

export function getAllDecksForLanguage(languageId: string): FlashcardDeck[] {
  return decksByLang.get(languageId) ?? [];
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

/** Placeholder image base; deterministic per seed. Replace with /api/placeholder/deck/{id} when backend supports it. */
const PLACEHOLDER_BASE = "https://picsum.photos/seed";

/**
 * Returns the deck/addon cover image URL. Uses `image` if set; otherwise a deterministic placeholder.
 * @param id - Deck or addon ID (used as placeholder seed)
 * @param image - Optional custom image URL from manifest/addon
 * @param size - Placeholder dimensions (default 400x200)
 */
export function getDeckImageUrl(
  id: string,
  image?: string | null,
  size = "400/200"
): string {
  if (image) return image;
  return `${PLACEHOLDER_BASE}/${encodeURIComponent(id)}/${size}`;
}
