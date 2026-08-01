/**
 * "Add to my words" — turn a word met in a story into an SRS card.
 *
 * Seeding is not grading. This creates a card in `learning` state due today,
 * exactly as `applyPlacement.ts` does after a placement test, so Spencer's
 * "only review cards count toward FSRS-6" invariant is untouched: the learner
 * still has to actually review the card for it to advance.
 *
 * Words with a course `atomId` seed the canonical card, so the word is already
 * familiar when its lesson arrives. Culture words with no atom anywhere in the
 * course get a story-local card instead — they are real vocabulary even though
 * the curriculum never formally teaches them.
 */
import { getCardState, setCardState } from "@/features/flashcards/engine";
import type { SRSCardState } from "@/features/flashcards/data/types";
import type { StoryWordInfo } from "./unknownWords";

/** Card id for a story word: the course atom id, or a story-local key. */
export function storyWordCardId(word: StoryWordInfo, langId: string): string {
  return word.atomId ?? `story-vocab:${langId}:${word.surface}`;
}

function createSeedState(): SRSCardState {
  const today = new Date().toISOString().slice(0, 10);
  const sub = {
    stability: 0,
    difficulty: 0,
    state: "learning" as const,
    interval: 0,
    dueDate: today,
    lastReviewDate: today,
    reps: 0,
    lapses: 0,
  };
  return { recognition: { ...sub }, production: { ...sub } };
}

/** True when this word already has SRS state. */
export function isStoryWordAdded(word: StoryWordInfo, langId: string): boolean {
  // `getCardState` returns `SRSCardState | undefined` — NOT `| null`. A `!== null`
  // check would be true for every missing card and report every word as already
  // added. Use a truthiness check.
  return Boolean(getCardState(storyWordCardId(word, langId)));
}

/**
 * Seed the word into SRS. Returns `false` and writes nothing when a card
 * already exists — re-adding a word must never wipe a real schedule back to a
 * fresh `learning` seed.
 */
export function addStoryWord(word: StoryWordInfo, langId: string): boolean {
  const id = storyWordCardId(word, langId);
  if (getCardState(id)) return false;
  setCardState(id, createSeedState());
  return true;
}
