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
    <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-secondary">
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
                ? "rounded bg-warning/20 px-0.5 font-medium text-text-primary"
                : "cursor-pointer rounded bg-success/15 px-0.5 underline decoration-success/50 decoration-dotted hover:bg-success/25"
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
