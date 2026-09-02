/**
 * The one renderer for a flashcard's word surface. JA kanji cards carry a
 * `reading` (Task 2) and render through `KanjiRuby` — okurigana-aligned
 * furigana, never the `漢字 (かな)` string (Spencer, 2026-09-02). Everything
 * else is `PlainText`.
 *
 * Furigana follows FSRS like the lesson steps do: on the PROMPT face it
 * shows until the card is mastered (both modalities past the mastery
 * interval), then the kanji stands alone. On the ANSWER face it always
 * shows — the learner is checking, not being tested. Re-renders on the SRS
 * store revision so a grade in the same session is reflected.
 */
import { KanjiRuby } from "@/shared/readingAnnotation/KanjiRuby";
import { PlainText } from "@/shared/components/PlainText";
import { isMastered } from "@/features/flashcards/engine/srs";
import { getCardState } from "@/features/flashcards/engine/srsStorage";
import { useSRSStoreRevision } from "@/features/flashcards/SRSStoreRevisionContext";

type Reading = { surface: string; kana: string };

type Props = {
  text: string;
  reading?: Reading;
  cardId?: string;
  face?: "prompt" | "answer";
  className?: string;
};

export function CardFront({ text, reading, cardId, face = "answer", className }: Props) {
  useSRSStoreRevision();
  if (!reading) return <PlainText className={className}>{text}</PlainText>;
  const show =
    face === "answer" || !cardId ? true : !isMastered(getCardState(cardId));
  return (
    <KanjiRuby
      surface={reading.surface}
      reading={reading.kana}
      show={show}
      className={className}
      lang="ja"
    />
  );
}
