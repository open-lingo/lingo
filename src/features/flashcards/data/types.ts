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
  /**
   * Legacy SM-2 initial ease. Retained on the deck schema so authored
   * deck JSON keeps validating, but no longer consumed by the FSRS-6
   * engine. Safe to ignore in new code; will be removed once deck JSON
   * is regenerated without it.
   */
  defaultEase?: number;
  /** UI locale for names/descriptions (e.g. en, ko). Filter by user's selected locale. */
  locale?: string;
};

/** FSRS card phase. */
export type SRSPhase = "new" | "learning" | "review" | "relearning";

/**
 * SRS state per card. Stored per user (localStorage / backend).
 *
 * Engine: FSRS-6 (Free Spaced Repetition Scheduler v6). The 4 rating
 * buttons (Again/Hard/Good/Easy) are unchanged from the prior SM-2
 * implementation; Hard is a *success* with reduced stability gain, not a
 * failure. Card state schema is FSRS-native (stability + difficulty)
 * with `interval` kept as a stored display field.
 *
 * `lapses` counts total Agains across the card's lifetime. `reps` counts
 * total reviews. `state` is the FSRS phase ("new"/"learning"/"review"/
 * "relearning").
 */
export type SRSCardState = {
  /** FSRS stability (S): predicted retention interval in days. */
  stability: number;
  /** FSRS difficulty (D): per-card difficulty in [1, 10]. */
  difficulty: number;
  /** FSRS phase. New cards always start here; resets push to "learning". */
  state: SRSPhase;
  /** Scheduled days until next review. Derived from stability + target retention; stored for sort/display. */
  interval: number;
  /** Next due date, YYYY-MM-DD (local). */
  dueDate: string;
  /** Date of most recent review, YYYY-MM-DD (local). */
  lastReviewDate: string;
  /** Total successful + failed reviews across the card's lifetime. */
  reps: number;
  /** Total Again ratings (lapses) across the card's lifetime. */
  lapses: number;
  /**
   * FSRS-6 internal: how many learning steps the card has progressed
   * through. Required to correctly resume cards mid-graduation. Omit
   * for review-state cards.
   */
  learningSteps?: number;
  /** ISO timestamp of last sync to backend. Undefined = never synced. */
  lastSyncedAt?: string;
  /** If set and > today, card is buried (excluded from queue). YYYY-MM-DD. */
  buriedUntil?: string;
};

/** Rating after reviewing a card. Used by FSRS-6 scheduler. */
export type SRSRating = "again" | "hard" | "good" | "easy";
