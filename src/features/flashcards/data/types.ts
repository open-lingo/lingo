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
 * Direction the learner is exercising the card. Each modality carries
 * its own FSRS-6 state so recognition mastery doesn't credit production
 * mastery (or vice versa).
 *
 * - `recognition`: shown stimulus → identify meaning/answer (e.g. audio→image MCQ).
 * - `production`: cued meaning → produce target form (e.g. English→kana build).
 */
export type SRSModality = "recognition" | "production";

/**
 * Per-direction FSRS-6 state. Stored once per modality inside an
 * {@link SRSCardState}.
 */
export type SRSModalityState = {
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
};

/**
 * SRS state per card. Stored per user (localStorage / backend).
 *
 * Engine: FSRS-6 (Free Spaced Repetition Scheduler v6). Each card carries
 * **two** FSRS sub-states — one per modality — so recognition progress and
 * production progress advance independently. A card is "due" when either
 * sub-state is due.
 *
 * Card-shared fields (`lastSyncedAt`, `buriedUntil`) live at the top level
 * because they apply to the whole card regardless of modality.
 */
export type SRSCardState = {
  recognition: SRSModalityState;
  production: SRSModalityState;
  /** ISO timestamp of last sync to backend. Undefined = never synced. */
  lastSyncedAt?: string;
  /** If set and > today, card is buried (excluded from queue). YYYY-MM-DD. */
  buriedUntil?: string;
};

/** Rating after reviewing a card. Used by FSRS-6 scheduler. */
export type SRSRating = "again" | "hard" | "good" | "easy";
