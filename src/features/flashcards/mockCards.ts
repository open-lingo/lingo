export type Flashcard = {
  id: string;
  front: string;
  back: string;
};

/** Single mock card for demo. Replace with real deck/API later. */
export const MOCK_FLASHCARDS: Flashcard[] = [
  { id: "1", front: "안녕하세요", back: "Hello / Good day" },
];
