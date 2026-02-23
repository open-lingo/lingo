export type CardSegment = {
  segment: string;
  meaning?: string;
  particleId?: string;
};

export type FlashcardType = "word" | "sentence" | "other";

export type FlashcardBase = {
  id: string;
  front: string;
  back: string;
  note?: string;
  /** Full image URL. */
  image?: string;
  type: FlashcardType;
  reasoning?: string;
  definition?: string;
  context?: string;
  /** For course decks: set at load based on lesson progress. Omitted = unlocked (e.g. community decks). */
  unlocked?: boolean;
};

export type FlashcardWord = FlashcardBase & {
  type: "word";
  parts?: CardSegment[];
};

export type FlashcardSentence = FlashcardBase & {
  type: "sentence";
  words?: CardSegment[];
};

export type FlashcardOther = FlashcardBase & {
  type: "other";
};

export type Flashcard = FlashcardWord | FlashcardSentence | FlashcardOther;

export type FlashcardDeck = {
  id: string;
  languageId: string;
  name: string;
  cards: Flashcard[];
  /** If set, this deck is course-linked. Cards are unlocked as lessons are completed. */
  courseId?: string;
  /** Cover/thumbnail URL. Use getDeckImageUrl() for placeholder when omitted. */
  image?: string;
  /** Initial ease for new cards (SM-2). Omit = 2.5. */
  defaultEase?: number;
  /** UI locale for names/descriptions (e.g. en, ko). Filter by user's selected locale. */
  locale?: string;
};

/** SRS (spaced repetition) state per card. Stored per user (localStorage or backend). */
export type SRSCardState = {
  easeFactor: number;
  interval: number;
  dueDate: string;
  repetitions: number;
  lastReviewDate: string;
  /** ISO timestamp of last sync to backend. Undefined = never synced. */
  lastSyncedAt?: string;
  /** If set and > today, card is buried (excluded from queue until this date). YYYY-MM-DD. */
  buriedUntil?: string;
};

/** Rating after reviewing a card. Used by SRS algorithm. */
export type SRSRating = "again" | "hard" | "good" | "easy";
