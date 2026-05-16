import type { DeckResponse } from "@/shared/api/decks";

/** Personal vocab decks created via API (`GET …/decks/my-vocab`). */
export function isMyVocabDeck(deckId: string): boolean {
  return deckId.startsWith("vocab-");
}

/** Course-linked lesson decks (official path cards). */
export function isLessonDeck(deck: Pick<DeckResponse, "id" | "courseId">): boolean {
  return Boolean(deck.courseId) && !isMyVocabDeck(deck.id);
}

/** Community / user-created decks without course linkage (excluding vocab-* ids). */
export function isCommunityStyleDeck(deck: Pick<DeckResponse, "id" | "courseId">): boolean {
  return !isMyVocabDeck(deck.id) && !deck.courseId;
}

export type DeckStudyPreset = "all" | "vocab" | "lessons";

export function deckMatchesPreset(
  deck: Pick<DeckResponse, "id" | "courseId">,
  preset: Exclude<DeckStudyPreset, "all">
): boolean {
  if (preset === "vocab") return isMyVocabDeck(deck.id);
  if (preset === "lessons") return isLessonDeck(deck);
  return false;
}
