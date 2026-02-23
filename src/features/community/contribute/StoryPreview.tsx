import { useMemo } from "react";
import { parseStoryBody } from "./parseStoryEmbeds";
import type { DeckCard } from "@/shared/api/decks";

type StoryPreviewProps = {
  body: string;
  cardsById?: Record<string, DeckCard>;
  brokenCardIds?: string[];
  onCardClick?: (cardId: string) => void;
};

export function StoryPreview({ body, cardsById = {}, brokenCardIds = [], onCardClick }: StoryPreviewProps) {
  const segments = useMemo(() => parseStoryBody(body), [body]);

  if (!body) return null;

  return (
    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-700 dark:text-gray-300">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.text}</span>;
        }
        const isBroken = brokenCardIds.includes(seg.cardId) || !cardsById[seg.cardId];
        const card = cardsById[seg.cardId];
        return (
          <span
            key={i}
            role={!isBroken && onCardClick ? "button" : undefined}
            tabIndex={!isBroken && onCardClick ? 0 : undefined}
            onClick={!isBroken && onCardClick ? () => onCardClick(seg.cardId) : undefined}
            onKeyDown={
              !isBroken && onCardClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onCardClick(seg.cardId);
                    }
                  }
                : undefined
            }
            className={
              isBroken
                ? "rounded bg-amber-100 px-0.5 font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                : "cursor-pointer rounded bg-emerald-100 px-0.5 underline decoration-emerald-400 decoration-dotted hover:bg-emerald-200 dark:bg-emerald-900/40 dark:decoration-emerald-500 dark:hover:bg-emerald-900/60"
            }
            title={isBroken ? "Card not found" : card?.back ? `Edit: ${card.back}` : undefined}
          >
            {seg.display || seg.cardId}
            {isBroken && " ⚠"}
          </span>
        );
      })}
    </div>
  );
}
