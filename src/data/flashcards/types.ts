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
  image?: string;
  type: FlashcardType;
  reasoning?: string;
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
  definition?: string;
  context?: string;
};

export type Flashcard = FlashcardWord | FlashcardSentence | FlashcardOther;

export type FlashcardDeck = {
  id: string;
  languageId: string;
  name: string;
  cards: Flashcard[];
};
